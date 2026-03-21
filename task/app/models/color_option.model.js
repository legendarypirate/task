// models/colorOption.js
module.exports = (sequelize, Sequelize) => {
    const ColorOption = sequelize.define("color_option", {
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
        value: {
            type: Sequelize.STRING,
            allowNull: false
        },
        image: {
            type: Sequelize.STRING
        }
    }, {
        timestamps: false,
        tableName: 'color_options',
        indexes: [
            {
                fields: ['product_id']
            }
        ]
    });

    return ColorOption;
};