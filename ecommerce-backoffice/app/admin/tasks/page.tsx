"use client";

import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "@/components/task/TaskCard";
import { X } from "lucide-react";

const columns = ["pending", "in_progress", "done", "verified", "cancelled"];

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_by: number;
  assigned_to?: number | number[];
  supervisor_id?: number | number[];
  due_date?: string | null;
  frequency_type?: "none" | "daily" | "weekly" | "monthly";
  frequency_value?: number | null;
}

// User interface for supervisors
interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  // Optional fields that might be in your API response
  first_name?: string;
  last_name?: string;
  name?: string;
}

// Custom drop animation for smoother transitions
const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

// Droppable column component
function Column({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      type: "column",
      column: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-[260px] bg-gray-200 dark:bg-neutral-800 p-3 rounded-lg transition-all duration-300 ease-in-out
        ${isOver ? "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20" : ""}
      `}
    >
      <h2 className="font-semibold mb-3 capitalize text-gray-700 dark:text-gray-300">
        {id.replace("_", " ")} ({(children as React.ReactNode[]).length})
      </h2>
      <div className="flex flex-col gap-3 min-h-[200px] transition-all duration-300">
        {children}
      </div>
    </div>
  );
}

// Create Task Drawer Component
function CreateTaskDrawer({ 
  isOpen, 
  onClose, 
  onCreate,
  supervisors 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreate: (task: Omit<Task, 'id'>) => void;
  supervisors: User[];
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal" as "low" | "normal" | "high",
    status: "pending" as Task["status"],
    frequency_type: "none" as NonNullable<Task["frequency_type"]>,
    frequency_value: 1,
    assigned_to: "",
    supervisor_id: "",
    due_date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.frequency_type === "none" && !formData.due_date.trim()) {
      alert("Нэг удаагийн ажилд дуусах огноо оруулна уу");
      return;
    }

    const assignId = formData.assigned_to ? parseInt(formData.assigned_to, 10) : NaN;
    const assignList = Number.isFinite(assignId) ? [assignId] : [];

    const newTask: Omit<Task, "id"> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      status: formData.status,
      created_by: 1,
      assigned_to: assignList.length ? assignList : undefined,
      supervisor_id: assignList.length ? assignList : undefined,
      due_date:
        formData.frequency_type === "none" && formData.due_date
          ? new Date(`${formData.due_date}T12:00:00`).toISOString()
          : null,
      frequency_type: formData.frequency_type,
      frequency_value:
        formData.frequency_type === "none" ? null : formData.frequency_value,
    };

    onCreate(newTask);
    setFormData({
      title: "",
      description: "",
      priority: "normal",
      status: "pending",
      frequency_type: "none",
      frequency_value: 1,
      assigned_to: "",
      supervisor_id: "",
      due_date: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-neutral-800 shadow-xl border-l z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Шинэ Task Үүсгэх
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Шинэ task үүсгэх форм
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center justify-center"
        >
          <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Гарчиг *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              placeholder="Task-ийн гарчиг"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Тайлбар
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              placeholder="Task-ийн дэлгэрэнгүй"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Чухалчлал
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as "low" | "normal" | "high" })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              >
                <option value="low">Бага</option>
                <option value="normal">Хэвийн</option>
                <option value="high">Өндөр</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Статус
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              >
                <option value="pending">Хүлээгдэж байна</option>
                <option value="in_progress">Хийгдэж байна</option>
                <option value="done">Дууссан</option>
                <option value="verified">Баталгаажсан</option>
                <option value="cancelled">Цуцлагдсан</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Давтамж
            </label>
            <select
              value={formData.frequency_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency_type: e.target.value as NonNullable<Task["frequency_type"]>,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
            >
              <option value="none">Нэг удаа</option>
              <option value="daily">Өдөр бүр</option>
              <option value="weekly">Долоо хоног бүр</option>
              <option value="monthly">Сар бүр</option>
            </select>
          </div>

          {formData.frequency_type === "weekly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Гариг *
              </label>
              <select
                value={formData.frequency_value.toString()}
                onChange={(e) =>
                  setFormData({ ...formData, frequency_value: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              >
                <option value="0">Ням</option>
                <option value="1">Даваа</option>
                <option value="2">Мягмар</option>
                <option value="3">Лхагва</option>
                <option value="4">Пүрэв</option>
                <option value="5">Баасан</option>
                <option value="6">Бямба</option>
              </select>
            </div>
          )}

          {formData.frequency_type === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Сарын өдөр (1–31) *
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={formData.frequency_value}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency_value: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Хэн рүү даалгаварлах
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
            >
              <option value="">Сонгох</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.full_name} ({supervisor.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Зөвхөн supervisor эрхтэй хэрэглэгчдэд даалгаварлах боломжтой
            </p>
          </div>

          {formData.frequency_type === "none" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дуусах огноо *
              </label>
              <input
                type="date"
                required={formData.frequency_type === "none"}
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              />
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Үүсгэх
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-neutral-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-neutral-500 transition-colors duration-200"
            >
              Цуцлах
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [columnTasks, setColumnTasks] = useState<Record<string, Task[]>>({});
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch supervisors from backend
  useEffect(() => {
    fetchSupervisors();
    fetchTasks();
  }, []);

  const fetchSupervisors = async () => {
    try {
      setLoadingSupervisors(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user?role=supervisor`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();
      
      let supervisorData: User[] = [];
      
      if (Array.isArray(json.data)) {
        supervisorData = json.data;
      } else if (Array.isArray(json)) {
        supervisorData = json;
      } else if (json.data && Array.isArray(json.data)) {
        supervisorData = json.data;
      }
      
      // Filter for supervisors only and ensure full_name exists
      const filteredSupervisors = supervisorData
        .filter((user: any) => user.role === 'supervisor' || user.role === 'Supervisor')
        .map((user: any) => {
          // Ensure full_name exists, create it if it doesn't
          let fullName = user.full_name;
          
          if (!fullName) {
            if (user.first_name && user.last_name) {
              fullName = `${user.first_name} ${user.last_name}`;
            } else if (user.name) {
              fullName = user.name;
            } else {
              fullName = user.email.split('@')[0]; // Fallback to email username
            }
          }
          
          return {
            ...user,
            full_name: fullName
          };
        });
      
      setSupervisors(filteredSupervisors);
    } catch (err) {
      console.error("Failed to fetch supervisors", err);
      setSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  // Fetch tasks from backend
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`);
      const json = await res.json();
      const tasks = Array.isArray(json.data) ? json.data : [];

      const grouped: Record<string, Task[]> = {};
      columns.forEach((c) => {
        grouped[c] = tasks.filter((t: Task) => t.status === c);
      });

      setColumnTasks(grouped);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  // Create new task
  const createTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        await fetchTasks(); // Refresh the task list
      } else {
        console.error("Failed to create task");
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  // Update task status in backend
  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Handle drag start
  const onDragStart = (e: DragStartEvent) => {
    const { active } = e;
    const taskId = active.id;
    
    for (const column of columns) {
      const task = columnTasks[column]?.find(t => t.id === taskId);
      if (task) {
        setActiveTask(task);
        break;
      }
    }
  };

  // Handle drag end
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const sourceColumn = active.data.current?.column;
    let targetColumn = over.data.current?.column;
    
    if (!targetColumn && over.data.current?.type === "task") {
      targetColumn = over.data.current.column;
    } else if (over.data.current?.type === "column") {
      targetColumn = over.id as string;
    }

    if (!sourceColumn || !targetColumn) {
      setActiveTask(null);
      return;
    }

    if (sourceColumn === targetColumn) {
      const items = [...columnTasks[sourceColumn]];
      const oldIndex = items.findIndex((t) => t.id === Number(activeId));
      const newIndex = items.findIndex((t) => t.id === Number(overId));

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = [...items];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        setColumnTasks((prev) => ({
          ...prev,
          [sourceColumn]: reordered,
        }));
      }
    } else {
      const fromList = [...columnTasks[sourceColumn]];
      const toList = [...columnTasks[targetColumn]];

      const movingTaskIndex = fromList.findIndex((t) => t.id === Number(activeId));
      if (movingTaskIndex === -1) {
        setActiveTask(null);
        return;
      }

      const movingTask = fromList[movingTaskIndex];
      fromList.splice(movingTaskIndex, 1);

      const updatedTask = { ...movingTask, status: targetColumn };
      toList.unshift(updatedTask);

      setColumnTasks((prev) => ({
        ...prev,
        [sourceColumn]: fromList,
        [targetColumn]: toList,
      }));

      updateTaskStatus(movingTask.id, targetColumn);
    }

    setActiveTask(null);
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      {/* Header with buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Task Board
        </h1>
        <button
          onClick={() => setIsCreateDrawerOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>+</span>
          Шинэ Task Үүсгэх
        </button>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Column key={col} id={col}>
              <SortableContext
                items={(columnTasks[col] || []).map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {(columnTasks[col] || []).map((task) => (
                  <TaskCard key={task.id} task={task} column={col} />
                ))}
              </SortableContext>
            </Column>
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeTask ? (
            <div className="transform rotate-3 shadow-xl">
              <TaskCard task={activeTask} column={activeTask.status} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={createTask}
        supervisors={supervisors}
      />
    </div>
  );
}