"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Star, Loader2, Lightbulb } from "lucide-react";

interface Interes {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
}

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
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/intereses")
      .then((r) => r.json())
      .then((data) => {
        setIntereses(data);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  const agregar = async (nombre?: string) => {
    const valor = (nombre ?? nuevo).trim();
    if (!valor) return;

    setGuardando(true);
    setError(null);

    try {
      const res = await fetch("/api/intereses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: valor }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error al agregar");

      setIntereses((prev) => [...prev, data]);
      setNuevo("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    try {
      const res = await fetch(`/api/intereses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setIntereses((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Error al eliminar el interés");
    }
  };

  const sugerenciasDisponibles = SUGERENCIAS.filter(
    (s) => !intereses.some((i) => i.nombre.toLowerCase() === s.toLowerCase())
  );

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-900">Sus Intereses</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gemini los usará para elegir temas de estudio relevantes para ustedes.
          </p>
        </header>

        {/* Input para agregar */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-4 mb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregar()}
              placeholder="Agregar un interés..."
              className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-gray-300"
            />
            <button
              onClick={() => agregar()}
              disabled={guardando || !nuevo.trim()}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Agregar
            </button>
          </div>

          {error && (
            <p className="text-red-600 text-xs mt-2 px-1">{error}</p>
          )}
        </div>

        {/* Lista de intereses actuales */}
        {cargando ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
          </div>
        ) : intereses.length === 0 ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-4">
            <div className="flex items-start gap-3">
              <Lightbulb size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">
                Sin intereses, Gemini usará temas generales de la vida espiritual en pareja.
                ¡Agrega algunos para temas más personalizados!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 divide-y divide-gray-50 mb-4">
            {intereses.map((interes) => (
              <div
                key={interes.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Star
                  size={14}
                  className="text-indigo-400 flex-shrink-0 fill-indigo-100"
                />
                <span className="flex-1 text-sm text-gray-800">
                  {interes.nombre}
                </span>
                <button
                  onClick={() => eliminar(interes.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sugerencias */}
        {sugerenciasDisponibles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Sugerencias
            </p>
            <div className="flex flex-wrap gap-2">
              {sugerenciasDisponibles.map((s) => (
                <button
                  key={s}
                  onClick={() => agregar(s)}
                  disabled={guardando}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <Plus size={11} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
