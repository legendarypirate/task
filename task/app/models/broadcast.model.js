module.exports = (sequelize, Sequelize) => {
  const Broadcast = sequelize.define("broadcast", {
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
    sender_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    sender_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    roles: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
    },
    receiver_type: {
      type: Sequelize.STRING,
      defaultValue: "role_broadcast",
    },
    target_users: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    success_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    failure_count: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "sent",
    },
  });

  return Broadcast;
};
