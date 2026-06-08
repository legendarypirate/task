const db = require("../models");
const { Op } = db.Sequelize;
const UserNotification = db.user_notifications;
const Broadcast = db.broadcasts;
const User = db.users;
const {
  serializeNotification,
  serializeBroadcast,
} = require("../services/notification.service");

const ALL_ROLES = ["director", "general_manager", "supervisor", "worker"];

function resolveUserId(req) {
  return req.query.user_id || req.body?.user_id || null;
}

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    const rows = await UserNotification.findAll({
      where: userId ? { user_id: userId } : undefined,
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

    return res.json({
      success: true,
      data: rows.map(serializeNotification),
    });
  } catch (err) {
    console.error("getMyNotifications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    const count = await UserNotification.count({
      where: userId ? { user_id: userId, read: false } : { read: false },
    });

    return res.json({ success: true, count });
  } catch (err) {
    console.error("getUnreadCount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const id = req.params.id;

    const where = { id };
    if (userId) where.user_id = userId;

    const row = await UserNotification.findOne({ where });
    if (!row) {
      return res.status(404).json({ success: false, message: "Мэдэгдэл олдсонгүй" });
    }

    if (!row.read) {
      await row.update({ read: true, read_at: new Date() });
    }

    return res.json({
      success: true,
      message: "Уншсан болголоо",
      data: serializeNotification(row),
    });
  } catch (err) {
    console.error("markAsRead:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = resolveUserId(req);

    const [updated] = await UserNotification.update(
      { read: true, read_at: new Date() },
      { where: userId ? { user_id: userId, read: false } : { read: false } }
    );

    return res.json({
      success: true,
      message: "Бүх мэдэгдлийг уншсан болголоо",
      updated,
    });
  } catch (err) {
    console.error("markAllAsRead:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBroadcastHistory = async (req, res) => {
  try {
    const rows = await Broadcast.findAll({
      order: [["createdAt", "DESC"]],
      limit: 100,
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "full_name", "role"],
        },
      ],
    });

    return res.json({
      success: true,
      data: rows.map((row) => {
        const item = serializeBroadcast(row);
        if (row.sender) {
          item.sender_name = row.sender.full_name || item.sender_name;
        }
        return item;
      }),
    });
  } catch (err) {
    console.error("getBroadcastHistory:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBroadcastStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, highPriority, todayCount] = await Promise.all([
      Broadcast.count(),
      Broadcast.count({ where: { priority: "high" } }),
      Broadcast.count({
        where: {
          createdAt: { [Op.gte]: startOfToday },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: { total, highPriority, todayCount },
    });
  } catch (err) {
    console.error("getBroadcastStats:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports.ALL_ROLES = ALL_ROLES;
