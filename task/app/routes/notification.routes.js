module.exports = (app) => {
  const auth = require("../controllers/auth.controller");
  const notifications = require("../controllers/notification.controller");

  const router = require("express").Router();

  router.get("/me", auth.verifyToken, notifications.getMyNotifications);
  router.get("/me/unread-count", auth.verifyToken, notifications.getUnreadCount);
  router.patch("/read-all", auth.verifyToken, notifications.markAllAsRead);
  router.patch("/:id/read", auth.verifyToken, notifications.markAsRead);
  router.get("/broadcasts", auth.verifyToken, notifications.getBroadcastHistory);
  router.get("/broadcasts/stats", auth.verifyToken, notifications.getBroadcastStats);

  app.use("/api/notifications", router);
};
