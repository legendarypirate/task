// models/product.js
module.exports = (sequelize, Sequelize) => {
    const Product = sequelize.define("product", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        originalPrice: {
            type: Sequelize.DECIMAL(10, 2),
            field: 'original_price'
        },
        images: {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: []
        },
        thumbnail: {
            type: Sequelize.STRING,
            allowNull: false
        },
        category: {
            type: Sequelize.STRING,
            allowNull: false
        },
        subcategory: {
            type: Sequelize.STRING
        },
        inStock: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            field: 'in_stock'
        },
        stockQuantity: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: 'stock_quantity'
        },
        sku: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        brand: {
            type: Sequelize.STRING
        },
        description: {
            type: Sequelize.TEXT
        },
        specifications: {
            type: Sequelize.JSON,
            defaultValue: {}
        },
        isFeatured: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'is_featured'
        },
        isNew: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'is_new'
        },
        isOnSale: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'is_on_sale'
        },
        isBestSeller: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'is_best_seller'
        },
        isLimited: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'is_limited'
        },
        discount: {
            type: Sequelize.DECIMAL(5, 2),
            defaultValue: 0
        },
        discountAmount: {
            type: Sequelize.DECIMAL(10, 2),
            field: 'discount_amount'
        },
        salePrice: {
            type: Sequelize.DECIMAL(10, 2),
            field: 'sale_price'
        },
        saleEndDate: {
            type: Sequelize.DATE,
            field: 'sale_end_date'
        },
        sales: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        rating: {
            type: Sequelize.DECIMAL(3, 2),
            defaultValue: 0
        },
        reviewCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: 'review_count'
        },
        slug: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        metaTitle: {
            type: Sequelize.STRING,
            field: 'meta_title'
        },
        metaDescription: {
            type: Sequelize.TEXT,
            field: 'meta_description'
        },
        tags: {
            type: Sequelize.JSON,
            defaultValue: []
        },
        weight: {
            type: Sequelize.DECIMAL(10, 2)
        },
        dimensions: {
            type: Sequelize.JSON
        },
        createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'updated_at'
        },
        publishedAt: {
            type: Sequelize.DATE,
            field: 'published_at'
        }
    }, {
        timestamps: false,
        tableName: 'products',
        indexes: [
            {
                unique: true,
                fields: ['sku']
            },
            {
                unique: true,
                fields: ['slug']
            },
            {
                fields: ['category']
            },
            {
                fields: ['is_on_sale']
            },
            {
                fields: ['is_featured']
            },
            {
                fields: ['is_new']
            }
        ]
    });

    return Product;
};