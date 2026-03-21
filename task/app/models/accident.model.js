// models/item.js

module.exports = (sequelize, Sequelize) => {
    const Accident = sequelize.define("accident", {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      staff_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  
    return Accident;
  };
  