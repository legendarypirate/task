const db = require("../models");
const Product = db.products;
const Op = db.Sequelize.Op;
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
// Create and Save a new Product
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name || !req.body.price || !req.body.sku || !req.body.slug || !req.body.category) {
      return res.status(400).send({
        message: "Name, price, SKU, slug, and category are required!"
      });
    }

    // Validate images - reject blob URLs
    if (req.body.images && Array.isArray(req.body.images)) {
      const hasBlobUrls = req.body.images.some(img => img.startsWith('blob:'));
      if (hasBlobUrls) {
        return res.status(400).send({
          message: "Invalid image URLs detected. Please upload images to Cloudinary first."
        });
      }
    }

    // Generate slug if not provided
    const slug = req.body.slug || generateSlug(req.body.name);
    
    // Check if slug already exists
    const existingProduct = await Product.findOne({ where: { slug } });
    if (existingProduct) {
      return res.status(400).send({
        message: "Slug already exists! Please use a different slug."
      });
    }

    // Create a Product with all required fields
    const product = {
      name: req.body.name,
      nameMn: req.body.nameMn || req.body.name,
      price: req.body.price,
      originalPrice: req.body.originalPrice || req.body.price,
      images: req.body.images || [],
      thumbnail: req.body.thumbnail || (req.body.images && req.body.images[0]) || "default.jpg",
      category: req.body.category,
      subcategory: req.body.subcategory || "",
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      stockQuantity: req.body.stockQuantity || 0,
      sku: req.body.sku,
      brand: req.body.brand || "",
      description: req.body.description || "",
      descriptionMn: req.body.descriptionMn || req.body.description || "",
      specifications: req.body.specifications || {},
      isFeatured: req.body.isFeatured || false,
      isNew: req.body.isNew !== undefined ? req.body.isNew : true,
      isOnSale: req.body.isOnSale || false,
      isBestSeller: req.body.isBestSeller || false,
      isLimited: req.body.isLimited || false,
      discount: req.body.discount || 0,
      discountAmount: req.body.discountAmount,
      salePrice: req.body.salePrice || req.body.price,
      saleEndDate: req.body.saleEndDate,
      sales: req.body.sales || 0,
      rating: req.body.rating || 0,
      reviewCount: req.body.reviewCount || 0,
      slug: slug,
      metaTitle: req.body.metaTitle || req.body.name,
      metaDescription: req.body.metaDescription || req.body.description,
      tags: req.body.tags || [],
      weight: req.body.weight,
      dimensions: req.body.dimensions,
      publishedAt: req.body.publishedAt || new Date()
    };

    // Save Product in the database
    const createdProduct = await Product.create(product);
    
    // Create variations if provided
    if (req.body.variations && req.body.variations.length > 0) {
      await Promise.all(req.body.variations.map(variation => {
        // Validate variation images
        let variationImages = [];
        if (variation.images && Array.isArray(variation.images)) {
          variationImages = variation.images.filter(img => !img.startsWith('blob:'));
        }
        
        return db.product_variations.create({
          name: variation.name || `Variant ${Date.now()}`,
          nameMn: variation.nameMn || variation.name || `Вариант ${Date.now()}`,
          price: variation.price || req.body.price,
          originalPrice: variation.originalPrice || variation.price || req.body.price,
          sku: variation.sku || `${req.body.sku}-${Date.now()}`,
          images: variationImages,
          inStock: variation.inStock !== undefined ? variation.inStock : true,
          stockQuantity: variation.stockQuantity || 0,
          attributes: variation.attributes || {},
          productId: createdProduct.id
        });
      }));
    }

    // Create color options if provided
    if (req.body.colorOptions && req.body.colorOptions.length > 0) {
      await Promise.all(req.body.colorOptions.map(colorOption => {
        return db.color_options.create({
          name: colorOption.name,
          nameMn: colorOption.nameMn || colorOption.name,
          value: colorOption.value || "#000000",
          image: colorOption.image,
          productId: createdProduct.id
        });
      }));
    }

    // Fetch the complete product with relationships
    const productWithRelations = await Product.findByPk(createdProduct.id, {
      include: [
        { model: db.product_variations, as: 'variations' },
        { model: db.color_options, as: 'colorOptions' }
      ]
    });

    res.status(201).send(productWithRelations);
  } catch (err) {
    console.error('Error creating product:', err);
    
    // Handle specific Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(error => ({
        field: error.path,
        message: error.message
      }));
      return res.status(400).send({
        message: "Validation error",
        errors: errors
      });
    }
    
    // Handle unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).send({
        message: "Duplicate entry",
        field: err.errors[0]?.path,
        value: err.errors[0]?.value
      });
    }
    
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Product."
    });
  }
};

