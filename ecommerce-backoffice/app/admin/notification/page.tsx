// app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Send, 
  Bell, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  User,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { mn } from "date-fns/locale";

type UiNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  sender: string;
  receiverType: string;
  receiverName: string;
  sentAt: string;
  read: boolean;
  status: string;
};

const SYSTEM_ROLES: { value: string; label: string }[] = [
  { value: "director", label: "Захирал" },
  { value: "general_manager", label: "Ерөнхий менежер" },
  { value: "supervisor", label: "Ахлах / хянагч" },
  { value: "worker", label: "Ажилтан" },
];

const initialNotifications: UiNotification[] = [];

// Мэдэгдлийн төрлүүд
const notificationTypes = [
  { value: "announcement", label: "Ерөнхий мэдэгдэл" },
  { value: "task", label: "Даалгавар" },
  { value: "reminder", label: "Сануулга" },
  { value: "warning", label: "Анхааруулга" },
  { value: "congrats", label: "Баяр хүргэлт" },
  { value: "training", label: "Сургалт" },
];

// Хүрээтэй тэргүүн зэргийн жагсаалт
const priorities = [
  { value: "low", label: "Бага", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Дунд", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Өндөр", color: "bg-red-100 text-red-800" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UiNotification[]>(initialNotifications);
  const [showSendForm, setShowSendForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fcmReady, setFcmReady] = useState<boolean | null>(null);

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "announcement",
    priority: "medium",
    /** role value -> selected */
    roles: {
      director: true,
      general_manager: true,
      supervisor: true,
      worker: true,
    } as Record<string, boolean>,
  });

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) return;
    fetch(`${api}/api/push/status`)
      .then((r) => r.json())
      .then((j) => setFcmReady(!!j.fcmConfigured))
      .catch(() => setFcmReady(false));
  }, []);

  // Унших болгох
  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Бүгдийг уншсан болгох
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast.success("Бүх мэдэгдлийг уншсан болголоо");
  };

  const defaultRolesState = () =>
    ({
      director: true,
      general_manager: true,
      supervisor: true,
      worker: true,
    }) as Record<string, boolean>;

  const handleSendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error("Гарчиг болон мессежээ бөглөнө үү");
      return;
    }

    const selectedRoles = SYSTEM_ROLES.filter((r) => newNotification.roles[r.value]).map(
      (r) => r.value
    );
    if (selectedRoles.length === 0) {
      toast.error("Дор хаяж нэг үүрэг сонгоно уу");
      return;
    }

    const api = process.env.NEXT_PUBLIC_API_URL;
    if (!api) {
      toast.error("NEXT_PUBLIC_API_URL тохируулаагүй байна");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("Нэвтэрч ороод дахин оролдоно уу");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${api}/api/push/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNotification.title.trim(),
          body: newNotification.message.trim(),
          roles: selectedRoles,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || `Алдаа: ${res.status}`);
        return;
      }

      const receiverName = SYSTEM_ROLES.filter((r) => selectedRoles.includes(r.value))
        .map((r) => r.label)
        .join(", ");

      const newNotif: UiNotification = {
        id: Date.now(),
        title: newNotification.title.trim(),
        message: newNotification.message.trim(),
        type: newNotification.type,
        priority: newNotification.priority,
        sender: "Админ (push)",
        receiverType: "role_broadcast",
        receiverName,
        sentAt: new Date().toISOString(),
        read: false,
        status: "sent",
      };

      setNotifications((prev) => [newNotif, ...prev]);

      setNewNotification({
        title: "",
        message: "",
        type: "announcement",
        priority: "medium",
        roles: defaultRolesState(),
      });

      setShowSendForm(false);

      toast.success(
        `Push илгээгдлээ. Идэвхтэй хэрэглэгч: ${data.targetUsers ?? 0}, амжилттай: ${data.successCount ?? 0}`
      );
    } catch (error) {
      console.error("Мэдэгдэл илгээхэд алдаа гарлаа:", error);
      toast.error("Мэдэгдэл илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Мэдэгдлийн төрлийн icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "announcement":
        return <Bell className="h-4 w-4 text-green-500" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Өнгөний классууд
  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || "bg-gray-100 text-gray-800";
  };

  const getReceiverTypeLabel = (type: string) => {
    if (type === "role_broadcast") return "Үүргээр (push)";
    return type;
  };

  // Огноо форматлах
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd HH:mm", { locale: mn });
    } catch {
      return dateString;
    }
  };

  // Уншаагүй мэдэгдлийн тоо
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мэдэгдэл удирдах</h1>
            <p className="text-gray-600 mt-2">
              Өгөөж чихэр боов ХХК-ийн ажилчдад мэдэгдэл илгээх, удирдах
            </p>
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Бүгдийг уншсан болгох ({unreadCount})
              </Button>
            )}
            
            <Button
              onClick={() => setShowSendForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Шинэ мэдэгдэл илгээх
            </Button>
          </div>
        </div>

        {/* Статистик картууд */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Нийт мэдэгдэл
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Уншаагүй
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Өндөр анхааралтай
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => n.priority === "high").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Өнөөдрийн мэдэгдэл
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications.filter(n => 
                  new Date(n.sentAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Шинэ мэдэгдэл илгээх drawer */}
      {showSendForm && (
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl border-l z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Шинэ мэдэгдэл илгээх
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Сонгосон үүргийн хэрэглэгчдэд push (FCM) илгээнэ
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSendForm(false)}
              className="h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
            <div className="space-y-4">
              {fcmReady === false && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Сервер дээр Firebase тохируулаагүй байна (.env дээр FIREBASE_SERVICE_ACCOUNT_JSON).
                </div>
              )}
              {fcmReady === true && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
                  Push илгээх бэлэн.
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Гарчиг *
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Мэдэгдлийн гарчиг"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Мессеж *
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Мэдэгдлийн дэлгэрэнгүй мэдээлэл"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Мэдэгдлийн төрөл
                </label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification(prev => ({
                    ...prev,
                    type: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Анхаарал
                </label>
                <select
                  value={newNotification.priority}
                  onChange={(e) => setNewNotification(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Хүлээн авагчид — системийн үүрэг
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => {
                      const allOn = SYSTEM_ROLES.every((r) => newNotification.roles[r.value]);
                      const next: Record<string, boolean> = { ...newNotification.roles };
                      for (const r of SYSTEM_ROLES) next[r.value] = !allOn;
                      setNewNotification((prev) => ({ ...prev, roles: next }));
                    }}
                  >
                    Бүгдийг сонгох / арилгах
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Зөвхөн гар утсанд апп нээгээд нэвтэрсэн, FCM токен илгээсэн хэрэглэгчдэд хүрнэ.
                </p>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  {SYSTEM_ROLES.map((role) => (
                    <div key={role.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`role-${role.value}`}
                        checked={!!newNotification.roles[role.value]}
                        onChange={(e) =>
                          setNewNotification((prev) => ({
                            ...prev,
                            roles: { ...prev.roles, [role.value]: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer flex-1">
                        {role.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSendNotification}
                  disabled={loading || !newNotification.title.trim() || !newNotification.message.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Илгээж байна..." : "Илгээх"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSendForm(false)}
                  className="flex-1"
                >
                  Цуцлах
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Мэдэгдлийн жагсаалт */}
      <Card>
        <CardHeader>
          <CardTitle>Мэдэгдлийн түүх</CardTitle>
          <CardDescription>
            Өгөөж чихэр боов ХХК-ийн илгээсэн мэдэгдлийн бүртгэл
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length === 0 && (
              <p className="text-sm text-gray-500 py-6 text-center">
                Одоогоор түүх байхгүй. Push илгээсний дараа энд түр зуурын бүртгэл харагдана.
              </p>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? "bg-blue-50 border-blue-200" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority === "high" ? "Өндөр" : 
                           notification.priority === "medium" ? "Дунд" : "Бага"}
                        </Badge>
                        {!notification.read && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Шинэ
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Илгээгч: {notification.sender}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Хүлээн авагч: {notification.receiverName}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(notification.sentAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          <span>{getReceiverTypeLabel(notification.receiverType)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Badge variant="outline">
                      {notificationTypes.find(t => t.value === notification.type)?.label}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}