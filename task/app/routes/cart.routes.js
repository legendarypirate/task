module.exports = app => {
  const cart = require("../controllers/cart.controller.js");

  var router = require("express").Router();

  // Add item to cart
  router.post("/add", cart.addToCart);

  // Get user's cart
  router.get("/:userId", cart.getCart);

  // Get cart item count
  router.get("/:userId/count", cart.getCartCount);

  // Update cart item quantity
  router.patch("/:id/quantity", cart.updateQuantity);

  // Remove item from cart
  router.delete("/:id", cart.removeFromCart);

  // Clear user's cart
  router.delete("/clear/:userId", cart.clearCart);

  app.use('/api/cart', router);
};