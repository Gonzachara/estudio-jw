"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  BookOpen,
  Video,
  Book,
  AlignLeft,
  Mic,
  ExternalLink,
  MessageCircle,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatSemana } from "@/lib/utils";

export interface Cita {
  tipo: string;
  titulo: string;
  publicacion: string;
  fecha: string;
  url: string;
  descripcion: string;
}

export interface TemaData {
  id: number;
  titulo: string;
  descripcion: string;
  citas: Cita[];
  aplicacion: string;
  preguntas: string[];
  intereses: string[];
  semana: string;
  createdAt: string;
}

const TIPO_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  articulo: {
    icon: BookOpen,
    color: "bg-blue-50 text-blue-700 border-blue-100",
    label: "Artículo",
  },
  video: {
    icon: Video,
    color: "bg-red-50 text-red-700 border-red-100",
    label: "Video",
  },
  libro: {
    icon: Book,
    color: "bg-green-50 text-green-700 border-green-100",
    label: "Libro",
  },
  parrafo: {
    icon: AlignLeft,
    color: "bg-amber-50 text-amber-700 border-amber-100",
    label: "Párrafo",
  },
  discurso: {
    icon: Mic,
    color: "bg-purple-50 text-purple-700 border-purple-100",
    label: "Discurso",
  },
};

function CitaCard({ cita }: { cita: Cita }) {
  const [expanded, setExpanded] = useState(false);
  const config = TIPO_CONFIG[cita.tipo] ?? TIPO_CONFIG.articulo;
  const Icon = config.icon;

  return (
    <div className={`border rounded-xl p-4 ${config.color} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {config.label}
            </span>
            {cita.fecha && (
              <span className="text-[10px] opacity-60">{cita.fecha}</span>
            )}
          </div>
          <p className="font-semibold text-sm leading-snug">{cita.titulo}</p>
          <p className="text-xs opacity-80 mt-0.5">{cita.publicacion}</p>

          {cita.descripcion && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs mt-2 opacity-70 hover:opacity-100 transition-opacity"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Ocultar detalle" : "Ver detalle"}
              </button>
              {expanded && (
                <p className="text-xs mt-2 opacity-80 leading-relaxed">
                  {cita.descripcion}
                </p>
              )}
            </>
          )}

          {cita.url && (
            <a
              href={cita.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs mt-2 underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              Abrir en jw.org
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface TemaDisplayProps {
  temaInicial: TemaData | null;
  semanaActual: string;
}

export default function TemaDisplay({
  temaInicial,
  semanaActual,
}: TemaDisplayProps) {
  const [tema, setTema] = useState<TemaData | null>(temaInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExtra, setMensajeExtra] = useState<string | null>(null);

  const mensajesCarga = [
    "Buscando en jw.org...",
    "Explorando publicaciones espirituales...",
    "Eligiendo un tema sorpresivo...",
    "Preparando sus citas...",
  ];
  const [mensajeCarga] = useState(
    mensajesCarga[Math.floor(Math.random() * mensajesCarga.length)]
  );

  const handleGenerar = async () => {
    setCargando(true);
    setError(null);
    setMensajeExtra(null);

    try {
      const res = await fetch("/api/generar-tema", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error al generar el tema");

      setTema(data.tema);
      if (data.yaExistia) {
        setMensajeExtra("Ya tenían su tema para esta semana.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  if (!tema) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-xl font-semibold text-indigo-900 mb-2 text-center">
          ¿Listos para descubrir su tema de esta semana?
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8 max-w-xs">
          Gemini buscará en jw.org algo especial basado en sus intereses
          espirituales.
        </p>

        <button
          onClick={handleGenerar}
          disabled={cargando}
          className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {cargando ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>{mensajeCarga}</span>
            </>
          ) : (
            <>
              <Sparkles
                size={20}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
              <span>Hoy toca estudiar…</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-5 bg-red-50 border border-red-100 text-red-700 rounded-xl px-5 py-3 text-sm max-w-sm text-center">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {mensajeExtra && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl px-4 py-2 text-sm text-center">
          {mensajeExtra}
        </div>
      )}

      {/* Tema principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
          <p className="text-indigo-200 text-xs font-medium mb-1">
            Semana del {formatSemana(tema.semana)}
          </p>
          <h2 className="text-white text-xl font-bold leading-snug">
            {tema.titulo}
          </h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {tema.descripcion}
          </p>
        </div>
      </div>

      {/* Citas */}
      {tema.citas && tema.citas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-indigo-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              Fuentes para estudiar
            </h3>
          </div>
          <div className="space-y-3">
            {tema.citas.map((cita, i) => (
              <CitaCard key={i} cita={cita} />
            ))}
          </div>
        </div>
      )}

      {/* Aplicación para la pareja */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-purple-600" />
          <h3 className="font-semibold text-gray-900 text-sm">
            ¿Cómo aplicarlo en pareja?
          </h3>
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{tema.aplicacion}</p>
      </div>

      {/* Preguntas de reflexión */}
      {tema.preguntas && tema.preguntas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-amber-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              Preguntas para reflexionar
            </h3>
          </div>
          <ol className="space-y-3">
            {tema.preguntas.map((pregunta, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 text-amber-700 text-xs font-bold flex items-center justify-center border border-amber-100">
                  {i + 1}
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {pregunta}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Intereses usados */}
      {tema.intereses && tema.intereses.length > 0 && (
        <div className="px-1">
          <p className="text-xs text-gray-400 text-center">
            Basado en:{" "}
            <span className="text-gray-500">{tema.intereses.join(", ")}</span>
          </p>
        </div>
      )}
    </div>
  );
}
