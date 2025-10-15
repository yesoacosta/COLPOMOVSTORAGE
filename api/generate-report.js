// Aumenta el tiempo de espera de la función a 60 segundos
export const maxDuration = 60; 

// Función principal que Vercel ejecutará
export default async function handler(req, res) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar solicitud OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Validar que la clave de API esté presente
  if (!process.env.GEMINI_API_KEY) {
    console.error("La variable de entorno GEMINI_API_KEY no está configurada.");
    return res.status(500).json({ error: "Configuración del servidor incompleta." });
  }

  try {
    const { contents } = req.body;
    
    // Validar la estructura del cuerpo de la solicitud
    if (!contents || !contents[0]?.parts || contents[0].parts.length < 2) {
      return res.status(400).json({ error: "El cuerpo de la solicitud es inválido." });
    }

    // === LA CORRECCIÓN DEFINITIVA ESTÁ AQUÍ ===
    // 1. Usamos la URL y el nombre de modelo EXACTOS del proyecto que SÍ funciona.
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // 2. Hacemos la llamada a la API usando `fetch`
    const fetchResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    });

    const responseData = await fetchResponse.json();

    // 3. Verificamos si Google devolvió un error
    if (!fetchResponse.ok || responseData.error) {
        console.error('Error desde la API de Google:', responseData);
        throw new Error(responseData.error?.message || 'La IA no pudo procesar la solicitud.');
    }
    
    // 4. Extraemos el texto de la respuesta exitosa
    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!text) {
        console.error('Respuesta de la IA vacía o en formato inesperado:', responseData);
        throw new Error('La IA respondió, pero el formato del texto no es el esperado.');
    }
    
    res.status(200).json({
      candidates: [{
        content: {
          parts: [{ text: text }]
        }
      }]
    });

  } catch (error) {
    console.error('Error en la función de IA:', error);
    res.status(500).json({ 
      error: "Error al procesar la solicitud de IA.", 
      details: error.message 
    });
  }
}


