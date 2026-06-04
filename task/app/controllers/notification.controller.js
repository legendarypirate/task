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

function assertAdminRole(role) {
  const r = (role || "").toLowerCase();
  return r === "director" || r === "general_manager";
}

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const rows = await UserNotification.findAll({
      where: { user_id: userId },
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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const count = await UserNotification.count({
      where: { user_id: userId, read: false },
    });

    return res.json({ success: true, count });
  } catch (err) {
    console.error("getUnreadCount:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const row = await UserNotification.findOne({
      where: { id, user_id: userId },
    });
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
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }

    const [updated] = await UserNotification.update(
      { read: true, read_at: new Date() },
      { where: { user_id: userId, read: false } }
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
    if (!assertAdminRole(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Зөвхөн захирал эсвэл ерөнхий менежер харах эрхтэй",
      });
    }

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
    if (!assertAdminRole(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Зөвхөн захирал эсвэл ерөнхий менежер харах эрхтэй",
      });
    }

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
