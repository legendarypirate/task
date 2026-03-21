module.exports = (sequelize, Sequelize) => {
    const Angilal = sequelize.define("angilal", {
      name: {
        type: Sequelize.STRING
      },
     
      parent_id: {
        type: Sequelize.INTEGER
      },
    });
  
    return Angilal;
  };
  