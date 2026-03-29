const auth = require("../controllers/auth.controller");
const push = require("../controllers/push.controller");

module.exports = (app) => {
  const router = require("express").Router();

  router.post("/fcm-token", auth.verifyToken, push.registerFcmToken);
  router.delete("/fcm-token", auth.verifyToken, push.clearFcmToken);
  router.post("/broadcast", auth.verifyToken, push.broadcastByRoles);
  router.get("/status", push.fcmStatus);

  app.use("/api/push", router);
};
