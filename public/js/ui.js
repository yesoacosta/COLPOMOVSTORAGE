// --- ELEMENTOS DEL DOM ---
let screens, loadingOverlay, loadingMessage, patientListEl, patientForm, addPatientBtn, cancelFormBtn, analyzeBtn, imageInput, imagePreview, patientSearch, darkModeToggle, formTitle, patientIdInput, medicalHistoryInput;

// Llama a esta función una vez al inicio para obtener todos los elementos
export function initializeDOMElements() {
    screens = { 
        list: document.getElementById('patient-list-screen'), 
        form: document.getElementById('patient-form-screen') 
    };
    loadingOverlay = document.getElementById('loading-overlay');
    loadingMessage = document.getElementById('loading-message');
    patientListEl = document.getElementById('patient-list');
    patientForm = document.getElementById('patient-form');
    addPatientBtn = document.getElementById('add-patient-btn');
    cancelFormBtn = document.getElementById('cancel-form-btn');
    analyzeBtn = document.getElementById('analyze-btn');
    imageInput = document.getElementById('colpo-image');
    imagePreview = document.getElementById('image-preview');
    patientSearch = document.getElementById('patient-search');
    darkModeToggle = document.getElementById('dark-mode-toggle');
    formTitle = document.getElementById('form-title');
    patientIdInput = document.getElementById('patient-id');
    medicalHistoryInput = document.getElementById('medical-history');
}

// --- FUNCIONES DE MANIPULACIÓN DEL DOM ---

export function showLoading(message) {
    loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex';
}

export function hideLoading() {
    loadingOverlay.style.display = 'none';
}

export function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

export function applyTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

export function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

export function renderPatientList(patients, filterText = '') {
    patientListEl.innerHTML = '';
    const filtered = patients.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));
    
    if (filtered.length === 0) {
        patientListEl.innerHTML = `<p class="text-center text-gray-500 col-span-full">No hay pacientes.</p>`;
        return;
    }
    
    filtered.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card p-6 rounded-xl shadow-md border flex flex-col justify-between';
        card.innerHTML = `
            <div>
                <p class="font-bold text-lg text-blue-800">${patient.name}</p>
                <p class="text-sm text-gray-500">Edad: ${patient.age} años</p>
            </div>
            <div class="flex space-x-2 mt-4 self-end">
                <button class="view-btn bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md text-sm" data-id="${patient.id}">Ver/Editar</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm" data-id="${patient.id}">Eliminar</button>
            </div>`;
        patientListEl.appendChild(card);
    });
}

export function showFormScreen(patient = null) {
    patientForm.reset();
    analyzeBtn.disabled = true;
    imagePreview.classList.add('hidden');

    if (patient) {
        formTitle.textContent = 'Editar Paciente';
        patientIdInput.value = patient.id;
        document.getElementById('name').value = patient.name;
        document.getElementById('age').value = patient.age;
        document.getElementById('social-security').value = patient.socialSecurity || '';
        medicalHistoryInput.value = patient.medicalHistory || '';
        if (patient.imageUrl) {
            showImagePreview(patient.imageUrl);
            analyzeBtn.disabled = false;
        }
    } else {
        formTitle.textContent = 'Añadir Nueva Paciente';
        patientIdInput.value = '';
    }
    showScreen('form');
}

export function showImagePreview(url) {
    imagePreview.src = url;
    imagePreview.classList.remove('hidden');
}

export function getFormData() {
    return {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        socialSecurity: document.getElementById('social-security').value,
        medicalHistory: medicalHistoryInput.value,
    };
}

// Exportar los elementos para que main.js pueda añadirles event listeners
export { 
    screens, loadingOverlay, loadingMessage, patientListEl, patientForm, 
    addPatientBtn, cancelFormBtn, analyzeBtn, imageInput, imagePreview, 
    patientSearch, darkModeToggle, formTitle, patientIdInput, medicalHistoryInput
};