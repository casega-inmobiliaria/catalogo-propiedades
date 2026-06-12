
const API_URL = "https://script.google.com/macros/s/AKfycbwAMiqvgRr_OoT7J_mHN8zhp8uyBHt8pe5rVAFW5SYcCHfg_ANheRsENJPLY0ACno6exw/exec";
let allProps = [];

async function doLogin() {

  document.getElementById('login-error').style.display = 'none';

  const usuario =
    document.getElementById('user-input').value.trim();

  const password =
    document.getElementById('pass-input').value;

  try {

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ usuario, password })
    });

    const json = await res.json();

    if (!json.success) {

      document.getElementById('login-error').textContent =
        json.message;

      document.getElementById('login-error').style.display =
        'block';

      return;
    }

    sessionStorage.setItem("logged", "true");
    sessionStorage.setItem("user", usuario);
    sessionStorage.setItem("pass", password)

    document.getElementById('login-screen').style.display =
      'none';

    document.getElementById('app').style.display =
      'block';

    allProps = json.data;

    populateZonas();
    applyFilters();

  } catch(err) {

    alert("Error de conexión");

  }
}
function doLogout() {

  sessionStorage.clear();

  document.getElementById('login-screen').style.display =
    'flex';

  document.getElementById('app').style.display =
    'none';

  document.getElementById('user-input').value = '';
  document.getElementById('pass-input').value = '';

}

function populateZonas() {
  const zonas = [...new Set(allProps.map(p => p.zona).filter(Boolean))].sort();
  const sel = document.getElementById('f-zona');
  sel.innerHTML = '<option value="">Zona</option>';
  zonas.forEach(z => {
    const o = document.createElement('option');
    o.value = z; o.textContent = z;
    sel.appendChild(o);
  });
}

function applyFilters() {
  const search = document.getElementById('f-search').value.toLowerCase();
  const op = document.getElementById('f-operacion').value;
  const tipo = document.getElementById('f-tipo').value;
  const status = document.getElementById('f-status').value;
  const zona = document.getElementById('f-zona').value;
  const excl = document.getElementById('f-exclusiva').value;
  const filtered = allProps.filter(p => {
    if (search && !JSON.stringify(p).toLowerCase().includes(search)) return false;
    if (op && p.operacion !== op) return false;
    if (tipo && p.tipo !== tipo) return false;
    if (status && p.status !== status) return false;
    if (zona && p.zona !== zona) return false;
    if (excl && p.exclusiva !== excl) return false;
    return true;
  });
  document.getElementById('total-count').textContent = allProps.length;
  document.getElementById('results-count').textContent = `Mostrando ${filtered.length} de ${allProps.length} propiedades`;
  renderGrid(filtered);
}

function clearFilters() {

  document.getElementById('f-search').value = '';
  document.getElementById('f-operacion').value = '';
  document.getElementById('f-tipo').value = '';
  document.getElementById('f-status').value = '';
  document.getElementById('f-zona').value = '';
  document.getElementById('f-exclusiva').value = '';

  applyFilters();
}

function statusClass(s) {
  const m = { 'Disponible': 'disponible', 'Apartada': 'apartada', 'Vendida': 'vendida', 'Rentada': 'rentada' };
  return m[s] || 'disponible';
}

