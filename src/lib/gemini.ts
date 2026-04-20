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

// ─── Models: current stable models as of April 2026 ───────────────────────────
// gemini-1.5-x  → SHUTDOWN (404)
// gemini-2.0-x  → still live but shutting down June 1 2026
// gemini-2.5-x  → current generation, recommended
const MODELS = [
  "gemini-2.5-flash",       // primary: latest stable, best free-tier quota
  "gemini-2.5-flash-lite",  // fallback: highest RPM on free tier
  "gemini-2.0-flash",       // last resort: still alive until June 2026
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

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
      generationConfig: { temperature: 0.9, maxOutputTokens: 1500 },
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

function isQuota(msg: string) {
  return msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
}

function isNotFound(msg: string) {
  return msg.includes("404") || msg.includes("NOT_FOUND");
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
    // Each model gets up to 2 attempts (immediate + one retry after delay)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const text = await callGemini(apiKey, model, prompt);
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

        if (isNotFound(msg)) {
          // Model is gone → skip to next model immediately, no retry
          console.warn(`[gemini] ${model} → 404, skipping`);
          break;
        }

        if (isQuota(msg)) {
          if (attempt === 1) {
            // First 429 → wait 6 seconds and retry same model once
            console.warn(`[gemini] ${model} → 429, waiting 6s before retry`);
            await sleep(6000);
            continue;
          } else {
            // Second 429 → give up on this model, try next
            console.warn(`[gemini] ${model} → 429 again, moving to next model`);
            break;
          }
        }

        // Any other error → surface immediately (wrong key, network, bad JSON, etc.)
        throw new Error(`Gemini (${model}): ${msg}`);
      }
    }
  }

  throw new Error(
    "No se pudo generar el tema. Todos los modelos de Gemini respondieron con error de cuota o no están disponibles. Esperá un minuto y volvé a intentarlo."
  );
}
