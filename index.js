// index.js
import { db } from './firebase.js';
import { collection, addDoc, onSnapshot, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const PASSWORD_CORRECTA = "jefesorganica";

const cupos = {
    'Lunes 11 am': 46,
    'Miércoles 15:30': 46,
    'Lunes 15hs (Com 8)': 8,
    'Martes 7 am (Com 4)': 8,
    'Martes 12 am (Com 5)': 8,
    'Miércoles 7 am (Com 3)': 8,
    'Miércoles 11:30 am (Com 6)': 8
};

let inscripciones = [];

// Mostrar comisiones
function renderComisiones() {
    const container = document.getElementById('comisiones-container');
    container.innerHTML = '';

    Object.entries(cupos).forEach(([comision, cupo]) => {
        const inscritos = inscripciones.filter(i => i.comisionNueva === comision).length;
        const disponible = cupo - inscritos;

        const div = document.createElement('div');
        div.className = `comision ${disponible <= 0 ? 'cupo-lleno' : 'cupo-disponible'}`;
        div.innerHTML = `
            <h3>${comision}</h3>
            <p class="cupos">${disponible} cupos disponibles</p>
            <button ${disponible <= 0 ? 'disabled' : ''} onclick="window.inscribir('${comision}')">
                Inscribirse
            </button>
            ${disponible <= 0 ? '<p class="error">CUPO LLENO - Seleccione otra comisión</p>' : ''}
        `;
        container.appendChild(div);
    });
}

// Inscripción
window.inscribir = async function(comision) {
    const nombre = document.getElementById('nombre').value.trim();
    const legajo = document.getElementById('legajo').value.trim();
    const comisionOriginal = document.getElementById('comision-original').value;

    if (!nombre || !legajo || !comisionOriginal) {
        alert('Complete todos los datos obligatorios');
        return;
    }

    // Verificar legajo duplicado en Firestore
    const yaInscripto = inscripciones.some(i => i.legajo === legajo);
    if (yaInscripto) {
        alert('Este legajo ya está inscripto en una comisión.');
        return;
    }

    // Verificar cupo
    const cupoDisponible = cupos[comision] - inscripciones.filter(i => i.comisionNueva === comision).length;
    if (cupoDisponible <= 0) {
        alert('Cupo completo, seleccione otra comisión');
        return;
    }

    const inscripcion = {
        nombre,
        legajo,
        comisionOriginal,
        comisionNueva: comision,
        fecha: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, 'inscripciones'), inscripcion);
        alert('¡Inscripción guardada!');
        document.getElementById('inscripcionForm').reset();
    } catch (error) {
        console.error('Error al guardar: ', error);
        alert('Hubo un error, intentá de nuevo.');
    }
};

// Mostrar tabla
function renderTabla() {
    const tbody = document.getElementById('inscripciones-body');
    tbody.innerHTML = '';

    inscripciones.forEach(inscripcion => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${inscripcion.nombre}</td>
            <td>${inscripcion.legajo}</td>
            <td>${inscripcion.comisionOriginal}</td>
            <td>${inscripcion.comisionNueva}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Autenticación para ver la tabla
window.accederAdmin = function() {
    const input = document.getElementById('admin-pass').value;
    if (input === PASSWORD_CORRECTA) {
        document.getElementById('tabla-inscripciones').style.display = 'block';
        document.getElementById('error-admin').innerText = '';
        renderTabla();
    } else {
        document.getElementById('error-admin').innerText = 'Contraseña incorrecta';
    }
};

// Reiniciar datos (solo para pruebas)
window.reiniciarDatos = async function() {
    if (confirm('¿Estás seguro de que querés eliminar todas las inscripciones? Esto no se puede deshacer.')) {
        try {
            const querySnapshot = await getDocs(collection(db, 'inscripciones'));
            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
            alert('Datos reiniciados.');
            location.reload();
        } catch (error) {
            console.error('Error al reiniciar: ', error);
            alert('Hubo un error al reiniciar.');
        }
    }
};

// Cargar datos desde Firestore en tiempo real
onSnapshot(collection(db, 'inscripciones'), (snapshot) => {
    inscripciones = [];
    snapshot.forEach((doc) => {
        inscripciones.push(doc.data());
    });
    renderComisiones();
    renderTabla(); // Actualiza la tabla si está visible
});

// Inicial
renderComisiones();
