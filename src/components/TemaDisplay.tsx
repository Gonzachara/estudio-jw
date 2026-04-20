"use client";

import { useState } from "react";
import {
  Loader2, BookOpen, Video, Book, AlignLeft,
  Mic, ExternalLink, Users, HelpCircle, ChevronDown,
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

const TIPO_ICON: Record<string, React.ElementType> = {
  articulo: BookOpen,
  video:    Video,
  libro:    Book,
  parrafo:  AlignLeft,
  discurso: Mic,
};

function CitaRow({ cita }: { cita: Cita }) {
  const [open, setOpen] = useState(false);
  const Icon = TIPO_ICON[cita.tipo] ?? BookOpen;

  return (
    <div className="group py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        {/* Icono con indicador de tipo */}
        <div className="mt-1 flex-shrink-0 w-9 h-9 rounded-xl bg-n-card 
                        flex items-center justify-center border border-n-border
                        group-hover:border-n-accent transition-colors shadow-sm">
          <Icon size={16} className="text-n-accent" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-n-accent px-2 py-0.5 rounded-full bg-n-accent/10">
              {cita.publicacion}
            </span>
            {cita.fecha && <span className="text-[11px] text-n-text3 font-medium">{cita.fecha}</span>}
          </div>
          
          <p className="text-[15px] font-semibold text-n-text mt-1 leading-tight">
            {cita.titulo}
          </p>

          {cita.descripcion && (
            <p className="text-[13px] text-n-text2 mt-2 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
              {cita.descripcion}
            </p>
          )}

          {/* EL ENLACE FORMATO BONITO */}
          {cita.url ? (
            <a
              href={cita.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg
                         bg-n-text text-white text-[12px] font-bold
                         hover:bg-n-accent transition-all hover:shadow-md
                         active:scale-95"
            >
              <span>Estudiar recurso</span>
              <ExternalLink size={14} strokeWidth={2.5} />
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg
                            bg-n-border/30 text-n-text3 text-[12px] font-medium cursor-not-allowed">
               Referencia impresa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-n-border px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className="text-n-text3 flex-shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-n-text3">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

interface TemaDisplayProps {
  temaInicial: TemaData | null;
  semanaActual: string;
}

export default function TemaDisplay({ temaInicial, semanaActual }: TemaDisplayProps) {
  const [tema, setTema]       = useState<TemaData | null>(temaInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [yaExistia, setYaExistia] = useState(false);

  const handleGenerar = async () => {
    setCargando(true);
    setError(null);
    setYaExistia(false);

    try {
      const res  = await fetch("/api/generar-tema", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar el tema");
      setTema(data.tema);
      setYaExistia(data.yaExistia);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  /* ── Empty state ── */
  if (!tema) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-n-card border border-n-border
                        flex items-center justify-center mb-6 text-2xl">
          📖
        </div>

        <p className="text-base font-semibold text-n-text mb-1 text-center">
          ¿Listos para descubrir su tema?
        </p>
        <p className="text-sm text-n-text2 text-center mb-8 max-w-xs leading-relaxed">
          Cada semana Gemini elige una sorpresa espiritual basada en sus intereses.
        </p>

        <button
          onClick={handleGenerar}
          disabled={cargando}
          className="inline-flex items-center gap-2.5 bg-n-text text-white
                     px-7 py-3 rounded-xl text-sm font-medium tracking-wide
                     hover:opacity-90 active:scale-[0.98] transition-all duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {cargando ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Buscando en jw.org…
            </>
          ) : (
            "Hoy toca estudiar…"
          )}
        </button>

        {error && (
          <p className="mt-5 text-[13px] text-red-500 bg-red-50 dark:bg-red-900/20
                        border border-red-100 dark:border-red-800 rounded-xl
                        px-4 py-3 max-w-sm text-center leading-relaxed">
            {error}
          </p>
        )}
      </div>
    );
  }

  /* ── Topic ── */
  return (
    <div className="animate-scale-in space-y-3">
      {yaExistia && (
        <p className="text-[12px] text-n-text3 text-center">
          Ya tienes el tema de esta semana.
        </p>
      )}

      {/* Main card */}
      <div className="rounded-2xl border border-n-border bg-n-card overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-medium text-n-text3 mb-2 uppercase tracking-widest">
            Semana del {formatSemana(tema.semana)}
          </p>
          <h2 className="text-xl font-bold text-n-text leading-snug">{tema.titulo}</h2>
          <p className="text-sm text-n-text2 mt-2 leading-relaxed">{tema.descripcion}</p>
        </div>

        {/* Sources */}
        {tema.citas?.length > 0 && (
          <Section icon={BookOpen} title="Fuentes para estudiar">
            <div className="divide-y divide-n-border">
              {tema.citas.map((cita, i) => <CitaRow key={i} cita={cita} />)}
            </div>
          </Section>
        )}

        {/* Application */}
        <Section icon={Users} title="¿Cómo aplicarlo en pareja?">
          <p className="text-sm text-n-text2 leading-relaxed">{tema.aplicacion}</p>
        </Section>

        {/* Questions */}
        {tema.preguntas?.length > 0 && (
          <Section icon={HelpCircle} title="Para reflexionar juntos">
            <ol className="space-y-3">
              {tema.preguntas.map((q, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 text-[11px] font-bold text-n-accent
                                   bg-n-accent-bg w-5 h-5 rounded-full
                                   flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-n-text2 leading-relaxed">{q}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Footer */}
        {tema.intereses?.length > 0 && (
          <div className="border-t border-n-border px-5 py-3">
            <p className="text-[11px] text-n-text3">
              Basado en: {tema.intereses.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Regenerate hint */}
      <p className="text-center text-[11px] text-n-text3 pb-1">
        El próximo tema estará disponible la semana que viene.
      </p>
    </div>
  );
}
