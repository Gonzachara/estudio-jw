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

// Models ordered by preference — REST API, no SDK needed
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1500,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("Respuesta vacía de Gemini");
  return text;
}

export async function generarTema(
  intereses: string[],
  temasAnteriores: { titulo: string; semana: string }[]
): Promise<TemaGenerado> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY no está configurada. Agrégala en Vercel → Settings → Environment Variables."
    );
  }

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
- Para las URLs, usa el patrón real de jw.org o deja vacío si no estás seguro
- El lenguaje: cálido, personal, motivador

Responde ÚNICAMENTE con JSON válido (sin bloques markdown, sin texto extra):
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

  let lastError: Error = new Error("Sin modelos disponibles");

  for (const model of MODELS) {
    try {
      const text = await callGemini(apiKey, model, prompt);

      // Strip markdown fences if present
      const cleaned = text
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```$/m, "")
        .trim();

      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("La respuesta no contiene JSON válido");

      return JSON.parse(match[0]) as TemaGenerado;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;

      // 404 = model not found → try next
      if (msg.includes("404")) continue;

      // 429 = quota exceeded → try next model
      if (msg.includes("429") || msg.includes("quota")) continue;

      // 400 with "not found" in body → try next
      if (msg.includes("400") && msg.toLowerCase().includes("not found")) continue;

      // Any other error → propagate immediately
      throw new Error(`Gemini (${model}): ${msg}`);
    }
  }

  throw new Error(
    `Todos los modelos de Gemini fallaron. Último error: ${lastError.message}`
  );
}
