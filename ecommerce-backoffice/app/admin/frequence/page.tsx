// app/task-calendar/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Calendar, RotateCw, Edit, Trash2, X } from "lucide-react";
import TaskForm from "./components/TaskForm";

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  priority: "low" | "normal" | "high";
  frequency_type: "none" | "daily" | "weekly" | "monthly";
  frequency_value?: number;
  is_generated?: boolean;
  created_by?: number;
  assigned_to?: number;
  supervisor_id?: number;
}

export default function TaskCalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Task-уудыг авах
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.data);
      } else {
        toast.error("Алдаа гарлаа");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Серверийн алдаа");
    }
  };

  // Календарын task-уудыг авах
  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/task/calendar/${currentYear}/${currentMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarTasks(data.data);
      } else {
        toast.error("Календар ачаалахад алдаа гарлаа");
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
      toast.error("Серверийн алдаа");
    } finally {
      setLoading(false);
    }
  };

  // Жинхэнэ task үүсгэх
  const generateTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/task/generate-recurring`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            year: currentYear,
            month: currentMonth,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        fetchTasks();
        fetchCalendar();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("Ажил үүсгэхэд алдаа гарлаа");
    }
  };

  // Task устгах
  const handleDelete = async (id: number) => {
    if (!confirm("Та энэ ажлыг устгахдаа итгэлтэй байна уу?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Ажил амжилттай устгагдлаа");
        fetchTasks();
        fetchCalendar();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Устгахад алдаа гарлаа");
    }
  };

  // Task засах
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  // Шинэ task нэмэх
  const handleAdd = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  // Form хаах
  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // Form амжилттай хадгалсны дараа
  const handleFormSuccess = () => {
    fetchTasks();
    fetchCalendar();
    handleFormClose();
  };

  // Task status өөрчлөх
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Статус амжилттай шинэчлэгдлээ");
        fetchTasks();
        fetchCalendar();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Статус шинэчлэхэд алдаа гарлаа");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchCalendar();
  }, [currentYear, currentMonth]);

  // Өдрүүдийг бэлтгэх
  const getDaysInMonth = () => {
    const days = [];
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    
    // Эхний өдрүүдийг хоосон эсүүдээр дүүргэх
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(currentYear, currentMonth - 1, i);
      days.push(date);
    }
    
    return days;
  };

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    
    return calendarTasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getFrequencyText = (task: Task) => {
    switch (task.frequency_type) {
      case 'daily':
        return 'Өдөр бүр';
      case 'weekly':
        const days = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
        return `Долоо хоног бүр ${days[task.frequency_value || 0]}`;
      case 'monthly':
        return `Сар бүр ${task.frequency_value} өдөр`;
      default:
        return 'Нэг удаа';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Хүлээгдэж байна';
      case 'in_progress': return 'Хийгдэж байна';
      case 'done': return 'Дууссан';
      case 'verified': return 'Баталгаажсан';
      case 'cancelled': return 'Цуцлагдсан';
      default: return status;
    }
  };

  const days = getDaysInMonth();
  const dayNames = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

  return (
    <div className="container mx-auto p-6">
      {/* Task Form Drawer - Background хар болохгүй */}
      {showForm && (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? "Ажил засах" : "Шинэ ажил үүсгэх"}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFormClose}
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
            <TaskForm
              task={editingTask || undefined}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ажлын Календар</h1>
          <p className="text-gray-600 mt-2">
            {currentYear} оны {currentMonth} сар
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }}
            variant="outline"
          >
            Өмнөх сар
          </Button>
          <Button
            onClick={() => setCurrentDate(new Date())}
            variant="outline"
          >
            Одоогийн сар
          </Button>
          <Button
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }}
            variant="outline"
          >
            Дараагийн сар
          </Button>
          <Button onClick={generateTasks} className="bg-green-600 hover:bg-green-700">
            <RotateCw className="w-4 h-4 mr-2" />
            Ажил үүсгэх
          </Button>
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Шинэ ажил
          </Button>
        </div>
      </div>

      {/* Календар */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Календар</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2 border-b">
                {day}
              </div>
            ))}
            
            {days.map((date, index) => (
              <div
                key={index}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  date ? 'bg-white' : 'bg-gray-50'
                } ${
                  date && date.toDateString() === new Date().toDateString() 
                    ? 'border-blue-500 border-2' 
                    : 'border-gray-200'
                }`}
              >
                {date && (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${
                        date.toDateString() === new Date().toDateString()
                          ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                          : ''
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {getTasksForDate(date).map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`text-xs p-1 rounded truncate ${
                            task.priority === "high" 
                              ? "bg-red-100 text-red-800 border-l-2 border-red-500" 
                              : task.priority === "normal"
                              ? "bg-blue-100 text-blue-800 border-l-2 border-blue-500"
                              : "bg-gray-100 text-gray-800 border-l-2 border-gray-500"
                          } ${task.is_generated ? 'opacity-75' : ''}`}
                          title={`${task.title}${task.is_generated ? ' (Автомат)' : ''}`}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Бүх ажлын жагсаалт */}
      <Card>
        <CardHeader>
          <CardTitle>Бүх ажлууд</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Ачааллаж байна...</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          task.frequency_type === "daily" ? "bg-green-100 text-green-800" :
                          task.frequency_type === "weekly" ? "bg-blue-100 text-blue-800" :
                          task.frequency_type === "monthly" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {getFrequencyText(task)}
                        </span>
                        
                        <span className={`px-2 py-1 rounded text-sm ${
                          task.priority === "high" ? "bg-red-100 text-red-800" :
                          task.priority === "normal" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {task.priority}
                        </span>
                        
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`px-2 py-1 rounded text-sm border-0 ${getStatusColor(task.status)}`}
                        >
                          <option value="pending">Хүлээгдэж байна</option>
                          <option value="in_progress">Хийгдэж байна</option>
                          <option value="done">Дууссан</option>
                          <option value="verified">Баталгаажсан</option>
                          <option value="cancelled">Цуцлагдсан</option>
                        </select>

                        {task.due_date && (
                          <span className="px-2 py-1 rounded text-sm bg-orange-100 text-orange-800">
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Ажил байхгүй байна
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Давтамжтай ажлын жагсаалт */}
      <Card>
        <CardHeader>
          <CardTitle>Давтамжтай ажлууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks
              .filter(task => task.frequency_type !== 'none')
              .map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className={`px-2 py-1 rounded ${
                          task.frequency_type === "daily" ? "bg-green-100 text-green-800" :
                          task.frequency_type === "weekly" ? "bg-blue-100 text-blue-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {getFrequencyText(task)}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          task.priority === "high" ? "bg-red-100 text-red-800" :
                          task.priority === "normal" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {task.priority}
                        </span>
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                          {getStatusText(task.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            
            {tasks.filter(task => task.frequency_type !== 'none').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Давтамжтай ажил байхгүй байна
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}