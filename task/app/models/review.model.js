// models/review.js
module.exports = (sequelize, Sequelize) => {
    const Review = sequelize.define("review", {
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
        userId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'user_id'
        },
        userName: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'user_name'
        },
        rating: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        title: {
            type: Sequelize.STRING
        },
        comment: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        verifiedPurchase: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            field: 'verified_purchase'
        },
        helpfulCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: 'helpful_count'
        },
        images: {
            type: Sequelize.JSON,
            defaultValue: []
        },
        createdAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            field: 'created_at'
        }
    }, {
        timestamps: false,
        tableName: 'reviews',
        indexes: [
            {
                fields: ['product_id']
            },
            {
                fields: ['user_id']
            },
            {
                fields: ['rating']
            },
            {
                fields: ['created_at']
            }
        ]
    });

    return Review;
};