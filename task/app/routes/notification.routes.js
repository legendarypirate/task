module.exports = (app) => {
  const notifications = require("../controllers/notification.controller");

  const router = require("express").Router();

  router.get("/me", notifications.getMyNotifications);
  router.get("/me/unread-count", notifications.getUnreadCount);
  router.patch("/read-all", notifications.markAllAsRead);
  router.patch("/:id/read", notifications.markAsRead);
  router.get("/broadcasts", notifications.getBroadcastHistory);
  router.get("/broadcasts/stats", notifications.getBroadcastStats);

  app.use("/api/notifications", router);
};
