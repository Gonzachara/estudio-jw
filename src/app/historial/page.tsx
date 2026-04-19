import { prisma } from "@/lib/prisma";
import { formatSemana } from "@/lib/utils";
import Link from "next/link";
import { BookOpen, Calendar, ChevronRight, Inbox } from "lucide-react";
import type { Cita } from "@/components/TemaDisplay";

export const dynamic = "force-dynamic";

interface TemaConCitas {
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

const TIPO_COLOR: Record<string, string> = {
  articulo: "bg-blue-100 text-blue-700",
  video: "bg-red-100 text-red-700",
  libro: "bg-green-100 text-green-700",
  parrafo: "bg-amber-100 text-amber-700",
  discurso: "bg-purple-100 text-purple-700",
};

export default async function HistorialPage() {
  const temas = await prisma.tema.findMany({
    orderBy: { createdAt: "desc" },
  });

  const temasParseados: TemaConCitas[] = temas.map((t) => ({
    ...t,
    citas: JSON.parse(t.citas),
    preguntas: JSON.parse(t.preguntas),
    intereses: JSON.parse(t.intereses),
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-indigo-900">
            Historial de Estudios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {temasParseados.length} tema{temasParseados.length !== 1 ? "s" : ""}{" "}
            estudiado{temasParseados.length !== 1 ? "s" : ""}
          </p>
        </header>

        {temasParseados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Aún no hay temas</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">
              Generen su primer tema en la pantalla de inicio.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Ir al inicio
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {temasParseados.map((tema) => (
              <details
                key={tema.id}
                className="bg-white rounded-2xl shadow-sm border border-indigo-50 group"
              >
                <summary className="px-5 py-4 cursor-pointer list-none flex items-start gap-3 select-none">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen size={16} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">
                      {tema.titulo}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={11} />
                      {formatSemana(tema.semana)}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 flex-shrink-0 mt-1 group-open:rotate-90 transition-transform"
                  />
                </summary>

                <div className="px-5 pb-5 border-t border-gray-50 pt-3 space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tema.descripcion}
                  </p>

                  {tema.citas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Fuentes
                      </p>
                      <div className="space-y-2">
                        {tema.citas.map((cita, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2"
                          >
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5 ${
                                TIPO_COLOR[cita.tipo] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {cita.tipo}
                            </span>
                            <div>
                              <p className="text-xs font-medium text-gray-700">
                                {cita.titulo}
                              </p>
                              <p className="text-xs text-gray-400">
                                {cita.publicacion}
                                {cita.fecha ? ` · ${cita.fecha}` : ""}
                              </p>
                              {cita.url && (
                                <a
                                  href={cita.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-500 underline underline-offset-2"
                                >
                                  Ver en jw.org
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Aplicación en pareja
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {tema.aplicacion}
                    </p>
                  </div>

                  {tema.intereses.length > 0 && (
                    <p className="text-[11px] text-gray-400">
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
