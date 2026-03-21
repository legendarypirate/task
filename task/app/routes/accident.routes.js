// routes/item.routes.js

module.exports = app => {
    const accident = require("../controllers/accident.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Item
    router.post("/", accident.create);
  
    // Retrieve all Items
    router.get("/", accident.findAll);
  
    // Retrieve a single Item with id
    router.get("/:id", accident.findOne);
  
    // Update an Item with id
    router.put("/:id", accident.update);
  
    // Delete an Item with id
    router.delete("/:id", accident.delete);
  
    // Delete all Items
    router.delete("/", accident.deleteAll);
  
    app.use('/api/accident', router);
  };
  