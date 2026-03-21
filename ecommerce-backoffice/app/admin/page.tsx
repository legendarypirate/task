import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CheckCircle2, TrendingUp, Clock, Award } from "lucide-react";

export default function AdminHome() {
  const stats = [
    {
      title: "Нийт ажилчид",
      value: "128 хүн",
      icon: Users,
      description: "Идэвхтэй бүртгэлтэй",
      trend: "+12%",
      color: "blue"
    },
    {
      title: "Идэвхтэй үүрэг даалгаварууд",
      value: "52 ширхэг",
      icon: ClipboardList,
      description: "Одоо хийгдэж байгаа",
      trend: "+5 шинэ",
      color: "green"
    },
    {
      title: "Амжилттай дуууссан",
      value: "78%",
      icon: CheckCircle2,
      description: "Энэ сарын гүйцэтгэл",
      trend: "+8%",
      color: "emerald"
    },
    {
      title: "Дундаж хариу үйлдэл",
      value: "2.4 хоног",
      icon: Clock,
      description: "Даалгавар бүрт",
      trend: "-0.3 хоног",
      color: "orange"
    },
    {
      title: "Чанартай үнэлгээ",
      value: "4.8/5.0",
      icon: Award,
      description: "Хэрэглэгчийн сэтгэл ханамж",
      trend: "+0.2",
      color: "purple"
    },
    {
      title: "Өсөлтийн түвшин",
      value: "24%",
      icon: TrendingUp,
      description: "Өмнөх сараас",
      trend: "+6%",
      color: "red"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      red: "bg-red-50 border-red-200 text-red-700"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendColor = (trend: string) => {
    return trend.includes('+') ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Системийн тойм</h1>
        <p className="text-gray-600">Бүх үйл ажиллагааны шинэчлэгдсэн мэдээлэл</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card 
              key={index} 
              className={`border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${getColorClasses(stat.color)}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${getColorClasses(stat.color)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">
                    {stat.description}
                  </p>
                  <span className={`text-xs font-semibold ${getTrendColor(stat.trend)}`}>
                    {stat.trend}
                  </span>
                </div>
                {/* Progress bar for completion rate */}
                {stat.title.includes("Амжилттай") && (
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: '78%' }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Сарын шилдэг ажилтан
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                ББ
              </div>
              <div>
                <h3 className="font-semibold">Бат-Эрдэнэ</h3>
                <p className="text-sm text-gray-600">Гүйцэтгэл: 94%</p>
                <p className="text-xs text-blue-600 font-medium">+12 даалгавар</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Өнөөдрийн урьдчилсан мэдээ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Шинэ даалгавар:</span>
                <span className="font-semibold text-green-600">8 ширхэг</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Дуусах дөхсөн:</span>
                <span className="font-semibold text-orange-600">5 ширхэг</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Дууссан:</span>
                <span className="font-semibold text-blue-600">12 ширхэг</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Түргэн үйлдлүүд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <span className="text-sm font-medium">Ажилтан нэмэх</span>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
              <ClipboardList className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <span className="text-sm font-medium">Даалгавар үүсгэх</span>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <span className="text-sm font-medium">Тайлан үзэх</span>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center">
              <Award className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <span className="text-sm font-medium">Үнэлгээ өгөх</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}