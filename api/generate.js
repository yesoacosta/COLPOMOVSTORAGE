// Aumenta el tiempo de espera de la función a 60 segundos
export const maxDuration = 60; 

// Importamos la librería correcta que definimos en package.json
import { GoogleGenerativeAI } from "@google/genai";

// Inicializa la IA con la clave de API desde las variables de entorno de Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    // Usamos el modelo estándar para visión
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const { contents } = req.body;
    
    // Validar la estructura del cuerpo de la solicitud
    if (!contents || !Array.isArray(contents) || contents.length === 0 || !contents[0].parts || !Array.isArray(contents[0].parts) || contents[0].parts.length < 2) {
      return res.status(400).json({ error: "El cuerpo de la solicitud es inválido." });
    }
    
    const prompt = contents[0].parts.find(part => part.text)?.text;
    const imageParts = contents[0].parts.filter(part => part.inlineData);
    
    if (!prompt || imageParts.length === 0) {
      return res.status(400).json({ error: "Falta el prompt o la imagen en la solicitud." });
    }

    const result = await model.generateContent([prompt, ...imageParts]);
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
