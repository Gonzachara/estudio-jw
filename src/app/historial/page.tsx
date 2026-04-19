import { prisma } from "@/lib/prisma";
import { formatSemana } from "@/lib/utils";
import Link from "next/link";
import { BookOpen, ChevronRight, Inbox, ExternalLink } from "lucide-react";
import type { Cita } from "@/components/TemaDisplay";

export const dynamic = "force-dynamic";

interface TemaRow {
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

export default async function HistorialPage() {
  const raw = await prisma.tema.findMany({ orderBy: { createdAt: "desc" } });

  const temas: TemaRow[] = raw.map((t) => ({
    ...t,
    citas:     JSON.parse(t.citas),
    preguntas: JSON.parse(t.preguntas),
    intereses: JSON.parse(t.intereses),
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-10">
        <header className="mb-8 animate-fade-in">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-n-text3 mb-1">
            {temas.length} tema{temas.length !== 1 ? "s" : ""} estudiado{temas.length !== 1 ? "s" : ""}
          </p>
          <h1 className="text-2xl font-bold text-n-text">Historial</h1>
        </header>

        {temas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center
                          animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-n-card border border-n-border
                            flex items-center justify-center mb-5">
              <Inbox size={22} className="text-n-text3" />
            </div>
            <p className="text-sm font-medium text-n-text mb-1">Sin historial aún</p>
            <p className="text-sm text-n-text2 mb-6">Genera su primer tema desde el inicio.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium
                         text-n-accent hover:underline underline-offset-2"
            >
              Ir al inicio <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2 animate-slide-up">
            {temas.map((tema) => (
              <details
                key={tema.id}
                className="group rounded-xl border border-n-border bg-n-card"
              >
                <summary className="list-none cursor-pointer select-none
                                    flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-n-bg border border-n-border
                                  flex items-center justify-center flex-shrink-0">
                    <BookOpen size={13} className="text-n-text2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-n-text leading-snug truncate">
                      {tema.titulo}
                    </p>
                    <p className="text-[11px] text-n-text3 mt-0.5">
                      {formatSemana(tema.semana)}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-n-text3 flex-shrink-0
                               group-open:rotate-90 transition-transform duration-200"
                  />
                </summary>

                <div className="px-4 pb-4 pt-1 border-t border-n-border space-y-4
                                animate-fade-in">
                  <p className="text-sm text-n-text2 leading-relaxed">{tema.descripcion}</p>

                  {tema.citas.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest
                                    text-n-text3 mb-2">
                        Fuentes
                      </p>
                      <div className="space-y-2">
                        {tema.citas.map((c, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5 text-[10px] font-medium
                                             px-1.5 py-0.5 rounded bg-n-accent-bg text-n-accent">
                              {c.tipo}
                            </span>
                            <div>
                              <p className="text-[12px] font-medium text-n-text">{c.titulo}</p>
                              <p className="text-[11px] text-n-text3">
                                {c.publicacion}{c.fecha ? ` · ${c.fecha}` : ""}
                              </p>
                              {c.url && (
                                <a
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[11px]
                                             text-n-accent hover:underline underline-offset-2 mt-0.5"
                                >
                                  jw.org <ExternalLink size={9} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest
                                  text-n-text3 mb-1.5">
                      Aplicación en pareja
                    </p>
                    <p className="text-[12px] text-n-text2 leading-relaxed">{tema.aplicacion}</p>
                  </div>

                  {tema.intereses.length > 0 && (
                    <p className="text-[11px] text-n-text3">
                      Basado en: {tema.intereses.join(", ")}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