function cardHTML(p, idx) {
  const precio = p.operacion === 'Renta' ? p.precio_renta : p.precio_venta;
  const specs = [
    p.recamaras ? `<div class="spec-item"><span class="spec-val">${p.recamaras}</span><span class="spec-lbl">recámaras</span></div>` : '',
    p.banos ? `<div class="spec-item"><span class="spec-val">${p.banos}</span><span class="spec-lbl">baños</span></div>` : '',
    p.m2 ? `<div class="spec-item"><span class="spec-val">${p.m2}</span><span class="spec-lbl">m²</span></div>` : '',
  ].filter(Boolean).join('');
  const extras = [
    p.zona ? `<span class="tag"><i class="ti ti-map-2"></i> ${p.zona}</span>` : '',
    p.nivel ? `<span class="tag">Nivel ${p.nivel}</span>` : '',
    p.estacionamiento ? `<span class="tag"><i class="ti ti-car"></i> ${p.estacionamiento} cajón${p.estacionamiento != '1' ? 'es' : ''}</span>` : '',
    p.amueblado && p.amueblado !== 'N/A' ? `<span class="tag">${p.amueblado === 'Sí' ? 'Amueblado' : 'Sin amueblar'}</span>` : '',
    p.mant_costo ? `<span class="tag">Mant. ${p.mant_costo}</span>` : '',
    p.mant_incluido === 'Sí' ? `<span class="tag" style="color:#065f46;background:#d1fae5;border-color:#a7f3d0;">Mant. incluido</span>` : '',
    p.iva === 'Sí' ? `<span class="tag tag-iva">+ IVA</span>` : '',
  ].filter(Boolean).join('');
  const links = [
    p.maps ? `<a class="link-btn" href="${p.maps}"target="_blank" rel="noopener noreferrer""><i class="ti ti-map-pin"></i> Maps</a>` : '',
    p.web ? `<a class="link-btn" href="${p.web}"target="_blank" rel="noopener noreferrer""><i class="ti ti-world"></i> Sitio</a>` : '',
    p.easybroker ? `<a class="link-btn" href="${p.easybroker}"target="_blank" rel="noopener noreferrer""><i class="ti ti-home-search"></i> EasyBroker</a>` : '',
    p.fotos_drive ? `<a class="link-btn" href="${p.fotos_drive}"target="_blank" rel="noopener noreferrer""><i class="ti ti-photo"></i> Fotos</a>` : '',
    p.ficha_tecnica ? `<a class="link-btn" href="${p.ficha_tecnica}"target="_blank" rel="noopener noreferrer""><i class="ti ti-file-description"></i> Ficha</a>` : '',
    p.video ? `<a class="link-btn" href="${p.video}"target="_blank" rel="noopener noreferrer""><i class="ti ti-player-play"></i> Video</a>` : '',
  ].filter(Boolean).join('');
  const copyEscaped = (p.copy || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  const waMsg = encodeURIComponent(p.copy || '');
  return `
    <div class="prop-card">
      <div class="card-header">
        <div style="flex:1;">
          <div class="prop-name">${p.nombre || 'Sin nombre'}</div>
          <div class="prop-address">${p.direccion || ''}</div>
        </div>
        <span class="status-badge status-${statusClass(p.status)}">${p.status || ''}</span>
      </div>
      <div class="card-body">
        <div class="prop-precio">${precio || '—'}${p.iva === 'Sí' ? '<small>+ IVA</small>' : ''}</div>
        <div class="prop-tipo-row">
          <span class="tag tag-blue">${p.operacion || ''}</span>
          <span class="tag">${p.tipo || ''}</span>
          ${p.exclusiva === 'Exclusiva' ? '<span class="tag tag-gold">Exclusiva</span>' : '<span class="tag">Opcional</span>'}
        </div>
        ${specs ? `<div class="prop-specs">${specs}</div>` : ''}
        ${extras ? `<div class="extra-specs">${extras}</div>` : ''}
        ${links ? `<div class="card-links">${links}</div>` : ''}
        <div class="copy-section">
          <div class="copy-label"><i class="ti ti-message" style="font-size:13px;"></i> Copy listo para enviar</div>
          <div class="copy-text">${(p.copy || 'Sin copy').replace(/\n/g, '<br>')}</div>
          <div class="card-actions">
            <button class="btn-copy" onclick="copyCopy('${copyEscaped}', this)"><i class="ti ti-copy"></i> Copiar</button>
            <button class="btn-wa" onclick="toggleWaInput(${idx})"><i class="ti ti-brand-whatsapp"></i> Enviar</button>
          </div>
          <div class="wa-input-row" id="wa-row-${idx}" style="display:none;">
            <input type="tel" id="wa-num-${idx}" placeholder="Número del cliente (ej. 526691234567)" />
            <button class="wa-send" onclick="sendWhatsApp(${idx}, '${waMsg}')"><i class="ti ti-send"></i> Abrir</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderGrid(props) {
  const grid = document.getElementById('prop-grid');
  if (props.length === 0) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-building-off"></i>No hay propiedades con esos filtros</div>';
    return;
  }
  grid.innerHTML = props.map((p, i) => cardHTML(p, i)).join('');
}

function toggleWaInput(idx) {
  const row = document.getElementById(`wa-row-${idx}`);
  row.style.display = row.style.display === 'none' ? 'flex' : 'none';
  if (row.style.display === 'flex') document.getElementById(`wa-num-${idx}`).focus();
}

function sendWhatsApp(idx, msg) {
  const num = document.getElementById(`wa-num-${idx}`).value.replace(/\D/g, '');
  if (!num || num.length < 10) { alert('Escribe un número válido con lada. Ej: 526691234567'); return; }
  window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
}

function copyCopy(text, btn) {
  const clean = text.replace(/\\n/g, '\n');
  navigator.clipboard.writeText(clean).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="ti ti-check"></i> Copiado';
    btn.style.color = '#065f46';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
  });
}

window.addEventListener('load', () => {
});