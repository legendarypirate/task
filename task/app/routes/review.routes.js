module.exports = app => {
  const reviews = require("../controllers/review.controller.js");

  var router = require("express").Router();

  // Create a new Review
  router.post("/", reviews.create);

  // Retrieve all Reviews for a product
  router.get("/product/:productId", reviews.findAll);

  // Retrieve reviews by user
  router.get("/user/:userId", reviews.findByUser);

  // Retrieve a single Review with id
  router.get("/:id", reviews.findOne);

  // Update a Review with id
  router.patch("/:id", reviews.update);

  // Mark review as helpful
  router.patch("/:id/helpful", reviews.markHelpful);

  // Delete a Review with id
  router.delete("/:id", reviews.delete);

  app.use('/api/reviews', router);
};