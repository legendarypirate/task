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
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: [],
    },
    supervisor_id: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: [],
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
    },
    /** Set when a "1 day before due" push was sent for this due_date (YYYY-MM-DD). Cleared when due_date changes. */
    deadline_reminder_sent_for: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
  });

  return Task;
};