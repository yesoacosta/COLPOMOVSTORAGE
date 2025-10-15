export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  if (!process.env.GEMINI_API_KEY) {
    console.error("La variable GEMINI_API_KEY no está configurada.");
    return res.status(500).json({ error: "Configuración del servidor incompleta." });
  }

  try {
    const { contents } = req.body;
    if (!contents || !contents[0]?.parts?.length) {
      return res.status(400).json({ error: "El cuerpo de la solicitud es inválido." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;


    const fetchResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    const responseData = await fetchResponse.json();

    if (!fetchResponse.ok || responseData.error) {
      console.error('Error desde la API de Google:', responseData);
      throw new Error(responseData.error?.message || 'La IA no pudo procesar la solicitud.');
    }

    const text = responseData.candidates[0]?.content?.parts[0]?.text || '';
    res.status(200).json({
      candidates: [{ content: { parts: [{ text }] } }],
    });

  } catch (error) {
    console.error('Error en la función de IA:', error);
    res.status(500).json({
      error: "Error al procesar la solicitud de IA.",
      details: error.message,
    });
  }
}
