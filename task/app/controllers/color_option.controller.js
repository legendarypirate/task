const db = require("../models");
const ColorOption = db.color_options;
const Op = db.Sequelize.Op;

// Create and Save a new Color Option
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.productId || !req.body.name || !req.body.value) {
      return res.status(400).send({
        message: "Product ID, name, and value are required!"
      });
    }

    // Check if product exists
    const product = await db.products.findByPk(req.body.productId);
    if (!product) {
      return res.status(404).send({
        message: "Product not found!"
      });
    }

    // Create a Color Option
    const colorOption = {
      productId: req.body.productId,
      name: req.body.name,
      nameMn: req.body.nameMn,
      value: req.body.value,
      image: req.body.image
    };

    // Save Color Option in the database
    const data = await ColorOption.create(colorOption);
    
    const colorOptionWithProduct = await ColorOption.findByPk(data.id, {
      include: [{ model: db.products, as: 'product' }]
    });

    res.send(colorOptionWithProduct);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Color Option."
    });
  }
};

// Get all color options for a product
exports.findByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const colorOptions = await ColorOption.findAll({
      where: { productId: productId },
      include: [{ model: db.products, as: 'product' }]
    });

    res.send(colorOptions);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving color options."
    });
  }
};

// Find a single Color Option with id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const colorOption = await ColorOption.findByPk(id, {
      include: [{ model: db.products, as: 'product' }]
    });

    if (colorOption) {
      res.send(colorOption);
    } else {
      res.status(404).send({
        message: `Cannot find Color Option with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving Color Option with id=" + req.params.id
    });
  }
};

// Update a Color Option by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await ColorOption.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      const updatedColorOption = await ColorOption.findByPk(id, {
        include: [{ model: db.products, as: 'product' }]
      });
      res.send({
        message: "Color Option was updated successfully.",
        colorOption: updatedColorOption
      });
    } else {
      res.status(404).send({
        message: `Cannot update Color Option with id=${id}. Maybe Color Option was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Color Option with id=" + req.params.id
    });
  }
};

// Delete a Color Option with id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await ColorOption.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        message: "Color Option was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Color Option with id=${id}. Maybe Color Option was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Color Option with id=" + req.params.id
    });
  }
};