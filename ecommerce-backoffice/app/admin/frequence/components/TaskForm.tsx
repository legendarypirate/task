// app/task-calendar/components/TaskForm.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  priority: "low" | "normal" | "high";
  frequency_type: "none" | "daily" | "weekly" | "monthly";
  frequency_value?: number;
  assigned_to?: number | number[];
  supervisor_id?: number | number[];
}

function idsFromTaskField(value: number | number[] | undefined | null): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((n) => String(n));
  return [String(value)];
}

function parseIdList(ids: string[]): number[] {
  return ids.map((id) => parseInt(id, 10)).filter((n) => Number.isFinite(n));
}

function mergeUniqueInts(...lists: number[][]): number[] {
  const out: number[] = [];
  for (const list of lists) {
    for (const n of list) {
      if (!out.includes(n)) out.push(n);
    }
  }
  return out;
}

function buildTaskApiJsonBody(
  formData: TaskFormData,
  assignedSupervisorIds: string[],
): Record<string, unknown> {
  const assignedParsed =
    assignedSupervisorIds.length > 0
      ? parseIdList(assignedSupervisorIds)
      : formData.assigned_to
        ? parseIdList([formData.assigned_to])
        : [];
  const assignedToPayloadFinal = assignedParsed.length > 0 ? assignedParsed : null;

  const reviewerParsed =
    formData.supervisor_ids.length > 0
      ? parseIdList(formData.supervisor_ids)
      : formData.supervisor_id
        ? parseIdList([formData.supervisor_id])
        : [];

  // supervisor_id on API = удирдлага/хяналт: гүйцэтгэгч supervisor-ууд + нэмэлт GM/Director сонголт
  const supervisorMerged = mergeUniqueInts(assignedParsed, reviewerParsed);
  const supervisorPayload = supervisorMerged.length > 0 ? supervisorMerged : null;

  return {
    title: formData.title,
    description: formData.description,
    priority: formData.priority,
    status: formData.status,
    frequency_type: formData.frequency_type,
    frequency_value: formData.frequency_type === "none" ? null : formData.frequency_value,
    due_date: formData.frequency_type === "none" ? formData.due_date || null : null,
    assigned_to: assignedToPayloadFinal,
    supervisor_id: supervisorPayload,
  };
}

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  priority: "low" | "normal" | "high";
  status: string;
  frequency_type: "none" | "daily" | "weekly" | "monthly";
  frequency_value: number;
  assigned_to: string;
  supervisor_id: string;
  supervisor_ids: string[];
}

interface User {
  id: number;
  full_name?: string;
  phone?: string;
  role: string;
}

interface TaskFormProps {
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
  loading?: boolean;
  onSubmit?: (taskData: TaskFormData) => void;
}

