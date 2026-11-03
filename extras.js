'use strict';
/* PetDelicias · extras.js — se carga DESPUÉS de script.js y no lo modifica.
   Agrega: portada por rol, 3 vistas exclusivas (Carnet de salud, Agenda clínica, Reportes) y animaciones. */
(() => {
  const EXTRA = ['passport', 'agenda', 'reports'];
  Object.assign(MODULE_META, {
    passport: { label: 'Carnet de salud', icon: '❖', roles: ['owner'] },
    agenda: { label: 'Agenda clínica', icon: '◈', roles: ['vet'] },
    reports: { label: 'Reportes', icon: '◩', roles: ['admin'] }
  });

  /* ---------- Utilidades ---------- */
  const E = escapeHTML;
  const emoji = p => p.species === 'Gato' ? '🐱' : p.species === 'Ave' ? '🦜' : p.species === 'Conejo' ? '🐰' : '🐶';
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; };
  const ageOf = b => { if (!b) return '—'; const m = Math.max(0, Math.floor((Date.now() - new Date(b)) / 2629800000)); return m >= 24 ? `${Math.floor(m / 12)} años` : `${m} meses`; };
  const dayName = (d, o) => new Intl.DateTimeFormat('es-CO', o).format(new Date(`${d}T12:00:00`));
  const liveSales = () => state.db.sales.filter(s => s.status !== 'cancelada');
  const last7 = () => [...Array(7)].map((_, i) => { const d = addDays(i - 6); return { d, v: liveSales().filter(s => s.date === d).reduce((a, s) => a + s.total, 0) }; });
  const cols = (arr, fmt = x => x) => { const mx = Math.max(1, ...arr.map(x => x.v)); return arr.map((x, i) => `<div title="${E(fmt(x.v))}"><i style="--h:${Math.round(x.v / mx * 100)}%;--i:${i}"></i>${dayName(x.d, { weekday: 'short' }).replace('.', '')}</div>`).join(''); };

  /* ---------- Navegación: entradas exclusivas por rol ---------- */
  const _renderNav = renderNav;
  renderNav = function () {
    _renderNav();
    const mine = EXTRA.filter(roleCan); if (!mine.length) return;
    const html = mine.map(k => `<button type="button" class="nav-link ${state.module === k ? 'active' : ''}" data-module="${k}"><span class="nav-icon">${MODULE_META[k].icon}</span><span>${MODULE_META[k].label}</span></button>`).join('');
    const home = $('#mainNav .nav-link');
    if (home) home.insertAdjacentHTML('afterend', html); else $('#mainNav').insertAdjacentHTML('beforeend', html);
  };

  /* ---------- Portada distinta para cada rol ---------- */
  function hero() {
    const u = state.user, nm = u.name.replace(/^Dra?\.\s*/, '').split(' ')[0];
    const refresh = `<button type="button" class="button button-secondary" data-action="refresh">Actualizar datos</button>`;
    const chip = (n, l) => `<div class="hero-chip"><small>${l}</small><span class="hero-num">${n}</span></div>`;
    const alerts = scopedEvents().filter(e => ['vencido', 'hoy', 'proximo'].includes(eventClassification(e).key)).length;
    if (u.role === 'owner') {
      const pets = scopedPets(), nx = scopedAppointments().filter(a => !['cancelada', 'completada'].includes(a.status) && a.date >= todayISO()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
      return `<section class="hero owner"><div><p class="hero-hi">${greet()}, ${E(nm)}</p><h2>Tu familia peluda, con todo su cuidado a la vista.</h2><div class="pet-strip">${pets.map(p => `<div class="pet-bubble"><span>${emoji(p)}</span>${E(p.name)}</div>`).join('')}</div><button type="button" class="button button-primary" data-module="passport">Abrir carnet de salud</button> ${refresh}</div><div class="hero-chips">${chip(pets.length, 'Mascotas a tu cargo')}${chip(alerts, 'Cuidados por atender')}<div class="hero-chip"><small>Próxima visita</small><strong>${nx ? `${formatDate(nx.date, { day: 'numeric', month: 'short' })}, ${formatTime(nx.time)}` : 'Sin agendar'}</strong></div></div></section>`;
    }
    if (u.role === 'vet') {
      const t = state.db.appointments.filter(a => a.date >= todayISO() && !['cancelada', 'completada'].includes(a.status)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 3);
      return `<section class="hero vet"><div><p class="hero-hi">${greet()}, Dra. ${E(nm)}</p><h2>Tu ruta de visitas a domicilio, lista para salir.</h2><p class="lead">${state.db.appointments.filter(a => a.status === 'pendiente').length} solicitudes esperan confirmación y ${alerts} seguimientos preventivos requieren tu atención.</p><button type="button" class="button button-primary" data-module="agenda">Ver agenda clínica</button> ${refresh}</div><div class="hero-side"><div class="mini-tl">${t.length ? t.map(a => `<div><b>${formatDate(a.date, { day: 'numeric', month: 'short' })}</b><span>${formatTime(a.time)} · ${E(petName(a.petId))}, ${E(a.reason)}</span></div>`).join('') : '<div>No hay visitas próximas</div>'}</div></div></section>`;
    }
    const tot = liveSales().reduce((a, s) => a + s.total, 0), low = state.db.products.filter(p => p.stock <= p.minStock).length;
    return `<section class="hero admin"><div><p class="hero-hi">${greet()}, ${E(nm)}</p><h2>Esto es lo que ha vendido la tienda esta semana.</h2><p class="lead">${low} productos están en o por debajo de su stock mínimo.</p><button type="button" class="button button-primary" data-module="reports">Abrir reportes</button> ${refresh}</div><div class="hero-side"><div class="hero-chip"><small>Ventas acumuladas</small><span class="hero-num" style="font-size:28px">${money(tot)}</span></div><div><div class="spark">${last7().map((x, i, a) => `<i style="--h:${Math.round(x.v / Math.max(1, ...a.map(y => y.v)) * 100)}%;--i:${i}"></i>`).join('')}</div><div class="spark-cap"><span>Hace 6 días</span><span>Hoy</span></div></div></div></section>`;
  }
  const _renderHome = renderHome;
  renderHome = () => hero() + _renderHome();

  /* ---------- Propietario: Carnet de salud ---------- */
  function renderPassport() {
    const pets = scopedPets();
    const head = pageHeading('Tus mascotas', 'Carnet de salud', 'El historial completo de cada mascota: vacunas, desparasitaciones, próximos cuidados y citas.', button('Solicitar cita', 'create-appointment', '+', 'button-primary'));
    if (!pets.length) return head + emptyState('Aún no tienes mascotas', 'Cuando el personal veterinario registre una mascota a tu nombre, su carnet aparecerá aquí.');
    const id = pets.some(p => p.id === state.filters.passportPet) ? state.filters.passportPet : pets[0].id, p = petById(id);
    const care = state.db.care.filter(c => c.petId === id).sort((a, b) => b.date.localeCompare(a.date));
    const ev = state.db.events.filter(e => e.petId === id && e.status !== 'completado').sort((a, b) => a.date.localeCompare(b.date));
    const apt = state.db.appointments.filter(a => a.petId === id && !['cancelada', 'completada'].includes(a.status)).sort((a, b) => a.date.localeCompare(b.date));
    return `${head}<div class="pp-tabs">${pets.map(x => `<button type="button" class="pp-tab ${x.id === id ? 'on' : ''}" data-passport="${x.id}"><span>${emoji(x)}</span>${E(x.name)}</button>`).join('')}</div>
    <div class="pp-grid"><article class="pp-card"><div class="pp-photo">${emoji(p)}</div><h2>${E(p.name)}</h2><p>${E(p.species)}${p.breed ? ' · ' + E(p.breed) : ''}</p><div class="pp-facts"><div><small>Edad</small><strong>${ageOf(p.birthDate)}</strong></div><div><small>Peso</small><strong>${p.weight ? E(p.weight) + ' kg' : '—'}</strong></div><div><small>Sexo</small><strong>${E(p.sex || 'No indicado')}</strong></div><div><small>Nacimiento</small><strong>${p.birthDate ? formatDate(p.birthDate, { month: 'short', year: 'numeric' }) : '—'}</strong></div></div></article>
    <div><section class="panel"><div class="panel-header"><div><h2>Historial de cuidados</h2><p>De lo más reciente a lo más antiguo.</p></div></div>${care.length ? `<ul class="timeline">${care.map(c => `<li class="${c.type === 'Vacunación' ? 'vac' : ''}"><strong>${E(c.title || c.type)}</strong><small>${E(c.type)} · ${formatDate(c.date)} · ${E(c.recordedBy || '')}</small></li>`).join('')}</ul>` : emptyState('Sin cuidados registrados', 'Aquí verás cada vacuna y atención de ' + p.name + '.')}</section>
    <section class="panel"><div class="panel-header"><div><h2>Lo que viene</h2><p>Seguimientos y visitas pendientes.</p></div></div><div class="event-list">${ev.map(eventRow).join('') || emptyState('Todo al día', 'No hay seguimientos pendientes.', '🌿')}${apt.map(a => `<div class="event-item"><div class="event-datebox"><strong>${new Date(a.date + 'T12:00:00').getDate()}</strong><small>${dayName(a.date, { month: 'short' }).replace('.', '')}</small></div><div class="event-info"><strong>Visita: ${E(a.reason)}</strong><p>${formatTime(a.time)} · ${E(a.address)}</p></div><div class="event-side">${appointmentPill(a.status)}</div></div>`).join('')}</div></section></div></div>`;
  }

  /* ---------- Veterinario: Agenda clínica ---------- */
  function renderAgenda() {
    const days = [...Array(7)].map((_, i) => addDays(i));
    const week = days.map((d, i) => {
      const list = state.db.appointments.filter(a => a.date === d && a.status !== 'cancelada').sort((a, b) => a.time.localeCompare(b.time));
      return `<div class="day ${i === 0 ? 'today' : ''}"><header><strong>${new Date(d + 'T12:00:00').getDate()}</strong><small>${i === 0 ? 'Hoy' : dayName(d, { weekday: 'long' })}</small></header>${list.map(a => `<div class="visit"><span class="vt">${formatTime(a.time)}</span><b>${E(petName(a.petId))}</b>${E(a.reason)}<br><small>${E(ownerName(a.ownerId))}</small><div class="row">${appointmentPill(a.status)}${a.status === 'pendiente' ? `<button class="button button-small button-soft" data-action="appointment-confirm" data-id="${a.id}">Confirmar</button>` : ''}${a.status === 'confirmada' ? `<button class="button button-small button-secondary" data-action="appointment-complete" data-id="${a.id}">Completar</button>` : ''}</div></div>`).join('') || '<p class="day-empty">Sin visitas</p>'}</div>`;
    }).join('');
    const cov = state.db.pets.map(p => {
      const v = state.db.care.filter(c => c.petId === p.id && c.type === 'Vacunación').sort((a, b) => b.date.localeCompare(a.date))[0];
      const dd = v ? -daysDifference(v.date) : null, pct = v ? Math.max(6, Math.round(100 - dd / 365 * 100)) : 4;
      return `<div class="cov-row"><strong>${E(p.name)}</strong><div class="bar ${!v ? 'bad' : dd > 270 ? 'warn' : ''}"><i style="--w:${pct}%"></i></div><span>${v ? `hace ${dd} días` : 'Sin vacuna registrada'}</span></div>`;
    }).join('');
    return `${pageHeading('Panel clínico', 'Agenda clínica', 'Las visitas a domicilio de los próximos siete días y qué mascotas necesitan refuerzo de vacuna.', button('Programar evento', 'create-event', '+', 'button-primary'))}<div class="week">${week}</div><section class="panel"><div class="panel-header"><div><h2>Cobertura de vacunación</h2><p>Tiempo desde la última vacuna registrada; la barra se vacía a medida que se acerca el año.</p></div></div><div class="cov">${cov}</div></section>`;
  }

  /* ---------- Administrador: Reportes ---------- */
  function renderReports() {
    const sales = liveSales(), tot = sales.reduce((a, s) => a + s.total, 0);
    const units = sales.reduce((a, s) => a + s.items.reduce((x, i) => x + i.quantity, 0), 0);
    const inv = state.db.products.reduce((a, p) => a + p.price * p.stock, 0);
    const byProd = {}, byCat = {};
    sales.forEach(s => s.items.forEach(i => { byProd[i.name] = (byProd[i.name] || 0) + i.subtotal; const c = productById(i.productId)?.category || 'Otros'; byCat[c] = (byCat[c] || 0) + i.subtotal; }));
    const top = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5), mx = top[0]?.[1] || 1;
    const pal = ['#0f3b46', '#f0b13c', '#7fb7a4', '#c9514a', '#8aa4ad'], cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    let acc = 0; const stops = cats.map(([, v], i) => { const s = acc / (tot || 1) * 100; acc += v; return `${pal[i % 5]} ${s}% ${acc / (tot || 1) * 100}%`; }).join(',');
    return `${pageHeading('Inteligencia comercial', 'Reportes', 'Cómo se mueven las ventas, qué categorías pesan más y cómo está la salud del inventario.', button('Registrar venta', 'create-sale', '+', 'button-primary'))}
    <div class="stats-grid">${statsCard('$', '#fbecc8', money(tot), 'Ingresos', 'Ventas no canceladas')}${statsCard('▦', '#d4ece3', sales.length ? money(Math.round(tot / sales.length)) : '$ 0', 'Ticket promedio', 'Por venta registrada')}${statsCard('▧', '#d7e8f0', units, 'Unidades vendidas', 'Suma de todas las ventas')}${statsCard('▤', '#fde2df', money(inv), 'Valor del inventario', 'Precio × existencias')}</div>
    <div class="rp-grid"><section class="panel"><div class="panel-header"><div><h2>Productos más vendidos</h2><p>Por ingresos generados.</p></div></div>${top.map(([n, v]) => `<div class="hbar"><span>${E(n)}</span><div class="bar"><i style="--w:${Math.round(v / mx * 100)}%"></i></div><b>${money(v)}</b></div>`).join('') || emptyState('Sin ventas', 'Registra una venta para ver el ranking.')}<div class="panel-header" style="margin-top:26px"><div><h3>Últimos 7 días</h3></div></div><div class="cols">${cols(last7(), money)}</div></section>
    <section class="panel"><div class="panel-header"><div><h2>Ingresos por categoría</h2></div></div>${cats.length ? `<div class="donut" style="background:conic-gradient(${stops})" data-c="${cats.length} categorías"></div><div class="legend">${cats.map(([c, v], i) => `<span><i style="background:${pal[i % 5]}"></i>${E(c)}<b>${money(v)}</b></span>`).join('')}</div>` : emptyState('Sin datos', 'Aún no hay ventas por categoría.')}</section></div>
    <section class="panel"><div class="panel-header"><div><h2>Salud del inventario</h2><p>Existencias frente al stock mínimo (la barra llena equivale a tres veces el mínimo).</p></div><button class="text-link" data-module="inventory">Ir a inventario</button></div>${state.db.products.map(p => { const pc = Math.min(100, Math.round(p.stock / Math.max(1, p.minStock * 3) * 100)); return `<div class="hbar"><span>${E(p.name)}</span><div class="bar ${p.stock <= p.minStock ? 'bad' : ''}"><i style="--w:${pc}%"></i></div><b>${p.stock} un.</b></div>`; }).join('')}</section>`;
  }

  const _renderModule = renderModule;
  renderModule = m => m === 'passport' ? renderPassport() : m === 'agenda' ? renderAgenda() : m === 'reports' ? renderReports() : _renderModule(m);

  /* ---------- Animación de entrada y contadores ---------- */
  let timer;
  const enter = () => { const pc = $('#pageContent'); if (!pc) return; pc.classList.add('enter'); clearTimeout(timer); timer = setTimeout(() => pc.classList.remove('enter'), 1500); };
  function countUp() {
    $$('.stat-value,.hero-num').forEach(el => {
      const t = el.textContent.trim(); if (!/^\d+$/.test(t) || +t < 2) return;
      const n = +t, s = performance.now();
      const tick = now => { const p = Math.min(1, (now - s) / 900); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }
  const _renderApp = renderApp;
  renderApp = function () { _renderApp(); if ($('#pageContent')?.classList.contains('enter')) countUp(); };
  const _navigate = navigate; navigate = m => { enter(); _navigate(m); };
  const _showApp = showApp; showApp = () => { _showApp(); enter(); };

  /* ---------- Eventos: carnet y foco de luz que sigue al cursor ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-passport]'); if (!t) return;
    state.filters.passportPet = t.dataset.passport; enter(); renderApp();
  });
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.stat-card,.quick-action,.hero'); if (!c) return;
    const r = c.getBoundingClientRect(); c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
})();
