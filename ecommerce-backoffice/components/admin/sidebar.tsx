"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Settings, Clock,Calendar,} from "lucide-react";

const links = [
  { href: "/admin", label: "Хянах самбар", icon: Home },
  { href: "/admin/users", label: "Хэрэглэгч", icon: Users },
  // { href: "/admin/tasks", label: "Үүрэг даалгаврууд", icon: Calendar },
  { href: "/admin/frequence", label: "Давтамжит ажлууд", icon: Settings },
    { href: "/admin/tasklist", label: "Жагсаалтаар", icon: Settings },

  { href: "/admin/notification", label: "Мэдэгдэлүүд", icon: Clock },

];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background border-r p-4 flex flex-col">
      <h1 className="text-lg font-bold mb-6">Админ самбар</h1>
      <nav className="flex flex-col gap-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition",
              pathname === href ? "bg-muted text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
