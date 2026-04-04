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
import { TaskCard, type Task as CardTask } from "@/components/task/TaskCard";
import { X, List, Grid, Plus, Edit, User, Save, Trash2, Eye } from "lucide-react";

const columns = ["pending", "in_progress", "done", "verified", "cancelled"] as const;

const STATUS_LABELS: Record<(typeof columns)[number], string> = {
  pending: "Шинэ",
  in_progress: "Гүйцэтгэж байгаа",
  done: "Дууссан",
  verified: "Баталгаажсан",
  cancelled: "Цуцалсан",
};

interface Task extends CardTask {
  image?: string | null;
  created_at?: string;
  updated_at?: string;
  /** Sequelize may serialize as camelCase */
  updatedAt?: string;
  completed_at?: string;
}

/** Date used to decide which calendar month a verified task belongs to (verification / last update). */
function getVerifiedMonthReference(task: Task): Date | null {
  const raw =
    task.updated_at ??
    task.updatedAt ??
    task.completed_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** True when task is verified and its reference month is strictly before the current local month. */
function isVerifiedFromPriorMonth(task: Task): boolean {
  if (task.status !== "verified") return false;
  const d = getVerifiedMonthReference(task);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() < now.getFullYear() ||
    (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth())
  );
}

// User interface for supervisors
interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

