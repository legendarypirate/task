// models/cartItem.js
module.exports = (sequelize, Sequelize) => {
    const CartItem = sequelize.define("cart_item", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'user_id'
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
        variationId: {
            type: Sequelize.UUID,
            field: 'variation_id',
            references: {
                model: 'product_variations',
                key: 'id'
            }
        },
        quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
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
        }
    }, {
        timestamps: false,
        tableName: 'cart_items',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['product_id']
            },
            {
                unique: true,
                fields: ['user_id', 'product_id', 'variation_id']
            }
        ]
    });

    return CartItem;
};