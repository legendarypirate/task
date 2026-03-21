module.exports = app => {
    const angilal = require("../controllers/angilal.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/", angilal.create);
  
    // Retrieve all Tutorials
    router.get("/", angilal.findAll);
  
    router.get("/mobile_category", angilal.mobile_cat);

    // Retrieve all published Tutorials
    router.get("/published", angilal.findAllPublished);
  
    // Retrieve a single Tutorial with id
   
    // Update a Tutorial with id
    router.patch("/:id", angilal.update);
  
    // Delete a Tutorial with id
    router.delete("/:id", angilal.delete);
  
    // Delete all Tutorials
    router.delete("/", angilal.deleteAll);
    router.get("/:id", angilal.findOne);

    app.use('/api/angilal', router);
  };
  