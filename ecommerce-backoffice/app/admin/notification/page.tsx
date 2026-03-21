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
  User
} from "lucide-react";
import { format } from "date-fns";
import { mn } from "date-fns/locale";

// Статик өгөгдөл
const initialNotifications = [
  {
    id: 1,
    title: "Шинэ даалгавар үүссэн",
    message: "Борлуулалтын тайлан бэлтгэх даалгавар танд өгөгдлөө",
    type: "task",
    priority: "high",
    sender: "А.Бат",
    receiverType: "individual",
    receiverName: "Ц.Энхжин",
    sentAt: "2024-01-15T10:30:00",
    read: true,
    status: "sent"
  },
  {
    id: 2,
    title: "Чухал мэдэгдэл",
    message: "Энэ сарын уулзалт 15-ны өдөр 14:00 цагт болно",
    type: "announcement",
    priority: "high",
    sender: "Удирдлагын газар",
    receiverType: "all",
    receiverName: "Бүх ажилчид",
    sentAt: "2024-01-14T09:15:00",
    read: true,
    status: "sent"
  },
  {
    id: 3,
    title: "Дуусах хугацаа ойртлоо",
    message: "Төсөв төлөвлөлтийн даалгавар 2 хоног үлдлээ",
    type: "reminder",
    priority: "medium",
    sender: "Систем",
    receiverType: "group",
    receiverName: "Санхүүгийн баг",
    sentAt: "2024-01-14T15:45:00",
    read: false,
    status: "sent"
  },
  {
    id: 4,
    title: "Ажлын байранд анхааруулга",
    message: "Маргааш цахилгаан тасалдалтай байна, урьдчилан бэлдэх",
    type: "warning",
    priority: "high",
    sender: "Техник технологийн хэлтэс",
    receiverType: "department",
    receiverName: "Бүх хэлтэс",
    sentAt: "2024-01-13T16:20:00",
    read: true,
    status: "sent"
  },
  {
    id: 5,
    title: "Баяр хүргэе",
    message: "Тайзны ажилтны 5 жилийн ойд баяр хүргэе",
    type: "congrats",
    priority: "low",
    sender: "Хүний нөөцийн хэлтэс",
    receiverType: "individual",
    receiverName: "Б.Гэрэлмаа",
    sentAt: "2024-01-12T11:00:00",
    read: false,
    status: "sent"
  },
  {
    id: 6,
    title: "Сургалтын мэдээлэл",
    message: "Шинэ програм хангамжийн сургалт эхэлж байна",
    type: "training",
    priority: "medium",
    sender: "Сургалтын хэлтэс",
    receiverType: "selected",
    receiverName: "Сонгогдсон 10 ажилтан",
    sentAt: "2024-01-11T13:30:00",
    read: true,
    status: "sent"
  },
];

// Хэрэглэгчийн статик жагсаалт
const users = [
  { id: 1, name: "Ц.Энхжин", role: "Ахлах мэргэжилтэн", department: "Борлуулалт" },
  { id: 2, name: "Б.Гэрэлмаа", role: "Тайзны ажилтан", department: "Үйлдвэрлэл" },
  { id: 3, name: "А.Бат", role: "Менежер", department: "Борлуулалт" },
  { id: 4, name: "Д.Сүхбат", role: "Программист", department: "IT" },
  { id: 5, name: "Ц.Ариунзаяа", role: "Санхүүчи", department: "Санхүү" },
  { id: 6, name: "Б.Энхтайван", role: "Ахлах инженер", department: "Техник" },
  { id: 7, name: "Г.Отгонцэцэг", role: "Маркетингийн мэргэжилтэн", department: "Маркетинг" },
  { id: 8, name: "Л.Хүслэн", role: "Агуулахын ажилтан", department: "Логистик" },
];

// Мэдэгдлийн төрлүүд
const notificationTypes = [
  { value: "announcement", label: "Ерөнхий мэдэгдэл" },
  { value: "task", label: "Даалгавар" },
  { value: "reminder", label: "Сануулга" },
  { value: "warning", label: "Анхааруулга" },
  { value: "congrats", label: "Баяр хүргэлт" },
  { value: "training", label: "Сургалт" },
];

