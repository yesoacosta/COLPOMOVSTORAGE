// Aumenta el tiempo de espera de la función a 60 segundos
export const maxDuration = 60; 

// Función principal que Vercel ejecutará
export default async function handler(req, res) {
  // === LA CORRECCIÓN #1 ESTÁ AQUÍ ===
  // Hacemos una "importación dinámica" DENTRO de la función.
  // Esto resuelve los conflictos de módulos en el entorno de Vercel.
  const { GoogleGenerativeAI } = await import('@google/genai');

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
    // Inicializamos la IA aquí, después de la importación
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const { contents } = req.body;
    
    // Validar la estructura del cuerpo de la solicitud
    if (!contents || !contents[0]?.parts || contents[0].parts.length < 2) {
      return res.status(400).json({ error: "El cuerpo de la solicitud es inválido." });
    }
    
    // === LA CORRECCIÓN #2 ESTÁ AQUÍ ===
    // La nueva librería espera un formato de datos ligeramente diferente.
    // Re-estructuramos los datos que nos llegan de la app para que coincidan.
    const prompt = contents[0].parts.find(part => part.text)?.text;
    const imagePart = contents[0].parts.find(part => part.inlineData);

    if (!prompt || !imagePart) {
      return res.status(400).json({ error: "Falta el prompt o la imagen en la solicitud." });
    }
    
    // Este es el formato que la nueva librería entiende
    const parts = [
      { text: prompt },
      { inlineData: imagePart.inlineData }
    ];

    const result = await model.generateContent(parts);
    const response = result.response;
    
    res.status(200).json({
      candidates: [{
        content: {
          parts: [{ text: response.text() }]
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
