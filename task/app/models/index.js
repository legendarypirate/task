// models/index.js
const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config.js");

// Create a new Sequelize instance and configure the connection
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

// Assign the Sequelize instance to the db object
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.categories = require("./category.model.js")(sequelize, Sequelize);
db.products = require("./product.model.js")(sequelize, Sequelize);
db.product_variations = require("./product_variation.model.js")(sequelize, Sequelize);
// Register existing models
db.users = require("./user.model.js")(sequelize, Sequelize);
db.tasks = require("./task.model.js")(sequelize, Sequelize);

// Register e-commerce models

db.color_options = require("./color_option.model.js")(sequelize, Sequelize);
db.reviews = require("./review.model.js")(sequelize, Sequelize);
db.cart_items = require("./cart_item.model.js")(sequelize, Sequelize);

// ====== EXISTING RELATIONSHIPS ======
// Task relationships (only created_by is a plain integer FK; assigned_to & supervisor_id are integer arrays)
db.users.hasMany(db.tasks, { foreignKey: "created_by", as: "createdTasks" });
db.tasks.belongsTo(db.users, { foreignKey: "created_by", as: "creator" });
// NOTE: assigned_to and supervisor_id are now integer[] arrays, so we cannot use
// standard Sequelize belongsTo/hasMany associations for them.
// Supervisor data must be resolved manually in controllers.

// ====== E-COMMERCE RELATIONSHIPS ======
// Product - ProductVariation relationships
db.products.hasMany(db.product_variations, { 
  foreignKey: "productId", 
  as: "variations",
  onDelete: 'CASCADE'
});
db.product_variations.belongsTo(db.products, { 
  foreignKey: "productId", 
  as: "product" 
});

// Product - ColorOption relationships
db.products.hasMany(db.color_options, { 
  foreignKey: "productId", 
  as: "colorOptions",
  onDelete: 'CASCADE'
});
db.color_options.belongsTo(db.products, { 
  foreignKey: "productId", 
  as: "product" 
});

// Product - Review relationships
db.products.hasMany(db.reviews, { 
  foreignKey: "productId", 
  as: "reviews",
  onDelete: 'CASCADE'
});
db.reviews.belongsTo(db.products, { 
  foreignKey: "productId", 
  as: "product" 
});

// User - Review relationships (if reviews are linked to users)
db.users.hasMany(db.reviews, { 
  foreignKey: "userId", 
  as: "reviews" 
});
db.reviews.belongsTo(db.users, { 
  foreignKey: "userId", 
  as: "user" 
});



// Product - Category many-to-many relationship
db.productCategories = sequelize.define('product_categories', {
  productId: {
    type: Sequelize.UUID,
    primaryKey: true,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  categoryId: {
    type: Sequelize.UUID,
    primaryKey: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  tableName: 'product_categories'
});

db.products.belongsToMany(db.categories, { 
  through: db.productCategories, 
  foreignKey: 'productId',
  otherKey: 'categoryId',
  as: 'categories'
});
db.categories.belongsToMany(db.products, { 
  through: db.productCategories, 
  foreignKey: 'categoryId',
  otherKey: 'productId',
  as: 'products'
});

// CartItem relationships
db.cart_items.belongsTo(db.users, { 
  foreignKey: "userId", 
  as: "user" 
});
db.users.hasMany(db.cart_items, { 
  foreignKey: "userId", 
  as: "cartItems" 
});

db.cart_items.belongsTo(db.products, { 
  foreignKey: "productId", 
  as: "product" 
});
db.products.hasMany(db.cart_items, { 
  foreignKey: "productId", 
  as: "cartItems" 
});

db.cart_items.belongsTo(db.product_variations, { 
  foreignKey: "variationId", 
  as: "variation" 
});
db.product_variations.hasMany(db.cart_items, { 
  foreignKey: "variationId", 
  as: "cartItems" 
});

// Product - User relationships (favorites/wishlist if needed)
db.productFavorites = sequelize.define('product_favorites', {
  userId: {
    type: Sequelize.UUID,
    primaryKey: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  productId: {
    type: Sequelize.UUID,
    primaryKey: true,
    references: {
      model: 'products',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'product_favorites'
});

db.users.belongsToMany(db.products, { 
  through: db.productFavorites, 
  foreignKey: 'userId',
  otherKey: 'productId',
  as: 'favorites'
});
db.products.belongsToMany(db.users, { 
  through: db.productFavorites, 
  foreignKey: 'productId',
  otherKey: 'userId',
  as: 'favoritedBy'
});

// Export the db object for easy access throughout the app
module.exports = db;