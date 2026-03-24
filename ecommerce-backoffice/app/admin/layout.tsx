import React from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";
import { Navbar } from "@/components/admin/navbar";

export const metadata: Metadata = {
  title: "Хянах самбар",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
