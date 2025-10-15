// public/js/gemini.js

// === LA CORRECCIÓN ESTÁ AQUÍ ===
// Apuntamos a la nueva ruta del servidor que acabamos de crear.
const API_URL = "/api/generate-report";

// Función para obtener el informe de la IA
export async function generateReport(imageBlob, medicalHistory) {
    // 1. Convertir la imagen a Base64
    const getBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    const imageBase64 = await getBase64(imageBlob);

    // 2. Crear el prompt
    const prompt = `Genera un informe colposcópico técnico y conciso basado en la imagen. Integra el historial médico si es relevante: "${medicalHistory}". El informe debe estar en español y estructurado en secciones:\n\nObservaciones Principales:\n\nPosible Diagnóstico:\n\nRecomendaciones:`;

    // 3. Llamar a la API
    const apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: imageBlob.type, data: imageBase64 } }
                ]
            }]
        })
    });

    // 4. Manejar la respuesta
    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(`Error de la API: ${errorData.details || apiResponse.statusText}`);
    }

    const result = await apiResponse.json();
    return result.candidates[0].content.parts[0].text;
}
