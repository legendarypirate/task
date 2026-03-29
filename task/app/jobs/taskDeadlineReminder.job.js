const { Op } = require("sequelize");
const db = require("../models");
const { sendToTokens, initFirebaseAdmin } = require("../services/fcm.service");

const Task = db.tasks;
const User = db.users;
const sequelize = db.sequelize;

/**
 * Send push one calendar day before due_date for one-off tasks (frequency_type = none).
 * Notifies assignee; also notifies supervisor if set and different from assignee.
 */
async function runTaskDeadlineReminders() {
  if (!initFirebaseAdmin()) {
    console.log("[deadline-reminder] FCM not configured, skip");
    return { skipped: true };
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tY = tomorrow.getFullYear();
  const tM = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const tD = String(tomorrow.getDate()).padStart(2, "0");
  const tomorrowStr = `${tY}-${tM}-${tD}`;

  const tasks = await Task.findAll({
    where: sequelize.and(
      { due_date: { [Op.ne]: null } },
      { frequency_type: "none" },
      { status: { [Op.in]: ["pending", "in_progress", "done"] } },
      sequelize.literal("(due_date::date - CURRENT_DATE) = 1"),
      sequelize.literal(
        "(deadline_reminder_sent_for IS NULL OR deadline_reminder_sent_for::date <> due_date::date)"
      )
    ),
    include: [
      { model: User, as: "assignee", attributes: ["id", "fcm_token", "full_name"], required: false },
      { model: User, as: "supervisor", attributes: ["id", "fcm_token", "full_name"], required: false },
    ],
  });

  let sentTasks = 0;

  for (const task of tasks) {
    const dueDateOnly =
      task.due_date instanceof Date
        ? task.due_date.toISOString().slice(0, 10)
        : String(task.due_date).slice(0, 10);

    if (dueDateOnly !== tomorrowStr) continue;

    const tokens = [];
    const a = task.assignee;
    const s = task.supervisor;
    if (a && a.fcm_token) tokens.push(a.fcm_token);
    if (s && s.fcm_token && (!a || s.id !== a.id)) tokens.push(s.fcm_token);

    if (tokens.length) {
      const title = "Даалгаврын дуусах хугацаа ойртлоо";
      const body = `Маргааш дуусах: «${task.title}»`;
      await sendToTokens(tokens, {
        title,
        body,
        data: {
          type: "task_deadline_reminder",
          taskId: String(task.id),
          dueDate: dueDateOnly,
        },
      });
    }

    await task.update({ deadline_reminder_sent_for: dueDateOnly });
    sentTasks += 1;
  }

  console.log(
    `[deadline-reminder] ${todayStr} (due ${tomorrowStr}): ${sentTasks} task(s) marked / notified`
  );
  return { today: todayStr, dueTomorrow: tomorrowStr, updated: sentTasks };
}

module.exports = { runTaskDeadlineReminders };
