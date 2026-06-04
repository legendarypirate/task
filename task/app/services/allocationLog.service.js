const db = require("../models");

const User = db.users;
const TaskAllocationLog = db.task_allocation_logs;

/**
 * Record when a supervisor assigns work to someone (create / assign / update).
 */
async function recordSupervisorAllocation({ actorUserId, taskId, action }) {
  if (!actorUserId || !taskId) return;
  try {
    const user = await User.findByPk(actorUserId, {
      attributes: ["id", "role"],
    });
    if (!user || String(user.role).toLowerCase() !== "supervisor") return;

    await TaskAllocationLog.create({
      allocator_id: actorUserId,
      task_id: taskId,
      action,
    });
  } catch (err) {
    console.error("[allocation-log] failed:", err.message);
  }
}

function recordSupervisorAllocationAsync(params) {
  recordSupervisorAllocation(params).catch(() => {});
}

module.exports = {
  recordSupervisorAllocation,
  recordSupervisorAllocationAsync,
};
