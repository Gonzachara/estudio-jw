"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, BookOpen, Info } from "lucide-react";

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-n-text">{label}</p>
        {description && (
          <p className="text-[11px] text-n-text3 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-n-text3 mb-2 px-1">
        {title}
      </p>
      <div className="bg-n-card rounded-xl border border-n-border divide-y divide-n-border">
        {children}
      </div>
    </div>
  );
}

export default function AjustesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-10">
        <header className="mb-8 animate-fade-in">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-n-text3 mb-1">
            Preferencias
          </p>
          <h1 className="text-2xl font-bold text-n-text">Ajustes</h1>
        </header>

        {/* Appearance */}
        <Section title="Apariencia">
          <SettingsRow label="Tema" description="Elige entre modo claro u oscuro">
            {mounted ? (
              <div className="flex gap-1 bg-n-bg border border-n-border rounded-lg p-1 flex-shrink-0">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px]
                               font-medium transition-all duration-150
                               ${theme === "light"
                                 ? "bg-n-card text-n-text shadow-sm"
                                 : "text-n-text3 hover:text-n-text2"}`}
                >
                  <Sun size={13} /> Claro
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px]
                               font-medium transition-all duration-150
                               ${theme === "dark"
                                 ? "bg-n-card text-n-text shadow-sm"
                                 : "text-n-text3 hover:text-n-text2"}`}
                >
                  <Moon size={13} /> Oscuro
                </button>
              </div>
            ) : (
              <div className="w-32 h-8 bg-n-card rounded-lg border border-n-border animate-pulse" />
            )}
          </SettingsRow>
        </Section>

        {/* About */}
        <Section title="Acerca de">
          <SettingsRow label="Aplicación">
            <div className="flex items-center gap-2 text-[12px] text-n-text3">
              <BookOpen size={13} />
              <span>Estudio JW</span>
            </div>
          </SettingsRow>
          <SettingsRow label="Descripción">
            <span className="text-[12px] text-n-text3">Adoración en familia</span>
          </SettingsRow>
          <SettingsRow label="Versión">
            <span className="text-[12px] text-n-text3">1.0.0</span>
          </SettingsRow>
        </Section>

        {/* Info */}
        <div className="flex gap-2.5 rounded-xl border border-n-border bg-n-card px-4 py-3">
          <Info size={13} className="text-n-text3 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-n-text2 leading-relaxed">
            Los temas se generan con Gemini AI buscando contenido real en jw.org,
            basados en sus intereses espirituales como pareja.
          </p>
        </div>
      </div>
    </main>
  );
}
