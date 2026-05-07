"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface StatusCounts {
  approved: number;
  review: number;
  returned: number;
  waiting: number;
  in_progress: number;
}

interface ReportTask {
  index: number;
  id: number;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  status: string;
  status_label: string;
}

interface ReportUser {
  id: number;
  name: string;
  role: string;
  role_label: string;
  avatar_initials: string;
  avatar_color: string;
  completion_percentage: number;
  status_counts: StatusCounts;
  tasks: ReportTask[];
}

interface ReportSection {
  id: string;
  title: string;
  users: ReportUser[];
}

interface MonthlyReportData {
  year: number;
  month: number;
  month_label: string;
  sections: ReportSection[];
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "verified":
      return "bg-[#4CAF50] text-white";
    case "done":
      return "bg-[#FF9800] text-white";
    case "cancelled":
      return "bg-[#F44336] text-white";
    case "in_progress":
      return "bg-[#2196F3] text-white";
    case "pending":
    default:
      return "bg-[#9E9E9E] text-white";
  }
}

function UserCard({
  user,
  showInProgressRow,
}: {
  user: ReportUser;
  showInProgressRow: boolean;
}) {
  const c = user.status_counts;
  return (
    <article
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: user.avatar_color }}
          >
            {user.avatar_initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-neutral-900">{user.name}</p>
            <p className="text-sm text-neutral-500">{user.role_label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-neutral-900">
            {user.completion_percentage}%
          </p>
          <p className="text-xs text-neutral-500">гүйцэтгэл</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-[#4CAF50] px-2.5 py-0.5 text-xs font-medium text-white">
          Батлагдсан: {c.approved}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#FF9800] px-2.5 py-0.5 text-xs font-medium text-white">
          Хянагдаж: {c.review}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#F44336] px-2.5 py-0.5 text-xs font-medium text-white">
          Буцаагдсан: {c.returned}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#9E9E9E] px-2.5 py-0.5 text-xs font-medium text-white">
          Хүлээж: {c.waiting}
        </span>
        {showInProgressRow && (
          <span className="inline-flex items-center rounded-full bg-[#2196F3] px-2.5 py-0.5 text-xs font-medium text-white">
            Хийгдэж: {c.in_progress}
          </span>
        )}
      </div>

      {user.tasks.length === 0 ? (
        <p className="mt-6 text-center text-sm text-neutral-500">Энэ сард ажил байхгүй байна</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Гарчиг</th>
                <th className="px-3 py-2.5">Тайлбар</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Огноо</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Дуусах</th>
                <th className="px-3 py-2.5">Зураг</th>
                <th className="px-3 py-2.5">Төлөв</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {user.tasks.map((t) => (
                <tr key={t.id} className="text-neutral-800">
                  <td className="px-3 py-2.5 tabular-nums text-neutral-500">{t.index}</td>
                  <td className="px-3 py-2.5 font-medium">{t.title}</td>
                  <td className="max-w-xs px-3 py-2.5 text-neutral-600">
                    <span className="line-clamp-3">{t.description || "—"}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-neutral-600">{t.start_date ?? "—"}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-neutral-600">{t.end_date ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    {t.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(t.status)}`}
                    >
                      {t.status_label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export default function MonthlyReportPage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthInputValue = `${year}-${pad2(month)}`;

  const load = useCallback(async () => {
    if (!API_BASE) {
      setError("NEXT_PUBLIC_API_URL тохируулаагүй байна.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/task/monthly-report/${year}/${month}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Тайлан ачаалахад алдаа гарлаа");
      }
      setData(json.data as MonthlyReportData);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const onMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    const [y, m] = v.split("-").map((x) => parseInt(x, 10));
    if (Number.isFinite(y) && Number.isFinite(m)) {
      setYear(y);
      setMonth(m);
    }
  };

  const downloadCsv = () => {
    if (!data) return;
    const rows: string[][] = [];
    rows.push(["Сарын тайлан", data.month_label]);
    rows.push([]);
    for (const section of data.sections) {
      rows.push([section.title]);
      for (const u of section.users) {
        rows.push([
          "Хэрэглэгч",
          "Тушаал",
          "Гүйцэтгэл_%",
          "Батлагдсан",
          "Хянагдаж",
          "Буцаагдсан",
          "Хүлээж",
          "Хийгдэж",
        ]);
        rows.push([
          u.name,
          u.role_label,
          String(u.completion_percentage),
          String(u.status_counts.approved),
          String(u.status_counts.review),
          String(u.status_counts.returned),
          String(u.status_counts.waiting),
          String(u.status_counts.in_progress),
        ]);
        rows.push(["#", "Гарчиг", "Тайлбар", "Огноо", "Дуусах", "Зураг", "Төлөв"]);
        for (const t of u.tasks) {
          rows.push([
            String(t.index),
            t.title,
            t.description || "",
            t.start_date || "",
            t.end_date || "",
            t.image_url || "",
            t.status_label,
          ]);
        }
        rows.push([]);
      }
    }
    const text = rows.map((r) => r.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tailan-${data.year}-${pad2(data.month)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    window.print();
  };

  return (
    <div id="monthly-report-print-root" className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Сарын тайлан</h1>
          <p className="mt-1 text-neutral-600">
            {data?.month_label ??
              new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
          </p>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-600 no-print">
            <span>Сонгох:</span>
            <input
              type="month"
              value={monthInputValue}
              onChange={onMonthChange}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 shadow-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!data || loading}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            CSV татах
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!data || loading}
            className="rounded-md bg-[#1976D2] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1565C0] disabled:opacity-50"
          >
            PDF татах
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-[#1976D2]" />
        </div>
      )}
      {!loading && error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {!loading && !error && data && (
        <div className="space-y-10">
          {data.sections.map((section) => (
            <section key={section.id}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-neutral-800">
                {section.title}
              </h2>
              <div className="space-y-6">
                {section.users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    showInProgressRow={section.id === "employees"}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

    </div>
  );
}
