"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Loader2, Info } from "lucide-react";

interface Interes { id: number; nombre: string; activo: boolean; createdAt: string }

const SUGERENCIAS = [
  "vida espiritual en pareja",
  "fe y confianza en Jehová",
  "comunicación en el matrimonio",
  "resistir las presiones del mundo",
  "familia cristiana",
  "oración y meditación",
  "amor al prójimo",
  "servicio de campo",
  "reuniones de la congregación",
  "esperanza en el nuevo mundo",
  "gratitud hacia Jehová",
  "perdón y reconciliación",
];

export default function InteresesPage() {
  const [intereses, setIntereses] = useState<Interes[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [nuevo, setNuevo]         = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/intereses")
      .then((r) => r.json())
      .then((d) => { setIntereses(d); setCargando(false); })
      .catch(() => setCargando(false));
  }, []);

  const agregar = async (nombre?: string) => {
    const valor = (nombre ?? nuevo).trim();
    if (!valor) return;
    setGuardando(true); setError(null);
    try {
      const res  = await fetch("/api/intereses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: valor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setIntereses((p) => [...p, data]);
      setNuevo("");
      inputRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    const res = await fetch(`/api/intereses/${id}`, { method: "DELETE" });
    if (res.ok) setIntereses((p) => p.filter((i) => i.id !== id));
  };

  const disponibles = SUGERENCIAS.filter(
    (s) => !intereses.some((i) => i.nombre.toLowerCase() === s.toLowerCase())
  );

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-10">
        <header className="mb-8 animate-fade-in">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-n-text3 mb-1">
            Personalización
          </p>
          <h1 className="text-2xl font-bold text-n-text">Intereses</h1>
        </header>

        {/* Info */}
        <div className="flex gap-2.5 bg-n-accent-bg border border-n-border rounded-xl
                        px-4 py-3 mb-5 animate-fade-in">
          <Info size={14} className="text-n-accent flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-n-text2 leading-relaxed">
            Gemini usará estos intereses para elegir temas sorpresivos cada semana.
          </p>
        </div>

        {/* Input */}
        <div className="bg-n-card rounded-xl border border-n-border p-3 mb-4 animate-fade-in">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregar()}
              placeholder="Agregar un interés…"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-n-border
                         bg-n-bg text-n-text placeholder:text-n-text3
                         focus:outline-none focus:ring-1 focus:ring-n-accent
                         focus:border-n-accent transition-colors"
            />
            <button
              onClick={() => agregar()}
              disabled={guardando || !nuevo.trim()}
              className="inline-flex items-center gap-1.5 bg-n-text text-white
                         px-3.5 py-2 rounded-lg text-sm font-medium
                         hover:opacity-90 transition-opacity
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Agregar
            </button>
          </div>
          {error && <p className="text-[12px] text-red-500 mt-2 px-1">{error}</p>}
        </div>

        {/* Current interests */}
        {cargando ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-n-text3" />
          </div>
        ) : intereses.length > 0 ? (
          <div className="bg-n-card rounded-xl border border-n-border
                          divide-y divide-n-border mb-4 animate-slide-up">
            {intereses.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-sm text-n-text">{item.nombre}</span>
                <button
                  onClick={() => eliminar(item.id)}
                  className="p-1 rounded-md text-n-text3 hover:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-n-text3 text-center py-4 mb-4">
            Sin intereses — agrega algunos o usa las sugerencias.
          </p>
        )}

        {/* Suggestions */}
        {disponibles.length > 0 && (
          <div className="animate-fade-in">
            <p className="text-[10px] font-semibold uppercase tracking-widest
                          text-n-text3 mb-2.5">
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-2">
              {disponibles.map((s) => (
                <button
                  key={s}
                  onClick={() => agregar(s)}
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5
                             rounded-full border border-n-border bg-n-card text-n-text2
                             hover:border-n-accent hover:text-n-accent
                             transition-colors disabled:opacity-40"
                >
                  <Plus size={10} /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
