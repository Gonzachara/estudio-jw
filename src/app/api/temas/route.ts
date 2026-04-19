import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const temas = await prisma.tema.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      temas.map((t) => ({
        ...t,
        citas: JSON.parse(t.citas),
        preguntas: JSON.parse(t.preguntas),
        intereses: JSON.parse(t.intereses),
        createdAt: t.createdAt.toISOString(),
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Error al obtener los temas" },
      { status: 500 }
    );
  }
}
