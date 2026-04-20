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

// ─── Models: strings exactos que funcionan en la API v1beta (Abril 2026) ───────
// gemini-1.5-x              → MUERTOS (404) — no usar
// gemini-2.0-flash          → Deprecado, muere el 1 Jun 2026
// gemini-2.5-flash          → SIN alias estable aún, usar versión con fecha
// gemini-2.5-flash-lite     → SIN alias estable aún, usar versión con fecha
const MODELS = [
  "gemini-2.5-flash-preview-04-17", // Más capaz, gratis con límites generosos
  "gemini-2.5-flash-lite-preview-06-17", // Máximo RPM en free tier
  "gemini-2.0-flash",               // Último recurso, vivo hasta Jun 2026
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
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
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
    // Cada modelo tiene hasta 2 intentos (inmediato + retry tras espera)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[gemini] Intentando ${model} (intento ${attempt})`);
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
          // Modelo inexistente → pasar al siguiente sin reintentar
          console.warn(`[gemini] ${model} → 404, saltando al siguiente modelo`);
          break;
        }

        if (isQuota(msg)) {
          if (attempt === 1) {
            // Primer 429 → esperar 6s y reintentar el mismo modelo
            console.warn(`[gemini] ${model} → 429, esperando 6s antes de reintentar`);
            await sleep(6000);
            continue;
          } else {
            // Segundo 429 → pasar al siguiente modelo
            console.warn(`[gemini] ${model} → 429 de nuevo, cambiando de modelo`);
            break;
          }
        }

        // Cualquier otro error (API key inválida, red, JSON roto, etc.) → fallar inmediatamente
        throw new Error(`Gemini (${model}): ${msg}`);
      }
    }
  }

  throw new Error(
    `Todos los modelos de Gemini fallaron. Último error: ${lastError.message}`
  );
}
