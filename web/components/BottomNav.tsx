
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, PlusCircle, MessageSquare, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Danh mục", href: "/categories", icon: Grid },
    { name: "Đăng bán", href: "/sell", icon: PlusCircle },
    { name: "Tin nhắn", href: "/messages", icon: MessageSquare },
    { name: "Tài khoản", href: "/account", icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <Icon />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

