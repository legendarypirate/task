"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_by: number;
  assigned_to?: number;
  supervisor_id?: number;
  due_date?: string;
}

interface TaskCardProps {
  task: Task;
  column: string;
}

export function TaskCard({ task, column }: TaskCardProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    isOver 
  } = useSortable({
    id: task.id,
    data: { 
      type: "task",
      column,
      task,
    },
    transition: {
      duration: 250,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "normal": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-400";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700
        cursor-grab active:cursor-grabbing transition-all duration-300 ease-in-out
        hover:shadow-md hover:scale-[1.02] active:scale-[1.01]
        ${isDragging ? "shadow-xl ring-2 ring-blue-500 ring-opacity-50 z-50" : ""}
        ${isOver ? "bg-blue-50 dark:bg-blue-900/20" : ""}
      `}
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className={`font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.assigned_to && (
            <span className="text-gray-500">Хүртэгч: {task.assigned_to}</span>
          )}
        </div>
        
        {task.due_date && (
          <div className="text-gray-500">
            Дуусах: {formatDate(task.due_date)}
          </div>
        )}
        
        <div className="w-full bg-gray-200 dark:bg-neutral-600 rounded-full h-1">
          <div className="bg-blue-500 h-1 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>
  );
}