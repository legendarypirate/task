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
  assigned_to?: number;
  supervisor_id?: number;
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
}

interface TaskFormProps {
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
  loading?: boolean;
  onSubmit?: (taskData: TaskFormData) => void;
}

export default function TaskForm({ task, onSuccess, onCancel, loading = false, onSubmit }: TaskFormProps) {
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
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
        priority: task.priority,
        status: task.status,
        frequency_type: task.frequency_type,
        frequency_value: task.frequency_value || 1,
        assigned_to: task.assigned_to?.toString() || "",
        supervisor_id: task.supervisor_id?.toString() || "",
      });
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
        assigned_to: formData.assigned_to || "",
        supervisor_id: formData.supervisor_id || "",
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
        body: JSON.stringify({
          ...formData,
          frequency_value: formData.frequency_type === "none" ? null : formData.frequency_value,
          due_date: formData.frequency_type === "none" ? formData.due_date : null,
          assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
          supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : null,
        }),
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
          <Label htmlFor="assigned_to">Хэрэгжүүлэгчийн ID</Label>
          <Input
            type="number"
            value={formData.assigned_to}
            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
            placeholder="ID оруулах"
          />
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
        <Label htmlFor="supervisor_id">Хянах хүний ID</Label>
        <Input
          type="number"
          value={formData.supervisor_id}
          onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
          placeholder="ID оруулах"
        />
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