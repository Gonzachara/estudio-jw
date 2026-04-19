import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const intereses = await prisma.interes.findMany({
      where: { activo: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(intereses);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener intereses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { nombre } = await request.json();

    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const interes = await prisma.interes.create({
      data: { nombre: nombre.trim() },
    });

    return NextResponse.json(interes);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ese interés ya está en la lista" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al agregar interés" },
      { status: 500 }
    );
  }
}
