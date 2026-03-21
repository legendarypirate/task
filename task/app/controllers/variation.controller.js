const db = require("../models");
const ProductVariation = db.product_variations;
const Op = db.Sequelize.Op;

// Create and Save a new Product Variation
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.productId || !req.body.name || !req.body.price || !req.body.sku) {
      return res.status(400).send({
        message: "Product ID, name, price, and SKU are required!"
      });
    }

    // Check if product exists
    const product = await db.products.findByPk(req.body.productId);
    if (!product) {
      return res.status(404).send({
        message: "Product not found!"
      });
    }

    // Create a Product Variation
    const variation = {
      productId: req.body.productId,
      name: req.body.name,
      nameMn: req.body.nameMn,
      price: req.body.price,
      originalPrice: req.body.originalPrice,
      sku: req.body.sku,
      images: req.body.images || [],
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      stockQuantity: req.body.stockQuantity || 0,
      attributes: req.body.attributes || {}
    };

    // Save Variation in the database
    const data = await ProductVariation.create(variation);
    
    const variationWithProduct = await ProductVariation.findByPk(data.id, {
      include: [{ model: db.products, as: 'product' }]
    });

    res.send(variationWithProduct);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Product Variation."
    });
  }
};

// Get all variations for a product
exports.findByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const variations = await ProductVariation.findAll({
      where: { productId: productId },
      include: [{ model: db.products, as: 'product' }],
      order: [['createdAt', 'ASC']]
    });

    res.send(variations);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving product variations."
    });
  }
};

// Find a single Product Variation with id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const variation = await ProductVariation.findByPk(id, {
      include: [{ model: db.products, as: 'product' }]
    });

    if (variation) {
      res.send(variation);
    } else {
      res.status(404).send({
        message: `Cannot find Product Variation with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving Product Variation with id=" + req.params.id
    });
  }
};

// Update a Product Variation by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await ProductVariation.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      const updatedVariation = await ProductVariation.findByPk(id, {
        include: [{ model: db.products, as: 'product' }]
      });
      res.send({
        message: "Product Variation was updated successfully.",
        variation: updatedVariation
      });
    } else {
      res.status(404).send({
        message: `Cannot update Product Variation with id=${id}. Maybe Variation was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Product Variation with id=" + req.params.id
    });
  }
};

// Delete a Product Variation with id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await ProductVariation.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        message: "Product Variation was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Product Variation with id=${id}. Maybe Variation was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Product Variation with id=" + req.params.id
    });
  }
};

// Get variation by attributes
exports.findByAttributes = async (req, res) => {
  try {
    const productId = req.params.productId;
    const attributes = req.body.attributes;

    const variation = await ProductVariation.findOne({
      where: { 
        productId: productId,
        attributes: attributes
      },
      include: [{ model: db.products, as: 'product' }]
    });

    if (variation) {
      res.send(variation);
    } else {
      res.status(404).send({
        message: "No variation found with the specified attributes."
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error finding variation by attributes."
    });
  }
};