const db = require("../models");
const { sendToTokens } = require("./fcm.service");
const { createInboxNotification } = require("./notification.service");

const User = db.users;

function parseIdList(value) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map((v) => Number(v)).filter(Number.isFinite))];
  }
  const n = Number(value);
  return Number.isFinite(n) ? [n] : [];
}

function idsAdded(beforeValue, afterValue) {
  const before = new Set(parseIdList(beforeValue));
  return parseIdList(afterValue).filter((id) => !before.has(id));
}

function collectRecipientIds(task) {
  const ids = [];
  for (const id of parseIdList(task.assigned_to)) {
    if (!ids.includes(id)) ids.push(id);
  }
  for (const id of parseIdList(task.supervisor_id)) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

async function resolveActorName(actorUserId, fallbackName) {
  if (fallbackName) return fallbackName;
  if (!actorUserId) return "Систем";
  const user = await User.findByPk(actorUserId, {
    attributes: ["full_name"],
  });
  return user?.full_name || "Систем";
}

/**
 * Notify users about a task (in-app inbox + FCM).
 * @param {object} params
 * @param {object} params.task - task row (needs id, title)
 * @param {number[]} params.recipientIds - user ids to notify
 * @param {number|null} [params.actorUserId] - skip notifying the actor
 * @param {string} [params.actorName]
 * @param {string} [params.title] - notification title
 * @param {string} [params.message] - notification body
 * @param {string} [params.receiverType] - inbox receiver_type
 */
async function notifyTaskAssignment({
  task,
  recipientIds,
  actorUserId = null,
  actorName,
  title = "Шинэ даалгавар",
  message,
  receiverType = "task_assigned",
}) {
  const taskId = task?.id;
  const taskTitle = (task?.title || "Даалгавар").trim();
  const body =
    message ||
    (actorName
      ? `${actorName} танд «${taskTitle}» даалгавар өгсөн`
      : `«${taskTitle}» даалгавар танд хуваарилагдлаа`);

  const targetIds = [...new Set(parseIdList(recipientIds))].filter(
    (id) => id !== actorUserId
  );
  if (!targetIds.length) {
    return { notified: 0, pushSuccess: 0, pushFailure: 0 };
  }

  const users = await User.findAll({
    where: { id: targetIds, is_active: true },
    attributes: ["id", "fcm_token", "full_name"],
  });

  const senderName = await resolveActorName(actorUserId, actorName);

  for (const user of users) {
    await createInboxNotification({
      userId: user.id,
      title,
      message: body,
      type: "task",
      priority: task?.priority === "high" ? "high" : "medium",
      senderName,
      receiverType,
    });
  }

  const tokens = users.map((u) => u.fcm_token).filter(Boolean);
  let pushSuccess = 0;
  let pushFailure = 0;
  if (tokens.length) {
    const result = await sendToTokens(tokens, {
      title,
      body,
      data: {
        type: "task_assigned",
        taskId: taskId != null ? String(taskId) : "",
      },
    });
    pushSuccess = result.successCount;
    pushFailure = result.failureCount;
  }

  return {
    notified: users.length,
    pushSuccess,
    pushFailure,
  };
}

/** Fire-and-forget wrapper — does not block HTTP handlers. */
function notifyTaskAssignmentAsync(params) {
  notifyTaskAssignment(params).catch((err) => {
    console.error("[task-notify] failed:", err.message);
  });
}

module.exports = {
  parseIdList,
  idsAdded,
  collectRecipientIds,
  notifyTaskAssignment,
  notifyTaskAssignmentAsync,
};
