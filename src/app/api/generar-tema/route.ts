import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarTema } from "@/lib/gemini";
import { getSemanaActual } from "@/lib/utils";

export async function POST() {
  try {
    const semanaActual = getSemanaActual();

    const temaExistente = await prisma.tema.findUnique({
      where: { semana: semanaActual },
    });

    if (temaExistente) {
      return NextResponse.json({
        tema: {
          ...temaExistente,
          citas: JSON.parse(temaExistente.citas),
          preguntas: JSON.parse(temaExistente.preguntas),
          intereses: JSON.parse(temaExistente.intereses),
          createdAt: temaExistente.createdAt.toISOString(),
        },
        yaExistia: true,
      });
    }

    const intereses = await prisma.interes.findMany({
      where: { activo: true },
    });

    const temasAnteriores = await prisma.tema.findMany({
      select: { titulo: true, semana: true },
      orderBy: { createdAt: "desc" },
    });

    const temaGenerado = await generarTema(
      intereses.map((i) => i.nombre),
      temasAnteriores
    );

    const nuevoTema = await prisma.tema.create({
      data: {
        titulo: temaGenerado.titulo,
        descripcion: temaGenerado.descripcion,
        citas: JSON.stringify(temaGenerado.citas),
        aplicacion: temaGenerado.aplicacion,
        preguntas: JSON.stringify(temaGenerado.preguntas),
        intereses: JSON.stringify(intereses.map((i) => i.nombre)),
        semana: semanaActual,
      },
    });

    return NextResponse.json({
      tema: {
        ...nuevoTema,
        citas: temaGenerado.citas,
        preguntas: temaGenerado.preguntas,
        intereses: intereses.map((i) => i.nombre),
        createdAt: nuevoTema.createdAt.toISOString(),
      },
      yaExistia: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // Log full detail to Vercel Function Logs
    console.error("[generar-tema] ERROR:", message);
    if (stack) console.error("[generar-tema] STACK:", stack);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
