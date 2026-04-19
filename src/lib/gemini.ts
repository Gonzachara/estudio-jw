import { GoogleGenerativeAI, DynamicRetrievalMode } from "@google/generative-ai";

export interface Cita {
  tipo: "articulo" | "video" | "libro" | "parrafo" | "discurso" | string;
  titulo: string;
  publicacion: string;
  fecha: string;
  url: string;
  descripcion: string;
}

export interface TemaGenerado {
  titulo: string;
  descripcion: string;
  citas: Cita[];
  aplicacion: string;
  preguntas: string[];
}

export async function generarTema(
  intereses: string[],
  temasAnteriores: { titulo: string; semana: string }[]
): Promise<TemaGenerado> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY no está configurada. Copia .env.example a .env.local y agrega tu clave."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ googleSearchRetrieval: { dynamicRetrievalConfig: { mode: DynamicRetrievalMode.MODE_DYNAMIC } } }],
  });

  const interesesStr =
    intereses.length > 0
      ? intereses.join(", ")
      : "vida espiritual en pareja, fe y confianza en Jehová, amor al prójimo, familia cristiana, oración, servicio";

  const temasStr =
    temasAnteriores.length > 0
      ? temasAnteriores
          .map((t, i) => `${i + 1}. "${t.titulo}" (${t.semana})`)
          .join("\n")
      : "Ninguno todavía — es su primer estudio juntos";

  const prompt = `Eres un asistente espiritual para una pareja de Testigos de Jehová que estudia semanalmente usando jw.org.

MISIÓN: Encontrar UN tema de estudio espiritual específico, aleatorio y sorpresivo para esta semana.

INTERESES DE LA PAREJA:
${interesesStr}

TEMAS YA ESTUDIADOS (NO repetir ninguno):
${temasStr}

INSTRUCCIONES:
- Usa Google Search para buscar en jw.org contenido real y actual
- Fuentes válidas: La Atalaya, ¡Despertad!, JW Broadcasting, libros de estudio, videos del sitio oficial, programas de asambleas
- Elige el tema de manera ALEATORIA — no el primero que aparezca, sino algo genuinamente sorpresivo
- El tema debe ser práctico y aplicable a la vida de pareja como creyentes
- Incluye entre 2 y 4 citas ESPECÍFICAS de jw.org con URLs cuando existan
- El lenguaje debe ser cálido, personal y motivador

Responde ÚNICAMENTE con JSON válido (sin bloques markdown, sin texto extra):
{
  "titulo": "Título concreto del tema de estudio",
  "descripcion": "2-3 oraciones sobre el tema y su importancia espiritual para esta pareja",
  "citas": [
    {
      "tipo": "articulo|video|libro|parrafo|discurso",
      "titulo": "Título exacto del recurso",
      "publicacion": "Nombre de la publicación o canal (ej: La Atalaya, JW Broadcasting)",
      "fecha": "Año, edición o número",
      "url": "URL completa de jw.org o cadena vacía",
      "descripcion": "Qué encontrarán aquí y cómo conecta con el tema"
    }
  ],
  "aplicacion": "3-4 oraciones concretas y cálidas sobre cómo esta pareja puede vivir este tema juntos esta semana",
  "preguntas": [
    "¿Primera pregunta para reflexionar juntos?",
    "¿Segunda pregunta personal o práctica?",
    "¿Cómo pueden aplicar esto específicamente esta semana?"
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(
      "No se pudo generar el tema. Verifica tu API key e intenta nuevamente."
    );
  }

  try {
    return JSON.parse(match[0]) as TemaGenerado;
  } catch {
    throw new Error("Error al procesar la respuesta de Gemini. Intenta nuevamente.");
  }
}
