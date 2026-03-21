module.exports = app => {
  const colorOptions = require("../controllers/color_option.controller.js");

  var router = require("express").Router();

  // Create a new Color Option
  router.post("/", colorOptions.create);

  // Retrieve all color options for a product
  router.get("/product/:productId", colorOptions.findByProduct);

  // Retrieve a single Color Option with id
  router.get("/:id", colorOptions.findOne);

  // Update a Color Option with id
  router.patch("/:id", colorOptions.update);

  // Delete a Color Option with id
  router.delete("/:id", colorOptions.delete);

  app.use('/api/color-options', router);
};