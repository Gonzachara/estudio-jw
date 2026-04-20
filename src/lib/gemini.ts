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
─────────────────────────────────────────────────────────────────────────
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile"; // Gratis, muy capaz; fallback: llama-3.1-8b-instant

export async function generarTema(
  intereses: string[],
  temasAnteriores: { titulo: string; semana: string }[]
): Promise<TemaGenerado> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY no está configurada. Agrégala en Vercel → Settings → Environment Variables."
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

  const systemPrompt = `Eres un asistente espiritual para una pareja de Testigos de Jehová que estudia semanalmente usando jw.org.
Responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra, sin comentarios.`;

  const userPrompt = `MISIÓN: Generar UN tema de estudio espiritual específico, aleatorio y sorpresivo para esta semana.

INTERESES DE LA PAREJA:
${interesesStr}

TEMAS YA ESTUDIADOS (NO repetir):
${temasStr}

INSTRUCCIONES:

- Elige el tema de manera completamente aleatoria entre los intereses — que sea una sorpresa real
- Basa las citas en publicaciones REALES de jw.org: La Atalaya, ¡Despertad!, JW Broadcasting, libros de estudio, videos oficiales
- El tema debe ser práctico y aplicable a la vida de pareja
- Para las URLs, DEBES intentar buscar el enlace real en jw.org. 
- Si es un artículo de La Atalaya, usa: https://www.jw.org/es/biblioteca/revistas/
- Si es un video, usa: https://www.jw.org/es/biblioteca/videos/
- IMPORTANTE: Si no conoces la URL exacta, construye una búsqueda directa: https://www.jw.org/es/busqueda/?q=TITULO+DEL+RECURSO
- El lenguaje: cálido, personal, motivador

Responde ÚNICAMENTE con este JSON válido:
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

  // Modelos en orden de preferencia (todos 100% gratis en Groq)
  const MODELS = [
    "llama-3.3-70b-versatile",  // Mejor calidad, gratis
    "llama-3.1-8b-instant",     // Más rápido, mayor cuota RPM
    "gemma2-9b-it",             // Fallback adicional
  ];

  let lastError: Error = new Error("Error desconocido");

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[groq] Intentando ${model} (intento ${attempt})`);

        const res = await fetch(GROQ_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 1500,
            temperature: 0.9,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`HTTP ${res.status}: ${body}`);
        }

        const data = await res.json();
        const text: string | undefined = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error("Respuesta vacía de Groq");

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

        // API key inválida → fallar inmediatamente
        if (msg.includes("401") || msg.includes("invalid_api_key")) {
          throw new Error(
            `API key de Groq inválida. Verificá GROQ_API_KEY en Vercel. Detalle: ${msg}`
          );
        }

        // Modelo no disponible → pasar al siguiente
        if (msg.includes("404") || msg.includes("model_not_found")) {
          console.warn(`[groq] ${model} → no disponible, probando siguiente`);
          break;
        }

        // Rate limit → esperar y reintentar una vez
        if (msg.includes("429") && attempt === 1) {
          console.warn(`[groq] ${model} → 429, esperando 8s...`);
          await new Promise((r) => setTimeout(r, 8000));
          continue;
        }

        // Segundo intento fallido → probar siguiente modelo
        if (attempt === 2) {
          console.warn(`[groq] ${model} → falló 2 veces, probando siguiente`);
          break;
        }

        // Cualquier otro error → fallar inmediatamente
        throw new Error(`Groq (${model}): ${msg}`);
      }
    }
  }

  throw new Error(`Todos los modelos de Groq fallaron. Último error: ${lastError.message}`);
}
