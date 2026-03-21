module.exports = app => {
  const categories = require("../controllers/category.controller");

  var router = require("express").Router();

  // Create a new Category
  router.post("/", categories.create);

  // Retrieve all Categories
  router.get("/", categories.findAll);

  // Retrieve top-level categories
  router.get("/top-level", categories.findTopLevel);

  // Retrieve subcategories by parent ID
  router.get("/parent/:parentId/subcategories", categories.findSubcategories);

  // Retrieve a single Category with id
  router.get("/:id", categories.findOne);

  // Update a Category with id
  router.patch("/:id", categories.update);

  // Delete a Category with id
  router.delete("/:id", categories.delete);

  app.use('/api/categories', router);
};