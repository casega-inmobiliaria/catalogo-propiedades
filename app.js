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

function updateRangosPrecios() {
  const op = document.getElementById('f-operacion').value;
  const sel = document.getElementById('f-precio');
  const valorActual = sel.value;

  const rangosVenta = [
    { label: 'Menos de $1M',  value: '0-1000000' },
    { label: '$1M – $3M',     value: '1000000-3000000' },
    { label: '$3M – $6M',     value: '3000000-6000000' },
    { label: '$6M – $10M',    value: '6000000-10000000' },
    { label: 'Más de $10M',   value: '10000000-99999999' },
  ];

  const rangosRenta = [
    { label: 'Menos de $10K', value: '0-10000' },
    { label: '$10K – $20K',   value: '10000-20000' },
    { label: '$20K – $40K',   value: '20000-40000' },
    { label: 'Más de $40K',   value: '40000-99999999' },
  ];

  const rangos = op === 'Renta' ? rangosRenta : rangosVenta;

  sel.innerHTML = '<option value="">Precio</option>';
  rangos.forEach(r => {
    const o = document.createElement('option');
    o.value = r.value;
    o.textContent = r.label;
    sel.appendChild(o);
  });

  if ([...sel.options].some(o => o.value === valorActual)) {
    sel.value = valorActual;
  }
}

function applyFilters() {
  updateRangosPrecios();

  const search = document.getElementById('f-search').value.toLowerCase();
  const op = document.getElementById('f-operacion').value;
  const tipo = document.getElementById('f-tipo').value;
  const status = document.getElementById('f-status').value;
  const zona = document.getElementById('f-zona').value;
  const excl = document.getElementById('f-exclusiva').value;
  const precioRango = document.getElementById('f-precio').value;
  const vigencia = document.getElementById('f-vigencia').value;

  const filtered = allProps.filter(p => {
    if (search && !JSON.stringify(p).toLowerCase().includes(search)) return false;
    if (op && p.operacion !== op && p.operacion !== 'Venta y Renta') return false;
    if (tipo && p.tipo !== tipo) return false;
    if (status && p.status !== status) return false;
    if (zona && p.zona !== zona) return false;
    if (excl && p.exclusiva !== excl) return false;

    if (precioRango) {
      const [min, max] = precioRango.split('-').map(Number);
      let valorPrecio;
      if (p.operacion === 'Venta y Renta') {
        valorPrecio = op === 'Renta' ? p.precio_renta : p.precio_venta;
      } else {
        valorPrecio = p.operacion === 'Renta' ? p.precio_renta : p.precio_venta;
      }
      const numPrecio = parseFloat(String(valorPrecio).replace(/[^0-9.]/g, ''));
      if (isNaN(numPrecio) || numPrecio < min || numPrecio > max) return false;
    }

    if (vigencia) {
      if (!p.fecha_vencimiento) return false;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const venc = new Date(p.fecha_vencimiento);
      if (isNaN(venc)) return false;
      const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
      if (vigencia === 'vencido'  && dias >= 0) return false;
      if (vigencia === 'critico'  && (dias < 0 || dias > 15)) return false;
      if (vigencia === 'proximo'  && (dias < 0 || dias <= 15 || dias > 30)) return false;
      if (vigencia === 'vigente'  && dias <= 30) return false;
    }

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
  document.getElementById('f-precio').value = '';
  document.getElementById('f-vigencia').value = '';
  applyFilters();
}

function statusClass(s) {
  const m = { 'Disponible': 'disponible', 'Apartada': 'apartada', 'Vendida': 'vendida', 'Rentada': 'rentada' };
  return m[s] || 'disponible';
}

function vigenciaBadge(fechaVenc) {
  if (!fechaVenc) return '';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVenc);
  if (isNaN(venc)) return '';
  const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));

  let estilo, texto;
  if (dias < 0) {
    estilo = 'background:#fee2e2;color:#991b1b;border-color:#fca5a5';
    texto = 'Acuerdo vencido';
  } else if (dias <= 15) {
    estilo = 'background:#ffedd5;color:#9a3412;border-color:#fdba74';
    texto = `Vence en ${dias} día${dias !== 1 ? 's' : ''}`;
  } else if (dias <= 30) {
    estilo = 'background:#fef9c3;color:#854d0e;border-color:#fde047';
    texto = `Vence en ${dias} días`;
  } else {
    estilo = 'background:#dcfce7;color:#166534;border-color:#86efac';
    texto = `Vence en ${dias} días`;
  }

  return `<span class="tag" style="${estilo}"><i class="ti ti-calendar-time"></i> ${texto}</span>`;
}

function formatPrecio(valor) {
  if (!valor) return '—';
  const num = parseFloat(String(valor).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return valor;
  return '$' + num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function cardHTML(p, idx) {
  const esAmbas = p.operacion === 'Venta y Renta';

  const precioHTML = esAmbas
    ? `<div class="prop-precio-doble">
        <div class="precio-item">
          <span class="precio-label">Venta</span>
          <span class="precio-val">${formatPrecio(p.precio_venta)}${p.iva === 'Sí' ? '<small>+ IVA</small>' : ''}</span>
        </div>
        <div class="precio-item">
          <span class="precio-label">Renta</span>
          <span class="precio-val">${formatPrecio(p.precio_renta)}<small>/mes</small></span>
        </div>
      </div>`
    : `<div class="prop-precio">${p.operacion === 'Renta' ? formatPrecio(p.precio_renta) : formatPrecio(p.precio_venta)}${p.iva === 'Sí' ? '<small>+ IVA</small>' : ''}</div>`;

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
    vigenciaBadge(p.fecha_vencimiento),
  ].filter(Boolean).join('');

  const links = [
    p.maps ? `<a class="link-btn" href="${p.maps}" target="_blank" rel="noopener noreferrer"><i class="ti ti-map-pin"></i> Maps</a>` : '',
    p.web ? `<a class="link-btn" href="${p.web}" target="_blank" rel="noopener noreferrer"><i class="ti ti-world"></i> Sitio</a>` : '',
    p.easybroker ? `<a class="link-btn" href="${p.easybroker}" target="_blank" rel="noopener noreferrer"><i class="ti ti-home-search"></i> EasyBroker</a>` : '',
    p.fotos_drive ? `<a class="link-btn" href="${p.fotos_drive}" target="_blank" rel="noopener noreferrer"><i class="ti ti-photo"></i> Fotos</a>` : '',
    p.ficha_tecnica ? `<a class="link-btn" href="${p.ficha_tecnica}" target="_blank" rel="noopener noreferrer"><i class="ti ti-file-description"></i> Ficha</a>` : '',
    p.video ? `<a class="link-btn" href="${p.video}" target="_blank" rel="noopener noreferrer"><i class="ti ti-player-play"></i> Video</a>` : '',
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
        ${precioHTML}
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
  // Sin restauración automática de sesión por seguridad
});