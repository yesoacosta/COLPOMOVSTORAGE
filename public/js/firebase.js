// Configuración e inicialización de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCaUWw6-odmRFoglotYFqvuOX4bY6Ol9KU",
    authDomain: "colpomov.firebaseapp.com",
    projectId: "colpomov",
    storageBucket: "colpomov.firebasestorage.app",
    messagingSenderId: "78086675183",
    appId: "1:78086675183:web:77c5a2d219ebbcddf8191a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// --- FUNCIONES EXPORTADAS ---

// Escucha los cambios en la lista de pacientes en tiempo real
export function listenForPatients(callback) {
    return db.collection("patients").orderBy("name").onSnapshot(callback, (error) => {
        console.error("Error al obtener pacientes:", error);
        alert("Error de Conexión: No se pudo conectar a la base de datos.");
    });
}

// Guarda los datos de un paciente (actualiza si existe, crea si es nuevo)
export async function savePatient(patientId, patientData) {
    if (patientId) {
        return db.collection("patients").doc(patientId).update(patientData);
    } else {
        const newDocRef = await db.collection("patients").add(patientData);
        return newDocRef;
    }
}

// Sube una imagen a Firebase Storage
export async function uploadImage(file, patientId) {
    if (!file) return null;
    const filePath = `images/${patientId}/${Date.now()}_${file.name}`;
    const fileRef = storage.ref(filePath);
    await fileRef.put(file);
    return fileRef.getDownloadURL();
}

// Elimina un paciente y su imagen asociada
export async function deletePatient(patient) {
    if (patient?.imageUrl) {
        try {
            await storage.refFromURL(patient.imageUrl).delete();
        } catch (storageError) {
            console.warn("La imagen no existía en Storage, se procede a borrar solo los datos.");
        }
    }
    return db.collection("patients").doc(patient.id).delete();
}