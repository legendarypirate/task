// models/productVariation.model.js
module.exports = (sequelize, Sequelize) => {
    const ProductVariation = sequelize.define("product_variation", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        productId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'product_id',
            references: {
                model: 'products',
                key: 'id'
            }
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        nameMn: {
            type: Sequelize.STRING,
            field: 'name_mn'
        },
        price: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false
        },
        originalPrice: {
            type: Sequelize.DECIMAL(10, 2),
            field: 'original_price'
        },
        sku: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        images: {
            type: Sequelize.JSON,
            defaultValue: []
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
        attributes: {
            type: Sequelize.JSON,
            defaultValue: {}
        },
        // Add these timestamp fields
        createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'created_at'
        },
        updatedAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'updated_at'
        }
    }, {
        timestamps: true, // Enable timestamps
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'product_variations',
        indexes: [
            {
                fields: ['product_id']
            },
            {
                unique: true,
                fields: ['sku']
            }
        ]
    });

    return ProductVariation;
};