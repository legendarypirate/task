import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сарын тайлан",
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
