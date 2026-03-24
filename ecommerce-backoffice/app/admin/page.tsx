"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

type DashboardPayload = {
  users_total: number;
  users_active: number;
  new_users_this_month: number;
  active_tasks: number;
  completion_rate_pct: number;
  avg_completion_days: number | null;
  verified_among_finished_pct: number;
  month_over_month_pct: number;
  tasks_created_today: number;
  tasks_completed_today: number;
  tasks_due_soon: number;
  completed_this_month: number;
  top_worker: {
    id: number;
    full_name: string;
    completed_tasks: number;
    share_of_month_pct: number;
  } | null;
};

type StatsResponse = {
  success: boolean;
  data?: {
    total: number;
    pending: number;
    in_progress: number;
    done: number;
    verified: number;
    cancelled: number;
    dashboard: DashboardPayload;
  };
  message?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dash, setDash] = useState<DashboardPayload | null>(null);
  const [taskTotals, setTaskTotals] = useState<{
    total: number;
    pending: number;
    in_progress: number;
    done: number;
    verified: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!API) {
        setError("NEXT_PUBLIC_API_URL тохируулаагүй байна.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API}/api/task/stats`, { cache: "no-store" });
        const json: StatsResponse = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success || !json.data?.dashboard) {
          setError(json.message ?? "Статистик ачаалахад алдаа гарлаа.");
          setLoading(false);
          return;
        }
        setDash(json.data.dashboard);
        setTaskTotals({
          total: json.data.total,
          pending: json.data.pending,
          in_progress: json.data.in_progress,
          done: json.data.done,
          verified: json.data.verified,
        });
      } catch {
        if (!cancelled) setError("Серверт холбогдож чадсангүй.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Мэдээлэл татаж байна…</p>
      </div>
    );
  }

  if (error || !dash) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">{error ?? "Өгөгдөл байхгүй."}</p>
      </div>
    );
  }

  const stats = [
    {
      title: "Нийт ажилчид",
      value: `${dash.users_active} идэвхтэй`,
      icon: Users,
      description: `Бүртгэлтэй нийт ${dash.users_total} хүн`,
      trend:
        dash.new_users_this_month > 0
          ? `+${dash.new_users_this_month} энэ сар`
          : "Шинэ бүртгэлгүй",
      color: "blue" as const,
    },
    {
      title: "Идэвхтэй даалгавар",
      value: `${dash.active_tasks} ширхэг`,
      icon: ClipboardList,
      description: `Хүлээгдэж буй ${taskTotals?.pending ?? "—"} · Хийгдэж буй ${taskTotals?.in_progress ?? "—"}`,
      trend: `Нийт ${taskTotals?.total ?? "—"}`,
      color: "green" as const,
    },
    {
      title: "Дууссан харьцаа",
      value: `${dash.completion_rate_pct}%`,
      icon: CheckCircle2,
      description: `Дууссан + баталгаажсан / бүх даалгавар`,
      trend: `Дууссан ${taskTotals?.done ?? 0} · Баталгаажсан ${taskTotals?.verified ?? 0}`,
      color: "emerald" as const,
      progressWidth: Math.min(100, Math.max(0, dash.completion_rate_pct)),
    },
    {
      title: "Дундаж дуусах хугацаа",
      value:
        dash.avg_completion_days != null
          ? `${dash.avg_completion_days} хоног`
          : "—",
      icon: Clock,
      description:
        dash.avg_completion_days != null
          ? "Дууссан огноо бүртгэгдсэн даалгавруудаас тооцсон"
          : "Дууссан огноо хангалтгүй",
      trend:
        dash.avg_completion_days != null && dash.avg_completion_days <= 3
          ? "Түргэн"
          : dash.avg_completion_days != null
            ? "Ажиглах"
            : "",
      trendUp: dash.avg_completion_days != null && dash.avg_completion_days <= 3,
      color: "orange" as const,
    },
    {
      title: "Баталгаажуулалт",
      value: `${dash.verified_among_finished_pct}%`,
      icon: Award,
      description: "Дууссан даалгавруудаас баталгаажсан хувь",
      trend:
        (taskTotals?.done ?? 0) + (taskTotals?.verified ?? 0) > 0
          ? `${taskTotals?.verified ?? 0} баталгаажсан`
          : "Дата байхгүй",
      color: "purple" as const,
    },
    {
      title: "Сарын өсөлт",
      value: `${dash.month_over_month_pct > 0 ? "+" : ""}${dash.month_over_month_pct}%`,
      icon: TrendingUp,
      description: "Дууссан даалгавар (өмнөх сартай харьцуулбал)",
      trend: `Энэ сар ${dash.completed_this_month} дууссан`,
      color: "red" as const,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
      orange: "bg-orange-50 border-orange-200 text-orange-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      red: "bg-red-50 border-red-200 text-red-700",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendColor = (trend: string, trendUp?: boolean) => {
    if (!trend) return "text-gray-500";
    if (trend === "Ажиглах" || trend === "Түргэн") {
      return trendUp ? "text-green-600" : "text-amber-600";
    }
    if (trend.startsWith("+")) return "text-green-600";
    if (trend.startsWith("-")) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Системийн тойм</h1>
        <p className="text-gray-600">
          Өгөгдлийн санаас шинэчлэгдсэн мэдээлэл
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          const progressWidth =
            "progressWidth" in stat ? stat.progressWidth : undefined;
          return (
            <Card
              key={index}
              className={`cursor-pointer border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${getColorClasses(stat.color)}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${getColorClasses(stat.color)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-600">{stat.description}</p>
                  {stat.trend ? (
                    <span
                      className={`text-xs font-semibold ${getTrendColor(stat.trend, "trendUp" in stat ? stat.trendUp : undefined)}`}
                    >
                      {stat.trend}
                    </span>
                  ) : null}
                </div>
                {progressWidth != null && (
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Сарын шилдэг ажилтан
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dash.top_worker ? (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  {initials(dash.top_worker.full_name)}
                </div>
                <div>
                  <h3 className="font-semibold">{dash.top_worker.full_name}</h3>
                  <p className="text-sm text-gray-600">
                    Энэ сар дуусгасан: {dash.top_worker.completed_tasks}
                  </p>
                  <p className="text-xs font-medium text-blue-600">
                    Сарын дууссалтын {dash.top_worker.share_of_month_pct}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Энэ сар дууссан даалгаварт томилогдсон ажилтан олдсонгүй.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Өнөөдрийн тойм
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Шинэ даалгавар:</span>
                <span className="font-semibold text-green-600">
                  {dash.tasks_created_today} ширхэг
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Дуусах дөхсөн (3 хоног):</span>
                <span className="font-semibold text-orange-600">
                  {dash.tasks_due_soon} ширхэг
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Өнөөдөр дууссан:</span>
                <span className="font-semibold text-blue-600">
                  {dash.tasks_completed_today} ширхэг
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Түргэн үйлдлүүд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link
              href="/admin/users"
              className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
            >
              <Users className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium">Ажилчид</span>
            </Link>
            <Link
              href="/admin/tasks"
              className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-green-500 hover:bg-green-50"
            >
              <ClipboardList className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium">Даалгавар (канбан)</span>
            </Link>
            <Link
              href="/admin/tasklist"
              className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-purple-500 hover:bg-purple-50"
            >
              <TrendingUp className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium">Жагсаалт / тайлан</span>
            </Link>
            <Link
              href="/admin/frequence"
              className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center transition-colors hover:border-orange-500 hover:bg-orange-50"
            >
              <Award className="mx-auto mb-2 h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium">Давтамж</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
