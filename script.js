'use strict';

/* PetDelicias MVP académico — HTML, CSS y JavaScript puro. */
const STORAGE_KEY = 'petdelicias_mvp_v1';
const DEMO_USERS = [
  { id: 'u-owner', name: 'Laura Martínez', email: 'laura@petdelicias.demo', password: 'petdemo123', role: 'owner', ownerId: 'own-1', active: true },
  { id: 'u-vet', name: 'Dra. Camila Ríos', email: 'veterinaria@petdelicias.demo', password: 'petdemo123', role: 'vet', ownerId: null, active: true },
  { id: 'u-admin', name: 'Andrés Gómez', email: 'admin@petdelicias.demo', password: 'petdemo123', role: 'admin', ownerId: null, active: true }
];
const ROLE_LABELS = { owner: 'Propietario', vet: 'Personal veterinario', admin: 'Administrador comercial' };
const ROLE_INITIALS = { owner: 'LM', vet: 'CR', admin: 'AG' };
const MODULE_META = {
  home: { label: 'Inicio', icon: '⌂', roles: ['owner', 'vet', 'admin'] },
  owners: { label: 'Propietarios', icon: '♙', roles: ['vet', 'admin'] },
  pets: { label: 'Mascotas', icon: '🐾', roles: ['owner', 'vet', 'admin'] },
  care: { label: 'Historial de cuidados', icon: '♡', roles: ['owner', 'vet'] },
  'care-types': { label: 'Vacunación y desparasitación', icon: '✚', roles: ['owner', 'vet'] },
  appointments: { label: 'Citas a domicilio', icon: '▦', roles: ['owner', 'vet'] },
  events: { label: 'Seguimiento preventivo', icon: '◷', roles: ['owner', 'vet'] },
  products: { label: 'Productos', icon: '▧', roles: ['owner', 'admin'] },
  inventory: { label: 'Inventario', icon: '▤', roles: ['admin'] },
  sales: { label: 'Ventas', icon: '$', roles: ['admin'] },
  users: { label: 'Usuarios y roles', icon: '⚙', roles: ['admin'] }
};
const state = { db: null, user: null, module: 'home', search: '', filters: {}, selectedPetId: '', modal: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function isoDate(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function addDays(days, base = new Date()) { const d = new Date(base); d.setDate(d.getDate() + days); return isoDate(d); }
function todayISO() { return isoDate(new Date()); }
function nowDateTimeLocal() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
function makeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; }
function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function money(value) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0); }
function formatDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) { if (!value) return 'No registrada'; const d = new Date(`${value}T12:00:00`); return Number.isNaN(d.getTime()) ? 'Fecha no válida' : new Intl.DateTimeFormat('es-CO', options).format(d); }
function formatTime(value) { if (!value) return ''; const [h, m] = value.split(':').map(Number); const suffix = h >= 12 ? 'p. m.' : 'a. m.'; const hour = h % 12 || 12; return `${hour}:${String(m).padStart(2, '0')} ${suffix}`; }
function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'PD'; }
function daysDifference(date) { const a = new Date(`${todayISO()}T00:00:00`); const b = new Date(`${date}T00:00:00`); return Math.round((b - a) / 86400000); }
function seedData() {
  const owners = [
    { id: 'own-1', name: 'Laura Martínez', document: '1020304050', phone: '300 555 0123', email: 'laura@ejemplo.demo', address: 'Calle 42 # 18-20, Bucaramanga' },
    { id: 'own-2', name: 'Daniel Torres', document: '1098765432', phone: '310 555 0188', email: 'daniel@ejemplo.demo', address: 'Carrera 25 # 36-14, Bucaramanga' },
    { id: 'own-3', name: 'Sofía Ramírez', document: '1002003004', phone: '315 555 0164', email: 'sofia@ejemplo.demo', address: 'Calle 8 # 12-50, Floridablanca' }
  ];
  const pets = [
    { id: 'pet-1', name: 'Max', species: 'Perro', breed: 'Criollo', sex: 'Macho', birthDate: '2021-04-12', weight: '18.5', observations: 'Sociable; registro de ejemplo.', ownerId: 'own-1' },
    { id: 'pet-2', name: 'Luna', species: 'Gato', breed: 'Mestiza', sex: 'Hembra', birthDate: '2022-09-03', weight: '4.2', observations: 'Permanece en casa.', ownerId: 'own-1' },
    { id: 'pet-3', name: 'Rocky', species: 'Perro', breed: 'Beagle', sex: 'Macho', birthDate: '2020-02-21', weight: '12.1', observations: 'Usa arnés durante los paseos.', ownerId: 'own-2' },
    { id: 'pet-4', name: 'Mía', species: 'Gato', breed: 'Criolla', sex: 'Hembra', birthDate: '2023-01-18', weight: '3.7', observations: '', ownerId: 'own-3' }
  ];
  const care = [
    { id: 'care-1', petId: 'pet-1', type: 'Vacunación', title: 'Vacuna polivalente', date: addDays(-80), description: 'Aplicación registrada para demostración.', observations: 'Registro ficticio. Sin recomendaciones clínicas.', recordedBy: 'Dra. Camila Ríos' },
    { id: 'care-2', petId: 'pet-1', type: 'Desparasitación', title: 'Desparasitación interna', date: addDays(-36), description: 'Procedimiento documentado.', observations: 'Producto registrado en la visita.', recordedBy: 'Dra. Camila Ríos' },
    { id: 'care-3', petId: 'pet-2', type: 'Atención', title: 'Valoración general', date: addDays(-12), description: 'Atención de ejemplo registrada.', observations: 'Información ficticia para pruebas.', recordedBy: 'Dra. Camila Ríos' },
    { id: 'care-4', petId: 'pet-3', type: 'Vacunación', title: 'Vacuna antirrábica', date: addDays(-100), description: 'Aplicación documentada.', observations: 'Dato de demostración.', recordedBy: 'Dra. Camila Ríos' }
  ];
  const events = [
    { id: 'evt-1', petId: 'pet-1', type: 'Vacunación', description: 'Seguimiento de vacuna', date: addDays(4), status: 'pendiente', observations: 'Evento de demostración próximo.' },
    { id: 'evt-2', petId: 'pet-2', type: 'Desparasitación', description: 'Seguimiento preventivo', date: addDays(0), status: 'pendiente', observations: 'Fecha de ejemplo para revisar alerta de hoy.' },
    { id: 'evt-3', petId: 'pet-3', type: 'Otro cuidado', description: 'Control preventivo registrado', date: addDays(-3), status: 'pendiente', observations: 'Fecha pasada de ejemplo para alerta vencida.' },
    { id: 'evt-4', petId: 'pet-4', type: 'Vacunación', description: 'Evento ya realizado', date: addDays(-15), status: 'completado', observations: 'Evento completado de demostración.' },
    { id: 'evt-5', petId: 'pet-1', type: 'Cita', description: 'Preparar visita veterinaria', date: addDays(12), status: 'pendiente', observations: '' }
  ];
  const appointments = [
    { id: 'apt-1', ownerId: 'own-1', petId: 'pet-1', date: addDays(2), time: '10:00', address: owners[0].address, reason: 'Valoración general', observations: 'Confirmar disponibilidad del propietario.', status: 'confirmada', createdAt: new Date().toISOString() },
    { id: 'apt-2', ownerId: 'own-1', petId: 'pet-2', date: addDays(6), time: '15:30', address: owners[0].address, reason: 'Revisión de rutina', observations: '', status: 'pendiente', createdAt: new Date().toISOString() },
    { id: 'apt-3', ownerId: 'own-2', petId: 'pet-3', date: addDays(9), time: '09:00', address: owners[1].address, reason: 'Consulta general', observations: 'Solicitud ficticia.', status: 'pendiente', createdAt: new Date().toISOString() },
    { id: 'apt-4', ownerId: 'own-3', petId: 'pet-4', date: addDays(-5), time: '11:00', address: owners[2].address, reason: 'Valoración de seguimiento', observations: '', status: 'completada', createdAt: new Date().toISOString() }
  ];
  const products = [
    { id: 'prd-1', name: 'Alimento para perro 2 kg', category: 'Alimentos', description: 'Alimento de demostración para perros.', price: 48500, stock: 18, minStock: 5 },
    { id: 'prd-2', name: 'Champú para mascotas', category: 'Higiene', description: 'Champú de uso general para el catálogo ficticio.', price: 22500, stock: 4, minStock: 5 },
    { id: 'prd-3', name: 'Juguete de cuerda', category: 'Juguetes', description: 'Juguete resistente para perros.', price: 12000, stock: 22, minStock: 6 },
    { id: 'prd-4', name: 'Collar ajustable', category: 'Accesorios', description: 'Collar de talla ajustable.', price: 18000, stock: 3, minStock: 4 },
        { id: 'prd-5', name: 'Cepillo de pelaje', category: 'Higiene', description: 'Accesorio para el cuidado del pelaje.', price: 16000, stock: 9, minStock: 3 },
    { id: 'prd-6', name: 'Botiquín básico para mascotas', category: 'Salud animal', description: 'Producto de catálogo para demostración.', price: 32000, stock: 7, minStock: 3 }
  ];
  const sales = [
    { id: 'sal-1', ownerId: 'own-1', date: addDays(-6), status: 'registrada', items: [{ productId: 'prd-1', name: 'Alimento para perro 2 kg', quantity: 1, price: 48500, subtotal: 48500 }, { productId: 'prd-3', name: 'Juguete de cuerda', quantity: 2, price: 12000, subtotal: 24000 }], total: 72500 },
    { id: 'sal-2', ownerId: 'own-2', date: addDays(-2), status: 'registrada', items: [{ productId: 'prd-2', name: 'Champú para mascotas', quantity: 1, price: 22500, subtotal: 22500 }], total: 22500 }
  ];
  const movements = [
    { id: 'mov-1', productId: 'prd-1', type: 'Entrada', quantity: 19, reason: 'Inventario inicial de demostración', date: addDays(-30), user: 'Andrés Gómez' },
    { id: 'mov-2', productId: 'prd-1', type: 'Salida', quantity: 1, reason: 'Venta de demostración', date: addDays(-6), user: 'Andrés Gómez' },
    { id: 'mov-3', productId: 'prd-3', type: 'Entrada', quantity: 24, reason: 'Inventario inicial de demostración', date: addDays(-30), user: 'Andrés Gómez' },
    { id: 'mov-4', productId: 'prd-3', type: 'Salida', quantity: 2, reason: 'Venta de demostración', date: addDays(-6), user: 'Andrés Gómez' },
    { id: 'mov-5', productId: 'prd-2', type: 'Entrada', quantity: 5, reason: 'Inventario inicial de demostración', date: addDays(-30), user: 'Andrés Gómez' },
    { id: 'mov-6', productId: 'prd-2', type: 'Salida', quantity: 1, reason: 'Venta de demostración', date: addDays(-2), user: 'Andrés Gómez' }
  ];
  return { owners, pets, care, events, appointments, products, movements, sales, users: DEMO_USERS.map(u => ({ ...u })) };
}
function loadDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const keys = ['owners', 'pets', 'care', 'events', 'appointments', 'products', 'movements', 'sales', 'users'];
      if (keys.every(k => Array.isArray(parsed[k]))) return parsed;
    }
  } catch (error) { console.warn('No se pudieron leer los datos locales; se cargarán datos de ejemplo.'); }
  const db = seedData();
  saveDatabase(db);
  return db;
}
function saveDatabase(db = state.db) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); return true; } catch (error) { toast('No se pudieron guardar los datos. Revisa el almacenamiento del navegador.', 'error'); return false; } }
function userById(id) { return state.db.users.find(x => x.id === id); }
function ownerById(id) { return state.db.owners.find(x => x.id === id); }
function petById(id) { return state.db.pets.find(x => x.id === id); }
function productById(id) { return state.db.products.find(x => x.id === id); }
function petName(id) { return petById(id)?.name || 'Mascota no disponible'; }
function ownerName(id) { return ownerById(id)?.name || 'Propietario no disponible'; }
function roleCan(moduleName) { return Boolean(state.user && MODULE_META[moduleName]?.roles.includes(state.user.role)); }
function ensurePermission(moduleName, message = 'Tu perfil no tiene permiso para realizar esta acción.') { if (roleCan(moduleName)) return true; toast(message, 'warning'); return false; }
function scopedPets() { return state.user?.role === 'owner' ? state.db.pets.filter(p => p.ownerId === state.user.ownerId) : state.db.pets; }
function scopedCare() { const petIds = new Set(scopedPets().map(p => p.id)); return state.user?.role === 'owner' ? state.db.care.filter(c => petIds.has(c.petId)) : state.db.care; }
function scopedEvents() { const petIds = new Set(scopedPets().map(p => p.id)); return state.user?.role === 'owner' ? state.db.events.filter(e => petIds.has(e.petId)) : state.db.events; }
function scopedAppointments() { return state.user?.role === 'owner' ? state.db.appointments.filter(a => a.ownerId === state.user.ownerId) : state.db.appointments; }
function scopedProducts() { return state.db.products; }
function eventClassification(event) {
  if (event.status === 'completado') return { label: 'Completado', className: 'status-success', key: 'completado' };
  const diff = daysDifference(event.date);
  if (diff < 0) return { label: 'Vencido', className: 'status-danger', key: 'vencido' };
  if (diff === 0) return { label: 'Para hoy', className: 'status-warning', key: 'hoy' };
  if (diff <= 7) return { label: 'Próximo', className: 'status-info', key: 'proximo' };
  return { label: 'Programado', className: 'status-neutral', key: 'programado' };
}
function statusPill(label, className = 'status-neutral') { return `<span class="status-pill ${className}">${escapeHTML(label)}</span>`; }
function appointmentPill(status) { const map = { pendiente: ['Pendiente', 'status-warning'], confirmada: ['Confirmada', 'status-info'], completada: ['Completada', 'status-success'], cancelada: ['Cancelada', 'status-neutral'] }; const item = map[status] || [status, 'status-neutral']; return statusPill(item[0], item[1]); }
function toast(message, type = 'success', title) {
  const region = $('#toastRegion'); if (!region) return;
  const config = type === 'error' ? ['⚠', title || 'No se pudo completar'] : type === 'warning' ? ['!', title || 'Atención'] : ['✓', title || 'Operación realizada'];
  const el = document.createElement('div'); el.className = `toast ${type === 'error' ? 'toast-error' : type === 'warning' ? 'toast-warning' : ''}`;
  el.innerHTML = `<span class="toast-icon">${config[0]}</span><div><strong>${escapeHTML(config[1])}</strong><p>${escapeHTML(message)}</p></div><button class="toast-close" aria-label="Cerrar notificación">×</button>`;
  $('.toast-close', el).addEventListener('click', () => el.remove()); region.appendChild(el);
  window.setTimeout(() => { if (el.isConnected) { el.classList.add('toast-leaving'); window.setTimeout(() => el.remove(), 250); } }, 4500);
}
function commit(message = 'Los cambios se guardaron correctamente.') { saveDatabase(); renderApp(); toast(message, 'success'); }
function showLogin() { $('#loginView').hidden = false; $('#appView').hidden = true; }
function showApp() { $('#loginView').hidden = true; $('#appView').hidden = false; }
function loginAs(role) {
  const user = state.db.users.find(u => u.role === role && u.active !== false) || DEMO_USERS.find(u => u.role === role);
  if (!user) { toast('No existe un usuario activo para este perfil.', 'error'); return; }
  state.user = { ...user }; state.module = 'home'; state.search = ''; state.filters = {}; state.selectedPetId = '';
  showApp(); renderApp();
}
function logout() { state.user = null; state.module = 'home'; state.modal = null; $('#modalRoot').innerHTML = ''; showLogin(); }
function renderNav() {
  const nav = $('#mainNav');
  const order = ['home', 'owners', 'pets', 'care', 'care-types', 'appointments', 'events', 'products', 'inventory', 'sales', 'users'];
  nav.innerHTML = order.filter(key => roleCan(key)).map(key => {
    const meta = MODULE_META[key]; const active = state.module === key;
    let count = '';
    if (key === 'events') { const n = scopedEvents().filter(e => ['vencido', 'hoy', 'proximo'].includes(eventClassification(e).key)).length; if (n) count = `<span class="nav-count">${n}</span>`; }
    if (key === 'appointments') { const n = scopedAppointments().filter(a => a.status === 'pendiente').length; if (n) count = `<span class="nav-count">${n}</span>`; }
    return `<button type="button" class="nav-link ${active ? 'active' : ''}" data-module="${key}"><span class="nav-icon">${meta.icon}</span><span>${meta.label}</span>${count}</button>`;
  }).join('');
}
function renderApp() {
  if (!state.user) return;
  if (!roleCan(state.module)) state.module = 'home';
  renderNav();
  $('#breadcrumbCurrent').textContent = MODULE_META[state.module]?.label || 'Inicio';
  $('#profileName').textContent = state.user.name; $('#profileRole').textContent = ROLE_LABELS[state.user.role]; $('#profileAvatar').textContent = ROLE_INITIALS[state.user.role] || initials(state.user.name);
  $('#pageDate').textContent = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  $('#pageContent').innerHTML = renderModule(state.module);
  $('#profileMenu').hidden = true;
    $('#resetDemoButton').style.display = state.user.role === 'admin' ? 'flex' : 'none';
}
function pageHeading(kicker, title, description, actions = '') {
  return `<div class="page-heading"><div><div class="heading-kicker"><span></span>${escapeHTML(kicker)}</div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(description)}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function button(label, action, icon = '', kind = 'button-primary', extra = '') { return `<button type="button" class="button ${kind}" data-action="${action}" ${extra}>${icon ? `<span>${icon}</span>` : ''}${label}</button>`; }
function statsCard(icon, tint, value, label, foot) { return `<article class="stat-card"><div class="stat-top"><span class="stat-icon" style="background:${tint}">${icon}</span><span class="stat-trend">● Actualizado</span></div><div class="stat-value">${value}</div><div class="stat-label">${escapeHTML(label)}</div><div class="stat-foot">${escapeHTML(foot)}</div></article>`; }
function emptyState(title, description, icon = '🐾') { return `<div class="empty-state"><span>${icon}</span><strong>${escapeHTML(title)}</strong><p>${escapeHTML(description)}</p></div>`; }
function eventRow(event) {
  const pet = petById(event.petId); const cls = eventClassification(event); const day = event.date ? new Date(`${event.date}T12:00:00`).getDate() : '—';
  const month = event.date ? new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(new Date(`${event.date}T12:00:00`)).replace('.', '') : '—';
  const note = cls.key === 'vencido' ? 'La fecha programada ya pasó' : cls.key === 'hoy' ? 'Programado para hoy' : cls.key === 'completado' ? 'Atención marcada como realizada' : `Fecha: ${formatDate(event.date)}`;
  return `<div class="event-item"><div class="event-datebox"><strong>${day}</strong><small>${escapeHTML(month)}</small></div><div class="event-info"><strong>${escapeHTML(event.description || event.type)} · ${escapeHTML(pet?.name || 'Mascota')}</strong><p>${escapeHTML(event.type)} · ${escapeHTML(note)}</p></div><div class="event-side">${statusPill(cls.label, cls.className)}${state.user.role === 'vet' && event.status !== 'completado' ? `<button class="text-link" data-action="complete-event" data-id="${event.id}">Completar</button>` : ''}</div></div>`;
}
function alertRow(event) {
  const cls = eventClassification(event); const red = cls.key === 'vencido'; const green = cls.key === 'completado';
  const symbol = red ? '!' : cls.key === 'hoy' ? '◷' : green ? '✓' : '↗';
  const detail = `${petName(event.petId)} · ${formatDate(event.date)}${cls.key === 'vencido' ? ` · ${Math.abs(daysDifference(event.date))} día(s) de atraso` : ''}`;
  return `<div class="alert-item ${red ? 'alert-red' : green ? 'alert-green' : ''}"><span class="alert-symbol">${symbol}</span><div class="alert-copy"><strong>${escapeHTML(event.description || event.type)} ${statusPill(cls.label, cls.className)}</strong><p>${escapeHTML(detail)}</p></div></div>`;
}
function renderHome() {
  const pets = scopedPets(); const events = scopedEvents(); const appointments = scopedAppointments();
  const relevantEvents = events.filter(e => ['vencido', 'hoy', 'proximo'].includes(eventClassification(e).key)).sort((a, b) => a.date.localeCompare(b.date));
  const upcomingAppointments = appointments.filter(a => !['cancelada', 'completada'].includes(a.status) && a.date >= todayISO()).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const nextEvents = [...events].filter(e => e.status !== 'completado').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  let cards = '';
  if (state.user.role === 'owner') {
    cards = statsCard('🐾', '#e8f4e5', pets.length, 'Mis mascotas', 'Mascotas asociadas a tu perfil') + statsCard('▦', '#eaf3fb', appointments.filter(a => a.status === 'pendiente' || a.status === 'confirmada').length, 'Citas por atender', 'Solicitudes pendientes o confirmadas') + statsCard('◷', '#fff0db', relevantEvents.length, 'Alertas preventivas', 'Próximas, de hoy o vencidas') + statsCard('▧', '#f2ecfb', state.db.products.filter(p => p.stock > 0).length, 'Productos disponibles', 'Referencias con existencias');
  } else if (state.user.role === 'vet') {
    cards = statsCard('♙', '#e8f4e5', state.db.owners.length, 'Propietarios', 'Registros disponibles') + statsCard('🐾', '#eaf3fb', state.db.pets.length, 'Mascotas', 'Expedientes registrados') + statsCard('▦', '#fff0db', appointments.filter(a => a.status === 'pendiente').length, 'Citas pendientes', 'Solicitudes por gestionar') + statsCard('◷', '#f2ecfb', relevantEvents.length, 'Alertas preventivas', 'Eventos con seguimiento');
  } else {
    const lowStock = state.db.products.filter(p => p.stock <= p.minStock).length;
    cards = statsCard('♙', '#e8f4e5', state.db.owners.length, 'Propietarios', 'Clientes registrados') + statsCard('🐾', '#eaf3fb', state.db.pets.length, 'Mascotas', 'Expedientes registrados') + statsCard('$', '#fff0db', state.db.sales.filter(s => s.status !== 'cancelada').length, 'Ventas registradas', 'Operaciones no canceladas') + statsCard('▧', '#f2ecfb', lowStock, 'Productos con stock bajo', 'Existencias ≤ stock mínimo');
  }
  const eventsHTML = nextEvents.length ? nextEvents.map(eventRow).join('') : emptyState('Sin eventos pendientes', 'Los próximos seguimientos aparecerán aquí.', '🌱');
  const appointmentsHTML = upcomingAppointments.slice(0, 4).length ? upcomingAppointments.slice(0, 4).map(a => `<div class="event-item"><div class="event-datebox"><strong>${new Date(`${a.date}T12:00:00`).getDate()}</strong><small>${escapeHTML(new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(new Date(`${a.date}T12:00:00`)).replace('.', ''))}</small></div><div class="event-info"><strong>${escapeHTML(petName(a.petId))} · ${escapeHTML(a.reason)}</strong><p>${escapeHTML(state.user.role === 'owner' ? 'Visita veterinaria a domicilio' : ownerName(a.ownerId))} · ${formatTime(a.time)}</p></div><div class="event-side">${appointmentPill(a.status)}</div></div>`).join('') : emptyState('No hay citas próximas', 'Las solicitudes futuras aparecerán en esta sección.', '🗓️');
  const alertsHTML = relevantEvents.slice(0, 4).map(alertRow).join('') || emptyState('Todo al día', 'No hay alertas preventivas pendientes en este momento.', '🌿');
  let quickActions = '';
  if (state.user.role === 'vet') quickActions = `<button class="quick-action" data-module="pets"><span class="quick-icon">🐾</span><strong>Registrar mascota</strong><small>Crear un expediente vinculado a su propietario.</small></button><button class="quick-action" data-module="care-types"><span class="quick-icon">✚</span><strong>Registrar cuidado</strong><small>Documentar una vacuna o desparasitación.</small></button><button class="quick-action" data-module="events"><span class="quick-icon">◷</span><strong>Programar seguimiento</strong><small>Crear una fecha preventiva.</small></button>`;
  else if (state.user.role === 'owner') quickActions = `<button class="quick-action" data-module="appointments"><span class="quick-icon">▦</span><strong>Solicitar cita</strong><small>Programar una valoración a domicilio.</small></button><button class="quick-action" data-module="pets"><span class="quick-icon">🐾</span><strong>Mis mascotas</strong><small>Consultar la ficha de cada mascota.</small></button><button class="quick-action" data-module="products"><span class="quick-icon">▧</span><strong>Ver catálogo</strong><small>Consultar productos y disponibilidad.</small></button>`;
  else quickActions = `<button class="quick-action" data-module="products"><span class="quick-icon">▧</span><strong>Administrar productos</strong><small>Actualizar catálogo, precios y referencias.</small></button><button class="quick-action" data-module="inventory"><span class="quick-icon">▤</span><strong>Registrar movimiento</strong><small>Documentar entradas y salidas.</small></button><button class="quick-action" data-module="sales"><span class="quick-icon">$</span><strong>Registrar venta</strong><small>Calcular total y descontar existencias.</small></button>`;
    return `${pageHeading('Resumen general', `¡Hola, ${state.user.name.split(' ')[0]}!`, 'Este es el resumen actualizado de tu espacio de trabajo.', button('Actualizar datos', 'refresh', '↻', 'button-secondary'))}<div class="stats-grid">${cards}</div><div class="dashboard-grid"><div><section class="panel"><div class="panel-header"><div><h2>Seguimiento preventivo</h2><p>Próximos eventos pendientes de seguimiento.</p></div><button class="text-link" data-module="events">Ver todos →</button></div><div class="event-list">${eventsHTML}</div></section><section class="panel"><div class="panel-header"><div><h2>Próximas citas</h2><p>Visitas veterinarias programadas.</p></div><button class="text-link" data-module="appointments">Ver agenda →</button></div><div class="event-list">${appointmentsHTML}</div></section></div><div class="dashboard-side"><section class="panel"><div class="panel-header"><div><h3>Alertas importantes</h3><p>Fechas que requieren atención.</p></div><button class="text-link" data-module="events">Abrir →</button></div>${alertsHTML}</section><section class="panel"><div class="panel-header"><div><h3>Accesos rápidos</h3><p>Acciones frecuentes de tu perfil.</p></div></div><div class="quick-actions">${quickActions}</div></section></div></div>`;
}
function tableMarkup(headers, rows, emptyMessage = 'No hay registros que coincidan con la búsqueda.') {
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">${emptyState('Sin registros', emptyMessage, '📋')}</td></tr>`}</tbody></table></div>`;
}
function actionControls(entity, id, options = {}) {
  const view = options.view ? `<button type="button" class="action-button" title="Consultar" aria-label="Consultar" data-action="view-${entity}" data-id="${id}">⌕</button>` : '';
  const edit = options.edit ? `<button type="button" class="action-button" title="Editar" aria-label="Editar" data-action="edit-${entity}" data-id="${id}">✎</button>` : '';
  const del = options.delete ? `<button type="button" class="action-button danger" title="Eliminar" aria-label="Eliminar" data-action="delete-${entity}" data-id="${id}">⌫</button>` : '';
  return `<div class="table-actions">${view}${edit}${del}${options.extra || ''}</div>`;
}
function searchToolbar(placeholder, filters = '', leftExtra = '', rightExtra = '') {
  return `<div class="toolbar"><div class="toolbar-left">${leftExtra}<div class="search-box"><input type="search" data-search placeholder="${escapeHTML(placeholder)}" value="${escapeHTML(state.search)}" aria-label="Buscar"></div>${filters}</div><div class="toolbar-right">${rightExtra}</div></div>`;
}
function visibleRows(records, selector) { const term = state.search.trim().toLocaleLowerCase('es'); return records.filter(rec => !term || selector(rec).toLocaleLowerCase('es').includes(term)); }
function ownerAvatar(name) { return `<span class="table-avatar">${escapeHTML(initials(name))}</span>`; }
function renderOwners() {
  const records = visibleRows(state.db.owners, o => `${o.name} ${o.document} ${o.phone} ${o.email}`);
  const canManage = state.user.role === 'vet';
  const rows = records.map(o => `<tr><td><div class="primary-cell">${ownerAvatar(o.name)}<div><span class="cell-title">${escapeHTML(o.name)}</span><span class="cell-subtitle">ID ${escapeHTML(o.id)}</span></div></div></td><td>${escapeHTML(o.document)}</td><td>${escapeHTML(o.phone)}</td><td>${escapeHTML(o.email)}</td><td>${state.db.pets.filter(p => p.ownerId === o.id).length} mascota(s)</td><td>${actionControls('owner', o.id, { view: true, edit: canManage, delete: canManage })}</td></tr>`).join('');
  return `${pageHeading('Directorio', 'Propietarios', 'Centraliza los datos de contacto de las personas responsables de las mascotas.', canManage ? button('Nuevo propietario', 'create-owner', '+', 'button-primary') : '')}<div class="summary-strip"><div class="summary-chip"><strong>${state.db.owners.length}</strong> propietarios registrados</div><div class="summary-chip"><strong>${state.db.pets.length}</strong> mascotas vinculadas</div></div>${searchToolbar('Buscar por nombre, documento o teléfono')} ${tableMarkup(['Propietario', 'Documento', 'Teléfono', 'Correo electrónico', 'Mascotas', 'Acciones'], rows, 'Prueba otra búsqueda o registra un propietario nuevo.')}<div class="table-foot"><span>Mostrando ${records.length} de ${state.db.owners.length} propietarios</span><span>Los datos son ficticios para la demostración.</span></div>`;
}
function renderPets() {
  const pets = scopedPets(); const records = visibleRows(pets, p => `${p.name} ${p.species} ${p.breed} ${ownerName(p.ownerId)}`);
  const canEdit = state.user.role === 'vet';
  const rows = records.map(p => `<tr><td><div class="primary-cell"><span class="table-avatar">${p.species === 'Gato' ? '🐱' : p.species === 'Ave' ? '🦜' : '🐶'}</span><div><span class="cell-title">${escapeHTML(p.name)}</span><span class="cell-subtitle">${escapeHTML(p.sex || 'Sexo no indicado')}</span></div></div></td><td>${escapeHTML(p.species)}</td><td>${escapeHTML(p.breed || 'Sin raza registrada')}</td><td>${escapeHTML(ownerName(p.ownerId))}</td><td>${p.weight ? `${escapeHTML(p.weight)} kg` : '—'}</td><td>${actionControls('pet', p.id, { view: true, edit: canEdit, delete: canEdit, extra: `<button class="action-button" title="Historial de cuidados" aria-label="Historial de cuidados" data-action="pet-history" data-id="${p.id}">♡</button><button class="action-button" title="Ver eventos" aria-label="Ver eventos" data-action="pet-events" data-id="${p.id}">◷</button>` })}</td></tr>`).join('');
  const add = canEdit ? button('Registrar mascota', 'create-pet', '+', 'button-primary') : '';
  return `${pageHeading('Expedientes', state.user.role === 'owner' ? 'Mis mascotas' : 'Mascotas', state.user.role === 'owner' ? 'Consulta la información general y el seguimiento de tus mascotas.' : 'Registra mascotas vinculadas a un propietario existente.', add)}<div class="summary-strip"><div class="summary-chip"><strong>${pets.length}</strong> mascotas visibles</div><div class="summary-chip"><strong>${new Set(pets.map(p => p.ownerId)).size}</strong> propietarios vinculados</div></div>${searchToolbar('Buscar por mascota, propietario o especie')}${tableMarkup(['Mascota', 'Especie', 'Raza', 'Propietario', 'Peso', 'Acciones'], rows, 'No se encontraron mascotas.')}<div class="table-foot"><span>Mostrando ${records.length} mascotas</span><span>Para crear una mascota, selecciona un propietario registrado.</span></div>`;
}
function renderCare(typeFilter = null) {
  let care = scopedCare(); if (state.selectedPetId) care = care.filter(c => c.petId === state.selectedPetId); if (typeFilter) care = care.filter(c => typeFilter.includes(c.type));
  const records = visibleRows(care, c => `${petName(c.petId)} ${c.type} ${c.title} ${c.description} ${c.observations}` ).sort((a, b) => b.date.localeCompare(a.date));
  const rows = records.map(c => `<tr><td><span class="cell-title">${escapeHTML(c.title || c.type)}</span><span class="cell-subtitle">${escapeHTML(c.type)}</span></td><td>${escapeHTML(petName(c.petId))}</td><td>${formatDate(c.date)}</td><td>${escapeHTML(c.recordedBy || 'Usuario de demostración')}</td><td>${escapeHTML(c.description || c.observations || 'Sin descripción')}</td><td>${actionControls('care', c.id, { view: true, edit: state.user.role === 'vet', delete: state.user.role === 'vet' })}</td></tr>`).join('');
    return `${pageHeading(typeFilter ? 'Registro preventivo' : 'Expediente de cuidados', typeFilter ? 'Vacunaciones y desparasitaciones' : 'Historial de cuidados', typeFilter ? 'Documenta las aplicaciones y consulta las próximas fechas cuando se hayan informado.' : 'Consulta las atenciones registradas para cada mascota, desde la más reciente.', state.user.role === 'vet' ? `<button class="button button-secondary" data-action="create-care-vaccine">+ Vacunación</button><button class="button button-primary" data-action="create-care-deworm">+ Desparasitación</button>` : '')}<div class="summary-strip"><div class="summary-chip"><strong>${care.length}</strong> registros de cuidado</div><div class="summary-chip"><strong>${care.filter(c => c.type === 'Vacunación').length}</strong> vacunaciones</div><div class="summary-chip"><strong>${care.filter(c => c.type === 'Desparasitación').length}</strong> desparasitaciones</div></div>${searchToolbar('Buscar por mascota, tipo o descripción')}${tableMarkup(['Atención registrada', 'Mascota', 'Fecha de realización', 'Registrado por', 'Descripción', 'Acciones'], rows, 'Todavía no hay cuidados que coincidan con esta búsqueda.')}<div class="table-foot"><span>Ordenado por fecha, de más reciente a más antigua</span><span>El módulo registra información; no emite diagnósticos ni tratamientos.</span></div>`;
}
function renderAppointments() {
  const appointments = visibleRows(scopedAppointments(), a => `${petName(a.petId)} ${ownerName(a.ownerId)} ${a.reason} ${a.status} ${a.address}` ).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const rows = appointments.map(a => {
    let extra = '';
    if (state.user.role === 'vet' && !['cancelada', 'completada'].includes(a.status)) {
      if (a.status === 'pendiente') extra += `<button class="button button-small button-soft" data-action="appointment-confirm" data-id="${a.id}">Confirmar</button>`;
      extra += `<button class="button button-small button-secondary" data-action="appointment-complete" data-id="${a.id}">Completar</button><button class="button button-small button-danger" data-action="appointment-cancel" data-id="${a.id}">Cancelar</button>`;
    }
    return `<tr><td><span class="cell-title">${formatDate(a.date)}</span><span class="cell-subtitle">${formatTime(a.time)}</span></td><td><span class="cell-title">${escapeHTML(petName(a.petId))}</span><span class="cell-subtitle">${escapeHTML(ownerName(a.ownerId))}</span></td><td>${escapeHTML(a.reason)}</td><td>${escapeHTML(a.address)}</td><td>${appointmentPill(a.status)}</td><td>${state.user.role === 'vet' ? actionControls('appointment', a.id, { view: true, edit: true, extra }) : actionControls('appointment', a.id, { view: true, extra: a.status === 'pendiente' ? `<button class="action-button" title="Cancelar solicitud" aria-label="Cancelar solicitud" data-action="appointment-cancel" data-id="${a.id}">×</button>` : '' })}</td></tr>`;
  }).join('');
  const pending = scopedAppointments().filter(a => a.status === 'pendiente').length; const confirmed = scopedAppointments().filter(a => a.status === 'confirmada').length;
  return `${pageHeading('Atención veterinaria', state.user.role === 'owner' ? 'Mis citas' : 'Citas a domicilio', state.user.role === 'owner' ? 'Solicita una visita y consulta el estado de tus solicitudes.' : 'Administra solicitudes, confirmaciones y visitas realizadas.', button('Solicitar cita', 'create-appointment', '+', 'button-primary'))}<div class="summary-strip"><div class="summary-chip"><strong>${pending}</strong> pendientes</div><div class="summary-chip"><strong>${confirmed}</strong> confirmadas</div><div class="summary-chip"><strong>${scopedAppointments().filter(a => a.status === 'completada').length}</strong> completadas</div></div>${searchToolbar('Buscar por mascota, propietario o motivo', `<select class="filter-select" data-filter="appointment-status" aria-label="Filtrar por estado"><option value="">Todos los estados</option><option value="pendiente">Pendientes</option><option value="confirmada">Confirmadas</option><option value="completada">Completadas</option><option value="cancelada">Canceladas</option></select>`)}${tableMarkup(['Fecha y hora', 'Mascota / propietario', 'Motivo', 'Dirección', 'Estado', 'Acciones'], appointments.filter(a => !state.filters['appointment-status'] || a.status === state.filters['appointment-status']).map(a => {
    // Build filtered rows with the same controls as above.
    let extra = ''; if (state.user.role === 'vet' && !['cancelada','completada'].includes(a.status)) { if (a.status === 'pendiente') extra += `<button class="button button-small button-soft" data-action="appointment-confirm" data-id="${a.id}">Confirmar</button>`; extra += `<button class="button button-small button-secondary" data-action="appointment-complete" data-id="${a.id}">Completar</button><button class="button button-small button-danger" data-action="appointment-cancel" data-id="${a.id}">Cancelar</button>`; }
    return `<tr><td><span class="cell-title">${formatDate(a.date)}</span><span class="cell-subtitle">${formatTime(a.time)}</span></td><td><span class="cell-title">${escapeHTML(petName(a.petId))}</span><span class="cell-subtitle">${escapeHTML(ownerName(a.ownerId))}</span></td><td>${escapeHTML(a.reason)}</td><td>${escapeHTML(a.address)}</td><td>${appointmentPill(a.status)}</td><td>${state.user.role === 'vet' ? actionControls('appointment', a.id, { view: true, edit: true, extra }) : actionControls('appointment', a.id, { view: true, extra: a.status === 'pendiente' ? `<button class="action-button" title="Cancelar solicitud" aria-label="Cancelar solicitud" data-action="appointment-cancel" data-id="${a.id}">×</button>` : '' })}</td></tr>`;
  }).join(''), 'No hay citas que coincidan con el filtro.')}<div class="table-foot"><span>La agenda se ordena por fecha y hora.</span><span>Las citas de demostración no representan disponibilidad real.</span></div>`;
}
function renderEvents() {
  const pets = scopedPets(); const petIds = new Set(pets.map(p => p.id));
  let events = state.db.events.filter(e => petIds.has(e.petId));
  events = visibleRows(events, e => `${petName(e.petId)} ${e.type} ${e.description} ${e.observations}`);
  if (state.filters['event-pet']) events = events.filter(e => e.petId === state.filters['event-pet']);
  if (state.filters['event-type']) events = events.filter(e => e.type === state.filters['event-type']);
  if (state.filters['event-status']) events = events.filter(e => eventClassification(e).key === state.filters['event-status']);
  events.sort((a, b) => a.date.localeCompare(b.date));
  const rows = events.map(e => { const cls = eventClassification(e); const extra = state.user.role === 'vet' && e.status !== 'completado' ? `<button class="button button-small button-soft" data-action="complete-event" data-id="${e.id}">Completar</button>` : ''; return `<tr><td><span class="cell-title">${escapeHTML(e.description)}</span><span class="cell-subtitle">${escapeHTML(e.type)}</span></td><td>${escapeHTML(petName(e.petId))}</td><td>${formatDate(e.date)}</td><td>${statusPill(cls.label, cls.className)}</td><td>${escapeHTML(e.observations || '—')}</td><td>${actionControls('event', e.id, { view: true, edit: state.user.role === 'vet' && e.status !== 'completado', delete: state.user.role === 'vet', extra })}</td></tr>`; }).join('');
  const openEvents = state.db.events.filter(e => petIds.has(e.petId) && e.status !== 'completado');
  const overdue = openEvents.filter(e => eventClassification(e).key === 'vencido').length; const today = openEvents.filter(e => eventClassification(e).key === 'hoy').length; const next = openEvents.filter(e => eventClassification(e).key === 'proximo').length;
    const filterUI = `<select class="filter-select" data-filter="event-pet" aria-label="Filtrar por mascota"><option value="">Todas las mascotas</option>${pets.map(p => `<option value="${p.id}" ${state.filters['event-pet'] === p.id ? 'selected' : ''}>${escapeHTML(p.name)}</option>`).join('')}</select><select class="filter-select" data-filter="event-type" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>${['Vacunación','Desparasitación','Cita','Otro cuidado'].map(t => `<option ${state.filters['event-type'] === t ? 'selected' : ''}>${t}</option>`).join('')}</select><select class="filter-select" data-filter="event-status" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${[['vencido','Vencido'],['hoy','Para hoy'],['proximo','Próximo'],['programado','Programado'],['completado','Completado']].map(([v,l]) => `<option value="${v}" ${state.filters['event-status'] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `${pageHeading('Cuidado preventivo', 'Seguimiento y alertas', 'Las alertas se calculan desde las fechas programadas: próximo, para hoy, vencido o completado.', state.user.role === 'vet' ? button('Programar evento', 'create-event', '+', 'button-primary') : '')}<div class="stats-grid">${statsCard('!', '#ffebea', overdue, 'Eventos vencidos', 'Fechas pasadas aún pendientes')}${statsCard('◷', '#fff0db', today, 'Para hoy', 'Programados para la fecha actual')}${statsCard('↗', '#eaf3fb', next, 'Próximos 7 días', 'Pendientes de seguimiento')}${statsCard('✓', '#e8f4e5', state.db.events.filter(e => petIds.has(e.petId) && e.status === 'completado').length, 'Completados', 'Eventos marcados como realizados')}</div>${overdue ? `<div class="notice notice-warn"><strong>Atención:</strong> hay ${overdue} evento(s) con fecha vencida. Revisa el seguimiento y actualiza su estado cuando corresponda.</div>` : ''}${searchToolbar('Buscar evento, mascota o descripción', filterUI)}${tableMarkup(['Evento / descripción', 'Mascota', 'Fecha programada', 'Estado calculado', 'Observaciones', 'Acciones'], rows, 'No hay eventos que coincidan con los filtros.')}<div class="table-foot"><span>Estados calculados automáticamente según la fecha actual.</span><span>No se generan recomendaciones clínicas ni fechas automáticas.</span></div>`;
}
function renderProducts() {
  let records = visibleRows(scopedProducts(), p => `${p.name} ${p.category} ${p.description}`);
  if (state.filters['product-category']) records = records.filter(p => p.category === state.filters['product-category']);
  if (state.filters['product-availability'] === 'available') records = records.filter(p => p.stock > 0);
  if (state.filters['product-availability'] === 'low') records = records.filter(p => p.stock <= p.minStock);
  const isAdmin = state.user.role === 'admin';
  const rows = records.map(p => { const low = p.stock <= p.minStock; return `<tr><td><div class="primary-cell"><span class="table-avatar">${p.category === 'Alimentos' ? '🥣' : p.category === 'Higiene' ? '🧴' : p.category === 'Juguetes' ? '🪢' : p.category === 'Accesorios' ? '🦴' : '🩹'}</span><div><span class="cell-title">${escapeHTML(p.name)}</span><span class="cell-subtitle">ID ${escapeHTML(p.id)}</span></div></div></td><td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td><span class="cell-title">${p.stock} unidades</span><span class="cell-subtitle">Stock mínimo: ${p.minStock}</span></td><td>${low ? statusPill('Stock bajo', 'status-danger') : p.stock > 0 ? statusPill('Disponible', 'status-success') : statusPill('Agotado', 'status-neutral')}</td><td>${actionControls('product', p.id, { view: true, edit: isAdmin, delete: isAdmin })}</td></tr>`; }).join('');
  const filters = `<select class="filter-select" data-filter="product-category" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${['Alimentos','Higiene','Accesorios','Juguetes','Salud animal'].map(c => `<option value="${c}" ${state.filters['product-category'] === c ? 'selected' : ''}>${c}</option>`).join('')}</select><select class="filter-select" data-filter="product-availability" aria-label="Filtrar disponibilidad"><option value="">Toda disponibilidad</option><option value="available" ${state.filters['product-availability'] === 'available' ? 'selected' : ''}>Con existencias</option><option value="low" ${state.filters['product-availability'] === 'low' ? 'selected' : ''}>Stock bajo</option></select>`;
  return `${pageHeading(isAdmin ? 'Catálogo comercial' : 'Tienda PetDelicias', isAdmin ? 'Productos' : 'Catálogo de productos', isAdmin ? 'Administra referencias, precios y niveles de existencias.' : 'Consulta los productos del catálogo y su disponibilidad actual.', isAdmin ? button('Nuevo producto', 'create-product', '+', 'button-primary') : '')}<div class="summary-strip"><div class="summary-chip"><strong>${state.db.products.length}</strong> referencias</div><div class="summary-chip"><strong>${state.db.products.filter(p => p.stock > 0).length}</strong> disponibles</div><div class="summary-chip"><strong>${state.db.products.filter(p => p.stock <= p.minStock).length}</strong> con stock bajo</div></div>${state.db.products.some(p => p.stock <= p.minStock) ? `<div class="notice notice-warn">Algunas referencias tienen existencias iguales o inferiores al stock mínimo. Consulta el inventario para revisar sus cantidades.</div>` : ''}${searchToolbar('Buscar producto por nombre', filters)}${tableMarkup(['Producto', 'Categoría', 'Precio', 'Existencias', 'Disponibilidad', 'Acciones'], rows, 'No se encontraron productos.')}<div class="table-foot"><span>Los precios y cantidades son de demostración.</span><span>${isAdmin ? 'Las ventas y movimientos actualizan las existencias.' : 'La consulta del catálogo no permite modificar datos.'}</span></div>`;
}
function renderInventory() {
  const products = state.db.products; const movements = visibleRows([...state.db.movements].sort((a, b) => b.date.localeCompare(a.date)), m => `${productById(m.productId)?.name || ''} ${m.type} ${m.reason} ${m.user}`);
  const rows = movements.map(m => `<tr><td>${formatDate(m.date)}</td><td><span class="cell-title">${escapeHTML(productById(m.productId)?.name || 'Producto eliminado')}</span></td><td>${m.type === 'Entrada' ? statusPill('Entrada', 'status-success') : statusPill('Salida', 'status-warning')}</td><td><strong>${m.type === 'Entrada' ? '+' : '−'}${m.quantity}</strong></td><td>${escapeHTML(m.reason)}</td><td>${escapeHTML(m.user || 'Usuario')}</td></tr>`).join('');
  const low = products.filter(p => p.stock <= p.minStock);
  return `${pageHeading('Control comercial', 'Inventario', 'Consulta existencias y registra entradas o salidas sin permitir cantidades negativas.', button('Registrar movimiento', 'create-movement', '+', 'button-primary'))}<div class="stats-grid">${statsCard('▤', '#e8f4e5', products.reduce((sum, p) => sum + p.stock, 0), 'Unidades disponibles', 'Suma de las existencias actuales')}${statsCard('!', '#ffebea', low.length, 'Referencias con stock bajo', 'Existencias ≤ stock mínimo')}${statsCard('↗', '#eaf3fb', state.db.movements.filter(m => m.type === 'Entrada').length, 'Registros de entrada', 'Movimientos documentados')}${statsCard('↘', '#fff0db', state.db.movements.filter(m => m.type === 'Salida').length, 'Registros de salida', 'Incluye salidas por venta')}</div>${low.length ? `<div class="notice notice-warn"><strong>Revisar existencias:</strong> ${low.map(p => escapeHTML(p.name)).join(', ')}.</div>` : ''}<section class="panel"><div class="panel-header"><div><h2>Existencias actuales</h2><p>El valor se actualiza después de cada movimiento o venta.</p></div></div>${tableMarkup(['Producto', 'Categoría', 'Cantidad actual', 'Stock mínimo', 'Estado'], products.map(p => `<tr><td><span class="cell-title">${escapeHTML(p.name)}</span><span class="cell-subtitle">${escapeHTML(p.id)}</span></td><td>${escapeHTML(p.category)}</td><td><strong>${p.stock} un.</strong></td><td>${p.minStock} un.</td><td>${p.stock <= p.minStock ? statusPill('Stock bajo', 'status-danger') : statusPill('Normal', 'status-success')}</td></tr>`).join(''), 'No hay productos registrados.')}</section><section class="panel"><div class="panel-header"><div><h2>Historial de movimientos</h2><p>Entradas y salidas registradas en el prototipo.</p></div></div>${searchToolbar('Buscar por producto o motivo')}${tableMarkup(['Fecha', 'Producto', 'Movimiento', 'Cantidad', 'Motivo', 'Registrado por'], rows, 'Todavía no hay movimientos de inventario.')}</section>`;
}
function renderSales() {
  const records = visibleRows([...state.db.sales].sort((a, b) => b.date.localeCompare(a.date)), s => `${ownerName(s.ownerId)} ${s.status} ${s.items.map(i => i.name).join(' ')}`);
  const rows = records.map(s => `<tr><td><span class="cell-title">${escapeHTML(s.id)}</span><span class="cell-subtitle">${formatDate(s.date)}</span></td><td>${escapeHTML(ownerName(s.ownerId))}</td><td>${s.items.map(i => `${escapeHTML(i.name)} × ${i.quantity}`).join('<br>')}</td><td>${money(s.total)}</td><td>${s.status === 'cancelada' ? statusPill('Cancelada', 'status-neutral') : statusPill('Registrada', 'status-success')}</td><td>${actionControls('sale', s.id, { view: true, extra: s.status !== 'cancelada' ? `<button class="action-button danger" title="Cancelar venta y devolver existencias" aria-label="Cancelar venta" data-action="cancel-sale" data-id="${s.id}">↶</button>` : '' })}</td></tr>`).join('');
  const total = state.db.sales.filter(s => s.status !== 'cancelada').reduce((sum, s) => sum + s.total, 0);
  return `${pageHeading('Operación comercial', 'Ventas', 'Registra ventas, calcula subtotales y mantiene sincronizado el inventario.', button('Registrar venta', 'create-sale', '+', 'button-primary'))}<div class="summary-strip"><div class="summary-chip"><strong>${state.db.sales.filter(s => s.status !== 'cancelada').length}</strong> ventas vigentes</div><div class="summary-chip"><strong>${money(total)}</strong> valor acumulado</div><div class="summary-chip"><strong>${state.db.sales.filter(s => s.status === 'cancelada').length}</strong> canceladas</div></div><div class="notice notice-info">Al registrar una venta se descuentan las unidades disponibles. Al cancelarla, las existencias se devuelven una sola vez.</div>${searchToolbar('Buscar por cliente, producto o código')}${tableMarkup(['Venta / fecha', 'Cliente', 'Productos y cantidades', 'Total', 'Estado', 'Acciones'], rows, 'No hay ventas que coincidan con la búsqueda.')}<div class="table-foot"><span>Las ventas canceladas se conservan como historial.</span><span>El total excluye las ventas canceladas.</span></div>`;
}
function renderUsers() {
  const records = visibleRows(state.db.users, u => `${u.name} ${u.email} ${ROLE_LABELS[u.role] || u.role}`);
  const rows = records.map(u => `<tr><td><div class="primary-cell">${ownerAvatar(u.name)}<div><span class="cell-title">${escapeHTML(u.name)}</span><span class="cell-subtitle">${escapeHTML(u.email)}</span></div></div></td><td>${escapeHTML(ROLE_LABELS[u.role] || u.role)}</td><td>${u.role === 'owner' ? escapeHTML(ownerName(u.ownerId)) : '—'}</td><td>${u.active !== false ? statusPill('Activo', 'status-success') : statusPill('Inactivo', 'status-neutral')}</td><td>${actionControls('user', u.id, { edit: true, extra: `<button class="button button-small ${u.active !== false ? 'button-danger' : 'button-soft'}" data-action="toggle-user" data-id="${u.id}">${u.active !== false ? 'Desactivar' : 'Activar'}</button>` })}</td></tr>`).join('');
  return `${pageHeading('Administración', 'Usuarios y roles', 'Gestiona las cuentas ficticias utilizadas para probar los distintos perfiles.', button('Nuevo usuario', 'create-user', '+', 'button-primary'))}<div class="notice notice-warn">Los perfiles y permisos se simulan en el navegador. No son un mecanismo de autenticación seguro para producción.</div>${searchToolbar('Buscar por nombre, correo o rol')}${tableMarkup(['Usuario', 'Perfil asignado', 'Propietario vinculado', 'Estado', 'Acciones'], rows, 'No hay usuarios registrados.') }<div class="table-foot"><span>Las cuentas de prueba permiten comparar las interfaces por rol.</span><span>Contraseña predeterminada al crear un usuario: petdemo123.</span></div>`;
}
function renderModule(moduleName) {
  switch (moduleName) {
    case 'home': return renderHome();
    case 'owners': return renderOwners();
    case 'pets': return renderPets();
    case 'care': return renderCare();
    case 'care-types': return renderCare(['Vacunación', 'Desparasitación']);
    case 'appointments': return renderAppointments();
    case 'events': return renderEvents();
    case 'products': return renderProducts();
    case 'inventory': return renderInventory();
    case 'sales': return renderSales();
    case 'users': return renderUsers();
    default: return renderHome();
  }
}
function navigate(moduleName) {
  if (!MODULE_META[moduleName]) return;
  if (!ensurePermission(moduleName)) return;
  state.module = moduleName; state.search = ''; state.filters = {}; state.selectedPetId = '';
  renderApp(); $('#sidebar').classList.remove('sidebar-open'); $('#sidebarScrim').classList.remove('visible'); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function optionsList(items, selected, labelFn, emptyLabel = 'Selecciona una opción') {
  return `<option value="">${emptyLabel}</option>${items.map(item => `<option value="${escapeHTML(item.id)}" ${String(selected || '') === String(item.id) ? 'selected' : ''}>${escapeHTML(labelFn(item))}</option>`).join('')}`;
}
function field(name, label, value = '', type = 'text', opts = {}) {
  const req = opts.required ? 'required' : ''; const full = opts.full ? 'full' : ''; const placeholder = opts.placeholder ? `placeholder="${escapeHTML(opts.placeholder)}"` : '';
  if (opts.options) return `<div class="field ${full}"><label for="f-${name}">${escapeHTML(label)}${opts.required ? ' <span class="required">*</span>' : ''}</label><select id="f-${name}" name="${name}" ${req} ${opts.disabled ? 'disabled' : ''}>${opts.options}</select>${opts.hint ? `<small class="hint">${escapeHTML(opts.hint)}</small>` : ''}</div>`;
  if (opts.textarea) return `<div class="field ${full}"><label for="f-${name}">${escapeHTML(label)}${opts.required ? ' <span class="required">*</span>' : ''}</label><textarea id="f-${name}" name="${name}" ${req} ${placeholder} rows="${opts.rows || 3}">${escapeHTML(value || '')}</textarea>${opts.hint ? `<small class="hint">${escapeHTML(opts.hint)}</small>` : ''}</div>`;
  const min = opts.min !== undefined ? `min="${opts.min}"` : ''; const max = opts.max !== undefined ? `max="${opts.max}"` : ''; const step = opts.step ? `step="${opts.step}"` : ''; const maxLength = opts.maxLength ? `maxlength="${opts.maxLength}"` : '';
  return `<div class="field ${full}"><label for="f-${name}">${escapeHTML(label)}${opts.required ? ' <span class="required">*</span>' : ''}</label><input id="f-${name}" type="${type}" name="${name}" value="${escapeHTML(value ?? '')}" ${req} ${placeholder} ${min} ${max} ${step} ${maxLength} ${opts.readonly ? 'readonly' : ''} ${opts.autocomplete ? `autocomplete="${opts.autocomplete}"` : ''}>${opts.hint ? `<small class="hint">${escapeHTML(opts.hint)}</small>` : ''}</div>`;
}
function openModal({ title, subtitle = '', body, formId = '', submitText = 'Guardar', wide = false, hideFooter = false }) {
  const root = $('#modalRoot'); state.modal = { formId };
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><section class="modal-card ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="modal-head"><div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(subtitle)}</p></div><button type="button" class="modal-close" data-action="close-modal" aria-label="Cerrar ventana">×</button></div>${formId ? `<form id="${formId}" data-form="${formId}"><div class="modal-body">${body}</div>${hideFooter ? '' : `<div class="modal-footer"><button type="button" class="button button-secondary" data-action="close-modal">Cancelar</button><button type="submit" class="button button-primary">${escapeHTML(submitText)}</button></div>`}</form>` : `<div class="modal-body">${body}</div><div class="modal-footer"><button type="button" class="button button-secondary" data-action="close-modal">Cerrar</button></div>`}</section></div>`;
  const first = $('input:not([type="hidden"]), select, textarea, button', root); if (first) first.focus();
}
function closeModal() { $('#modalRoot').innerHTML = ''; state.modal = null; }
function modalOwnerOptions(selected = '') { const owners = state.user.role === 'owner' ? state.db.owners.filter(o => o.id === state.user.ownerId) : state.db.owners; return optionsList(owners, selected, o => `${o.name} · ${o.document}`); }
function modalPetOptions(selected = '', ownerId = '') { const pets = scopedPets().filter(p => !ownerId || p.ownerId === ownerId); return optionsList(pets, selected, p => `${p.name} (${p.species})`); }
function modalProductOptions(selected = '') { return optionsList(state.db.products, selected, p => `${p.name} · ${money(p.price)} · ${p.stock} disponibles`); }
function formOwner(record = {}) {
  const editing = Boolean(record.id); const body = `<div class="form-grid">${field('name', 'Nombre completo', record.name, 'text', { required: true, maxLength: 90, placeholder: 'Ej. Laura Martínez' })}${field('document', 'Documento de demostración', record.document, 'text', { required: true, maxLength: 24, placeholder: 'Número ficticio' })}${field('phone', 'Teléfono', record.phone, 'tel', { required: true, maxLength: 30, placeholder: '300 555 0000' })}${field('email', 'Correo electrónico', record.email, 'email', { required: true, placeholder: 'correo@ejemplo.demo' })}${field('address', 'Dirección', record.address, 'text', { required: true, full: true, maxLength: 160, placeholder: 'Dirección para contacto o visita' })}</div>`;
  openModal({ title: editing ? 'Editar propietario' : 'Registrar propietario', subtitle: 'Los campos marcados con * son obligatorios.', body, formId: 'ownerForm', submitText: editing ? 'Guardar cambios' : 'Registrar propietario' });
  $('#ownerForm').dataset.id = record.id || '';
}
function formPet(record = {}) {
  const editing = Boolean(record.id); const owners = state.db.owners; const body = `<div class="form-grid">${field('name', 'Nombre de la mascota', record.name, 'text', { required: true, placeholder: 'Ej. Max' })}${field('ownerId', 'Propietario asociado', record.ownerId, 'text', { required: true, options: optionsList(owners, record.ownerId, o => o.name), hint: 'La mascota debe estar vinculada a un propietario registrado.' })}${field('species', 'Especie', record.species, 'text', { required: true, options: ['Perro','Gato','Ave','Conejo','Otro'].map(s => `<option ${record.species === s ? 'selected' : ''}>${s}</option>`).join('') })}${field('breed', 'Raza', record.breed, 'text', { placeholder: 'Raza o tipo, si se conoce' })}${field('sex', 'Sexo', record.sex, 'text', { options: ['No especificado','Macho','Hembra'].map(s => `<option ${((record.sex || 'No especificado') === s) ? 'selected' : ''}>${s}</option>`).join('') })}${field('birthDate', 'Fecha de nacimiento', record.birthDate, 'date', { max: todayISO(), hint: 'Opcional.' })}${field('weight', 'Peso (kg)', record.weight, 'number', { min: 0.01, step: 0.01, placeholder: 'Ej. 4.5' })}${field('observations', 'Observaciones', record.observations, 'text', { full: true, placeholder: 'Información básica relevante', maxLength: 500 })}</div>`;
  openModal({ title: editing ? 'Editar mascota' : 'Registrar mascota', subtitle: 'Completa los datos conocidos. El propietario es obligatorio.', body, formId: 'petForm', submitText: editing ? 'Guardar cambios' : 'Registrar mascota' }); $('#petForm').dataset.id = record.id || '';
}
function formCare(record = {}, forcedType = '') {
  const editing = Boolean(record.id); const type = forcedType || record.type || 'Atención';
  const types = ['Vacunación','Desparasitación','Atención','Otro cuidado'];
  const body = `<div class="form-grid">${field('petId', 'Mascota', record.petId || state.selectedPetId, 'text', { required: true, options: modalPetOptions(record.petId || state.selectedPetId) })}${field('type', 'Tipo de cuidado', type, 'text', { required: true, options: types.map(t => `<option ${type === t ? 'selected' : ''}>${t}</option>`).join('') })}${field('title', type === 'Vacunación' ? 'Nombre de la vacuna' : type === 'Desparasitación' ? 'Producto o procedimiento' : 'Nombre de la atención', record.title, 'text', { required: true, placeholder: 'Describe el cuidado realizado' })}${field('date', 'Fecha de realización', record.date || todayISO(), 'date', { required: true, max: todayISO() })}${field('nextDate', 'Próxima fecha programada (opcional)', record.nextDate || '', 'date', { min: todayISO(), hint: 'Si se registra, se creará un evento de seguimiento. No se asignan fechas automáticamente.' })}${field('description', 'Descripción', record.description, 'text', { full: true, placeholder: 'Descripción breve de la atención' })}${field('observations', 'Observaciones', record.observations, 'text', { full: true, placeholder: 'Notas aportadas por el personal autorizado' })}</div>`;
  openModal({ title: editing ? 'Editar cuidado' : type === 'Vacunación' ? 'Registrar vacunación' : type === 'Desparasitación' ? 'Registrar desparasitación' : 'Registrar atención', subtitle: 'Este registro documenta información aportada por el usuario; no genera diagnósticos.', body, formId: 'careForm', submitText: editing ? 'Guardar cambios' : 'Guardar registro' }); $('#careForm').dataset.id = record.id || '';
}
function formAppointment(record = {}) {
  const editing = Boolean(record.id); const ownerId = record.ownerId || (state.user.role === 'owner' ? state.user.ownerId : ''); const pets = state.db.pets.filter(p => state.user.role !== 'owner' ? (!ownerId || p.ownerId === ownerId) : p.ownerId === state.user.ownerId);
  const minDate = todayISO(); const body = `<div class="form-grid">${field('ownerId', 'Propietario', ownerId, 'text', { required: true, options: modalOwnerOptions(ownerId), disabled: state.user.role === 'owner' })}${field('petId', 'Mascota', record.petId, 'text', { required: true, options: optionsList(pets, record.petId, p => `${p.name} (${p.species})`) })}${field('date', 'Fecha solicitada', record.date || addDays(1), 'date', { required: true, min: minDate })}${field('time', 'Hora solicitada', record.time || '09:00', 'time', { required: true })}${field('address', 'Dirección del servicio', record.address || (ownerId ? ownerById(ownerId)?.address : ''), 'text', { required: true, full: true, maxLength: 180 })}${field('reason', 'Motivo de la solicitud', record.reason, 'text', { required: true, full: true, placeholder: 'Ej. Valoración veterinaria a domicilio' })}${field('observations', 'Observaciones', record.observations, 'text', { full: true, placeholder: 'Información adicional para la visita' })}${editing ? field('status', 'Estado de la cita', record.status, 'text', { required: true, options: ['pendiente','confirmada','completada','cancelada'].map(s => `<option value="${s}" ${record.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('') }) : ''}</div>`;
  openModal({ title: editing ? 'Editar cita' : 'Solicitar cita veterinaria', subtitle: 'La fecha y hora solicitadas deben ser actuales o futuras. La solicitud queda pendiente de confirmación.', body, formId: 'appointmentForm', submitText: editing ? 'Guardar cambios' : 'Enviar solicitud' }); $('#appointmentForm').dataset.id = record.id || ''; if (state.user.role === 'owner') $('#f-ownerId').disabled = false;
}
function formEvent(record = {}) {
  const editing = Boolean(record.id); const body = `<div class="form-grid">${field('petId', 'Mascota', record.petId || state.selectedPetId, 'text', { required: true, options: modalPetOptions(record.petId || state.selectedPetId) })}${field('type', 'Tipo de evento', record.type || 'Vacunación', 'text', { required: true, options: ['Vacunación','Desparasitación','Cita','Otro cuidado'].map(t => `<option ${record.type === t ? 'selected' : (!record.type && t === 'Vacunación' ? 'selected' : '')}>${t}</option>`).join('') })}${field('description', 'Descripción del evento', record.description, 'text', { required: true, full: true, placeholder: 'Ej. Seguimiento preventivo programado' })}${field('date', 'Fecha programada', record.date || addDays(7), 'date', { required: true })}${field('status', 'Estado', record.status || 'pendiente', 'text', { required: true, options: ['pendiente','completado'].map(s => `<option value="${s}" ${(record.status || 'pendiente') === s ? 'selected' : ''}>${s === 'pendiente' ? 'Pendiente' : 'Completado'}</option>`).join('') })}${field('observations', 'Observaciones', record.observations, 'text', { full: true, placeholder: 'Notas opcionales' })}</div>`;
  openModal({ title: editing ? 'Editar evento preventivo' : 'Programar evento preventivo', subtitle: 'La alerta se clasifica automáticamente según la fecha registrada.', body, formId: 'eventForm', submitText: editing ? 'Guardar cambios' : 'Programar evento' }); $('#eventForm').dataset.id = record.id || '';
}
function formProduct(record = {}) {
      const editing = Boolean(record.id); const body = `<div class="form-grid">${field('name', 'Nombre del producto', record.name, 'text', { required: true, full: true, maxLength: 100 })}${field('category', 'Categoría', record.category || 'Alimentos', 'text', { required: true, options: ['Alimentos','Higiene','Accesorios','Juguetes','Salud animal'].map(c => `<option ${record.category === c ? 'selected' : (!record.category && c === 'Alimentos' ? 'selected' : '')}>${c}</option>`).join('') })}${field('price', 'Precio de venta (COP)', record.price ?? '', 'number', { required: true, min: 1, step: 1 })}${field('stock', 'Cantidad disponible', record.stock ?? 0, 'number', { required: true, min: 0, step: 1, readonly: editing, hint: editing ? 'Campo de solo lectura: para ajustar existencias, utiliza el módulo Inventario.' : 'Cantidad inicial para crear la referencia.' })}${field('minStock', 'Stock mínimo de referencia', record.minStock ?? 5, 'number', { required: true, min: 0, step: 1 })}${field('description', 'Descripción', record.description, 'text', { full: true, maxLength: 350 })}</div>`;
  openModal({ title: editing ? 'Editar producto' : 'Registrar producto', subtitle: 'El stock bajo se indica cuando las existencias son iguales o inferiores al mínimo.', body, formId: 'productForm', submitText: editing ? 'Guardar cambios' : 'Crear producto' }); $('#productForm').dataset.id = record.id || '';
}
function formMovement() {
  const productOptions = optionsList(state.db.products, '', p => `${p.name} · ${p.stock} disponibles`);
  const body = `<div class="form-grid">${field('productId', 'Producto', '', 'text', { required: true, options: productOptions, full: true })}${field('type', 'Tipo de movimiento', 'Entrada', 'text', { required: true, options: ['Entrada','Salida'].map(t => `<option>${t}</option>`).join('') })}${field('quantity', 'Cantidad de unidades', '', 'number', { required: true, min: 1, step: 1 })}${field('date', 'Fecha del movimiento', todayISO(), 'date', { required: true, max: todayISO() })}${field('reason', 'Motivo', '', 'text', { required: true, full: true, placeholder: 'Ej. Reposición de proveedor o ajuste autorizado' })}</div>`;
  openModal({ title: 'Registrar movimiento de inventario', subtitle: 'Las salidas se validan contra las existencias actuales.', body, formId: 'movementForm', submitText: 'Registrar movimiento' });
}
function formSale() {
  const ownerOptions = optionsList(state.db.owners, '', o => o.name);
  const body = `<div class="form-grid">${field('ownerId', 'Cliente / propietario (opcional)', '', 'text', { options: ownerOptions, full: true })}<div class="field full"><label>Productos de la venta <span class="required">*</span></label><div class="sale-items-heading"><span>Producto</span><span>Cantidad</span><span>Subtotal</span><span></span></div><div id="saleItems"></div><button type="button" class="button button-secondary button-small" data-action="add-sale-item">+ Agregar producto</button><small class="hint">Solo puedes vender referencias con existencias suficientes. El precio se toma del catálogo y queda guardado como referencia histórica.</small></div></div><div class="sale-total"><span>Total de la venta</span><strong id="saleTotal">$ 0</strong></div>`;
  openModal({ title: 'Registrar venta', subtitle: 'Selecciona uno o varios productos y valida las existencias antes de confirmar.', body, formId: 'saleForm', submitText: 'Confirmar venta', wide: true });
  addSaleItemRow();
}
function addSaleItemRow() {
  const root = $('#saleItems'); if (!root) return;
  const row = document.createElement('div'); row.className = 'sale-item-row';
  row.innerHTML = `<select name="productId" aria-label="Producto" required>${optionsList(state.db.products.filter(p => p.stock > 0), '', p => `${p.name} (${p.stock} disp.)`)}</select><input name="quantity" type="number" min="1" step="1" value="1" aria-label="Cantidad" required><input name="subtotal" type="text" value="$ 0" aria-label="Subtotal" readonly><button type="button" class="action-button danger" data-action="remove-sale-item" aria-label="Quitar producto">×</button>`;
  root.appendChild(row); row.querySelectorAll('select,input[name="quantity"]').forEach(el => el.addEventListener('change', recalculateSale)); row.querySelectorAll('select,input[name="quantity"]').forEach(el => el.addEventListener('input', recalculateSale)); recalculateSale();
}
function recalculateSale() {
  const rows = $$('.sale-item-row', $('#modalRoot')); let total = 0;
  rows.forEach(row => { const product = productById($('select[name="productId"]', row)?.value); const qty = Number($('input[name="quantity"]', row)?.value || 0); const subtotal = product && Number.isInteger(qty) && qty > 0 ? product.price * qty : 0; total += subtotal; const sub = $('input[name="subtotal"]', row); if (sub) sub.value = money(subtotal); });
  const totalNode = $('#saleTotal'); if (totalNode) totalNode.textContent = money(total);
}
function showDetails(title, subtitle, body) { openModal({ title, subtitle, body, formId: '', hideFooter: true, wide: true }); }
function viewOwner(id) { const o = ownerById(id); if (!o) return; const pets = state.db.pets.filter(p => p.ownerId === id); const body = `<div class="detail-card"><div class="detail-field"><small>Identificador</small><strong>${escapeHTML(o.id)}</strong></div><div class="detail-field"><small>Documento</small><strong>${escapeHTML(o.document)}</strong></div><div class="detail-field"><small>Teléfono</small><strong>${escapeHTML(o.phone)}</strong></div><div class="detail-field"><small>Correo</small><strong>${escapeHTML(o.email)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Dirección</small><strong>${escapeHTML(o.address)}</strong></div></div><div class="subsection-heading"><h3>Mascotas asociadas (${pets.length})</h3></div>${pets.length ? tableMarkup(['Mascota','Especie','Raza'], pets.map(p => `<tr><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.species)}</td><td>${escapeHTML(p.breed || '—')}</td></tr>`).join('')) : emptyState('Sin mascotas asociadas','Este propietario todavía no tiene mascotas registradas.')}`; showDetails('Ficha del propietario', o.name, body); }
function viewPet(id) { const p = petById(id); if (!p) return; const care = state.db.care.filter(c => c.petId === id).sort((a,b)=>b.date.localeCompare(a.date)); const events = state.db.events.filter(e => e.petId === id).sort((a,b)=>a.date.localeCompare(b.date)); const appointments = state.db.appointments.filter(a => a.petId === id).sort((a,b)=>b.date.localeCompare(a.date)); const body = `<div class="detail-card"><div class="detail-field"><small>Identificador</small><strong>${escapeHTML(p.id)}</strong></div><div class="detail-field"><small>Especie</small><strong>${escapeHTML(p.species)}</strong></div><div class="detail-field"><small>Raza</small><strong>${escapeHTML(p.breed || 'No registrada')}</strong></div><div class="detail-field"><small>Sexo</small><strong>${escapeHTML(p.sex || 'No indicado')}</strong></div><div class="detail-field"><small>Fecha de nacimiento</small><strong>${formatDate(p.birthDate)}</strong></div><div class="detail-field"><small>Peso</small><strong>${p.weight ? `${escapeHTML(p.weight)} kg` : 'No registrado'}</strong></div><div class="detail-field"><small>Propietario</small><strong>${escapeHTML(ownerName(p.ownerId))}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(p.observations || 'Sin observaciones registradas')}</strong></div></div><div class="subsection-heading"><h3>Historial de cuidados (${care.length})</h3><button class="text-link" data-action="pet-history" data-id="${p.id}">Abrir historial →</button></div>${care.length ? tableMarkup(['Fecha','Tipo','Atención','Registrado por'], care.slice(0,5).map(c=>`<tr><td>${formatDate(c.date)}</td><td>${escapeHTML(c.type)}</td><td>${escapeHTML(c.title || c.description)}</td><td>${escapeHTML(c.recordedBy || 'Usuario')}</td></tr>`).join('')) : emptyState('Sin cuidados registrados','Cuando se registre una atención aparecerá aquí.')}<div class="subsection-heading"><h3>Eventos preventivos (${events.length})</h3></div>${events.length ? tableMarkup(['Evento','Fecha','Estado'], events.map(e=>`<tr><td>${escapeHTML(e.description)}</td><td>${formatDate(e.date)}</td><td>${statusPill(eventClassification(e).label,eventClassification(e).className)}</td></tr>`).join('')) : emptyState('Sin eventos preventivos','No hay eventos programados para esta mascota.')}<div class="subsection-heading"><h3>Citas (${appointments.length})</h3></div>${appointments.length ? tableMarkup(['Fecha','Motivo','Estado'], appointments.map(a=>`<tr><td>${formatDate(a.date)} · ${formatTime(a.time)}</td><td>${escapeHTML(a.reason)}</td><td>${appointmentPill(a.status)}</td></tr>`).join('')) : emptyState('Sin citas','No hay citas registradas para esta mascota.')}`; showDetails(`Ficha de ${p.name}`, `Información general y seguimiento de ${p.name}.`, body); }
function viewCare(id) { const c = state.db.care.find(x => x.id === id); if (!c) return; const body = `<div class="detail-card"><div class="detail-field"><small>Mascota</small><strong>${escapeHTML(petName(c.petId))}</strong></div><div class="detail-field"><small>Tipo de cuidado</small><strong>${escapeHTML(c.type)}</strong></div><div class="detail-field"><small>Fecha de realización</small><strong>${formatDate(c.date)}</strong></div><div class="detail-field"><small>Registrado por</small><strong>${escapeHTML(c.recordedBy || 'Usuario')}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Descripción</small><strong>${escapeHTML(c.description || c.title)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(c.observations || 'Sin observaciones')}</strong></div></div>`; showDetails(c.title || c.type, 'Detalle del cuidado registrado', body); }
function viewAppointment(id) { const a = state.db.appointments.find(x => x.id === id); if (!a) return; const body = `<div class="detail-card"><div class="detail-field"><small>Propietario</small><strong>${escapeHTML(ownerName(a.ownerId))}</strong></div><div class="detail-field"><small>Mascota</small><strong>${escapeHTML(petName(a.petId))}</strong></div><div class="detail-field"><small>Fecha y hora</small><strong>${formatDate(a.date)} · ${formatTime(a.time)}</strong></div><div class="detail-field"><small>Estado</small><strong>${appointmentPill(a.status)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Dirección del servicio</small><strong>${escapeHTML(a.address)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Motivo</small><strong>${escapeHTML(a.reason)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(a.observations || 'Sin observaciones')}</strong></div></div>`; showDetails('Detalle de la cita', 'Solicitud de atención veterinaria a domicilio', body); }
function viewEvent(id) { const e = state.db.events.find(x => x.id === id); if (!e) return; const cls = eventClassification(e); const body = `<div class="detail-card"><div class="detail-field"><small>Mascota</small><strong>${escapeHTML(petName(e.petId))}</strong></div><div class="detail-field"><small>Tipo</small><strong>${escapeHTML(e.type)}</strong></div><div class="detail-field"><small>Fecha programada</small><strong>${formatDate(e.date)}</strong></div><div class="detail-field"><small>Estado calculado</small><strong>${statusPill(cls.label, cls.className)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Descripción</small><strong>${escapeHTML(e.description)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(e.observations || 'Sin observaciones')}</strong></div></div>`; showDetails('Detalle del evento preventivo', 'El estado se determina a partir de la fecha guardada.', body); }
function viewProduct(id) { const p = productById(id); if (!p) return; const body = `<div class="detail-card"><div class="detail-field"><small>Identificador</small><strong>${escapeHTML(p.id)}</strong></div><div class="detail-field"><small>Categoría</small><strong>${escapeHTML(p.category)}</strong></div><div class="detail-field"><small>Precio de venta</small><strong>${money(p.price)}</strong></div><div class="detail-field"><small>Existencias</small><strong>${p.stock} unidades</strong></div><div class="detail-field"><small>Stock mínimo</small><strong>${p.minStock} unidades</strong></div><div class="detail-field"><small>Disponibilidad</small><strong>${p.stock <= p.minStock ? statusPill('Stock bajo','status-danger') : statusPill('Disponible','status-success')}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Descripción</small><strong>${escapeHTML(p.description || 'Sin descripción')}</strong></div></div>`; showDetails(p.name, 'Detalle del producto', body); }
function viewSale(id) { const s = state.db.sales.find(x => x.id === id); if (!s) return; const body = `<div class="detail-card"><div class="detail-field"><small>Número</small><strong>${escapeHTML(s.id)}</strong></div><div class="detail-field"><small>Fecha</small><strong>${formatDate(s.date)}</strong></div><div class="detail-field"><small>Cliente</small><strong>${escapeHTML(ownerName(s.ownerId))}</strong></div><div class="detail-field"><small>Estado</small><strong>${s.status === 'cancelada' ? 'Cancelada' : 'Registrada'}</strong></div></div><div class="subsection-heading"><h3>Productos vendidos</h3></div>${tableMarkup(['Producto','Cantidad','Precio unitario','Subtotal'], s.items.map(i=>`<tr><td>${escapeHTML(i.name)}</td><td>${i.quantity}</td><td>${money(i.price)}</td><td>${money(i.subtotal)}</td></tr>`).join(''))}<div class="sale-total"><span>Total de la venta</span><strong>${money(s.total)}</strong></div>`; showDetails('Detalle de la venta', 'Los productos se conservan como referencia histórica.', body); }
function viewPet(id) { const p = petById(id); if (!p) return; const care = state.db.care.filter(c => c.petId === id).sort((a,b)=>b.date.localeCompare(a.date)); const events = state.db.events.filter(e => e.petId === id).sort((a,b)=>a.date.localeCompare(b.date)); const appointments = state.db.appointments.filter(a => a.petId === id).sort((a,b)=>b.date.localeCompare(a.date)); const body = `<div class="detail-card"><div class="detail-field"><small>Identificador</small><strong>${escapeHTML(p.id)}</strong></div><div class="detail-field"><small>Especie</small><strong>${escapeHTML(p.species)}</strong></div><div class="detail-field"><small>Raza</small><strong>${escapeHTML(p.breed || 'No registrada')}</strong></div><div class="detail-field"><small>Sexo</small><strong>${escapeHTML(p.sex || 'No indicado')}</strong></div><div class="detail-field"><small>Fecha de nacimiento</small><strong>${formatDate(p.birthDate)}</strong></div><div class="detail-field"><small>Peso</small><strong>${p.weight ? `${escapeHTML(p.weight)} kg` : 'No registrado'}</strong></div><div class="detail-field"><small>Propietario</small><strong>${escapeHTML(ownerName(p.ownerId))}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(p.observations || 'Sin observaciones registradas')}</strong></div></div><div class="subsection-heading"><h3>Historial de cuidados (${care.length})</h3><button class="text-link" data-action="pet-history" data-id="${p.id}">Abrir historial →</button></div>${care.length ? tableMarkup(['Fecha','Tipo','Atención','Registrado por'], care.slice(0,5).map(c=>`<tr><td>${formatDate(c.date)}</td><td>${escapeHTML(c.type)}</td><td>${escapeHTML(c.title || c.description)}</td><td>${escapeHTML(c.recordedBy || 'Usuario')}</td></tr>`).join('')) : emptyState('Sin cuidados registrados','Cuando se registre una atención aparecerá aquí.')}<div class="subsection-heading"><h3>Eventos preventivos (${events.length})</h3></div>${events.length ? tableMarkup(['Evento','Fecha','Estado'], events.map(e=>`<tr><td>${escapeHTML(e.description)}</td><td>${formatDate(e.date)}</td><td>${statusPill(eventClassification(e).label,eventClassification(e).className)}</td></tr>`).join('')) : emptyState('Sin eventos preventivos','No hay eventos programados para esta mascota.')}<div class="subsection-heading"><h3>Citas (${appointments.length})</h3></div>${appointments.length ? tableMarkup(['Fecha','Motivo','Estado'], appointments.map(a=>`<tr><td>${formatDate(a.date)} · ${formatTime(a.time)}</td><td>${escapeHTML(a.reason)}</td><td>${appointmentPill(a.status)}</td></tr>`).join('')) : emptyState('Sin citas','No hay citas registradas para esta mascota.')}`; showDetails(`Ficha de ${p.name}`, `Información general y seguimiento de ${p.name}.`, body); }
function viewCare(id) { const c = state.db.care.find(x => x.id === id); if (!c) return; const body = `<div class="detail-card"><div class="detail-field"><small>Mascota</small><strong>${escapeHTML(petName(c.petId))}</strong></div><div class="detail-field"><small>Tipo de cuidado</small><strong>${escapeHTML(c.type)}</strong></div><div class="detail-field"><small>Fecha de realización</small><strong>${formatDate(c.date)}</strong></div><div class="detail-field"><small>Registrado por</small><strong>${escapeHTML(c.recordedBy || 'Usuario')}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Descripción</small><strong>${escapeHTML(c.description || c.title)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(c.observations || 'Sin observaciones')}</strong></div></div>`; showDetails(c.title || c.type, 'Detalle del cuidado registrado', body); }
function viewAppointment(id) { const a = state.db.appointments.find(x => x.id === id); if (!a) return; const body = `<div class="detail-card"><div class="detail-field"><small>Propietario</small><strong>${escapeHTML(ownerName(a.ownerId))}</strong></div><div class="detail-field"><small>Mascota</small><strong>${escapeHTML(petName(a.petId))}</strong></div><div class="detail-field"><small>Fecha y hora</small><strong>${formatDate(a.date)} · ${formatTime(a.time)}</strong></div><div class="detail-field"><small>Estado</small><strong>${appointmentPill(a.status)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Dirección del servicio</small><strong>${escapeHTML(a.address)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Motivo</small><strong>${escapeHTML(a.reason)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(a.observations || 'Sin observaciones')}</strong></div></div>`; showDetails('Detalle de la cita', 'Solicitud de atención veterinaria a domicilio', body); }
function viewEvent(id) { const e = state.db.events.find(x => x.id === id); if (!e) return; const cls = eventClassification(e); const body = `<div class="detail-card"><div class="detail-field"><small>Mascota</small><strong>${escapeHTML(petName(e.petId))}</strong></div><div class="detail-field"><small>Tipo</small><strong>${escapeHTML(e.type)}</strong></div><div class="detail-field"><small>Fecha programada</small><strong>${formatDate(e.date)}</strong></div><div class="detail-field"><small>Estado calculado</small><strong>${statusPill(cls.label, cls.className)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Descripción</small><strong>${escapeHTML(e.description)}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Observaciones</small><strong>${escapeHTML(e.observations || 'Sin observaciones')}</strong></div></div>`; showDetails('Detalle del evento preventivo', 'El estado se determina a partir de la fecha guardada.', body); }
function viewProduct(id) { const p = productById(id); if (!p) return; const body = `<div class="detail-card"><div class="detail-field"><small>Identificador</small><strong>${escapeHTML(p.id)}</strong></div><div class="detail-field"><small>Categoría</small><strong>${escapeHTML(p.category)}</strong></div><div class="detail-field"><small>Precio de venta</small><strong>${money(p.price)}</strong></div><div class="detail-field"><small>Existencias</small><strong>${p.stock} unidades</strong></div><div class="detail-field"><small>Stock mínimo</small><strong>${p.minStock} unidades</strong></div><div class="detail-field"><small>Disponibilidad</small><strong>${p.stock <= p.minStock ? statusPill('Stock bajo','status-danger') : statusPill('Disponible','status-success')}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Descripción</small><strong>${escapeHTML(p.description || 'Sin descripción')}</strong></div></div>`; showDetails(p.name, 'Detalle del producto', body); }
function viewSale(id) { const s = state.db.sales.find(x => x.id === id); if (!s) return; const body = `<div class="detail-card"><div class="detail-field"><small>Número</small><strong>${escapeHTML(s.id)}</strong></div><div class="detail-field"><small>Fecha</small><strong>${formatDate(s.date)}</strong></div><div class="detail-field"><small>Cliente</small><strong>${escapeHTML(ownerName(s.ownerId))}</strong></div><div class="detail-field"><small>Estado</small><strong>${s.status === 'cancelada' ? 'Cancelada' : 'Registrada'}</strong></div></div><div class="subsection-heading"><h3>Productos vendidos</h3></div>${tableMarkup(['Producto','Cantidad','Precio unitario','Subtotal'], s.items.map(i=>`<tr><td>${escapeHTML(i.name)}</td><td>${i.quantity}</td><td>${money(i.price)}</td><td>${money(i.subtotal)}</td></tr>`).join(''))}<div class="sale-total"><span>Total de la venta</span><strong>${money(s.total)}</strong></div>`; showDetails('Detalle de la venta', 'Los productos se conservan como referencia histórica.', body); }
function viewUser(id) { const u = userById(id); if (!u) return; const body = `<div class="detail-card"><div class="detail-field"><small>Nombre</small><strong>${escapeHTML(u.name)}</strong></div><div class="detail-field"><small>Correo de demo</small><strong>${escapeHTML(u.email)}</strong></div><div class="detail-field"><small>Rol</small><strong>${escapeHTML(ROLE_LABELS[u.role])}</strong></div><div class="detail-field"><small>Estado</small><strong>${u.active !== false ? 'Activo' : 'Inactivo'}</strong></div><div class="detail-field" style="grid-column:1/-1"><small>Contraseña de prueba</small><strong>petdemo123</strong></div></div>`; showDetails('Cuenta de demostración', 'Los datos de acceso son ficticios y locales.', body); }
function openCreate(action) {
  const mapping = {
    'create-owner': () => ensurePermission('owners') && state.user.role === 'vet' && formOwner(),
    'create-pet': () => ensurePermission('pets') && state.user.role === 'vet' && formPet(),
    'create-care-vaccine': () => ensurePermission('care-types') && state.user.role === 'vet' && formCare({}, 'Vacunación'),
    'create-care-deworm': () => ensurePermission('care-types') && state.user.role === 'vet' && formCare({}, 'Desparasitación'),
    'create-care': () => ensurePermission('care') && state.user.role === 'vet' && formCare(),
    'create-appointment': () => ensurePermission('appointments') && formAppointment(),
    'create-event': () => ensurePermission('events') && state.user.role === 'vet' && formEvent(),
    'create-product': () => ensurePermission('products') && state.user.role === 'admin' && formProduct(),
    'create-movement': () => ensurePermission('inventory') && formMovement(),
    'create-sale': () => ensurePermission('sales') && formSale(),
    'create-user': () => ensurePermission('users') && formUser()
  };
  if (mapping[action]) { mapping[action](); return; }
}
function formUser(record = {}) {
  const editing = Boolean(record.id); const body = `<div class="form-grid">${field('name', 'Nombre completo', record.name, 'text', { required: true, maxLength: 90 })}${field('email', 'Correo de demostración', record.email, 'email', { required: true, maxLength: 120 })}${field('role', 'Perfil', record.role || 'owner', 'text', { required: true, options: Object.entries(ROLE_LABELS).map(([k,v]) => `<option value="${k}" ${(record.role || 'owner') === k ? 'selected' : ''}>${v}</option>`).join('') })}${field('ownerId', 'Propietario asociado (solo perfil propietario)', record.ownerId || '', 'text', { options: optionsList(state.db.owners, record.ownerId, o => o.name), hint: 'El perfil propietario debe quedar vinculado a un registro de propietario.' })}${field('password', editing ? 'Contraseña de demostración (sin cambios si se deja vacía)' : 'Contraseña de demostración', '', 'text', { required: !editing, placeholder: 'Al menos 6 caracteres' })}</div>`;
  openModal({ title: editing ? 'Editar usuario' : 'Crear usuario de demostración', subtitle: 'Esta administración de usuarios es solo una simulación local.', body, formId: 'userForm', submitText: editing ? 'Guardar cambios' : 'Crear usuario' }); $('#userForm').dataset.id = record.id || '';
}
function editRecord(entity, id) {
  switch (entity) {
    case 'owner': if (state.user.role !== 'vet') return toast('Tu perfil puede consultar propietarios, pero no editarlos.', 'warning'); formOwner(ownerById(id)); break;
    case 'pet': if (state.user.role !== 'vet') return toast('Tu perfil puede consultar mascotas, pero no editarlas.', 'warning'); formPet(petById(id)); break;
    case 'care': if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede editar cuidados registrados.', 'warning'); formCare(state.db.care.find(x => x.id === id)); break;
    case 'appointment': if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede editar los datos de una cita.', 'warning'); formAppointment(state.db.appointments.find(x => x.id === id)); break;
    case 'event': if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede editar eventos preventivos.', 'warning'); formEvent(state.db.events.find(x => x.id === id)); break;
    case 'product': if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede editar productos.', 'warning'); formProduct(productById(id)); break;
    case 'user': if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede gestionar usuarios.', 'warning'); formUser(userById(id)); break;
  }
}
function deleteRecord(entity, id) {
  if (entity === 'owner') {
    if (state.user.role !== 'vet') return toast('Tu perfil no tiene permiso para eliminar propietarios.', 'warning');
    const owner = ownerById(id); if (!owner) return;
    const petCount = state.db.pets.filter(p => p.ownerId === id).length; const aptCount = state.db.appointments.filter(a => a.ownerId === id).length; const saleCount = state.db.sales.filter(s => s.ownerId === id).length;
    if (petCount || aptCount || saleCount) { const msg = `El propietario ${owner.name} tiene ${petCount} mascota(s), ${aptCount} cita(s) y ${saleCount} venta(s) vinculadas. Para evitar registros inconsistentes, no se eliminará mientras existan relaciones. ¿Deseas revisar esta información?`; window.confirm(msg); toast('No se eliminó el propietario porque tiene registros relacionados. Conserva el historial o resuelve las relaciones antes de intentarlo de nuevo.', 'warning'); return; }
    if (window.confirm(`¿Eliminar al propietario ${owner.name}? Esta acción no se puede deshacer.`)) { state.db.owners = state.db.owners.filter(o => o.id !== id); commit('Propietario eliminado.'); } return;
  }
  if (entity === 'pet') {
    if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede eliminar mascotas.', 'warning');
    const pet = petById(id); if (!pet) return;
    const careCount = state.db.care.filter(c => c.petId === id).length; const eventCount = state.db.events.filter(e => e.petId === id).length; const aptCount = state.db.appointments.filter(a => a.petId === id).length;
    if (careCount || eventCount || aptCount) { window.confirm(`${pet.name} tiene ${careCount} cuidado(s), ${eventCount} evento(s) y ${aptCount} cita(s) vinculadas. Para evitar inconsistencias, el expediente no se eliminará.`); toast('No se eliminó la mascota porque tiene historial o citas relacionadas.', 'warning'); return; }
    if (window.confirm(`¿Eliminar el registro de ${pet.name}?`)) { state.db.pets = state.db.pets.filter(p => p.id !== id); commit('Mascota eliminada.'); } return;
  }
  if (entity === 'care') {
    if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede eliminar cuidados.', 'warning');
    const care = state.db.care.find(c => c.id === id); if (!care) return;
    if (window.confirm(`¿Eliminar el cuidado “${care.title || care.type}” del historial de ${petName(care.petId)}?`)) { state.db.care = state.db.care.filter(c => c.id !== id); commit('Registro de cuidado eliminado.'); } return;
  }
  if (entity === 'event') {
    if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede eliminar eventos.', 'warning');
    const ev = state.db.events.find(e => e.id === id); if (!ev) return;
    if (window.confirm(`¿Eliminar el evento “${ev.description}”?`)) { state.db.events = state.db.events.filter(e => e.id !== id); commit('Evento preventivo eliminado.'); } return;
  }
  if (entity === 'product') {
    if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede eliminar productos.', 'warning');
    const p = productById(id); if (!p) return;
    const inSale = state.db.sales.some(s => s.items.some(i => i.productId === id)); const inMovement = state.db.movements.some(m => m.productId === id);
    if (inSale || inMovement) { window.confirm(`El producto ${p.name} aparece en registros históricos de ${inSale ? 'ventas' : 'inventario'}. Para conservar esos registros, no se eliminará.`); toast('No se eliminó el producto porque está relacionado con el historial de ventas o inventario.', 'warning'); return; }
    if (window.confirm(`¿Eliminar el producto ${p.name}?`)) { state.db.products = state.db.products.filter(x => x.id !== id); commit('Producto eliminado del catálogo.'); } return;
  }
  if (entity === 'user') {
    if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede gestionar usuarios.', 'warning');
    const u = userById(id); if (!u) return;
        if (u.id === state.user.id) return toast('No puedes eliminar la cuenta con la que has iniciado sesión.', 'warning');
    if (u.role === 'owner' && state.db.owners.some(o => o.id === u.ownerId) && u.active !== false) return toast('Desactiva el usuario antes de desvincularlo de su propietario.', 'warning');
    if (window.confirm(`¿Eliminar el usuario de demostración ${u.name}?`)) { state.db.users = state.db.users.filter(x => x.id !== id); commit('Usuario eliminado.'); } return;
  }
}
function setAppointmentStatus(id, status) {
  if (state.user.role !== 'vet' && !(state.user.role === 'owner' && status === 'cancelada')) return toast('Tu perfil no tiene permiso para cambiar este estado.', 'warning');
  const a = state.db.appointments.find(x => x.id === id); if (!a) return;
  if (state.user.role === 'owner' && a.ownerId !== state.user.ownerId) return toast('Esta cita no pertenece a tu perfil.', 'error');
  if (a.status === 'cancelada' || a.status === 'completada') return toast('La cita ya está cerrada y no puede cambiar de estado desde esta acción.', 'warning');
  if (status === 'completada' && state.user.role === 'vet' && !window.confirm(`¿Marcar como completada la cita de ${petName(a.petId)}?`)) return;
  if (status === 'cancelada' && !window.confirm('¿Cancelar esta cita?')) return;
  a.status = status; commit(`La cita quedó ${status}.`);
}
function completeEvent(id) {
  if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede completar eventos.', 'warning');
  const event = state.db.events.find(e => e.id === id); if (!event) return;
  if (event.status === 'completado') return toast('Este evento ya estaba completado.', 'warning');
  if (!window.confirm(`¿Marcar como completado “${event.description}” para ${petName(event.petId)}?`)) return;
  event.status = 'completado'; commit('Evento marcado como completado; dejó de figurar como alerta pendiente.');
}
function cancelSale(id) {
  if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede cancelar ventas.', 'warning');
  const sale = state.db.sales.find(s => s.id === id); if (!sale || sale.status === 'cancelada') return toast('La venta ya fue cancelada; no se volverán a devolver existencias.', 'warning');
  if (!window.confirm(`¿Cancelar la venta ${id}? Las cantidades vendidas se devolverán al inventario una sola vez.`)) return;
  sale.items.forEach(item => { const product = productById(item.productId); if (product) product.stock += item.quantity; state.db.movements.push({ id: makeId('mov'), productId: item.productId, type: 'Entrada', quantity: item.quantity, reason: `Devolución por cancelación de ${sale.id}`, date: todayISO(), user: state.user.name }); });
  sale.status = 'cancelada'; sale.canceledAt = new Date().toISOString(); commit('Venta cancelada y existencias restauradas una sola vez.');
}
function toggleUser(id) {
  if (state.user.role !== 'admin') return toast('No tienes permiso para gestionar usuarios.', 'warning');
  const u = userById(id); if (!u) return;
  if (u.id === state.user.id) return toast('No puedes desactivar tu propio usuario mientras has iniciado sesión.', 'warning');
  if (u.role === 'admin' && u.active !== false && state.db.users.filter(x => x.role === 'admin' && x.active !== false).length <= 1) return toast('Debe existir al menos un administrador activo.', 'warning');
  u.active = u.active === false; commit(`Usuario ${u.active ? 'activado' : 'desactivado'}.`);
}
function handleFormSubmit(event) {
  const form = event.target.closest('form[data-form]'); if (!form) return;
  event.preventDefault(); if (!form.reportValidity()) return;
  const type = form.dataset.form; const fd = new FormData(form); const data = Object.fromEntries(fd.entries()); const id = form.dataset.id || '';
  if (type === 'ownerForm') {
    if (state.user.role !== 'vet') return toast('Tu perfil no tiene permiso para registrar propietarios.', 'warning');
    const email = data.email.trim().toLowerCase(); const duplicate = state.db.owners.find(o => o.email.toLowerCase() === email && o.id !== id); const duplicateDoc = state.db.owners.find(o => o.document.trim() === data.document.trim() && o.id !== id);
    if (duplicate) return toast('Ya existe un propietario con ese correo electrónico.', 'error'); if (duplicateDoc) return toast('Ese documento ya está asociado a otro propietario.', 'error');
    const record = { id: id || makeId('own'), name: data.name.trim(), document: data.document.trim(), phone: data.phone.trim(), email, address: data.address.trim() };
    if (id) state.db.owners = state.db.owners.map(o => o.id === id ? record : o); else state.db.owners.push(record);
    commit(id ? 'Los datos del propietario se actualizaron.' : 'Propietario registrado correctamente.'); closeModal(); renderApp(); return;
  }
  if (type === 'petForm') {
    if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede registrar o editar mascotas.', 'warning');
    if (!ownerById(data.ownerId)) return toast('Selecciona un propietario válido antes de guardar la mascota.', 'error');
    if (data.weight && Number(data.weight) <= 0) return toast('El peso debe ser mayor que cero o quedar vacío.', 'error');
    if (data.birthDate && data.birthDate > todayISO()) return toast('La fecha de nacimiento no puede ser futura.', 'error');
    const record = { id: id || makeId('pet'), name: data.name.trim(), species: data.species, breed: (data.breed || '').trim(), sex: data.sex === 'No especificado' ? '' : data.sex, birthDate: data.birthDate || '', weight: data.weight || '', observations: (data.observations || '').trim(), ownerId: data.ownerId };
    if (id) state.db.pets = state.db.pets.map(p => p.id === id ? record : p); else state.db.pets.push(record);
    commit(id ? 'La ficha de la mascota se actualizó.' : 'Mascota registrada y vinculada a su propietario.'); closeModal(); renderApp(); return;
  }
  if (type === 'careForm') {
    if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede registrar cuidados.', 'warning');
    if (!petById(data.petId)) return toast('Selecciona una mascota válida.', 'error');
    if (data.nextDate && data.nextDate <= data.date) return toast('La próxima fecha programada debe ser posterior a la fecha de realización.', 'error');
    const previous = id ? state.db.care.find(c => c.id === id) : null;
    const record = { id: id || makeId('care'), petId: data.petId, type: data.type, title: data.title.trim(), date: data.date, description: (data.description || '').trim(), observations: (data.observations || '').trim(), recordedBy: previous?.recordedBy || state.user.name };
    if (id) state.db.care = state.db.care.map(c => c.id === id ? record : c); else state.db.care.push(record);
    if (data.nextDate) {
      const dupe = state.db.events.some(e => e.petId === data.petId && e.date === data.nextDate && e.type === data.type && e.status !== 'completado' && e.description === `Seguimiento: ${record.title}`);
      if (!dupe) state.db.events.push({ id: makeId('evt'), petId: data.petId, type: data.type, description: `Seguimiento: ${record.title}`, date: data.nextDate, status: 'pendiente', observations: 'Creado desde el registro de cuidado.' });
    }
    commit(id ? 'El cuidado se actualizó en el historial.' : 'Cuidado registrado en el historial de la mascota.'); closeModal(); renderApp(); return;
  }
  if (type === 'appointmentForm') {
    if (!ensurePermission('appointments')) return;
    const owner = ownerById(data.ownerId); const pet = petById(data.petId);
    if (!owner || !pet) return toast('Selecciona un propietario y una mascota válidos.', 'error');
    if (pet.ownerId !== owner.id) return toast('La mascota seleccionada no pertenece al propietario elegido.', 'error');
    if (state.user.role === 'owner' && owner.id !== state.user.ownerId) return toast('Solo puedes solicitar citas para tu propio perfil.', 'error');
    const timeValue = data.time || '00:00'; if (data.date < todayISO() || (data.date === todayISO() && timeValue < nowDateTimeLocal().slice(11, 16))) return toast('La fecha y hora solicitadas no pueden ser anteriores al momento actual.', 'error');
    const old = id ? state.db.appointments.find(a => a.id === id) : null;
        const record = { id: id || makeId('apt'), ownerId: owner.id, petId: pet.id, date: data.date, time: timeValue, address: data.address.trim(), reason: data.reason.trim(), observations: (data.observations || '').trim(), status: state.user.role === 'vet' ? (data.status || old?.status || 'pendiente') : 'pendiente', createdAt: old?.createdAt || new Date().toISOString() };
    if (id && state.user.role === 'vet') state.db.appointments = state.db.appointments.map(a => a.id === id ? record : a); else state.db.appointments.push(record);
    commit(id ? 'Los datos de la cita se actualizaron.' : 'Solicitud de cita guardada. Quedó pendiente de confirmación.'); closeModal(); renderApp(); return;
  }
  if (type === 'eventForm') {
    if (state.user.role !== 'vet') return toast('Solo el personal veterinario puede programar eventos.', 'warning');
    if (!petById(data.petId)) return toast('Selecciona una mascota válida.', 'error');
    const record = { id: id || makeId('evt'), petId: data.petId, type: data.type, description: data.description.trim(), date: data.date, status: data.status, observations: (data.observations || '').trim() };
    if (id) state.db.events = state.db.events.map(e => e.id === id ? record : e); else state.db.events.push(record);
    commit(id ? 'Evento preventivo actualizado.' : 'Evento preventivo programado. La alerta se calculará según la fecha.'); closeModal(); renderApp(); return;
  }
  if (type === 'productForm') {
    if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede gestionar productos.', 'warning');
    if (!data.name.trim() || !data.category) return toast('Completa el nombre y la categoría del producto.', 'error');
    if (Number(data.price) <= 0 || !Number.isFinite(Number(data.price))) return toast('El precio debe ser un número mayor que cero.', 'error');
    if (!Number.isInteger(Number(data.stock)) || Number(data.stock) < 0 || !Number.isInteger(Number(data.minStock)) || Number(data.minStock) < 0) return toast('Las existencias y el stock mínimo deben ser números enteros iguales o mayores que cero.', 'error');
    const record = { id: id || makeId('prd'), name: data.name.trim(), category: data.category, description: (data.description || '').trim(), price: Number(data.price), stock: id ? productById(id).stock : Number(data.stock), minStock: Number(data.minStock) };
    if (id) state.db.products = state.db.products.map(p => p.id === id ? record : p); else {
      state.db.products.push(record); if (record.stock > 0) state.db.movements.push({ id: makeId('mov'), productId: record.id, type: 'Entrada', quantity: record.stock, reason: 'Existencias iniciales al crear producto', date: todayISO(), user: state.user.name });
    }
    commit(id ? 'Producto actualizado. Las existencias se gestionan desde Inventario.' : 'Producto creado en el catálogo.'); closeModal(); renderApp(); return;
  }
  if (type === 'movementForm') {
    if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede registrar movimientos.', 'warning');
    const product = productById(data.productId); const qty = Number(data.quantity);
    if (!product) return toast('Selecciona un producto existente.', 'error'); if (!Number.isInteger(qty) || qty <= 0) return toast('La cantidad debe ser un número entero positivo.', 'error');
    if (data.type === 'Salida' && qty > product.stock) return toast(`No hay existencias suficientes. Disponibles: ${product.stock} unidad(es).`, 'error');
    if (data.date > todayISO()) return toast('La fecha del movimiento no puede ser futura.', 'error');
    product.stock += data.type === 'Entrada' ? qty : -qty;
    state.db.movements.push({ id: makeId('mov'), productId: product.id, type: data.type, quantity: qty, reason: data.reason.trim(), date: data.date, user: state.user.name });
    commit(`Movimiento registrado. Existencias actuales de ${product.name}: ${product.stock}.`); closeModal(); renderApp(); return;
  }
  if (type === 'saleForm') {
    if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede registrar ventas.', 'warning');
    const rows = $$('.sale-item-row', form); if (!rows.length) return toast('Agrega al menos un producto a la venta.', 'error');
    const items = rows.map(row => { const product = productById($('select[name="productId"]', row).value); const quantity = Number($('input[name="quantity"]', row).value); return { product, quantity }; });
    if (items.some(i => !i.product || !Number.isInteger(i.quantity) || i.quantity <= 0)) return toast('Selecciona productos válidos y cantidades enteras mayores que cero.', 'error');
    const aggregate = new Map(); items.forEach(i => aggregate.set(i.product.id, (aggregate.get(i.product.id) || 0) + i.quantity));
    for (const [productId, qty] of aggregate) { const p = productById(productId); if (qty > p.stock) return toast(`Existencias insuficientes para ${p.name}. Disponibles: ${p.stock}; solicitadas: ${qty}.`, 'error'); }
    const saleId = makeId('sal'); const detailItems = items.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.quantity, price: i.product.price, subtotal: i.product.price * i.quantity })); const total = detailItems.reduce((sum, i) => sum + i.subtotal, 0);
    detailItems.forEach(i => { const p = productById(i.productId); p.stock -= i.quantity; state.db.movements.push({ id: makeId('mov'), productId: p.id, type: 'Salida', quantity: i.quantity, reason: `Venta ${saleId}`, date: todayISO(), user: state.user.name }); });
    state.db.sales.push({ id: saleId, ownerId: data.ownerId || '', date: todayISO(), status: 'registrada', items: detailItems, total });
    commit(`Venta registrada por ${money(total)}. El inventario se actualizó automáticamente.`); closeModal(); renderApp(); return;
  }
  if (type === 'userForm') {
    if (state.user.role !== 'admin') return toast('Solo el administrador comercial puede gestionar usuarios.', 'warning');
    const email = data.email.trim().toLowerCase(); const dupe = state.db.users.find(u => u.email.toLowerCase() === email && u.id !== id); if (dupe) return toast('Ya existe una cuenta con ese correo de demostración.', 'error');
    if (!id && (data.password || '').length < 6) return toast('La contraseña de demostración debe tener al menos 6 caracteres.', 'error');
    if (data.role === 'owner' && !ownerById(data.ownerId)) return toast('Selecciona el propietario vinculado para una cuenta con perfil Propietario.', 'error');
    if (data.role !== 'owner') data.ownerId = '';
    const old = id ? userById(id) : null;
    if (old?.id === state.user.id && data.role !== 'admin') return toast('No puedes cambiar el perfil de administrador de tu propia sesión.', 'warning');
    const record = { id: id || makeId('usr'), name: data.name.trim(), email, password: data.password || old?.password || 'petdemo123', role: data.role, ownerId: data.ownerId || null, active: old?.active !== false };
    if (id) state.db.users = state.db.users.map(u => u.id === id ? record : u); else state.db.users.push(record);
    if (id && state.user.id === id) state.user = { ...record };
    commit(id ? 'Usuario actualizado.' : 'Usuario de demostración creado.'); closeModal(); renderApp(); return;
  }
}
function handleAction(action, id, element) {
  if (action.startsWith('create-')) return openCreate(action);
  if (action.startsWith('edit-')) return editRecord(action.slice(5), id);
  if (action.startsWith('delete-')) return deleteRecord(action.slice(7), id);
  if (action === 'close-modal') return closeModal();
  if (action === 'refresh') { renderApp(); toast('Los indicadores y las listas se actualizaron.'); return; }
  if (action === 'view-owner') return viewOwner(id);
  if (action === 'view-pet') return viewPet(id);
  if (action === 'view-care') return viewCare(id);
  if (action === 'view-appointment') return viewAppointment(id);
  if (action === 'view-event') return viewEvent(id);
  if (action === 'view-product') return viewProduct(id);
  if (action === 'view-sale') return viewSale(id);
  if (action === 'view-user') return viewUser(id);
  if (action === 'pet-history') { closeModal(); navigate('care'); state.selectedPetId = id; renderApp(); return; }
  if (action === 'pet-events') { closeModal(); navigate('events'); state.filters['event-pet'] = id; renderApp(); return; }
  if (action === 'complete-event') return completeEvent(id);
  if (action === 'appointment-confirm') return setAppointmentStatus(id, 'confirmada');
    if (action === 'appointment-complete') return setAppointmentStatus(id, 'completada');
  if (action === 'appointment-cancel') return setAppointmentStatus(id, 'cancelada');
  if (action === 'cancel-sale') return cancelSale(id);
  if (action === 'toggle-user') return toggleUser(id);
  if (action === 'add-sale-item') return addSaleItemRow();
  if (action === 'remove-sale-item') { const row = element.closest('.sale-item-row'); if (row) row.remove(); recalculateSale(); return; }
  if (action === 'reset-demo') return resetDemo();
  if (action === 'logout') return logout();
}
function resetDemo() {
  if (state.user?.role !== 'admin') return toast('Solo el administrador comercial puede restaurar los datos de demostración.', 'warning');
  if (!window.confirm('¿Restaurar todos los datos de demostración? Se perderán los registros creados o editados durante esta prueba.')) return;
  state.db = seedData(); saveDatabase(); state.user = { ...state.db.users.find(u => u.role === 'admin') }; state.module = 'home'; state.search = ''; state.filters = {}; state.selectedPetId = ''; closeModal(); renderApp(); toast('Se restauraron los datos ficticios iniciales.');
}
function handleSearchInput(event) {
  const target = event.target; if (!target.matches('[data-search]')) return;
  state.search = target.value;
  const cursor = target.selectionStart;
  renderApp(); const next = $('[data-search]'); if (next) { next.focus(); try { next.setSelectionRange(cursor, cursor); } catch (_) {} }
}
function handleFilterChange(event) {
  const target = event.target; if (!target.matches('[data-filter]')) return;
  state.filters[target.dataset.filter] = target.value; renderApp();
}
function handleFormChange(event) {
  if (event.target.name === 'ownerId' && event.target.closest('#appointmentForm')) {
    const ownerId = event.target.value; const petSelect = $('#f-petId'); if (!petSelect) return;
    const matching = state.db.pets.filter(p => p.ownerId === ownerId && (state.user.role !== 'owner' || p.ownerId === state.user.ownerId));
    petSelect.innerHTML = optionsList(matching, '', p => `${p.name} (${p.species})`);
  }
}
function bindEvents() {
  $$('.demo-role').forEach(btn => btn.addEventListener('click', () => loginAs(btn.dataset.demoRole)));
  $('#loginForm').addEventListener('submit', event => { event.preventDefault(); const email = $('#loginEmail').value.trim().toLowerCase(); const password = $('#loginPassword').value; const user = state.db.users.find(u => u.email.toLowerCase() === email && u.password === password && u.active !== false); if (!user) return toast('Correo o contraseña incorrectos, o cuenta desactivada. Utiliza un perfil de demostración.', 'error'); state.user = { ...user }; state.module = 'home'; showApp(); renderApp(); });
  $('#logoutButton').addEventListener('click', logout);
  $('#resetDemoButton').addEventListener('click', resetDemo);
  $('#profileButton').addEventListener('click', () => { $('#profileMenu').hidden = !$('#profileMenu').hidden; });
  $$('[data-switch-role]').forEach(btn => btn.addEventListener('click', () => { const role = btn.dataset.switchRole; $('#profileMenu').hidden = true; loginAs(role); }));
  $('#menuToggle').addEventListener('click', () => { $('#sidebar').classList.add('sidebar-open'); $('#sidebarScrim').classList.add('visible'); });
  $('#closeSidebar').addEventListener('click', () => { $('#sidebar').classList.remove('sidebar-open'); $('#sidebarScrim').classList.remove('visible'); });
  $('#sidebarScrim').addEventListener('click', () => { $('#sidebar').classList.remove('sidebar-open'); $('#sidebarScrim').classList.remove('visible'); });
  document.addEventListener('click', event => {
    const moduleButton = event.target.closest('[data-module]'); if (moduleButton) { navigate(moduleButton.dataset.module); return; }
    const actionButton = event.target.closest('[data-action]'); if (actionButton) { handleAction(actionButton.dataset.action, actionButton.dataset.id || '', actionButton); return; }
    if (event.target.matches('[data-modal-backdrop]')) closeModal();
    if (!event.target.closest('.topbar-right')) $('#profileMenu').hidden = true;
  });
  document.addEventListener('submit', handleFormSubmit);
  document.addEventListener('input', handleSearchInput);
  document.addEventListener('change', event => { handleFilterChange(event); handleFormChange(event); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (state.modal) closeModal(); $('#profileMenu').hidden = true; $('#sidebar').classList.remove('sidebar-open'); $('#sidebarScrim').classList.remove('visible'); } });
}

state.db = loadDatabase();
bindEvents();