const db = require("../models");

const Broadcast = db.broadcasts;
const UserNotification = db.user_notifications;

const VALID_TYPES = [
  "announcement",
  "task",
  "reminder",
  "warning",
  "congrats",
  "training",
];
const VALID_PRIORITIES = ["low", "medium", "high"];

function normalizeType(value) {
  const t = String(value || "announcement").toLowerCase();
  return VALID_TYPES.includes(t) ? t : "announcement";
}

function normalizePriority(value) {
  const p = String(value || "medium").toLowerCase();
  return VALID_PRIORITIES.includes(p) ? p : "medium";
}

function serializeNotification(row) {
  const json = row.toJSON ? row.toJSON() : row;
  return {
    id: json.id,
    user_id: json.user_id,
    broadcast_id: json.broadcast_id,
    title: json.title,
    message: json.message,
    type: json.type,
    priority: json.priority,
    sender_name: json.sender_name,
    receiver_type: json.receiver_type,
    read: !!json.read,
    read_at: json.read_at,
    created_at: json.createdAt,
    updated_at: json.updatedAt,
  };
}

function serializeBroadcast(row) {
  const json = row.toJSON ? row.toJSON() : row;
  return {
    id: json.id,
    title: json.title,
    message: json.message,
    type: json.type,
    priority: json.priority,
    sender_id: json.sender_id,
    sender_name: json.sender_name,
    roles: json.roles || [],
    receiver_type: json.receiver_type,
    target_users: json.target_users,
    success_count: json.success_count,
    failure_count: json.failure_count,
    status: json.status,
    created_at: json.createdAt,
    updated_at: json.updatedAt,
  };
}

/**
 * Persist admin broadcast + inbox rows for each target user.
 * @param {object} params
 * @param {import('sequelize').Transaction} [params.transaction]
 */
async function createBroadcastAndInbox({
  senderId,
  senderName,
  title,
  message,
  type,
  priority,
  roles,
  users,
  successCount = 0,
  failureCount = 0,
  transaction,
}) {
  const broadcast = await Broadcast.create(
    {
      title,
      message,
      type: normalizeType(type),
      priority: normalizePriority(priority),
      sender_id: senderId,
      sender_name: senderName,
      roles,
      receiver_type: "role_broadcast",
      target_users: users.length,
      success_count: successCount,
      failure_count: failureCount,
      status: "sent",
    },
    { transaction }
  );

  if (users.length) {
    await UserNotification.bulkCreate(
      users.map((user) => ({
        user_id: user.id,
        broadcast_id: broadcast.id,
        title,
        message,
        type: normalizeType(type),
        priority: normalizePriority(priority),
        sender_name: senderName,
        receiver_type: "role_broadcast",
        read: false,
      })),
      { transaction }
    );
  }

  return broadcast;
}

async function createInboxNotification({
  userId,
  title,
  message,
  type = "reminder",
  priority = "medium",
  senderName = "Систем",
  receiverType = "system",
  broadcastId = null,
  transaction,
}) {
  return UserNotification.create(
    {
      user_id: userId,
      broadcast_id: broadcastId,
      title,
      message,
      type: normalizeType(type),
      priority: normalizePriority(priority),
      sender_name: senderName,
      receiver_type: receiverType,
      read: false,
    },
    { transaction }
  );
}

module.exports = {
  VALID_TYPES,
  VALID_PRIORITIES,
  normalizeType,
  normalizePriority,
  serializeNotification,
  serializeBroadcast,
  createBroadcastAndInbox,
  createInboxNotification,
};
