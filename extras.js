'use strict';
/* PetDelicias · extras.js — se carga DESPUÉS de script.js y no lo modifica.
   Agrega: portada por rol, 3 vistas exclusivas (Carnet de salud, Agenda clínica, Reportes) y animaciones. */
(() => {
  const EXTRA = ['passport', 'agenda', 'reports', 'calendar'];
  Object.assign(MODULE_META, {
    passport: { label: 'Carnet de salud', icon: '❖', roles: ['owner'] },
    agenda: { label: 'Agenda clínica', icon: '◈', roles: ['vet'] },
    reports: { label: 'Reportes', icon: '◩', roles: ['admin'] },
    calendar: { label: 'Calendario', icon: '▣', roles: ['owner', 'vet', 'admin'] }
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


  /* ---------- Calendario (los 3 roles, con datos propios de cada uno) ---------- */
  const ym = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const calMonth = () => { const f = state.filters.calMonth, d = f ? new Date(`${f}-01T12:00:00`) : new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); };
  function calData() {
    const m = {}, r = state.user.role, add = (d, it) => (m[d] = m[d] || []).push(it);
    if (r === 'admin') liveSales().forEach(s => add(s.date, { k: 'sale', short: money(s.total), label: `Venta ${s.id.slice(0, 9)}`, sub: s.ownerId ? ownerName(s.ownerId) : 'Cliente de mostrador', total: s.total }));
    else {
      scopedAppointments().filter(a => a.status !== 'cancelada').forEach(a => add(a.date, { k: 'apt', t: a.time, short: `${a.time} ${petName(a.petId)}`, label: `${petName(a.petId)} · ${a.reason}`, sub: r === 'vet' ? ownerName(a.ownerId) : a.address, a }));
      scopedEvents().forEach(e => add(e.date, { k: 'evt', short: `${petName(e.petId)} · ${e.type}`, label: `${e.description} · ${petName(e.petId)}`, sub: e.type, e, c: eventClassification(e) }));
    }
    return m;
  }
  function renderCalendar() {
    const mo = calMonth(), data = calData(), r = state.user.role, today = todayISO();
    const first = (mo.getDay() + 6) % 7, total = Math.ceil((first + new Date(mo.getFullYear(), mo.getMonth() + 1, 0).getDate()) / 7) * 7;
    let sel = state.filters.calDay; if (!sel || sel.slice(0, 7) !== ym(mo)) sel = today.slice(0, 7) === ym(mo) ? today : `${ym(mo)}-01`;
    const go = $('#pageContent')?.classList.contains('enter') || state.filters.calGo;
    const cells = [...Array(total)].map((_, i) => {
      const d = new Date(mo.getFullYear(), mo.getMonth(), 1 - first + i), iso = isoDate(d), its = data[iso] || [];
      return `<button type="button" class="cell ${d.getMonth() !== mo.getMonth() ? 'out' : ''} ${iso === today ? 'today' : ''} ${iso === sel ? 'sel' : ''} ${go ? 'go' : ''}" data-calday="${iso}"><b>${d.getDate()}</b>${its.slice(0, 2).map(x => `<span class="chip ${x.k} ${x.c?.key === 'vencido' ? 'late' : ''} ${x.c?.key === 'completado' || x.a?.status === 'completada' ? 'done' : ''}">${E(x.short)}</span>`).join('')}${its.length > 2 ? `<span class="more">+${its.length - 2} más</span>` : ''}</button>`;
    }).join('');
    const act = x => {
      if (x.k === 'apt') { const s = x.a.status; if (r === 'vet') return (s === 'pendiente' ? `<button class="button button-small button-soft" data-action="appointment-confirm" data-id="${x.a.id}">Confirmar</button>` : '') + (s === 'confirmada' ? `<button class="button button-small button-secondary" data-action="appointment-complete" data-id="${x.a.id}">Completar</button>` : ''); return r === 'owner' && s === 'pendiente' ? `<button class="button button-small button-danger" data-action="appointment-cancel" data-id="${x.a.id}">Cancelar</button>` : ''; }
      return x.k === 'evt' && r === 'vet' && x.e.status !== 'completado' ? `<button class="button button-small button-soft" data-action="complete-event" data-id="${x.e.id}">Completar</button>` : '';
    };
    const pill = x => x.k === 'apt' ? appointmentPill(x.a.status) : x.k === 'evt' ? statusPill(x.c.label, x.c.className) : statusPill('Registrada', 'status-success');
    const list = data[sel] || [];
    const cta = r === 'owner' ? button('Solicitar cita', 'create-appointment', '+', 'button-primary') : r === 'vet' ? button('Programar evento', 'create-event', '+', 'button-primary') : button('Registrar venta', 'create-sale', '+', 'button-primary');
    const legend = r === 'admin' ? '<span><i class="chip sale"></i>Ventas</span>' : '<span><i class="chip apt"></i>Citas</span><span><i class="chip evt"></i>Seguimientos</span><span><i class="chip late"></i>Vencidos</span>';
    return `${pageHeading('Planificación', 'Calendario', r === 'admin' ? 'Las ventas del mes, día por día.' : 'Citas a domicilio y seguimientos preventivos en una sola vista.', cta)}
    <div class="cal-layout"><section class="panel"><div class="cal-head"><h2>${dayName(`${ym(mo)}-01`, { month: 'long', year: 'numeric' })}</h2><div class="cal-nav"><button type="button" class="action-button" data-cal="prev" aria-label="Mes anterior">‹</button><button type="button" class="button button-small button-secondary" data-cal="today">Hoy</button><button type="button" class="action-button" data-cal="next" aria-label="Mes siguiente">›</button></div></div>
    <div class="cal-week">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(x => `<span>${x}</span>`).join('')}</div><div class="cal-grid">${cells}</div><div class="legend cal-legend">${legend}</div></section>
    <section class="panel cal-detail"><div class="panel-header"><div><h3>${dayName(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</h3><p>${list.length ? `${list.length} ${list.length === 1 ? 'registro' : 'registros'}` : 'Día libre'}</p></div></div>${list.map(x => `<div class="cal-item ${x.k}"><div class="ci-top"><strong>${x.t ? `<span class="vt">${formatTime(x.t)}</span> ` : ''}${E(x.label)}</strong>${pill(x)}</div><small>${E(x.sub)}</small>${act(x) ? `<div class="row">${act(x)}</div>` : ''}</div>`).join('') || emptyState('Nada programado', 'Elige otro día o crea un registro nuevo.', '🗓️')}</section></div>`;
  }

  /* ---------- Propietario: Productos como catálogo de revista ---------- */
  const TONES = { Alimentos: ['#f8dc94', '#f0b13c', '🥣'], Higiene: ['#c9e9de', '#7fb7a4', '🧴'], Juguetes: ['#f9cfc8', '#e4877b', '🪢'], Accesorios: ['#b4d2dc', '#4f8a9c', '🦴'], 'Salud animal': ['#d9e1f6', '#8fa5d8', '🩹'] };
  const tone = p => TONES[p.category] || ['#dfe8e6', '#8aa4ad', '🐾'];
  const stock = p => p.stock <= 0 ? statusPill('Agotado', 'status-neutral') : p.stock <= p.minStock ? statusPill(`Quedan ${p.stock}`, 'status-warning') : statusPill('Disponible', 'status-success');
  const view = p => `<button type="button" class="button button-small button-secondary" data-action="view-product" data-id="${p.id}">Ver ficha</button>`;
  function renderCatalog() {
    let list = visibleRows(state.db.products, p => `${p.name} ${p.category} ${p.description}`);
    const cat = state.filters['product-category'] || '', av = state.filters['product-availability'] || '';
    if (cat) list = list.filter(p => p.category === cat);
    if (av === 'available') list = list.filter(p => p.stock > 0);
    const star = [...list].filter(p => p.stock > 0).sort((a, b) => b.price - a.price)[0] || list[0];
    const rest = list.filter(p => p !== star), spans = [3, 3, 2, 2, 2];
    const cats = ['', ...Object.keys(TONES)];
    const masthead = `<header class="mag-head"><div><h1>Catálogo</h1><p>Lo mejor para el día a día de tu mascota, elegido por el equipo de PetDelicias.</p></div><div class="mag-meta"><strong>Edición de ${dayName(todayISO(), { month: 'long', year: 'numeric' })}</strong><span>${state.db.products.length} productos · ${state.db.products.filter(p => p.stock > 0).length} disponibles</span></div></header>
    <div class="mag-cats">${cats.map(c => `<button type="button" class="cat-pill ${c === cat ? 'on' : ''}" data-cat="${c}">${c || 'Todo el catálogo'}</button>`).join('')}</div>
    ${searchToolbar('Buscar en el catálogo', `<select class="filter-select" data-filter="product-availability" aria-label="Disponibilidad"><option value="">Toda disponibilidad</option><option value="available" ${av === 'available' ? 'selected' : ''}>Solo con existencias</option></select>`)}`;
    if (!star) return masthead + emptyState('Nada por aquí', 'Prueba con otra búsqueda o categoría.', '🔎');
    const [a, b, em] = tone(star);
    return `${masthead}<article class="mag-feature" style="--t1:${a};--t2:${b}"><div class="mf-art"><span>${em}</span></div><div class="mf-body"><small>Pieza destacada de ${E(star.category)}</small><h2>${E(star.name)}</h2><p>${E(star.description || 'Seleccionado para el cuidado diario de tu mascota.')}</p><div class="mf-foot"><strong class="price">${money(star.price)}</strong>${stock(star)}${view(star)}</div></div></article>
    ${rest.length ? `<div class="mag-grid">${rest.map((p, i) => { const [t1, t2, e] = tone(p); return `<article class="mag-card" style="--s:${spans[i % 5]};--t1:${t1};--t2:${t2}"><div class="mc-art"><span>${e}</span><em>${E(p.category)}</em></div><div class="mc-body"><h3>${E(p.name)}</h3><p>${E(p.description || '')}</p><div class="mc-foot"><strong class="price">${money(p.price)}</strong>${stock(p)}</div>${view(p)}</div></article>`; }).join('')}</div>` : ''}`;
  }
  const _renderProducts = renderProducts;
  renderProducts = () => state.user.role === 'owner' ? renderCatalog() : _renderProducts();

  const _renderModule = renderModule;
  renderModule = m => m === 'passport' ? renderPassport() : m === 'agenda' ? renderAgenda() : m === 'reports' ? renderReports() : m === 'calendar' ? renderCalendar() : _renderModule(m);

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
  const stagger = () => $$('.hbar,.timeline li,.day,.cell,.cal-item,.mag-card').forEach(el => el.style.setProperty('--i', [...el.parentNode.children].indexOf(el)));
  renderApp = function () { _renderApp(); const pc = $('#pageContent'); if (!pc) return; pc.dataset.view = state.module; stagger(); if (pc.classList.contains('enter')) countUp(); };
  const _navigate = navigate; navigate = m => { enter(); _navigate(m); };
  const _showApp = showApp; showApp = () => { _showApp(); enter(); };

  /* ---------- Animaciones de acciones ---------- */
  const restart = (el, cls, ms) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); if (ms) setTimeout(() => el.classList.remove(cls), ms); };
  const _toast = toast;
  toast = (m, t = 'success', ti) => {
    _toast(m, t, ti);
    if (t === 'success') restart($('#pageContent'), 'acted', 1100);
    else restart($('.modal-card'), 'shake', 500);
  };
  const _closeModal = closeModal;
  closeModal = () => {
    const b = $('.modal-backdrop'); if (!b || b.classList.contains('closing')) return _closeModal();
    b.classList.add('closing'); setTimeout(() => { if ($('.modal-backdrop') === b) _closeModal(); }, 200);
  };
  const _recalc = recalculateSale;
  recalculateSale = () => { _recalc(); restart($('#saleTotal'), 'tick', 450); };
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.button,.action-button,.nav-link,.quick-action,.pp-tab'); if (!b) return;
    const r = b.getBoundingClientRect(), z = Math.max(r.width, r.height) * 2, s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${z}px;height:${z}px;left:${e.clientX - r.left - z / 2}px;top:${e.clientY - r.top - z / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cal]'), d = e.target.closest('[data-calday]');
    if (c) {
      const mo = calMonth(), k = c.dataset.cal, n = k === 'today' ? new Date() : new Date(mo.getFullYear(), mo.getMonth() + (k === 'next' ? 1 : -1), 1);
      state.filters.calMonth = ym(n); if (k === 'today') state.filters.calDay = todayISO();
      state.filters.calGo = true; renderApp(); delete state.filters.calGo;
    } else if (d) {
      const iso = d.dataset.calday, changed = iso.slice(0, 7) !== ym(calMonth());
      state.filters.calDay = iso; state.filters.calMonth = iso.slice(0, 7); if (changed) state.filters.calGo = true;
      renderApp(); delete state.filters.calGo;
    }
  });

  document.addEventListener('click', e => {
    const c = e.target.closest('[data-cat]'); if (!c) return;
    state.filters['product-category'] = c.dataset.cat; renderApp();
  });

  /* ---------- Login: fondo vivo con esferas y burbujas en movimiento ---------- */
  (() => {
    const ls = $('.login-screen'); if (!ls || $('.orbs', ls)) return;
    const orbs = [['8%', '10%', '360px', 'rgba(240,177,60,.5)', '20s'], ['68%', '6%', '440px', 'rgba(31,122,140,.6)', '26s'], ['58%', '58%', '400px', 'rgba(127,183,164,.45)', '23s'], ['-6%', '62%', '320px', 'rgba(240,177,60,.32)', '28s'], ['38%', '28%', '230px', 'rgba(80,170,190,.4)', '17s'], ['84%', '72%', '280px', 'rgba(240,177,60,.38)', '22s']];
    const r = (a, b) => a + Math.random() * (b - a);
    const w = document.createElement('div'); w.className = 'orbs'; w.setAttribute('aria-hidden', 'true');
    w.innerHTML = orbs.map(([x, y, z, c, d], i) => `<span class="orb" style="--x:${x};--y:${y};--s:${z};--c:${c};--d:${d};--dl:-${i * 3}s"></span>`).join('') +
      [...Array(16)].map(() => `<i class="bubble" style="--l:${r(0, 98).toFixed(1)}%;--z:${r(10, 46).toFixed(0)}px;--t:${r(13, 28).toFixed(1)}s;--dl:-${r(0, 26).toFixed(1)}s"></i>`).join('');
    ls.prepend(w);
    ls.addEventListener('pointermove', e => { w.style.setProperty('--px', `${(e.clientX / innerWidth - .5) * -34}px`); w.style.setProperty('--py', `${(e.clientY / innerHeight - .5) * -34}px`); });
  })();

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
