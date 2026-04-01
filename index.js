// index.js
import { db } from './firebase.js';
import {
  collection, addDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const _p = atob("amVmZXNvcmdhbmljYQ==");
const CUPO_MAX = 15;

const comisiones = [
  { id: 'com1', num: '1', dia: 'Jueves', hora: '7:00 – 11:00 hs' },
  { id: 'com2', num: '2', dia: 'Viernes', hora: '7:00 – 11:00 hs' },
  { id: 'com3', num: '3', dia: 'Miércoles', hora: '7:00 – 11:00 hs' },
  { id: 'com5a', num: '5A', dia: 'Jueves', hora: '16:00 – 20:00 hs' },
  { id: 'com6', num: '6', dia: 'Miércoles', hora: '11:30 – 15:30 hs' },
  { id: 'com7', num: '7', dia: 'Jueves', hora: '12:00 – 16:00 hs' },
  { id: 'com9', num: '9', dia: 'Viernes', hora: '12:00 – 16:00 hs' }
];

// ── OPCIONES COMISIÓN ORIGEN (pegar en index.html → <select id="comision-original">) ──
// <option value="">Seleccioná tu comisión actual</option>
// <option value="4">Comisión 4 — Martes 7 a 11</option>
// <option value="5">Comisión 5 — Martes 12 a 16</option>
// <option value="8">Comisión 8 — Lunes 15:30 a 19:30</option>

let inscripciones = [];
let comisionSeleccionada = null;

// ---- Render comisiones ----
function renderComisiones() {
  const container = document.getElementById('comisiones-container');
  container.innerHTML = '';

  comisiones.forEach(com => {
    const inscritos = inscripciones.filter(i => i.comisionNueva === com.id).length;
    const disponible = CUPO_MAX - inscritos;
    const lleno = disponible <= 0;
    const casi = disponible <= 3 && disponible > 0;
    const pct = Math.round((inscritos / CUPO_MAX) * 100);
    const seleccionada = comisionSeleccionada === com.id;

    const card = document.createElement('div');
    card.className = `card ${lleno ? 'card-full' : ''} ${seleccionada ? 'card-selected' : ''}`;
    if (!lleno) card.onclick = () => seleccionarComision(com.id);

    const fillClass = lleno ? 'full-fill' : casi ? 'almost' : '';

    card.innerHTML = `
      ${lleno ? '<span class="full-badge">Cupo lleno</span>' : ''}
      <div class="card-num">${com.num}</div>
      <div class="card-day">${com.dia}</div>
      <div class="card-hour">${com.hora}</div>
      <div class="cupo-bar-wrap">
        <div class="cupo-bar">
          <div class="cupo-fill ${fillClass}" style="width:${pct}%"></div>
        </div>
        <span class="cupo-text">${disponible}/${CUPO_MAX}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ---- Seleccionar comisión ----
function seleccionarComision(id) {
  comisionSeleccionada = id;
  renderComisiones();

  const com = comisiones.find(c => c.id === id);
  const summary = document.getElementById('selected-summary');
  summary.innerHTML = `
    <div class="selected-summary">
      <div class="selected-summary-num">${com.num}</div>
      <div class="selected-summary-info">
        <div class="s-day">${com.dia}</div>
        <div class="s-hour">${com.hora}</div>
      </div>
      <button class="btn-change" onclick="cambiarComision()">Cambiar</button>
    </div>
  `;

  document.getElementById('panel-comisiones').style.display = 'none';
  document.getElementById('panel-form').style.display = 'block';

  setStep(2);
  document.getElementById('nombre').focus();
}

window.cambiarComision = function() {
  comisionSeleccionada = null;
  document.getElementById('panel-form').style.display = 'none';
  document.getElementById('panel-comisiones').style.display = 'block';
  document.getElementById('feedback').className = 'feedback';
  setStep(1);
};

// ---- Submit ----
window.submitInscripcion = async function() {
  const nombre = document.getElementById('nombre').value.trim();
  const legajo = document.getElementById('legajo').value.trim();
  const comisionOriginal = document.getElementById('comision-original').value;
  const feedback = document.getElementById('feedback');

  feedback.className = 'feedback';

  if (!nombre || !legajo || !comisionOriginal) {
    showFeedback('err', 'Completá todos los campos antes de confirmar.');
    return;
  }
  if (!/^\d+$/.test(legajo)) {
    showFeedback('err', 'El DNI debe contener solo números.');
    return;
  }
  if (!comisionSeleccionada) {
    showFeedback('err', 'No hay comisión seleccionada.');
    return;
  }

  const yaInscripto = inscripciones.some(i => i.legajo === legajo);
  if (yaInscripto) {
    showFeedback('err', 'Este DNI ya tiene una inscripción registrada.');
    return;
  }

  const inscritos = inscripciones.filter(i => i.comisionNueva === comisionSeleccionada).length;
  if (inscritos >= CUPO_MAX) {
    showFeedback('err', 'Esta comisión ya no tiene cupos. Volvé a elegir.');
    return;
  }

  const btn = document.getElementById('btn-inscribir');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const comConfirmada = comisiones.find(c => c.id === comisionSeleccionada);

  try {
    await addDoc(collection(db, 'inscripciones'), {
      nombre,
      legajo,
      comisionOriginal,
      comisionNueva: comisionSeleccionada,
      fecha: new Date().toISOString()
    });

    setStep(3);
    document.getElementById('panel-form').innerHTML = `
      <div style="text-align:center; padding: 1rem 0;">
        <div style="font-size:40px; margin-bottom:12px;">✓</div>
        <div style="font-size:18px; font-weight:600; margin-bottom:6px;">¡Inscripción confirmada!</div>
        <div style="font-size:14px; color:var(--text-muted);">
          Quedaste inscripto en la Comisión ${comConfirmada.num}.
        </div>
        <div style="font-size:14px; color:var(--text-muted); margin-top:4px;">
          ${comConfirmada.dia} · ${comConfirmada.hora}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error al guardar:', error);
    showFeedback('err', 'Hubo un error al guardar. Intentá de nuevo.');
    btn.disabled = false;
    btn.textContent = 'Confirmar inscripción';
  }
};

function showFeedback(type, msg) {
  const el = document.getElementById('feedback');
  el.className = `feedback ${type}`;
  el.textContent = msg;
}

// ---- Steps ----
function setStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`step${i}`);
    el.className = 'step' + (i < n ? ' done' : i === n ? ' active' : '');
  });
}

