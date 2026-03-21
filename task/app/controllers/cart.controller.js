const db = require("../models");
const CartItem = db.cart_items;
const Op = db.Sequelize.Op;

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, variationId, quantity } = req.body;

    // Validate request
    if (!userId || !productId || !quantity) {
      return res.status(400).send({
        message: "User ID, product ID, and quantity are required!"
      });
    }

    // Check if product exists
    const product = await db.products.findByPk(productId);
    if (!product) {
      return res.status(404).send({
        message: "Product not found!"
      });
    }

    // Check if variation exists (if provided)
    if (variationId) {
      const variation = await db.productVariations.findByPk(variationId);
      if (!variation) {
        return res.status(404).send({
          message: "Product variation not found!"
        });
      }
    }

    // Check if item already exists in cart
    const existingItem = await CartItem.findOne({
      where: {
        userId,
        productId,
        variationId: variationId || null
      }
    });

    let cartItem;
    if (existingItem) {
      // Update quantity if item already exists
      await CartItem.update(
        { quantity: existingItem.quantity + quantity },
        {
          where: {
            userId,
            productId,
            variationId: variationId || null
          }
        }
      );
      cartItem = await CartItem.findByPk(existingItem.id);
    } else {
      // Create new cart item
      const newItem = {
        userId,
        productId,
        variationId,
        quantity
      };
      cartItem = await CartItem.create(newItem);
    }

    const itemWithDetails = await CartItem.findByPk(cartItem.id, {
      include: [
        { model: db.products, as: 'product' },
        { model: db.productVariations, as: 'variation' }
      ]
    });

    res.send({
      message: "Item added to cart successfully!",
      item: itemWithDetails
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while adding item to cart."
    });
  }
};

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const cartItems = await CartItem.findAll({
      where: { userId: userId },
      include: [
        { 
          model: db.products, 
          as: 'product',
          include: [
            { model: db.productVariations, as: 'variations' },
            { model: db.colorOptions, as: 'colorOptions' }
          ]
        },
        { model: db.productVariations, as: 'variation' }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;
    
    cartItems.forEach(item => {
      const price = item.variation ? item.variation.price : item.product.price;
      subtotal += price * item.quantity;
      totalItems += item.quantity;
    });

    res.send({
      items: cartItems,
      subtotal,
      totalItems,
      total: subtotal // Add shipping/tax here if needed
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving cart items."
    });
  }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
  try {
    const id = req.params.id;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).send({
        message: "Valid quantity is required!"
      });
    }

    const [updated] = await CartItem.update(
      { quantity: quantity },
      { where: { id: id } }
    );

    if (updated) {
      const updatedItem = await CartItem.findByPk(id, {
        include: [
          { model: db.products, as: 'product' },
          { model: db.productVariations, as: 'variation' }
        ]
      });
      res.send({
        message: "Cart item quantity updated successfully!",
        item: updatedItem
      });
    } else {
      res.status(404).send({
        message: `Cannot update cart item with id=${id}. Maybe item was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating cart item quantity."
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await CartItem.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        message: "Item removed from cart successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot remove item with id=${id}. Maybe item was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not remove item from cart."
    });
  }
};

// Clear user's cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.params.userId;

    const deleted = await CartItem.destroy({
      where: { userId: userId }
    });

    res.send({
      message: `${deleted} items removed from cart successfully!`
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error clearing cart."
    });
  }
};

// Get cart item count
exports.getCartCount = async (req, res) => {
  try {
    const userId = req.params.userId;

    const count = await CartItem.count({
      where: { userId: userId }
    });

    res.send({
      count: count
    });
  } catch (err) {
    res.status(500).send({
      message: "Error getting cart count."
    });
  }
};