// Helper function to generate slug
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
// Retrieve all Products from the database
exports.findAll = async (req, res) => {
  try {
    const { 
      category, subcategory, minPrice, maxPrice, brand, 
      inStock, isOnSale, isNew, rating, search, sortBy, 
      page = 1, limit = 10, includeVariations 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    // Build filter conditions
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (inStock !== undefined) where.inStock = inStock === 'true';
    if (isOnSale !== undefined) where.isOnSale = isOnSale === 'true';
    if (isNew !== undefined) where.isNew = isNew === 'true';
    if (brand) where.brand = brand;
    
    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    
    // Rating filter
    if (rating) where.rating = { [Op.gte]: parseFloat(rating) };
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { nameMn: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } }
      ];
    }

    // Build order
    let order = [['createdAt', 'DESC']];
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc': order = [['price', 'ASC']]; break;
        case 'price_desc': order = [['price', 'DESC']]; break;
        case 'newest': order = [['createdAt', 'DESC']]; break;
        case 'rating': order = [['rating', 'DESC']]; break;
        case 'popularity': order = [['sales', 'DESC']]; break;
      }
    }

    // Build include array
    const include = [];
    if (includeVariations === 'true') {
      include.push({
        model: db.product_variations,
        as: 'variations',
        attributes: ['id', 'name', 'nameMn', 'price', 'sku', 'inStock', 'stockQuantity', 'attributes'],
        required: false
      });
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include
    });

    // Clean up any blob URLs that might have been saved
    const sanitizedProducts = rows.map(product => {
      const productData = product.toJSON ? product.toJSON() : product;
      
      // Clean main product images
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = productData.images.filter(img => 
          !img.startsWith('blob:')
        );
      }
      
      // Clean thumbnail
      if (productData.thumbnail && productData.thumbnail.startsWith('blob:')) {
        productData.thumbnail = productData.images && productData.images[0] 
          ? productData.images[0] 
          : "default.jpg";
      }
      
      // Clean variation images
      if (productData.variations && Array.isArray(productData.variations)) {
        productData.variations = productData.variations.map(variation => {
          if (variation.images && Array.isArray(variation.images)) {
            variation.images = variation.images.filter(img => !img.startsWith('blob:'));
          }
          return variation;
        });
      }
      
      return productData;
    });

    res.send({
      products: sanitizedProducts,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving products."
    });
  }
};

