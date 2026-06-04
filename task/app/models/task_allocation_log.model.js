module.exports = (sequelize, Sequelize) => {
  const TaskAllocationLog = sequelize.define("task_allocation_log", {
    allocator_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    task_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    action: {
      type: Sequelize.ENUM("create", "assign", "update"),
      allowNull: false,
      defaultValue: "assign",
    },
  });

  return TaskAllocationLog;
};
