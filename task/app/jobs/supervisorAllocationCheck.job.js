const { Op } = require("sequelize");
const db = require("../models");
const { mongoliaDateString, mongoliaDayBounds } = require("../utils/mongoliaTime");
const { sendToTokens, initFirebaseAdmin } = require("../services/fcm.service");
const { createInboxNotification } = require("../services/notification.service");

const User = db.users;
const Task = db.tasks;
const TaskAllocationLog = db.task_allocation_logs;
const UserNotification = db.user_notifications;
const sequelize = db.sequelize;

const MANAGEMENT_ROLES = ["director", "general_manager"];

async function reportAlreadySentToday(dayStr, dayStart, dayEnd) {
  const row = await UserNotification.findOne({
    where: {
      receiver_type: "supervisor_allocation_daily",
      createdAt: { [Op.between]: [dayStart, dayEnd] },
    },
    attributes: ["id"],
  });
  return !!row;
}

/** Supervisors who assigned at least one task today (logs + same-day task create fallback). */
async function getSupervisorIdsWhoAllocatedToday(dayStart, dayEnd) {
  const ids = new Set();

  const logs = await TaskAllocationLog.findAll({
    where: { createdAt: { [Op.between]: [dayStart, dayEnd] } },
    attributes: ["allocator_id"],
    raw: true,
  });
  for (const row of logs) {
    if (row.allocator_id) ids.add(Number(row.allocator_id));
  }

  const supervisors = await User.findAll({
    where: { role: "supervisor", is_active: true },
    attributes: ["id"],
    raw: true,
  });
  const supervisorIds = supervisors.map((s) => s.id);
  if (!supervisorIds.length) return ids;

  const createdWithAssignees = await Task.findAll({
    where: {
      created_by: { [Op.in]: supervisorIds },
      createdAt: { [Op.between]: [dayStart, dayEnd] },
      [Op.and]: sequelize.literal(
        "cardinality(COALESCE(assigned_to, ARRAY[]::integer[])) > 0"
      ),
    },
    attributes: ["created_by"],
    raw: true,
  });
  for (const row of createdWithAssignees) {
    if (row.created_by) ids.add(Number(row.created_by));
  }

  return ids;
}

function buildReportMessage(dayStr, supervisors, allocatedIds) {
  const allocated = supervisors.filter((s) => allocatedIds.has(s.id));
  const notAllocated = supervisors.filter((s) => !allocatedIds.has(s.id));
  const total = supervisors.length;

  if (total === 0) {
    return {
      title: "Өдрийн хуваарилгаа",
      message: `${dayStr}: Идэвхтэй ахлах (supervisor) бүртгэгдээгүй байна.`,
      summary: "no_supervisors",
    };
  }

  if (allocated.length === total) {
    const names = allocated.map((s) => s.full_name).join(", ");
    return {
      title: "Өдрийн хуваарилгаа",
      message: `${dayStr}: Бүх ахлах (${total}/${total}) өнөөдөр даалгавар хуваарилсан: ${names}.`,
      summary: "all_allocated",
    };
  }

  if (allocated.length === 0) {
    const names = notAllocated.map((s) => s.full_name).join(", ");
    return {
      title: "Өдрийн хуваарилгаа — анхааруулга",
      message: `${dayStr}: Өнөөдөр хэн ч даалгавар хуваарилаагүй (${total} ахлах). ${names}`,
      summary: "none_allocated",
    };
  }

  const doneNames = allocated.map((s) => s.full_name).join(", ");
  const missingNames = notAllocated.map((s) => s.full_name).join(", ");
  return {
    title: "Өдрийн хуваарилгаа — анхааруулга",
    message: `${dayStr}: Хуваарилаагүй (ажил гаргаагүй): ${missingNames}. Хуваарилсан: ${doneNames}.`,
    summary: "partial",
  };
}

async function notifyManagement({ title, message, dayStr }) {
  const managers = await User.findAll({
    where: {
      role: { [Op.in]: MANAGEMENT_ROLES },
      is_active: true,
    },
    attributes: ["id", "fcm_token", "full_name"],
  });

  if (!managers.length) {
    console.log("[supervisor-allocation] no director/general_manager users");
    return { notified: 0 };
  }

  for (const user of managers) {
    await createInboxNotification({
      userId: user.id,
      title,
      message,
      type: "warning",
      priority: "high",
      senderName: "Систем",
      receiverType: "supervisor_allocation_daily",
    });
  }

  if (initFirebaseAdmin()) {
    const tokens = managers.map((u) => u.fcm_token).filter(Boolean);
    if (tokens.length) {
      await sendToTokens(tokens, {
        title,
        body: message,
        data: {
          type: "supervisor_allocation_daily",
          date: dayStr,
        },
      });
    }
  }

  return { notified: managers.length };
}

/**
 * Daily 12:00 Mongolia: report supervisor allocation status to director & general_manager.
 */
async function runSupervisorAllocationDailyReport() {
  const { dayStr, start, end } = mongoliaDayBounds();

  if (await reportAlreadySentToday(dayStr, start, end)) {
    console.log(`[supervisor-allocation] ${dayStr}: already sent, skip`);
    return { skipped: true, day: dayStr };
  }

  const supervisors = await User.findAll({
    where: { role: "supervisor", is_active: true },
    attributes: ["id", "full_name"],
    order: [["full_name", "ASC"]],
  });

  const allocatedIds = await getSupervisorIdsWhoAllocatedToday(start, end);
  const { title, message, summary } = buildReportMessage(
    dayStr,
    supervisors,
    allocatedIds
  );

  const notifyResult = await notifyManagement({ title, message, dayStr });

  console.log(
    `[supervisor-allocation] ${dayStr} ${summary}: supervisors=${supervisors.length} allocated=${allocatedIds.size} managers=${notifyResult.notified}`
  );

  return {
    day: dayStr,
    summary,
    supervisorsTotal: supervisors.length,
    allocatedCount: allocatedIds.size,
    managersNotified: notifyResult.notified,
  };
}

module.exports = { runSupervisorAllocationDailyReport };
