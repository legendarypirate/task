module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    full_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.ENUM("director", "general_manager", "supervisor", "worker"),
      allowNull: false,
      defaultValue: "worker",
    },
    supervisor_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  });

  return User;
};
