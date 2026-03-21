module.exports = app => {
  const variations = require("../controllers/variation.controller");

  var router = require("express").Router();

  // Create a new Product Variation
  router.post("/", variations.create);

  // Retrieve all variations for a product
  router.get("/product/:productId", variations.findByProduct);

  // Find variation by attributes
  router.post("/product/:productId/find-by-attributes", variations.findByAttributes);

  // Retrieve a single Product Variation with id
  router.get("/:id", variations.findOne);

  // Update a Product Variation with id
  router.patch("/:id", variations.update);

  // Delete a Product Variation with id
  router.delete("/:id", variations.delete);

  app.use('/api/variations', router);
};