"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, History, Star } from "lucide-react";

const links = [
  { href: "/", label: "Inicio", icon: Heart },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/intereses", label: "Intereses", icon: Star },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-indigo-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex justify-around px-2 py-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all duration-200 ${
                active
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-indigo-400"
              }`}
            >
              <Icon
                size={21}
                className={active ? "fill-indigo-100" : ""}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
