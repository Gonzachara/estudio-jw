import { prisma } from "@/lib/prisma";
import { getSemanaActual } from "@/lib/utils";
import TemaDisplay, { type TemaData } from "@/components/TemaDisplay";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const semanaActual = getSemanaActual();

  const temaActual = await prisma.tema.findUnique({
    where: { semana: semanaActual },
  });

  const temaParseado: TemaData | null = temaActual
    ? {
        ...temaActual,
        citas: JSON.parse(temaActual.citas),
        preguntas: JSON.parse(temaActual.preguntas),
        intereses: JSON.parse(temaActual.intereses),
        createdAt: temaActual.createdAt.toISOString(),
      }
    : null;

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <span className="text-2xl">📖</span>
          </div>
          <h1 className="text-2xl font-bold text-indigo-900">Estudio Semanal</h1>
          <p className="text-gray-500 text-sm mt-1">Juntos en el espíritu</p>
        </header>

        <TemaDisplay temaInicial={temaParseado} semanaActual={semanaActual} />
      </div>
    </main>
  );
}