export default function TaskForm({ task, onSuccess, onCancel, loading = false, onSubmit }: TaskFormProps) {
  const [assignableSupervisors, setAssignableSupervisors] = useState<User[]>([]);
  const [reviewManagers, setReviewManagers] = useState<User[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    due_date: "",
    priority: "normal",
    status: "pending",
    frequency_type: "none",
    frequency_value: 1,
    assigned_to: "",
    supervisor_id: "",
    supervisor_ids: [],
  });
  const [assignedSupervisorIds, setAssignedSupervisorIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;
        const result = await response.json();
        const users: User[] = Array.isArray(result?.data) ? result.data : [];

        setAssignableSupervisors(users.filter((u) => u.role === "supervisor"));
        setReviewManagers(
          users.filter((u) => u.role === "general_manager" || u.role === "director")
        );
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (task) {
      const supIds = idsFromTaskField(task.supervisor_id);
      const assignIds = idsFromTaskField(task.assigned_to);
      setFormData({
        title: task.title,
        description: task.description || "",
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
        priority: task.priority,
        status: task.status,
        frequency_type: task.frequency_type,
        frequency_value: task.frequency_value || 1,
        assigned_to: assignIds[0] || "",
        supervisor_id: supIds[0] || "",
        supervisor_ids: supIds,
      });
      setAssignedSupervisorIds(assignIds);
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Гарчиг оруулна уу");
      return;
    }

    // Хэрэв onSubmit prop байвал түүнийг дуудах
    if (onSubmit) {
      const submitData: TaskFormData = {
        ...formData,
        frequency_value: formData.frequency_type === "none" ? 1 : formData.frequency_value,
        due_date: formData.frequency_type === "none" ? formData.due_date : "",
        assigned_to: assignedSupervisorIds[0] || formData.assigned_to || "",
        supervisor_id: formData.supervisor_ids[0] || formData.supervisor_id || "",
        supervisor_ids: formData.supervisor_ids,
      };
      onSubmit(submitData);
      return;
    }

    // Эсвэл хуучин логикоор үргэлжлүүлэх
    try {
      const token = localStorage.getItem("token");
      const url = task 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/task/${task.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/task`;

      const method = task ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          buildTaskApiJsonBody(formData, assignedSupervisorIds),
        ),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(task ? "Ажил амжилттай шинэчлэгдлээ" : "Ажил амжилттай үүслээ");
        onSuccess();
      } else {
        toast.error(result.message || "Алдаа гарлаа");
      }
    } catch (error) {
      toast.error("Алдаа гарлаа");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Гарчиг *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ажлын гарчиг"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Тайлбар</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ажлын дэлгэрэнгүй тайлбар"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Чухалчлал</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: "low" | "normal" | "high") => 
              setFormData({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Бага</SelectItem>
              <SelectItem value="normal">Хэвийн</SelectItem>
              <SelectItem value="high">Өндөр</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Статус</Label>
          <Select
            value={formData.status}
            onValueChange={(value: string) => 
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Хүлээгдэж байна</SelectItem>
              <SelectItem value="in_progress">Хийгдэж байна</SelectItem>
              <SelectItem value="done">Дууссан</SelectItem>
              <SelectItem value="verified">Баталгаажсан</SelectItem>
              <SelectItem value="cancelled">Цуцлагдсан</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frequency_type">Давтамж</Label>
          <Select
            value={formData.frequency_type}
            onValueChange={(value: "none" | "daily" | "weekly" | "monthly") => 
              setFormData({ ...formData, frequency_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Нэг удаа</SelectItem>
              <SelectItem value="daily">Өдөр бүр</SelectItem>
              <SelectItem value="weekly">Долоо хоног бүр</SelectItem>
              <SelectItem value="monthly">Сар бүр</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Гүйцэтгэгчид (supervisor эрхтэй)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Сонгогдсон supervisor-ууд ажлыг гүйцэтгэнэ (<code className="text-[11px]">assigned_to</code>) мөн{" "}
            <code className="text-[11px]">supervisor_id</code> жагсаалтад орно.
          </p>
          <div className="mt-2 max-h-48 overflow-auto rounded-md border p-3 space-y-2">
            {assignableSupervisors.length === 0 && (
              <p className="text-sm text-gray-500">Supervisor хэрэглэгч олдсонгүй</p>
            )}
            {assignableSupervisors.map((supervisor) => {
              const id = String(supervisor.id);
              const checked = assignedSupervisorIds.includes(id);
              return (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setAssignedSupervisorIds((prev) =>
                        e.target.checked
                          ? prev.includes(id)
                            ? prev
                            : [...prev, id]
                          : prev.filter((x) => x !== id),
                      );
                    }}
                  />
                  <span>
                    {(supervisor.full_name || supervisor.phone || `ID: ${supervisor.id}`) +
                      ` (ID: ${supervisor.id})`}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {formData.frequency_type === "weekly" && (
        <div>
          <Label htmlFor="frequency_value">Гариг *</Label>
          <Select
            value={formData.frequency_value.toString()}
            onValueChange={(value) => 
              setFormData({ ...formData, frequency_value: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Ням</SelectItem>
              <SelectItem value="1">Даваа</SelectItem>
              <SelectItem value="2">Мягмар</SelectItem>
              <SelectItem value="3">Лхагва</SelectItem>
              <SelectItem value="4">Пүрэв</SelectItem>
              <SelectItem value="5">Баасан</SelectItem>
              <SelectItem value="6">Бямба</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.frequency_type === "monthly" && (
        <div>
          <Label htmlFor="frequency_value">Өдөр (1-31) *</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={formData.frequency_value}
            onChange={(e) => 
              setFormData({ ...formData, frequency_value: parseInt(e.target.value) || 1 })
            }
          />
        </div>
      )}

      {formData.frequency_type === "none" && (
        <div>
          <Label htmlFor="due_date">Дуусах огноо *</Label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required={formData.frequency_type === "none"}
          />
        </div>
      )}

      <div>
        <Label>Нэмэлт хянагчид (General manager / Director)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Дээрхээс гадна батлах/хянах ерөнхий менежер, захирал нэмж сонгоно. ID-ууд{" "}
          <code className="text-[11px]">supervisor_id</code>-д нэгтгэгдэнэ.
        </p>
        <div className="mt-2 max-h-48 overflow-auto rounded-md border p-3 space-y-2">
          {reviewManagers.length === 0 && (
            <p className="text-sm text-gray-500">
              General manager эсвэл director хэрэглэгч олдсонгүй — энэ талбар хоосон үлдэнэ
            </p>
          )}
          {reviewManagers.map((manager) => {
            const id = String(manager.id);
            const checked = formData.supervisor_ids.includes(id);
            return (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    setFormData((prev) => {
                      const nextIds = e.target.checked
                        ? prev.supervisor_ids.includes(id)
                          ? prev.supervisor_ids
                          : [...prev.supervisor_ids, id]
                        : prev.supervisor_ids.filter((x) => x !== id);
                      return {
                        ...prev,
                        supervisor_ids: nextIds,
                        supervisor_id: nextIds[0] || "",
                      };
                    });
                  }}
                />
                <span>
                  {(manager.full_name || manager.phone || `ID: ${manager.id}`) +
                    ` (${manager.role}, ID: ${manager.id})`}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? "Хадгалж байна..." : (task ? "Шинэчлэх" : "Үүсгэх")}
        </Button>
      </div>
    </form>
  );
}