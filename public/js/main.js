import * as DB from './firebase.js';
import * as UI from './ui.js';
import * as AI from './gemini.js';

// --- ESTADO DE LA APLICACIÓN ---
let allPatients = [];
let currentPatient = null;
let currentImageFile = null;
let generatedReportText = null;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    UI.applyTheme();
    UI.showLoading("Cargando pacientes...");
    DB.listenForPatients(handlePatientUpdate);
});

// --- MANEJO DE DATOS ---
function handlePatientUpdate(snapshot) {
    allPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    UI.renderPatientList(allPatients);
    UI.hideLoading();
}

// --- CONFIGURACIÓN DE EVENTOS ---
function setupEventListeners() {
    // Botones principales
    UI.addPatientBtn.addEventListener('click', handleAddNewPatient);
    UI.cancelFormBtn.addEventListener('click', () => UI.showScreen('list'));
    UI.darkModeToggle.addEventListener('click', UI.toggleTheme);

    // Formulario y búsqueda
    UI.patientForm.addEventListener('submit', handleFormSubmit);
    UI.patientSearch.addEventListener('input', (e) => UI.renderPatientList(allPatients, e.target.value));
    UI.imageInput.addEventListener('change', handleImageInputChange);
    
    // Acciones en la lista de pacientes (usando delegación de eventos)
    UI.patientListEl.addEventListener('click', handlePatientListActions);
    
    // Botón de análisis IA
    UI.analyzeBtn.addEventListener('click', handleAnalyze);
}

// --- LÓGICA DE MANEJADORES DE EVENTOS ---

function handleAddNewPatient() {
    currentPatient = null;
    currentImageFile = null;
    generatedReportText = null;
    UI.showFormScreen(null);
}

function handlePatientListActions(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const patientId = target.dataset.id;
    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;

    currentPatient = patient;
    currentImageFile = null;
    generatedReportText = null;

    if (target.classList.contains('view-btn')) {
        UI.showFormScreen(patient);
    } else if (target.classList.contains('delete-btn')) {
        if (confirm(`¿Seguro que quieres eliminar a ${patient.name}?`)) {
            deletePatient(patient);
        }
    }
}

function handleImageInputChange(e) {
    const file = e.target.files[0];
    if (file) {
        UI.showImagePreview(URL.createObjectURL(file));
        currentImageFile = file;
        UI.analyzeBtn.disabled = false;
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    UI.showLoading("Guardando datos...");

    const patientId = UI.patientIdInput.value;
    const patientData = UI.getFormData();

    if (!patientId && generatedReportText) {
        patientData.reportText = generatedReportText;
    }

    try {
        if (patientId) { // Actualizando paciente existente
            if (currentImageFile) {
                patientData.imageUrl = await DB.uploadImage(currentImageFile, patientId);
            }
            await DB.savePatient(patientId, patientData);
            alert('Paciente actualizado.');
        } else { // Creando nuevo paciente
            const newDoc = await DB.savePatient(null, patientData);
            if (currentImageFile) {
                const imageUrl = await DB.uploadImage(currentImageFile, newDoc.id);
                await newDoc.update({ imageUrl });
            }
            alert('Paciente creado.');
        }
        UI.showScreen('list');
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error: No se pudieron guardar los datos.");
    } finally {
        UI.hideLoading();
    }
}

async function handleAnalyze() {
    if (!currentImageFile && !currentPatient?.imageUrl) {
        return alert("No hay una imagen disponible para analizar.");
    }
    
    UI.showLoading("Analizando imagen con IA...");

    try {
        let imageBlob;
        if (currentImageFile) {
            imageBlob = currentImageFile;
        } else {
            const response = await fetch(currentPatient.imageUrl);
            imageBlob = await response.blob();
        }

        const medicalHistory = UI.medicalHistoryInput.value;
        const reportText = await AI.generateReport(imageBlob, medicalHistory);

        if (currentPatient && currentPatient.id) {
            await DB.savePatient(currentPatient.id, { reportText });
            alert("Informe generado y guardado exitosamente.");
        } else {
            generatedReportText = reportText;
            alert("Informe generado. Guarda los datos de la nueva paciente para conservarlo.");
        }
    } catch (error) {
        console.error("Error al generar informe:", error);
        alert(`${error.message}`);
    } finally {
        UI.hideLoading();
    }
}

async function deletePatient(patient) {
    UI.showLoading("Eliminando paciente...");
    try {
        await DB.deletePatient(patient);
        alert('Paciente eliminado.');
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error: No se pudo eliminar.");
    } finally {
        UI.hideLoading();
    }
}