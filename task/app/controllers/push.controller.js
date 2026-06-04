const db = require("../models");
const { Op } = db.Sequelize;
const { sendToTokens, initFirebaseAdmin } = require("../services/fcm.service");
const {
  createBroadcastAndInbox,
  serializeBroadcast,
} = require("../services/notification.service");

const User = db.users;

const ALL_ROLES = ["director", "general_manager", "supervisor", "worker"];

exports.registerFcmToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const token = req.body?.fcm_token ?? req.body?.token;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "fcm_token шаардлагатай" });
    }

    await User.update({ fcm_token: token }, { where: { id: userId } });
    return res.json({ success: true, message: "FCM токен хадгалагдлаа" });
  } catch (err) {
    console.error("registerFcmToken:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearFcmToken = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Нэвтрэх шаардлагатай" });
    }
    await User.update({ fcm_token: null }, { where: { id: userId } });
    return res.json({ success: true, message: "FCM токен устгагдлаа" });
  } catch (err) {
    console.error("clearFcmToken:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

function assertAdminRole(role) {
  const r = (role || "").toLowerCase();
  return r === "director" || r === "general_manager";
}

exports.broadcastByRoles = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    if (!assertAdminRole(req.user?.role)) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: "Зөвхөн захирал эсвэл ерөнхий менежер илгээх эрхтэй",
      });
    }

    const title = (req.body?.title || "").trim();
    const body = (req.body?.body || req.body?.message || "").trim();
    const type = req.body?.type;
    const priority = req.body?.priority;
    let roles = req.body?.roles;

    if (!title || !body) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Гарчиг болон мессеж шаардлагатай" });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      roles = [...ALL_ROLES];
    }

    const normalized = roles
      .map((r) => String(r).toLowerCase())
      .filter((r) => ALL_ROLES.includes(r));

    if (!normalized.length) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Хүчинтэй үүрэг сонгоно уу" });
    }

    const sender = await User.findByPk(req.user.userId, {
      attributes: ["id", "full_name", "role"],
      transaction: t,
    });
    if (!sender) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Илгээгч олдсонгүй" });
    }

    const users = await User.findAll({
      where: {
        role: normalized,
        is_active: true,
      },
      attributes: ["id", "fcm_token", "full_name", "role"],
      transaction: t,
    });

    const tokens = users.map((u) => u.fcm_token).filter(Boolean);

    let successCount = 0;
    let failureCount = 0;

    if (initFirebaseAdmin() && tokens.length) {
      const result = await sendToTokens(tokens, {
        title,
        body,
        data: {
          type: "admin_broadcast",
          notificationType: String(type || "announcement"),
          priority: String(priority || "medium"),
        },
      });
      successCount = result.successCount;
      failureCount = result.failureCount;
    } else if (tokens.length && !initFirebaseAdmin()) {
      failureCount = tokens.length;
    }

    const broadcast = await createBroadcastAndInbox({
      senderId: sender.id,
      senderName: sender.full_name,
      title,
      message: body,
      type,
      priority,
      roles: normalized,
      users,
      successCount,
      failureCount,
      transaction: t,
    });

    await t.commit();

    return res.json({
      success: true,
      message: "Илгээгдлээ",
      targetUsers: users.length,
      successCount,
      failureCount,
      roles: normalized,
      data: serializeBroadcast(broadcast),
    });
  } catch (err) {
    await t.rollback();
    console.error("broadcastByRoles:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.fcmStatus = async (req, res) => {
  const ready = initFirebaseAdmin();
  return res.json({ success: true, fcmConfigured: ready });
};
