const db = require("../models");
const Task = db.tasks;
const User = db.users;
const Op = db.Sequelize.Op;
const path = require('path');
const fs = require('fs');
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const {
  collectRecipientIds,
  idsAdded,
  notifyTaskAssignmentAsync,
} = require("../services/taskNotification.service");
const { recordSupervisorAllocationAsync } = require("../services/allocationLog.service");

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";

/** Resolve assigner from auth middleware or Bearer token (task routes are often unguarded). */
function getActorFromRequest(req, bodyUserId) {
  if (req.user?.userId) {
    return { userId: req.user.userId, name: req.user.fullName || null };
  }
  const token = req.headers?.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { userId: decoded.userId, name: decoded.fullName || null };
    } catch (_) {
      /* ignore invalid token */
    }
  }
  const uid = toNullableInt(bodyUserId);
  return { userId: uid, name: null };
}

function toNullableInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableIntArray(value) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) {
    return value.map(v => Number(v)).filter(n => Number.isFinite(n));
  }
  const n = Number(value);
  return Number.isFinite(n) ? [n] : null;
}

/** Merge multiple body fields (e.g. supervisor_id + supervisor_ids) into one deduped int[] or null. */
function mergeBodyIntArrays(body, keys) {
  const merged = [];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const arr = toNullableIntArray(body[key]);
    if (arr) for (const n of arr) if (!merged.includes(n)) merged.push(n);
  }
  return merged.length ? merged : null;
}

function toNullableDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
// ---------------------- CREATE ----------------------
exports.create = async (req, res) => {
  try {
    const { title, description, created_by, priority, status, image, due_date, frequency_type, frequency_value } = req.body;

    if (!title) {
      return res.status(400).send({ success: false, message: "Гарчиг оруулна уу" });
    }

    const normalizedFrequencyType = frequency_type || "none";
    const normalizedAssignedTo = mergeBodyIntArrays(req.body, [
      "assigned_to",
      "assigned_to_ids",
      "assignee_ids",
    ]);
    const normalizedSupervisorId = mergeBodyIntArrays(req.body, [
      "supervisor_id",
      "supervisor_ids",
    ]);
    const normalizedDueDate =
      normalizedFrequencyType === "none" ? toNullableDate(due_date) : null;
    const normalizedFrequencyValue =
      normalizedFrequencyType === "none" ? null : toNullableInt(frequency_value);

    const creatorId = created_by || req.user?.userId || 1;
    const task = await Task.create({
      title,
      description,
      created_by: creatorId,
      assigned_to: normalizedAssignedTo,
      supervisor_id: normalizedSupervisorId,
      priority: priority || "normal",
      status: status || "pending",
      image,
      due_date: normalizedDueDate,
      frequency_type: normalizedFrequencyType,
      frequency_value: normalizedFrequencyValue
    });

    const actor = getActorFromRequest(req, creatorId);
    if (normalizedAssignedTo?.length) {
      recordSupervisorAllocationAsync({
        actorUserId: actor.userId,
        taskId: task.id,
        action: "create",
      });
    }

    const recipientIds = collectRecipientIds(task);
    if (recipientIds.length) {
      notifyTaskAssignmentAsync({
        task,
        recipientIds,
        actorUserId: actor.userId,
        actorName: actor.name,
        title: "Шинэ даалгавар",
        receiverType: "task_assigned",
      });
    }

    return res.send({ success: true, data: task });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ALL ----------------------
exports.findAll = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.send({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND ONE ----------------------
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    return res.send({ success: true, data: task });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- UPDATE ----------------------
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = { ...req.body };
    const assignKeys = ["assigned_to", "assigned_to_ids", "assignee_ids"];
    const supervisorKeys = ["supervisor_id", "supervisor_ids"];
    if (assignKeys.some((k) => Object.prototype.hasOwnProperty.call(payload, k))) {
      payload.assigned_to = mergeBodyIntArrays(payload, assignKeys);
    }
    if (supervisorKeys.some((k) => Object.prototype.hasOwnProperty.call(payload, k))) {
      payload.supervisor_id = mergeBodyIntArrays(payload, supervisorKeys);
    }
    delete payload.assigned_to_ids;
    delete payload.assignee_ids;
    delete payload.supervisor_ids;
    if (Object.prototype.hasOwnProperty.call(payload, "due_date")) {
      payload.due_date = toNullableDate(payload.due_date);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "frequency_value")) {
      payload.frequency_value = toNullableInt(payload.frequency_value);
    }
    if (
      Object.prototype.hasOwnProperty.call(payload, "frequency_type") &&
      payload.frequency_type === "none"
    ) {
      payload.frequency_value = null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "due_date")) {
      payload.deadline_reminder_sent_for = null;
    }

    const assignmentTouched =
      assignKeys.some((k) => Object.prototype.hasOwnProperty.call(req.body, k)) ||
      supervisorKeys.some((k) => Object.prototype.hasOwnProperty.call(req.body, k));

    const before = assignmentTouched ? await Task.findByPk(id) : null;
    if (assignmentTouched && !before) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    const result = await Task.update(payload, { where: { id } });
    if (result[0] === 0) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    if (assignmentTouched && before) {
      const after = await Task.findByPk(id);
      const actor = getActorFromRequest(req, req.body.created_by);
      const newAssignees = idsAdded(before.assigned_to, after?.assigned_to);
      const newSupervisors = idsAdded(before.supervisor_id, after?.supervisor_id);

      if (after && newAssignees.length) {
        recordSupervisorAllocationAsync({
          actorUserId: actor.userId,
          taskId: after.id,
          action: "update",
        });
        notifyTaskAssignmentAsync({
          task: after,
          recipientIds: newAssignees,
          actorUserId: actor.userId,
          actorName: actor.name,
          title: "Даалгавар хуваарилагдлаа",
          receiverType: "task_assigned",
        });
      }
      if (after && newSupervisors.length) {
        notifyTaskAssignmentAsync({
          task: after,
          recipientIds: newSupervisors,
          actorUserId: actor.userId,
          actorName: actor.name,
          title: "Хянагч томилогдлоо",
          message: actor.name
            ? `${actor.name} танд «${(after.title || "").trim()}» даалгаврыг хянах үүрэг өгсөн`
            : `«${(after.title || "").trim()}» даалгаврыг хянах үүрэг танд өгөгдлөө`,
          receiverType: "task_supervisor",
        });
      }
    }

    return res.send({ success: true, message: "Амжилттай шинэчлэгдлээ" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ----------------------
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Task.destroy({ where: { id } });
    if (!result) {
      return res.status(404).send({ success: false, message: "Таск олдсонгүй" });
    }

    return res.send({ success: true, message: "Амжилттай устлаа" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- DELETE ALL ----------------------
exports.deleteAll = async (req, res) => {
  try {
    const count = await Task.destroy({ where: {}, truncate: false });

    return res.send({
      success: true,
      message: `${count} таск устгагдлаа`,
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- FIND PUBLISHED (optional) ----------------------
exports.findAllPublished = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { status: "done" },
    });

    return res.send({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// Add this function to your task.controller.js file

// Assign supervisor to task
exports.assignSupervisor = async (req, res) => {
  try {
    const taskId = req.params.id;
    const supervisorIds = mergeBodyIntArrays(req.body, [
      "supervisor_id",
      "supervisor_ids",
    ]);

    if (!supervisorIds?.length) {
      return res.status(400).json({
        success: false,
        message: "Supervisor ID is required"
      });
    }

    const before = await Task.findByPk(taskId);
    if (!before) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    for (const sid of supervisorIds) {
      const supervisor = await User.findByPk(sid);
      if (!supervisor) {
        return res.status(404).json({
          success: false,
          message: `Supervisor not found (id ${sid})`
        });
      }
      const role = String(supervisor.role || "").toLowerCase();
      if (role !== "supervisor") {
        return res.status(400).json({
          success: false,
          message: "User is not a supervisor"
        });
      }
    }

    await Task.update({ supervisor_id: supervisorIds }, { where: { id: taskId } });

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'full_name', 'phone', 'role']
        }
      ]
    });

    const newSupervisors = idsAdded(before.supervisor_id, supervisorIds);
    const notifyIds = newSupervisors.length ? newSupervisors : supervisorIds;
    const actor = getActorFromRequest(req);
    notifyTaskAssignmentAsync({
      task: updatedTask,
      recipientIds: notifyIds,
      actorUserId: actor.userId,
      actorName: actor.name,
      title: "Хянагч томилогдлоо",
      message: actor.name
        ? `${actor.name} танд «${(updatedTask?.title || "").trim()}» даалгаврыг хянах үүрэг өгсөн`
        : undefined,
      receiverType: "task_supervisor",
    });

    res.json({
      success: true,
      message: "Supervisor assigned successfully",
      data: updatedTask
    });
  } catch (error) {
    console.error("Error assigning supervisor:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning supervisor",
      error: error.message
    });
  }
};

// ---------------------- UPDATE STATUS (KANBAN DRAG) ----------------------
exports.updateStatus = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    // DEBUG: Log everything
    console.log('=== UPDATE STATUS DEBUG ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Headers content-type:', req.headers['content-type']);

    const { id } = req.params;

    // IMPORTANT: For multipart/form-data, body parser doesn't work
    // We need to read status from req.body if available, or from query
    let status = req.body.status;

    // If status is not in body, check query or try to parse manually
    if (!status) {
      status = req.query.status;
      console.log('Status not in body, trying query:', status);
    }

    // If still not found, the request might not be parsed properly
    if (!status) {
      console.log('❌ STATUS NOT FOUND! Check multer configuration');
      console.log('Full request object keys:', Object.keys(req));
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Статус олдсонгүй!",
        debug: {
          params: req.params,
          bodyKeys: Object.keys(req.body),
          query: req.query,
          hasFile: !!req.file
        }
      });
    }

    const validStatuses = ["pending", "in_progress", "done", "verified", "cancelled"];

    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status received:', status);
      console.log('Valid statuses:', validStatuses);
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Буруу статус байна!",
        debug: {
          receivedStatus: status,
          validStatuses: validStatuses
        }
      });
    }

    const task = await Task.findByPk(id, { transaction: t });
    if (!task) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Даалгавар олдсонгүй"
      });
    }

    const updateData = { status };

    if (status === "done") {
      updateData.completed_at = new Date();
    }

    // ✅ Only require image when status changes to "done"
    if (status === "done" && !req.file) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "'Дууссан' статус руу шилжихэд зураг шаардлагатай!"
      });
    }

    // ✅ Handle image upload if file exists
    if (req.file) {
      console.log('📁 File received:', req.file.originalname, 'size:', req.file.size);

      // Create temporary file
      const tempPath = path.join(__dirname, `../tmp/${Date.now()}.png`);
      const tmpDir = path.dirname(tempPath);

      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Write buffer to file
      fs.writeFileSync(tempPath, req.file.buffer);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(tempPath, {
        folder: "tasks",
        transformation: [
          { width: 1000, crop: "scale" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      });

      // Clean up temp file
      fs.unlinkSync(tempPath);

      updateData.image = result.secure_url;
    }

    await task.update(updateData, { transaction: t });
    await task.reload({ transaction: t });

    await t.commit();

    console.log('✅ Status updated successfully:', status);
    console.log('Task ID:', id);
    console.log('=== END DEBUG ===');

    res.status(200).json({
      success: true,
      message: "Төлөв амжилттай шинэчлэгдлээ",
      data: task
    });

  } catch (err) {
    await t.rollback();
    console.error("🔥 Төлөв шинэчлэхэд алдаа гарлаа:", err);
    console.error("🔥 Error stack:", err.stack);
    res.status(500).json({
      success: false,
      message: "Серверийн алдаа: " + err.message
    });
  }
};
// ---------------------- UPDATE EVENT DATES (calendar) ----------------------
exports.updateEventDates = async (req, res) => {
  try {
    const { id, due_date } = req.body;

    await Task.update({ due_date }, { where: { id } });

    return res.send({ success: true, message: "Огноо шинэчлэгдлээ" });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- MONTHLY REPORT (backoffice) ----------------------

const MONTHLY_REPORT_ENGINEER_ROLES = ["supervisor", "director", "general_manager"];
const MONTHLY_REPORT_WORKER_ROLES = ["worker"];

const ROLE_LABEL_MN = {
  supervisor: "Инженер",
  worker: "Завсарчин",
  director: "Удирдагч",
  general_manager: "Ерөнхий менежер",
};

const TASK_STATUS_LABEL_MN = {
  pending: "Хүлээгдэж байна",
  in_progress: "Гүйцэтгэж байна",
  done: "Хянагдаж байна",
  verified: "Батлагдсан",
  cancelled: "Буцаагдсан",
};

const AVATAR_BG_COLORS = [
  "#4CAF50",
  "#795548",
  "#F44336",
  "#2196F3",
  "#9C27B0",
  "#FF9800",
  "#00BCD4",
  "#E91E63",
];

function assigneeIdsFromTask(task) {
  const raw = task.assigned_to;
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  }
  const n = Number(raw);
  return Number.isFinite(n) ? [n] : [];
}

function taskInReportingMonth(task, monthStart, monthEnd) {
  const created = task.createdAt ? new Date(task.createdAt) : null;
  const updated = task.updatedAt ? new Date(task.updatedAt) : null;
  const due = task.due_date ? new Date(task.due_date) : null;

  const inRange = (d) =>
    d &&
    !Number.isNaN(d.getTime()) &&
    d >= monthStart &&
    d <= monthEnd;

  if (inRange(due)) return true;
  if (inRange(created)) return true;
  if (inRange(updated)) return true;
  return false;
}

function initialsFromFullName(fullName) {
  if (!fullName || typeof fullName !== "string") return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[parts.length - 1][0] || "";
    return (a + b).toUpperCase();
  }
  return fullName.trim().slice(0, 2).toUpperCase();
}

