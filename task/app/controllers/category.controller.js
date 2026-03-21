const db = require("../models");
const Category = db.categories;
const Op = db.Sequelize.Op;

// Create and Save a new Category
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name) {
      return res.status(400).send({
        message: "Name is required!"
      });
    }

    // Create a Category
    const category = {
      name: req.body.name,
      image: req.body.image,
      parentId: req.body.parentId
    };

    // Save Category in the database
    const data = await Category.create(category);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Category."
    });
  }
};

// Retrieve all Categories
// controllers/category.controller.js
exports.findAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    // Build nested tree structure
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item.dataValues,
          children: buildTree(items, item.id)
        }));
    };
    
    const treeData = buildTree(categories);
    
    res.send({
      flat: categories,
      tree: treeData,
      total: categories.length
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving categories."
    });
  }
};
// Find a single Category with id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const category = await Category.findByPk(id, {
      include: [
        { model: Category, as: 'subcategories' },
        { model: Category, as: 'parent' },
        { 
          model: db.products, 
          as: 'products',
          through: { attributes: [] },
          include: [{ model: db.categories, as: 'categories', through: { attributes: [] } }]
        }
      ]
    });

    if (category) {
      res.send(category);
    } else {
      res.status(404).send({
        message: `Cannot find Category with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving Category with id=" + req.params.id
    });
  }
};

// Update a Category by id
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    const [updated] = await Category.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      const updatedCategory = await Category.findByPk(id);
      res.send({
        message: "Category was updated successfully.",
        category: updatedCategory
      });
    } else {
      res.status(404).send({
        message: `Cannot update Category with id=${id}. Maybe Category was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Category with id=" + req.params.id
    });
  }
};

// Delete a Category with id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const deleted = await Category.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        message: "Category was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Category with id=${id}. Maybe Category was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Category with id=" + req.params.id
    });
  }
};

// Get subcategories by parent category id
exports.findSubcategories = async (req, res) => {
  try {
    const parentId = req.params.parentId;
    
    const subcategories = await Category.findAll({
      where: { parentId: parentId },
      include: [{ model: Category, as: 'subcategories' }]
    });

    res.send(subcategories);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error retrieving subcategories for parent id=${req.params.parentId}`
    });
  }
};

// Get top-level categories (no parent)
exports.findTopLevel = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { parentId: null },
      include: [{ model: Category, as: 'subcategories' }]
    });

    res.send(categories);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Error retrieving top-level categories."
    });
  }
};