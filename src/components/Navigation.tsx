"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, Star, Settings } from "lucide-react";

const LINKS = [
  { href: "/",          label: "Inicio",     icon: Home     },
  { href: "/historial", label: "Historial",  icon: Clock    },
  { href: "/intereses", label: "Intereses",  icon: Star     },
  { href: "/ajustes",   label: "Ajustes",    icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb
                    bg-n-bg border-t border-n-border">
      <div className="max-w-lg mx-auto flex justify-around px-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl
                          transition-colors duration-150 min-w-0
                          ${active
                            ? "text-n-accent"
                            : "text-n-text3 hover:text-n-text2"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
