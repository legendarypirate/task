module.exports = (sequelize, Sequelize) => {
  const UserNotification = sequelize.define("user_notification", {
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    broadcast_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      defaultValue: "announcement",
    },
    priority: {
      type: Sequelize.STRING,
      defaultValue: "medium",
    },
    sender_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    receiver_type: {
      type: Sequelize.STRING,
      defaultValue: "role_broadcast",
    },
    read: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    read_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });

  return UserNotification;
};
