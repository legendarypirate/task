import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Нууцлалын бодлого — Өгөөж Чихэр Боов ХХК",
  },
  description:
    "Өгөөж Чихэр Боов ХХК-ний ажилтнуудын гар утасны апп-ын нууцлалын бодлого",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
