const db = require("../models");
const { Op } = db.Sequelize;
const { sendToTokens, initFirebaseAdmin } = require("../services/fcm.service");

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
  try {
    if (!assertAdminRole(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: "Зөвхөн захирал эсвэл ерөнхий менежер илгээх эрхтэй",
      });
    }

    const title = (req.body?.title || "").trim();
    const body = (req.body?.body || req.body?.message || "").trim();
    let roles = req.body?.roles;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Гарчиг болон мессеж шаардлагатай" });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      roles = [...ALL_ROLES];
    }

    const normalized = roles
      .map((r) => String(r).toLowerCase())
      .filter((r) => ALL_ROLES.includes(r));

    if (!normalized.length) {
      return res.status(400).json({ success: false, message: "Хүчинтэй үүрэг сонгоно уу" });
    }

    if (!initFirebaseAdmin()) {
      return res.status(503).json({
        success: false,
        message: "FCM тохируулаагүй байна (FIREBASE_SERVICE_ACCOUNT_JSON)",
      });
    }

    const users = await User.findAll({
      where: {
        role: normalized,
        is_active: true,
        fcm_token: { [Op.ne]: null },
      },
      attributes: ["id", "fcm_token"],
    });

    const tokens = users.map((u) => u.fcm_token).filter(Boolean);
    const result = await sendToTokens(tokens, {
      title,
      body,
      data: { type: "admin_broadcast" },
    });

    return res.json({
      success: true,
      message: "Илгээгдлээ",
      targetUsers: users.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      roles: normalized,
    });
  } catch (err) {
    console.error("broadcastByRoles:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.fcmStatus = async (req, res) => {
  const ready = initFirebaseAdmin();
  return res.json({ success: true, fcmConfigured: ready });
};
