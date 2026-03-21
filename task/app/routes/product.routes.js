module.exports = app => {
  const products = require("../controllers/product.controller");

  var router = require("express").Router();

  // Create a new Product
  router.post("/", products.create);

  // Retrieve all Products
  router.get("/", products.findAll);

  // Retrieve all featured Products
  router.get("/featured", products.findAllFeatured);

  // Retrieve all on-sale Products
  router.get("/on-sale", products.findAllOnSale);

  // Retrieve all new Products
  router.get("/new", products.findAllNew);

  // Retrieve Products by category
  router.get("/category/:category", products.findByCategory);

  // Retrieve Products by subcategory
  router.get("/subcategory/:subcategory", products.findBySubcategory);

  // Retrieve a single Product with id
  router.get("/:id", products.findOne);

  // Update a Product with id
  router.patch("/:id", products.update);

  // Update product stock
  router.patch("/:id/stock", products.updateStock);

  // Delete a Product with id
  router.delete("/:id", products.delete);

  // Delete all Products
  router.delete("/", products.deleteAll);

  app.use('/api/products', router);
};