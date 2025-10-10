const { GoogleGenerativeAI } = require("@google/generative-ai");

// Lee la clave secreta de la API desde las Variables de Entorno de Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Función principal que Vercel ejecutará
export default async function handler(req, res) {
  // Configurar cabeceras para permitir solicitudes (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Vercel a veces envía una solicitud 'OPTIONS' primero, la manejamos aquí
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const { contents } = req.body;
    
    // Extrae el prompt y la imagen de la solicitud
    const prompt = contents[0].parts[0].text;
    const imageParts = contents[0].parts.filter(part => part.inlineData);
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Devuelve la respuesta generada por la IA
    res.status(200).json({
      candidates: [{
        content: {
          parts: [{ text: text }]
        }
      }]
    });

  } catch (error) {
    console.error('Error en la función de IA:', error);
    res.status(500).json({ error: "Error al procesar la solicitud de IA", details: error.message });
  }
}