// Image View Modal Component
function ImageViewModal({
  isOpen,
  onClose,
  imageUrl
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Даалгаврын зураг
            </h3>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center justify-center"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="p-4 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Даалгаврын зураг"
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=Зураг+алдаа";
            }}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 p-4">
          <div className="flex justify-end">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Зураг нээх
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Task Modal Component
function EditTaskModal({
  isOpen,
  onClose,
  task,
  supervisors,
  onSave,
  onDelete
}: {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  supervisors: User[];
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: number) => void;
}) {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      const rawSup = task.supervisor_id;
      const supervisorIds: number[] =
        rawSup === undefined || rawSup === null
          ? []
          : Array.isArray(rawSup)
            ? rawSup.map((n) => Number(n)).filter((n) => Number.isFinite(n))
            : Number.isFinite(Number(rawSup))
              ? [Number(rawSup)]
              : [];

      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        assigned_to: task.assigned_to
          ? (Array.isArray(task.assigned_to) ? task.assigned_to : [task.assigned_to])
          : [],
        supervisor_id: supervisorIds,
        due_date: task.due_date ? String(task.due_date).split("T")[0] : "",
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task && formData) {
      const updatedTask: Task = {
        ...task,
        title: formData.title || task.title,
        description: formData.description,
        priority: formData.priority || task.priority,
        status: formData.status || task.status,
        assigned_to: formData.assigned_to,
        supervisor_id: formData.supervisor_id,
        due_date: formData.due_date || task.due_date,
      };
      onSave(updatedTask);
      onClose();
    }
  };

  const handleDelete = () => {
    if (task && window.confirm("Та энэ даалгаврыг устгахдаа итгэлтэй байна уу?")) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/40"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Даалгавар засах
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ID: #{task.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDeleting(!isDeleting)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Устгах"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation */}
        {isDeleting && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mx-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 dark:text-red-200 font-medium">
                  Даалгавар устгах
                </p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                  Энэ үйлдлийг буцаах боломжгүй
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Устгах
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Гарчиг *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                  placeholder="Даалгаврын гарчиг"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Төлөв
                </label>
                <select
                  value={formData.status || ""}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                >
                  <option value="pending">Шинэ</option>
                  <option value="in_progress">Гүйцэтгэж байгаа</option>
                  <option value="done">Дууссан</option>
                  <option value="verified">Баталгаажсан</option>
                  <option value="cancelled">Цуцалсан</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Тайлбар
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                placeholder="Даалгаврын дэлгэрэнгүй"
                rows={4}
              />
            </div>

            {/* Assignment Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ангилал
                </label>
                <select
                  value={formData.priority || ""}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700">
                  {supervisors.map((supervisor) => (
                    <label key={supervisor.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600 p-1 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.assigned_to) && formData.assigned_to.includes(supervisor.id)}
                        onChange={(e) => {
                          const current = Array.isArray(formData.assigned_to) ? formData.assigned_to : [];
                          if (e.target.checked) {
                            setFormData({ ...formData, assigned_to: [...current, supervisor.id] });
                          } else {
                            setFormData({ ...formData, assigned_to: current.filter(id => id !== supervisor.id) });
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {supervisor.full_name}
                      </span>
                    </label>
                  ))}
                  {supervisors.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">Сонгох боломжтой хэрэглэгч байхгүй</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supervisor
                </label>
                <select
                  value={(() => {
                    const sid = formData.supervisor_id;
                    if (sid === undefined || sid === null) return "";
                    if (Array.isArray(sid)) return sid.length ? String(sid[0]) : "";
                    return String(sid);
                  })()}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({
                      ...formData,
                      supervisor_id: v ? [parseInt(v, 10)] : [],
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                >
                  <option value="">Сонгох</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Дуусах хугацаа
              </label>
              <input
                type="date"
                value={formData.due_date || ""}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              />
            </div>

            {/* Image Preview (if exists) */}
            {task.image && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Оруулсан зураг
                </label>
                <div className="border border-gray-300 dark:border-neutral-600 rounded-md p-4">
                  <img
                    src={task.image}
                    alt="Даалгаврын зураг"
                    className="w-32 h-32 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/128?text=Зураг+алдаа";
                    }}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    "Дууссан" төлөвт оруулсан зураг
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 dark:bg-neutral-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Системийн мэдээлэл
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Үүсгэсэн:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Тодорхойгүй'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Сүүлийн шинэчлэл:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : 'Тодорхойгүй'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                <Save className="h-4 w-4" />
                Хадгалах
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 dark:bg-neutral-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-neutral-500 transition-colors duration-200"
              >
                Цуцлах
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
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
function Column({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
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
      <h2 className="mb-3 text-sm font-semibold leading-snug text-gray-700 dark:text-gray-300">
        {title}{" "}
        <span className="tabular-nums text-gray-600 dark:text-gray-400">({count})</span>
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
    status: "pending" as (typeof columns)[number],
    frequency_type: "none" as NonNullable<CardTask["frequency_type"]>,
    frequency_value: 1,
    assigned_to: [] as number[],
    supervisor_id: "",
    due_date: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.frequency_type === "none" && !formData.due_date.trim()) {
      alert("Нэг удаагийн ажилд дуусах огноо оруулна уу");
      return;
    }

    const assignees = [...new Set(formData.assigned_to)];

    const newTask: Omit<Task, "id"> = {
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      status: formData.status,
      created_by: 1,
      assigned_to: assignees.length ? assignees : undefined,
      supervisor_id: assignees.length ? assignees : undefined,
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
      assigned_to: [],
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
            Шинэ даалгавар үүсгэх
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Шинэ даалгавар үүсгэх форм
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
              placeholder="Даалгаврын гарчиг"
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
              placeholder="Даалгаврын дэлгэрэнгүй"
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
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as (typeof columns)[number] })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {STATUS_LABELS[c]}
                  </option>
                ))}
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
                  frequency_type: e.target.value as NonNullable<CardTask["frequency_type"]>,
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
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700">
              {supervisors.map((supervisor) => (
                <label
                  key={supervisor.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-600 p-1 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.assigned_to.includes(supervisor.id)}
                    onChange={(e) => {
                      setFormData((prev) => {
                        const id = supervisor.id;
                        const next = e.target.checked
                          ? prev.assigned_to.includes(id)
                            ? prev.assigned_to
                            : [...prev.assigned_to, id]
                          : prev.assigned_to.filter((x) => x !== id);
                        return { ...prev, assigned_to: next };
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {supervisor.full_name} ({supervisor.email})
                  </span>
                </label>
              ))}
            </div>
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

// Task List Component (New)
function TaskListScreen({
  tasks,
  supervisors,
  onAssignSupervisor,
  onEditTask
}: {
  tasks: Task[];
  supervisors: User[];
  onAssignSupervisor: (taskId: number, supervisorId: number) => void;
  onEditTask: (task: Task) => void;
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [viewingImageTask, setViewingImageTask] = useState<Task | null>(null);

  const handleAssignSupervisor = () => {
    if (selectedTask && selectedSupervisor) {
      onAssignSupervisor(selectedTask.id, parseInt(selectedSupervisor));
      setSelectedTask(null);
      setSelectedSupervisor("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'шинэ': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'гүйцэтгэж байгаа': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'дууссан': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'баталгаажсан': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'цуцалсан': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'normal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSupervisorName = (supervisorId?: number | number[]) => {
    if (supervisorId === undefined || supervisorId === null) return "Томилогдоогүй";
    const ids = Array.isArray(supervisorId) ? supervisorId : [supervisorId];
    if (ids.length === 0) return "Томилогдоогүй";

    return ids
      .map((id) => {
        const supervisor = supervisors.find((s) => s.id === id);
        return supervisor ? supervisor.full_name : `ID: ${id}`;
      })
      .join(", ");
  };

  const getAssigneeNames = (assignedTo?: number | number[]) => {
    if (!assignedTo) return 'Томилогдоогүй';
    const ids = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    if (ids.length === 0) return 'Томилогдоогүй';

    return ids.map(id => {
      const supervisor = supervisors.find(s => s.id === id);
      return supervisor ? supervisor.full_name : `ID: ${id}`;
    }).join(", ");
  };

  const hasImage = (task: Task) => {
    return task.image && task.image !== null && task.image !== "null";
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Үүрэг даалгаврын жагсаалт
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Нийт {tasks.length} даалгавар
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Гарчиг
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Төлөв
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ангилал
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Хуваарилагдсан
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Supervisor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Дуусах хугацаа
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Зураг
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Үйлдэл
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                  #{task.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {task.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="max-w-xs truncate" title={getAssigneeNames(task.assigned_to)}>
                    {getAssigneeNames(task.assigned_to)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getSupervisorName(task.supervisor_id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Тодорхойгүй'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {hasImage(task) ? (
                    <button
                      onClick={() => setViewingImageTask(task)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Харах
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                        title="Supervisor томилох"
                      >
                        <User className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                      title="Засах"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Supervisor Modal */}
      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/40"
            onClick={() => {
              setSelectedTask(null);
              setSelectedSupervisor("");
            }}
          />

          <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Supervisor томилох
              </h3>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setSelectedSupervisor("");
                }}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Даалгавар:</p>
                <p className="font-medium text-gray-900 dark:text-gray-200">{selectedTask.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supervisor сонгох
                </label>
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-white"
                >
                  <option value="">Сонгох</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.full_name} ({supervisor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAssignSupervisor}
                  disabled={!selectedSupervisor}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Томилох
                </button>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setSelectedSupervisor("");
                  }}
                  className="flex-1 bg-gray-300 dark:bg-neutral-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-neutral-500 transition-colors duration-200"
                >
                  Цуцлах
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      <ImageViewModal
        isOpen={!!viewingImageTask}
        onClose={() => setViewingImageTask(null)}
        imageUrl={viewingImageTask?.image || null}
      />
    </div>
  );
}

// Main Kanban Component
function KanbanBoard({
  columnTasks,
  activeTask,
  sensors,
  onDragStart,
  onDragEnd
}: {
  columnTasks: Record<string, Task[]>;
  activeTask: Task | null;
  sensors: any;
  onDragStart: (e: DragStartEvent) => void;
  onDragEnd: (e: DragEndEvent) => void;
}) {
  return (
    <div className="p-6 bg-gray-100 dark:bg-neutral-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Самбар (Kanban)
        </h1>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Column
              key={col}
              id={col}
              title={STATUS_LABELS[col]}
              count={(columnTasks[col] || []).length}
            >
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
    </div>
  );
}

export default function TaskManagementPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columnTasks, setColumnTasks] = useState<Record<string, Task[]>>({});
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [supervisorFilter, setSupervisorFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredTasks = (source: Task[]) => {
    return source.filter((task) => {
      if (isVerifiedFromPriorMonth(task)) return false;
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (workerFilter !== "all") {
        const wid = Number(workerFilter);
        const assigned = task.assigned_to;
        if (Array.isArray(assigned)) {
          if (!assigned.includes(wid)) return false;
        } else if (String(assigned ?? "") !== workerFilter) {
          return false;
        }
      }
      if (supervisorFilter !== "all") {
        const sid = Number(supervisorFilter);
        const matchesSupervisorField = task.supervisor_id === sid;
        // Some flows assign the supervisor as assignee (assigned_to).
        const matchesAssignedSupervisor = Array.isArray(task.assigned_to)
          ? task.assigned_to.includes(sid)
          : task.assigned_to === sid;
        if (!matchesSupervisorField && !matchesAssignedSupervisor) return false;
      }
      return true;
    });
  };

  useEffect(() => {
    const filtered = getFilteredTasks(tasks);
    const grouped: Record<string, Task[]> = {};
    columns.forEach((c) => {
      grouped[c] = filtered.filter((t) => t.status === c);
    });
    setColumnTasks(grouped);
  }, [tasks, statusFilter, workerFilter, supervisorFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchTasks()]);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`);

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

      const normalizedUsers = supervisorData
        .map((user: any) => {
          let fullName = user.full_name;

          if (!fullName) {
            if (user.first_name && user.last_name) {
              fullName = `${user.first_name} ${user.last_name}`;
            } else if (user.name) {
              fullName = user.name;
            } else if (user.email) {
              fullName = user.email.split('@')[0];
            } else {
              fullName = `User ${user.id}`;
            }
          }

          return {
            ...user,
            full_name: fullName
          };
        });

      const filteredSupervisors = normalizedUsers
        .filter((user: any) => user.role?.toLowerCase() === 'supervisor')
        ;
      const filteredWorkers = normalizedUsers
        .filter((user: any) => user.role?.toLowerCase() === 'worker');

      setSupervisors(filteredSupervisors);
      setWorkers(filteredWorkers);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setSupervisors([]);
      setWorkers([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`);
      const json = await res.json();

      let fetchedTasks: Task[] = [];

      if (Array.isArray(json.data)) {
        fetchedTasks = json.data;
      } else if (Array.isArray(json)) {
        fetchedTasks = json;
      } else if (json.data && Array.isArray(json.data)) {
        fetchedTasks = json.data;
      }

      fetchedTasks.sort((a, b) => b.id - a.id);
      setTasks(fetchedTasks);

      const grouped: Record<string, Task[]> = {};
      columns.forEach((c) => {
        grouped[c] = fetchedTasks.filter((t: Task) => t.status === c);
      });
      setColumnTasks(grouped);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setTasks([]);
      setColumnTasks({});
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
        await fetchTasks();
      } else {
        console.error("Failed to create task");
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  // Edit task function
  const handleEditTask = async (updatedTask: Task) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });

      if (res.ok) {
        await fetchTasks();
        setEditingTask(null);
      } else {
        console.error("Failed to update task");
      }
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  // Delete task function
  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/${taskId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchTasks();
      } else {
        console.error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task", err);
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

  // Assign supervisor to task
  const assignSupervisor = async (taskId: number, supervisorId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/${taskId}/assign-supervisor`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisor_id: supervisorId }),
      });

      if (res.ok) {
        await fetchTasks();
      } else {
        console.error("Failed to assign supervisor");
      }
    } catch (err) {
      console.error("Failed to assign supervisor", err);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-900">
      {/* Header with navigation */}
      <div className="bg-white dark:bg-neutral-800 shadow">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Үүрэг даалгаврын систем
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-200 dark:bg-neutral-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${viewMode === 'kanban'
                      ? 'bg-white dark:bg-neutral-600 text-gray-800 dark:text-gray-200 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                    }`}
                >
                  <Grid className="h-4 w-4" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${viewMode === 'list'
                      ? 'bg-white dark:bg-neutral-600 text-gray-800 dark:text-gray-200 shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                    }`}
                >
                  <List className="h-4 w-4" />
                  Жагсаалт
                </button>
              </div>

              {/* Create Task Button */}
              <button
                onClick={() => setIsCreateDrawerOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Шинэ даалгавар
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 dark:text-white"
            >
              <option value="all">Бүх төлөв</option>
              {columns.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <select
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 dark:text-white"
            >
              <option value="all">Бүх хэрэгжүүлэгч</option>
              {workers.map((worker) => (
                <option key={worker.id} value={String(worker.id)}>
                  {worker.full_name}
                </option>
              ))}
            </select>
            <select
              value={supervisorFilter}
              onChange={(e) => setSupervisorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 dark:text-white"
            >
              <option value="all">Бүх supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={String(supervisor.id)}>
                  {supervisor.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          columnTasks={columnTasks}
          activeTask={activeTask}
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ) : (
        <div className="p-6">
          <TaskListScreen
            tasks={getFilteredTasks(tasks)}
            supervisors={supervisors}
            onAssignSupervisor={assignSupervisor}
            onEditTask={setEditingTask}
          />
        </div>
      )}

      {/* Create Task Drawer */}
      <CreateTaskDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        onCreate={createTask}
        supervisors={supervisors}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        supervisors={supervisors}
        onSave={handleEditTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}