// Find a single Product with id
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const product = await Product.findByPk(id, {
      include: [
        { 
          model: db.product_variations, 
          as: 'variations',
          attributes: ['id', 'name', 'nameMn', 'price', 'originalPrice', 'sku', 
                      'images', 'inStock', 'stockQuantity', 'attributes', 'createdAt']
        },
        { 
          model: db.color_options, 
          as: 'colorOptions',
          attributes: ['id', 'name', 'nameMn', 'value', 'image']
        }
      ]
    });

    if (product) {
      // Clean up any blob URLs
      const productData = product.toJSON ? product.toJSON() : product;
      
      // Clean main product images
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = productData.images.filter(img => 
          !img.startsWith('blob:')
        );
      }
      
      // Clean thumbnail
      if (productData.thumbnail && productData.thumbnail.startsWith('blob:')) {
        productData.thumbnail = productData.images && productData.images[0] 
          ? productData.images[0] 
          : "default.jpg";
      }
      
      // Clean variation images
      if (productData.variations && Array.isArray(productData.variations)) {
        productData.variations = productData.variations.map(variation => {
          if (variation.images && Array.isArray(variation.images)) {
            variation.images = variation.images.filter(img => !img.startsWith('blob:'));
          }
          return variation;
        });
      }
      
      res.send(productData);
    } else {
      res.status(404).send({
        message: `Cannot find Product with id=${id}.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error retrieving Product with id=" + req.params.id
    });
  }
};
// Update a Product by the id in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    // Get current product to compare images
    const currentProduct = await Product.findByPk(id);
    if (!currentProduct) {
      return res.status(404).send({
        message: `Product with id=${id} not found.`
      });
    }

    // Validate images - reject blob URLs
    if (req.body.images && Array.isArray(req.body.images)) {
      const hasBlobUrls = req.body.images.some(img => img.startsWith('blob:'));
      if (hasBlobUrls) {
        return res.status(400).send({
          message: "Invalid image URLs detected. Please upload images to Cloudinary first."
        });
      }
    }

    const updateData = {};
    
    // Only include other fields that are provided
    const fields = ['name', 'nameMn', 'price', 'originalPrice', 'thumbnail', 
                    'category', 'subcategory', 'inStock', 'stockQuantity', 'sku', 'brand',
                    'description', 'descriptionMn', 'specifications', 'isFeatured', 'isNew', 'isOnSale',
                    'isBestSeller', 'isLimited', 'discount', 'discountAmount', 'salePrice',
                    'saleEndDate', 'sales', 'rating', 'reviewCount', 'slug', 'metaTitle',
                    'metaDescription', 'tags', 'weight', 'dimensions', 'publishedAt',
                    'images']; // Added images to fields array
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Update thumbnail if images exist
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      updateData.thumbnail = req.body.images[0];
    }

    const [updated] = await Product.update(updateData, {
      where: { id: id }
    });

    if (!updated) {
      return res.status(404).send({
        message: `Cannot update Product with id=${id}. Maybe Product was not found!`
      });
    }

    // Handle variations if provided
    if (req.body.variations !== undefined) {
      console.log('Updating variations:', req.body.variations);
      
      // Validate variation images
      if (Array.isArray(req.body.variations)) {
        const hasInvalidImages = req.body.variations.some(variation => 
          variation.images && Array.isArray(variation.images) && 
          variation.images.some(img => img.startsWith('blob:'))
        );
        
        if (hasInvalidImages) {
          return res.status(400).send({
            message: "Invalid variation image URLs detected."
          });
        }
      }
      
      // First, delete existing variations
      await db.product_variations.destroy({
        where: { productId: id }
      });
      
      // Then create new variations
      if (Array.isArray(req.body.variations) && req.body.variations.length > 0) {
        const variationPromises = req.body.variations.map(async (variation) => {
          return db.product_variations.create({
            name: variation.name || `Variant ${Date.now()}`,
            nameMn: variation.nameMn || variation.name || `Вариант ${Date.now()}`,
            price: variation.price || req.body.price || 0,
            originalPrice: variation.originalPrice || variation.price || req.body.price || 0,
            sku: variation.sku || `${req.body.sku || 'VAR'}-${Date.now()}`,
            images: variation.images || [],
            inStock: variation.inStock !== undefined ? variation.inStock : true,
            stockQuantity: variation.stockQuantity || 0,
            attributes: variation.attributes || {},
            productId: id
          });
        });
        
        await Promise.all(variationPromises);
      }
    }

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { 
          model: db.product_variations, 
          as: 'variations',
          attributes: ['id', 'name', 'nameMn', 'price', 'originalPrice', 'sku', 
                      'images', 'inStock', 'stockQuantity', 'attributes']
        }
      ]
    });

    res.send({
      message: "Product was updated successfully.",
      product: updatedProduct
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).send({
      message: "Error updating Product with id=" + req.params.id
    });
  }
};


exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        message: "No image file provided"
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products'
    });

    res.send({
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (err) {
    console.error('Error uploading image:', err);
    res.status(500).send({
      message: "Error uploading image"
    });
  }
};

// Delete a Product with the specified id
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // First delete related variations
    await db.product_variations.destroy({
      where: { productId: id }
    });

    // Then delete color options
    await db.color_options.destroy({
      where: { productId: id }
    });

    const deleted = await Product.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.send({
        message: "Product was deleted successfully!"
      });
    } else {
      res.status(404).send({
        message: `Cannot delete Product with id=${id}. Maybe Product was not found!`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Could not delete Product with id=" + req.params.id
    });
  }
};


// Delete all Products from the database
exports.deleteAll = async (req, res) => {
  try {
    const deleted = await Product.destroy({
      where: {},
      truncate: false
    });

    res.send({
      message: `${deleted} Products were deleted successfully!`
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while removing all products."
    });
  }
};

// Find all featured Products
exports.findAllFeatured = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isFeatured: true },
      limit: 10
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving featured products."
    });
  }
};

// Find all on-sale Products
exports.findAllOnSale = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isOnSale: true },
      order: [['discount', 'DESC']],
      limit: 20
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving on-sale products."
    });
  }
};

// Find all new Products
exports.findAllNew = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isNew: true },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving new products."
    });
  }
};

// Get products by category
exports.findByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.findAll({
      where: { category: category },
      include: [
        { 
          model: db.product_variations, 
          as: 'variations',
          attributes: ['id', 'name', 'nameMn', 'price', 'sku', 'inStock', 'stockQuantity', 'attributes'],
          required: false
        }
      ]
    });

    // Clean blob URLs
    const sanitizedProducts = products.map(product => {
      const productData = product.toJSON ? product.toJSON() : product;
      
      if (productData.images && Array.isArray(productData.images)) {
        productData.images = productData.images.filter(img => 
          !img.startsWith('blob:')
        );
      }
      
      return productData;
    });

    res.send(sanitizedProducts);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error retrieving products in category ${req.params.category}`
    });
  }
};
// Get products by subcategory
exports.findBySubcategory = async (req, res) => {
  try {
    const subcategory = req.params.subcategory;
    const products = await Product.findAll({
      where: { subcategory: subcategory }
    });

    res.send(products);
  } catch (err) {
    res.status(500).send({
      message: err.message || `Error retrieving products in subcategory ${req.params.subcategory}`
    });
  }
};

// Update product stock
exports.updateStock = async (req, res) => {
  try {
    const id = req.params.id;
    const { stockQuantity, inStock } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).send({
        message: `Product with id=${id} not found.`
      });
    }

    const updateData = {};
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = stockQuantity;
      updateData.inStock = stockQuantity > 0;
    }
    if (inStock !== undefined) {
      updateData.inStock = inStock;
    }

    await Product.update(updateData, {
      where: { id: id }
    });

    const updatedProduct = await Product.findByPk(id);
    res.send({
      message: "Product stock updated successfully.",
      product: updatedProduct
    });
  } catch (err) {
    res.status(500).send({
      message: `Error updating stock for product id=${req.params.id}`
    });
  }
};