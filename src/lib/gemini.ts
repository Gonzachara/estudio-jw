import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Ordered by reliability and free-tier quota generosity (updated April 2026)
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function parseRetryDelay(msg: string): number {
  const m = msg.match(/retryDelay['":\s]+(\d+)/);
  return m ? Math.min(parseInt(m[1]) * 1000, 10_000) : 4_000;
}

function isQuotaError(msg: string) {
  return msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests");
}

function isNotFoundError(msg: string) {
  return msg.includes("404") || msg.includes("not found") || msg.includes("not supported");
}

export async function generarTema(
  intereses: string[],
  temasAnteriores: { titulo: string; semana: string }[]
): Promise<TemaGenerado> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const interesesStr =
    intereses.length > 0
      ? intereses.join(", ")
      : "vida espiritual en pareja, fe y confianza en Jehová, amor al prójimo, familia cristiana, oración, servicio";

  const temasStr =
    temasAnteriores.length > 0
      ? temasAnteriores.map((t, i) => `${i + 1}. "${t.titulo}"`).join("\n")
      : "Ninguno todavía — es su primer estudio juntos";

  const prompt = `Eres un asistente espiritual para una pareja de Testigos de Jehová que estudia semanalmente usando jw.org.

MISIÓN: Generar UN tema de estudio espiritual específico, aleatorio y sorpresivo para esta semana.

INTERESES DE LA PAREJA:
${interesesStr}

TEMAS YA ESTUDIADOS (NO repetir):
${temasStr}

INSTRUCCIONES:
- Elige el tema de manera completamente aleatoria entre los intereses — que sea una sorpresa real
- Basa las citas en publicaciones REALES de jw.org: La Atalaya, ¡Despertad!, JW Broadcasting, libros de estudio, videos oficiales
- El tema debe ser práctico y aplicable a la vida de pareja
- Para las URLs, usa el patrón real de jw.org (ej: https://www.jw.org/es/biblioteca/revistas/...) o deja vacío si no estás seguro
- El lenguaje: cálido, personal, motivador

Responde ÚNICAMENTE con JSON válido (sin bloques markdown):
{
  "titulo": "Título concreto del tema",
  "descripcion": "2-3 oraciones sobre el tema y su relevancia para esta pareja",
  "citas": [
    {
      "tipo": "articulo|video|libro|parrafo|discurso",
      "titulo": "Título exacto del recurso",
      "publicacion": "Nombre de la publicación (ej: La Atalaya, JW Broadcasting)",
      "fecha": "Año o edición",
      "url": "URL de jw.org o cadena vacía",
      "descripcion": "Qué encontrarán y cómo conecta con el tema"
    }
  ],
  "aplicacion": "3-4 oraciones sobre cómo vivir este tema juntos esta semana",
  "preguntas": [
    "¿Pregunta de reflexión 1?",
    "¿Pregunta personal o práctica 2?",
    "¿Cómo aplicarlo específicamente esta semana?"
  ]
}`;

  let lastError: Error = new Error("No se pudo generar el tema");

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const cleaned = text
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();

      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Respuesta sin JSON válido");

      return JSON.parse(match[0]) as TemaGenerado;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();

      if (isNotFoundError(msg)) {
        // Model not available → try next silently
        continue;
      }
      if (isQuotaError(msg)) {
        // Wait suggested delay then try next model
        await sleep(parseRetryDelay(lastError.message));
        continue;
      }
      // Unexpected error → surface it
      throw new Error(`Error de Gemini: ${lastError.message}`);
    }
  }

  throw new Error(
    "Cuota de Gemini agotada. Intenta en unos minutos o verifica tu plan en aistudio.google.com."
  );
}