function avatarColorForUserId(userId) {
  const idx = Math.abs(Number(userId)) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
}

function formatYmd(d) {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

exports.getMonthlyReport = async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: "Буруу он, сар" });
    }

    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const [allTasks, engineers, workers] = await Promise.all([
      Task.findAll({ order: [["id", "ASC"]] }),
      User.findAll({
        where: { role: { [Op.in]: MONTHLY_REPORT_ENGINEER_ROLES } },
        order: [["full_name", "ASC"]],
      }),
      User.findAll({
        where: { role: { [Op.in]: MONTHLY_REPORT_WORKER_ROLES } },
        order: [["full_name", "ASC"]],
      }),
    ]);

    const tasksInMonth = allTasks.filter((t) => taskInReportingMonth(t, monthStart, monthEnd));

    function buildUserReport(user) {
      const mine = tasksInMonth.filter((t) => assigneeIdsFromTask(t).includes(user.id));

      const status_counts = {
        approved: 0,
        review: 0,
        returned: 0,
        waiting: 0,
        in_progress: 0,
      };

      for (const t of mine) {
        const s = t.status;
        if (s === "verified") status_counts.approved += 1;
        else if (s === "done") status_counts.review += 1;
        else if (s === "cancelled") status_counts.returned += 1;
        else if (s === "pending") status_counts.waiting += 1;
        else if (s === "in_progress") status_counts.in_progress += 1;
      }

      const total = mine.length;
      const completion_percentage =
        total === 0 ? 0 : Math.round((status_counts.approved / total) * 100);

      const tasks = mine.map((t, idx) => {
        const json = t.toJSON ? t.toJSON() : t;
        return {
          index: idx + 1,
          id: json.id,
          title: json.title,
          description: json.description || "",
          start_date: formatYmd(json.createdAt),
          end_date: formatYmd(json.due_date),
          image_url: json.image || null,
          status: json.status,
          status_label: TASK_STATUS_LABEL_MN[json.status] || json.status,
        };
      });

      return {
        id: user.id,
        name: user.full_name,
        role: user.role,
        role_label: ROLE_LABEL_MN[user.role] || user.role,
        avatar_initials: initialsFromFullName(user.full_name),
        avatar_color: avatarColorForUserId(user.id),
        completion_percentage,
        status_counts,
        tasks,
      };
    }

    const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    return res.json({
      success: true,
      data: {
        year,
        month,
        month_label: monthLabel,
        sections: [
          {
            id: "engineers",
            title: "ИНЖЕНЕРҮҮДИЙН АЖЛЫН ТАЙЛАН",
            users: engineers.map((u) => buildUserReport(u)),
          },
          {
            id: "employees",
            title: "АЖИЛТНУУДЫН АЖЛЫН ТАЙЛАН",
            users: workers.map((u) => buildUserReport(u)),
          },
        ],
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------- STATS ----------------------
exports.getStats = async (req, res) => {
  try {
    const total = await Task.count();
    const pending = await Task.count({ where: { status: "pending" } });
    const in_progress = await Task.count({ where: { status: "in_progress" } });
    const done = await Task.count({ where: { status: "done" } });
    const verified = await Task.count({ where: { status: "verified" } });
    const cancelled = await Task.count({ where: { status: "cancelled" } });

    const active_tasks = pending + in_progress;
    const finished = done + verified;
    const completion_rate_pct =
      total > 0 ? Math.round((finished / total) * 1000) / 10 : 0;
    const verified_among_finished_pct =
      finished > 0 ? Math.round((verified / finished) * 1000) / 10 : 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const tasks_created_today = await Task.count({
      where: {
        createdAt: { [Op.gte]: startOfToday, [Op.lt]: endOfToday },
      },
    });

    const tasks_completed_today = await Task.count({
      where: {
        status: { [Op.in]: ["done", "verified"] },
        updatedAt: { [Op.gte]: startOfToday, [Op.lt]: endOfToday },
      },
    });

    const dueSoonEnd = new Date(now);
    dueSoonEnd.setDate(dueSoonEnd.getDate() + 4);
    dueSoonEnd.setHours(23, 59, 59, 999);
    const tasks_due_soon = await Task.count({
      where: {
        due_date: { [Op.between]: [now, dueSoonEnd] },
        status: { [Op.in]: ["pending", "in_progress"] },
      },
    });

    const completedThisMonth = await Task.count({
      where: {
        status: { [Op.in]: ["done", "verified"] },
        updatedAt: { [Op.gte]: startOfMonth },
      },
    });

    const completedLastMonth = await Task.count({
      where: {
        status: { [Op.in]: ["done", "verified"] },
        updatedAt: {
          [Op.gte]: startOfLastMonth,
          [Op.lt]: startOfMonth,
        },
      },
    });

    let month_over_month_pct = 0;
    if (completedLastMonth > 0) {
      month_over_month_pct =
        Math.round(
          ((completedThisMonth - completedLastMonth) / completedLastMonth) * 1000
        ) / 10;
    } else if (completedThisMonth > 0) {
      month_over_month_pct = 100;
    }

    const withCompletion = await Task.findAll({
      where: { completed_at: { [Op.ne]: null } },
      attributes: ["createdAt", "completed_at"],
      raw: true,
    });
    let avg_completion_days = null;
    if (withCompletion.length) {
      let sum = 0;
      for (const t of withCompletion) {
        sum +=
          (new Date(t.completed_at).getTime() -
            new Date(t.createdAt).getTime()) /
          86400000;
      }
      avg_completion_days = Math.round((sum / withCompletion.length) * 10) / 10;
    }

    const users_total = await User.count();
    const users_active = await User.count({ where: { is_active: true } });
    const new_users_this_month = await User.count({
      where: { createdAt: { [Op.gte]: startOfMonth } },
    });

    const completedThisMonthTasks = await Task.findAll({
      where: {
        status: { [Op.in]: ["done", "verified"] },
        updatedAt: { [Op.gte]: startOfMonth },
        assigned_to: { [Op.ne]: null },
      },
      attributes: ["assigned_to"],
      raw: true,
    });
    const byAssignee = {};
    for (const row of completedThisMonthTasks) {
      const id = row.assigned_to;
      byAssignee[id] = (byAssignee[id] || 0) + 1;
    }
    let top_worker = null;
    let topCount = 0;
    let topUid = null;
    for (const [uid, cnt] of Object.entries(byAssignee)) {
      if (cnt > topCount) {
        topCount = cnt;
        topUid = Number(uid);
      }
    }
    if (topUid) {
      const u = await User.findByPk(topUid, {
        attributes: ["id", "full_name"],
      });
      if (u) {
        const pct =
          completedThisMonth > 0
            ? Math.round((topCount / completedThisMonth) * 1000) / 10
            : 0;
        top_worker = {
          id: u.id,
          full_name: u.full_name,
          completed_tasks: topCount,
          share_of_month_pct: pct,
        };
      }
    }

    return res.send({
      success: true,
      data: {
        total,
        pending,
        in_progress,
        done,
        verified,
        cancelled,
        dashboard: {
          users_total,
          users_active,
          new_users_this_month,
          active_tasks,
          completion_rate_pct,
          avg_completion_days,
          verified_among_finished_pct,
          month_over_month_pct,
          tasks_created_today,
          tasks_completed_today,
          tasks_due_soon,
          completed_this_month: completedThisMonth,
          top_worker,
        },
      },
    });
  } catch (err) {
    return res.status(500).send({ success: false, message: err.message });
  }
};

// ---------------------- CALENDAR TASKS ----------------------
exports.getCalendarTasks = async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Бүх task-уудыг авах
    const tasks = await Task.findAll();

    // Календарт харуулах task-уудыг бэлтгэх
    const calendarTasks = [];

    for (const task of tasks) {
      if (task.frequency_type === 'none') {
        // Энгийн task - due_date шалгах
        if (task.due_date && isDateInMonth(task.due_date, year, month)) {
          calendarTasks.push({
            ...task.toJSON(),
            is_generated: false
          });
        }
      } else {
        // Давтамжтай task - бүх өдрүүдэд үүсгэх
        const instances = generateTaskInstances(task, year, month);
        calendarTasks.push(...instances);
      }
    }

    res.json({
      success: true,
      data: calendarTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignToWorker = async (req, res) => {
  try {
    const taskId = req.params.id;
    const assigneeIds = mergeBodyIntArrays(req.body, [
      "assigned_to",
      "assigned_to_ids",
      "assignee_ids",
    ]);

    if (!assigneeIds?.length) {
      return res.status(400).json({
        success: false,
        message: "Ажилтны ID шаардлагатай"
      });
    }

    const before = await Task.findByPk(taskId);
    if (!before) {
      return res.status(404).json({
        success: false,
        message: "Даалгавар олдсонгүй"
      });
    }

    for (const wid of assigneeIds) {
      const worker = await User.findByPk(wid);
      if (!worker) {
        return res.status(404).json({
          success: false,
          message: `Ажилтан олдсонгүй (id ${wid})`
        });
      }
    }

    await Task.update({ assigned_to: assigneeIds }, { where: { id: taskId } });

    const updatedTask = await Task.findByPk(taskId);
    const newAssignees = idsAdded(before.assigned_to, assigneeIds);
    const notifyIds = newAssignees.length ? newAssignees : assigneeIds;
    const actor = getActorFromRequest(req);
    recordSupervisorAllocationAsync({
      actorUserId: actor.userId,
      taskId: Number(taskId),
      action: "assign",
    });
    notifyTaskAssignmentAsync({
      task: updatedTask,
      recipientIds: notifyIds,
      actorUserId: actor.userId,
      actorName: actor.name,
      title: "Даалгавар хуваарилагдлаа",
      receiverType: "task_assigned",
    });

    return res.status(200).json({
      success: true,
      message: "Даалгавар амжилттай хуваарилагдлаа",
      data: updatedTask
    });

  } catch (error) {
    console.error("❌ Error assigning task to worker:", error);
    return res.status(500).json({
      success: false,
      message: "Даалгавар хуваарилахад алдаа гарлаа",
      error: error.message
    });
  }
};

// ---------------------- GENERATE RECURRING TASKS ----------------------
exports.generateRecurringTasks = async (req, res) => {
  try {
    const { year, month } = req.body;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Давтамжтай task-уудыг авах
    const recurringTasks = await Task.findAll({
      where: {
        frequency_type: { [Op.ne]: 'none' }
      }
    });

    const createdTasks = [];

    for (const template of recurringTasks) {
      const instances = generateTaskInstances(template, year, month);

      for (const instance of instances) {
        // Шалгах: энэ өдөр энэ task аль хэдийн үүссэн эсэх
        const existingTask = await Task.findOne({
          where: {
            title: instance.title,
            due_date: {
              [Op.between]: [
                new Date(instance.due_date.setHours(0, 0, 0, 0)),
                new Date(instance.due_date.setHours(23, 59, 59, 999))
              ]
            }
          }
        });

        if (!existingTask) {
          const task = await Task.create({
            title: instance.title,
            description: instance.description,
            created_by: req.user?.userId || 1, // req.user байхгүй бол default
            assigned_to: instance.assigned_to,
            supervisor_id: instance.supervisor_id,
            priority: instance.priority,
            status: 'pending',
            due_date: instance.due_date,
            frequency_type: 'none', // Үүссэн task нь энгийн болно
            frequency_value: null
          });
          createdTasks.push(task);
        }
      }
    }

    res.json({
      success: true,
      message: `${createdTasks.length} шинэ ажил үүслээ`,
      data: createdTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ---------------------- HELPER FUNCTIONS ----------------------

// Тухайн сард өдөр байгаа эсэхийг шалгах
function isDateInMonth(date, year, month) {
  const checkDate = new Date(date);
  return checkDate.getFullYear() === parseInt(year) &&
    checkDate.getMonth() === parseInt(month) - 1;
}

// Давтамжтай task-ийн instance үүсгэх
function generateTaskInstances(task, year, month) {
  const instances = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    let shouldCreate = false;

    switch (task.frequency_type) {
      case 'daily':
        shouldCreate = true;
        break;

      case 'weekly':
        if (currentDate.getDay() === task.frequency_value) {
          shouldCreate = true;
        }
        break;

      case 'monthly':
        if (currentDate.getDate() === task.frequency_value) {
          shouldCreate = true;
        }
        break;
    }

    if (shouldCreate) {
      instances.push({
        ...task.toJSON(),
        id: `${task.id}_${currentDate.getTime()}`, // Уникал ID
        due_date: new Date(currentDate),
        is_generated: true,
        original_task_id: task.id
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances; // Энэ мөрийг нэмэх
}