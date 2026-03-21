module.exports = (sequelize, Sequelize) => {
  const Task = sequelize.define("task", {
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    created_by: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    assigned_to: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    supervisor_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    priority: {
      type: Sequelize.ENUM("low", "normal", "high"),
      defaultValue: "normal",
    },
    status: {
      type: Sequelize.ENUM("pending", "in_progress", "done", "verified", "cancelled"),
      defaultValue: "pending",
    },
    image: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    due_date: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    completed_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    
    // Давтамжтай ажилд зориулсан 2 шинэ column
    frequency_type: {
      type: Sequelize.ENUM("none", "daily", "weekly", "monthly"),
      defaultValue: "none",
    },
    frequency_value: {
      type: Sequelize.INTEGER,
      allowNull: true,
    }
  });

  return Task;
};