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
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: [],
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    fcm_token: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  return User;
};