// Хүлээн авагчийн төрлүүд
const receiverTypes = [
  { value: "all", label: "Бүх ажилчид", icon: <Users className="h-4 w-4" /> },
  { value: "department", label: "Тодорхой хэлтэс", icon: <Users className="h-4 w-4" /> },
  { value: "group", label: "Баг", icon: <Users className="h-4 w-4" /> },
  { value: "individual", label: "Хувь хүн", icon: <User className="h-4 w-4" /> },
  { value: "selected", label: "Сонгосон хүмүүс", icon: <User className="h-4 w-4" /> },
];

// Хүрээтэй тэргүүн зэргийн жагсаалт
const priorities = [
  { value: "low", label: "Бага", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Дунд", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Өндөр", color: "bg-red-100 text-red-800" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showSendForm, setShowSendForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Шинэ мэдэгдлийн form state
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "announcement",
    priority: "medium",
    receiverType: "all",
    selectedUsers: [] as number[],
  });

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

  // Мэдэгдэл илгээх
  const handleSendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      toast.error("Гарчиг болон мессежээ бөглөнө үү");
      return;
    }

    setLoading(true);
    
    try {
      // Firebase руу илгээх логик (static төлөвт зориулж загварчлав)
      const firebaseResponse = {
        success: true,
        messageId: `msg_${Date.now()}`,
        recipients: newNotification.receiverType === "all" ? users.length : newNotification.selectedUsers.length
      };

      if (firebaseResponse.success) {
        // Шинэ мэдэгдэл нэмэх
        const newNotif = {
          id: notifications.length + 1,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          priority: newNotification.priority,
          sender: "Та (Систем администратор)",
          receiverType: newNotification.receiverType,
          receiverName: getReceiverName(newNotification.receiverType, newNotification.selectedUsers),
          sentAt: new Date().toISOString(),
          read: false,
          status: "sent"
        };

        setNotifications(prev => [newNotif, ...prev]);
        
        // Форм цэвэрлэх
        setNewNotification({
          title: "",
          message: "",
          type: "announcement",
          priority: "medium",
          receiverType: "all",
          selectedUsers: [],
        });
        
        setShowSendForm(false);
        
        toast.success(
          `Мэдэгдэл амжилттай илгээгдлээ. ${firebaseResponse.recipients} хүлээн авагчид хүргэгдлээ.`
        );
      }
    } catch (error) {
      console.error("Мэдэгдэл илгээхэд алдаа гарлаа:", error);
      toast.error("Мэдэгдэл илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Хүлээн авагчийн нэрийг үүсгэх
  const getReceiverName = (type: string, selectedIds: number[]) => {
    switch (type) {
      case "all":
        return "Бүх ажилчид";
      case "individual":
        const user = users.find(u => u.id === selectedIds[0]);
        return user ? user.name : "Хувь хүн";
      case "selected":
        return `${selectedIds.length} сонгогдсон ажилтан`;
      default:
        return type;
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

  // Хүлээн авагчийн төрлийн нэр
  const getReceiverTypeLabel = (type: string) => {
    const typeObj = receiverTypes.find(t => t.value === type);
    return typeObj?.label || type;
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
                Firebase ашиглан ажилчдад мэдэгдэл илгээх
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Хүлээн авагчид
                </label>
                <select
                  value={newNotification.receiverType}
                  onChange={(e) => setNewNotification(prev => ({
                    ...prev,
                    receiverType: e.target.value,
                    selectedUsers: e.target.value === "individual" ? [] : prev.selectedUsers
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {receiverTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {(newNotification.receiverType === "individual" || newNotification.receiverType === "selected") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {newNotification.receiverType === "individual" ? "Хүлээн авагч" : "Сонгох ажилчид"}
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center gap-2">
                        <input
                          type={newNotification.receiverType === "individual" ? "radio" : "checkbox"}
                          id={`user-${user.id}`}
                          checked={newNotification.selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (newNotification.receiverType === "individual") {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedUsers: e.target.checked ? [user.id] : []
                              }));
                            } else {
                              setNewNotification(prev => ({
                                ...prev,
                                selectedUsers: e.target.checked
                                  ? [...prev.selectedUsers, user.id]
                                  : prev.selectedUsers.filter(id => id !== user.id)
                              }));
                            }
                          }}
                        />
                        <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.role} - {user.department}</div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

// X icon компонент нэмэх
const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);