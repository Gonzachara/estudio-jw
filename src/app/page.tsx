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
        citas:     JSON.parse(temaActual.citas),
        preguntas: JSON.parse(temaActual.preguntas),
        intereses: JSON.parse(temaActual.intereses),
        createdAt: temaActual.createdAt.toISOString(),
      }
    : null;

  return (
    <main className="min-h-[100dvh] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-10">
        {/* App header */}
        <header className="mb-8 animate-fade-in">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-n-text3 mb-1">
            Adoración en familia
          </p>
          <h1 className="text-2xl font-bold text-n-text">Estudio JW</h1>
        </header>

        <TemaDisplay temaInicial={temaParseado} semanaActual={semanaActual} />
      </div>
    </main>
  );
}
