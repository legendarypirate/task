module.exports = app => {
    const auth = require("../controllers/auth.controller");
  
    var router = require("express").Router();
  
    // Login route
    router.post("/login", auth.login);


    // Register route
    router.post("/register", auth.register);

    // Verify token route (to protect routes that need authentication)
    router.get("/verify", auth.verifyToken, (req, res) => {
      res.status(200).send("Token is valid!");
    });

  
    app.use("/api/auth", router);
  };
  