// ---- Admin ----
window.toggleAdmin = function() {
  const panel = document.getElementById('admin-panel');
  panel.classList.toggle('visible');
};

window.accederAdmin = function() {
  const input = document.getElementById('admin-pass').value;
  if (input === _p) {
    document.getElementById('tabla-inscripciones').style.display = 'block';
    document.getElementById('error-admin').textContent = '';
    renderTabla();
  } else {
    document.getElementById('error-admin').textContent = 'Contraseña incorrecta.';
  }
};

function renderTabla() {
  const tbody = document.getElementById('inscripciones-body');
  tbody.innerHTML = '';
  inscripciones.forEach(ins => {
    const com = comisiones.find(c => c.id === ins.comisionNueva);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ins.nombre}</td>
      <td>${ins.legajo}</td>
      <td>${ins.comisionOriginal}</td>
      <td><span class="badge-com">Com. ${com ? com.num : ins.comisionNueva}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

window.descargarExcel = function() {
  const filas = [['Nombre', 'DNI', 'Comisión origen', 'Comisión nueva', 'Día', 'Horario']];
  inscripciones.forEach(ins => {
    const com = comisiones.find(c => c.id === ins.comisionNueva);
    filas.push([
      ins.nombre,
      ins.legajo,
      ins.comisionOriginal,
      com ? com.num : ins.comisionNueva,
      com ? com.dia : '',
      com ? com.hora : ''
    ]);
  });

  const csv = filas.map(f => f.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inscripciones_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ---- Firestore en tiempo real ----
onSnapshot(collection(db, 'inscripciones'), snapshot => {
  inscripciones = snapshot.docs.map(doc => doc.data());
  renderComisiones();
  if (document.getElementById('tabla-inscripciones').style.display !== 'none') {
    renderTabla();
  }
});

renderComisiones();