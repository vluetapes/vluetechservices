/* =====================================================================
   vx-ui.js  v1  —  Vlue Tech Services
   Se carga al final de cada página con defer. El ?v= lo actualiza
   herramientas/revisar.py (córrelo antes de publicar).
   Hace 4 cosas (más el aviso de cookies, que carga GA4 solo si la persona acepta):
     1. Paneles de detalle (<dialog>) con fondo difuminado: abrir, cerrar,
        enlace propio (#pack-despegue) y botón Atrás del celular.
     2. Calculadoras: retorno (/salud/), cantidad de tarjetas NFC y "arma tu sitio" (/paginas-web/sitio-web/).
     3. Carga Google Analytics 4 (si GA4_ID tiene tu ID) y le envía los clics
        marcados con data-evento. Sin ID no carga nada ni envía nada.
     4. En celular y tablet, enciende las cards destacadas al pasar por el
        centro de la pantalla (en computador lo hace el hover del CSS).
   ===================================================================== */
(function () {
  'use strict';

  var d = document;
  var html = d.documentElement;
  var hasDialog = typeof HTMLDialogElement === 'function' &&
                  typeof HTMLDialogElement.prototype.showModal === 'function';

  if (!hasDialog) html.classList.add('vx-nodialog');

  /* ---------- Línea de tiempo (.vx-tl) ----------
     Al bajar, la línea se llena hasta la altura del 60% de la pantalla y cada
     punto que queda por encima se enciende. */
  Array.prototype.forEach.call(d.querySelectorAll('.vx-tl'), function (tl) {
    var steps = tl.querySelectorAll(':scope > li');
    var last = steps[steps.length - 1];
    var queued = false;
    tl.classList.add('vx-tl--js');
    function update() {
      queued = false;
      var top = tl.getBoundingClientRect().top;
      var mark = window.innerHeight * 0.6;
      var h = last.offsetTop;
      tl.style.setProperty('--h', h + 'px');
      tl.style.setProperty('--fill', Math.min(1, Math.max(0, (mark - top - 11) / (h || 1))).toFixed(3));
      Array.prototype.forEach.call(steps, function (s) {
        s.classList.toggle('is-on', top + s.offsetTop + 11 <= mark);
      });
    }
    function queue() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  });

  /* ---------- Cards destacadas en pantallas táctiles ----------
     Sin mouse no hay :hover, así que la card se pone azul (.is-lit) mientras
     cruza la franja central de la pantalla y vuelve a blanco al salir. */
  if (window.matchMedia && window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    var lit = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-lit', e.isIntersecting); });
    }, { rootMargin: '-40% 0px -40% 0px' });
    d.querySelectorAll('.vx-card--featured, .vx-card--glow').forEach(function (c) { lit.observe(c); });
  }

  /* ---------- Pasos: la línea se dibuja cuando la lista entra en pantalla ---------- */
  if ('IntersectionObserver' in window && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var pasos = d.querySelectorAll('.vx-steps');
    if (pasos.length) {
      d.documentElement.classList.add('vx-anim');
      var verPasos = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); verPasos.unobserve(e.target); } });
      }, { threshold: 0.35 });
      pasos.forEach(function (p) { verPasos.observe(p); });
    }
  }

  /* ---------- Medición ----------
     Pega aquí tu ID de medición de Google Analytics 4 (empieza con "G-").
     Vacío = no se carga GA4 y los clics no se envían a ningún lado. */
  var GA4_ID = 'G-LJNVK597JG';

  /* Consentimiento (Ley 21.719): GA4 se carga solo si la persona acepta en el aviso.
     La respuesta queda en este navegador ("si" o "no"); cualquier elemento con
     data-cookies (por ejemplo, el enlace del pie) vuelve a mostrar el aviso. */
  var CLAVE = 'vx-consentimiento';
  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento: se pregunta en cada visita */ } }

  function cargarGA() {
    if (!GA4_ID || typeof window.gtag === 'function') return;
    var ga = d.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    d.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  var aviso = null;
  function mostrarAviso() {
    if (aviso) { aviso.hidden = false; return; }
    aviso = d.createElement('div');
    aviso.className = 'vx-cookies';
    aviso.setAttribute('role', 'region');
    aviso.setAttribute('aria-label', 'Aviso de cookies');
    aviso.innerHTML = '<p>Usamos Google Analytics para saber qué partes de la web sirven. Solo se activa si aceptas. ' +
      '<a href="/privacidad/#cookies">Más información</a></p>' +
      '<div class="vx-cookies-btns"><button type="button" class="vx-cookies-no">Rechazar</button>' +
      '<button type="button" class="vx-cookies-si">Aceptar</button></div>';
    aviso.addEventListener('click', function (e) {
      var si = e.target.closest('.vx-cookies-si'), no = e.target.closest('.vx-cookies-no');
      if (!si && !no) return;
      guardar(si ? 'si' : 'no');
      aviso.hidden = true;
      if (si) cargarGA();
      else if (typeof window.gtag === 'function') location.reload(); // quitar GA si ya estaba cargado
    });
    d.body.appendChild(aviso);
  }

  var respuesta = leer();
  if (respuesta === 'si') cargarGA();
  else if (respuesta !== 'no' && GA4_ID) mostrarAviso();
  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookies]');
    if (!t) return;
    e.preventDefault();
    mostrarAviso();
  });

  function track(evento, datos) {
    if (typeof window.gtag !== 'function') return;
    datos = datos || {};
    datos.page_path = location.pathname;
    window.gtag('event', evento, datos);
  }

  d.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-evento]');
    if (!el) return;
    track(el.getAttribute('data-evento'), {
      ubicacion: el.getAttribute('data-ubicacion') || '',
      producto: el.getAttribute('data-producto') || '',
      cantidad: el.getAttribute('data-cantidad') || ''
    });
  });

  /* ---------- Menú hamburguesa (solo se ve en celular, por CSS) ---------- */
  var header = d.querySelector('body > header');
  var burger = header && header.querySelector('.vx-burger');
  if (burger) {
    var setMenu = function (open) {
      header.classList.toggle('vx-nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    var menuOpen = function () { return header.classList.contains('vx-nav-open'); };
    burger.addEventListener('click', function () { setMenu(!menuOpen()); });
    header.querySelector('.nav-links').addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    d.addEventListener('click', function (e) {
      if (menuOpen() && !header.contains(e.target)) setMenu(false);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen()) { setMenu(false); burger.focus(); }
    });
  }

  /* ---------- Paneles de detalle ---------- */
  var current = null;   // panel abierto
  var opener = null;    // botón que lo abrió (para devolverle el foco)
  var pushed = false;   // true si agregamos una entrada al historial al abrir

  // Anclas antiguas que siguen funcionando después de renombrar un panel (enlaces ya compartidos)
  var ALIAS = { 'asesoria-1a1': 'sesion-estrategica' };

  function getDialog(id) {
    if (!id) return null;
    try { id = decodeURIComponent(id); } catch (err) {}
    if (ALIAS[id]) id = ALIAS[id];
    var el = d.getElementById(id);
    return el && el.classList.contains('vx-dialog') ? el : null;
  }

  function cleanup(dlg) {
    if (current !== dlg) return;      // ya se abrió otro panel encima
    current = null;
    html.classList.remove('vx-lock');
    if (opener && typeof opener.focus === 'function' && d.contains(opener)) {
      try { opener.focus({ preventScroll: true }); } catch (err) { opener.focus(); }
    }
    opener = null;
  }

  function closeNow(dlg) {
    if (!dlg) return;
    if (hasDialog) {
      if (dlg.open) dlg.close();      // el evento "close" llama a cleanup
    } else {
      dlg.removeAttribute('open');
      cleanup(dlg);
    }
  }

  function open(dlg, fromHistory) {
    if (!dlg || dlg === current) return;
    if (current) closeNow(current);
    if (!opener) opener = d.activeElement;

    if (hasDialog) dlg.showModal(); else dlg.setAttribute('open', '');
    current = dlg;
    html.classList.add('vx-lock');

    var body = dlg.querySelector('.vx-panel-body');
    if (body) body.scrollTop = 0;

    if (!fromHistory && location.hash !== '#' + dlg.id) {
      history.pushState({ vx: dlg.id }, '', '#' + dlg.id);
      pushed = true;
    } else if (!fromHistory) {
      pushed = false;
    }

    track('ver_detalle', { producto: dlg.id });
  }

  // Cerrar desde la X, "Volver", Esc o clic en el fondo
  function requestClose(dlg) {
    if (!dlg) return;
    if (pushed && history.state && history.state.vx === dlg.id) {
      pushed = false;
      history.back();                 // popstate cierra el panel
      return;
    }
    if (location.hash === '#' + dlg.id) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    closeNow(dlg);
  }

  function syncWithHash() {
    var dlg = getDialog(location.hash.slice(1));
    if (dlg) {
      pushed = !!(history.state && history.state.vx === dlg.id);
      open(dlg, true);
    } else if (current) {
      pushed = false;
      closeNow(current);
    }
  }

  var dialogs = d.querySelectorAll('.vx-dialog');
  if (dialogs.length) {
    Array.prototype.forEach.call(dialogs, function (dlg) {
      var downOnBackdrop = false;

      if (hasDialog) {
        dlg.addEventListener('close', function () { cleanup(dlg); });
        // Esc: pasa por requestClose para mantener el historial en orden
        dlg.addEventListener('cancel', function (e) {
          e.preventDefault();
          requestClose(dlg);
        });
      }

      // Clic en el fondo difuminado. Solo cierra si el clic empezó y
      // terminó fuera del contenido (evita cerrar al seleccionar texto).
      dlg.addEventListener('pointerdown', function (e) { downOnBackdrop = e.target === dlg; });
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg && downOnBackdrop) requestClose(dlg);
        downOnBackdrop = false;
      });
    });

    d.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      var btn = e.target.closest('[data-open]');
      if (btn) {
        var target = getDialog(btn.getAttribute('data-open'));
        if (target) {
          e.preventDefault();
          if (!current) opener = btn;
          open(target, false);
        }
        return;
      }
      var closer = e.target.closest('[data-close]');
      if (closer) {
        e.preventDefault();
        requestClose(closer.closest('.vx-dialog'));
        return;
      }
      // Un enlace a WhatsApp dentro del panel abre otra pestaña: el panel se queda abierto
    });

    // Atrás / Adelante del navegador y enlaces del tipo #pack-despegue
    window.addEventListener('popstate', syncWithHash);
    window.addEventListener('hashchange', syncWithHash);

    // Enlace directo: /catalogo/#pack-despegue abre el panel al cargar
    if (getDialog(location.hash.slice(1))) syncWithHash();
  }

  /* ---------- Calculadora de retorno (/salud/) ---------- */
  var fmt = (window.Intl && Intl.NumberFormat)
    ? new Intl.NumberFormat('es-CL')
    : { format: function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); } };

  function pesos(n) { return '$' + fmt.format(Math.round(n)); }

  Array.prototype.forEach.call(d.querySelectorAll('[data-vx-calc]'), function (calc) {
    var input = calc.querySelector('[data-calc-valor]');
    var plan = calc.querySelector('[data-calc-plan]');
    var out = calc.querySelector('output');
    if (!input || !plan || !out) return;

    var initial = out.textContent;

    function valor() { return parseInt(String(input.value).replace(/\D/g, ''), 10) || 0; }

    function update() {
      var v = valor();
      var precio = parseInt(plan.value, 10) || 0;
      var nombre = plan.options[plan.selectedIndex].text.replace(/\s*\(.*\)\s*$/, '');
      if (!v || !precio) { out.textContent = initial; return; }

      var n = Math.ceil(precio / v);
      out.textContent = '';
      var strong = d.createElement('strong');
      strong.textContent = n === 1 ? '1 paciente nuevo' : n + ' pacientes nuevos';
      out.appendChild(d.createTextNode('Con ' + pesos(v) + ' por paciente, ' + nombre + ' (' + pesos(precio) + ') se paga con '));
      out.appendChild(strong);
      out.appendChild(d.createTextNode('. Es una referencia para tu decisión: no garantizamos un número de pacientes.'));
    }

    input.addEventListener('input', update);
    plan.addEventListener('change', update);
    // Formato con punto de miles al salir del campo (no mientras escribe, para no mover el cursor)
    input.addEventListener('blur', function () { var v = valor(); input.value = v ? fmt.format(v) : ''; });
    input.addEventListener('focus', function () { var v = valor(); input.value = v ? String(v) : ''; });
  });

  /* ---------- Calculadora de cantidad de tarjetas (/catalogo/tarjetas-nfc-resenas/) ----------
     data-tramos="1:24990,3:18330,6:16990" = desde cuántas tarjetas rige cada precio por unidad.
     Sobre data-max no hay precio: se ofrece cotizar por WhatsApp. */
  Array.prototype.forEach.call(d.querySelectorAll('[data-vx-qty]'), function (box) {
    var input = box.querySelector('[data-qty-input]');
    var out = box.querySelector('[data-qty-out]');
    var wa = box.querySelector('[data-qty-wa]');
    if (!input || !out || !wa) return;

    var tramos = box.getAttribute('data-tramos').split(',').map(function (t) {
      var p = t.split(':'); return { desde: parseInt(p[0], 10), precio: parseInt(p[1], 10) };
    }).sort(function (a, b) { return a.desde - b.desde; });
    var max = parseInt(box.getAttribute('data-max'), 10) || 10;
    var base = tramos[0].precio;
    var waBase = wa.href.split('?')[0];

    function unitario(n) {
      var p = base;
      tramos.forEach(function (t) { if (n >= t.desde) p = t.precio; });
      return p;
    }
    function cantidad() { return Math.min(99, Math.max(1, parseInt(input.value, 10) || 1)); }

    function update() {
      var n = cantidad();
      var palabra = n === 1 ? ' tarjeta' : ' tarjetas';
      var strong = d.createElement('strong');
      var msg;
      out.textContent = '';
      if (n > max) {
        strong.textContent = n + palabra + ': te cotizamos';
        out.appendChild(strong);
        out.appendChild(d.createTextNode('. Sobre ' + max + ' tarjetas armamos un precio especial según el diseño y la entrega.'));
        msg = 'Hola, quiero cotizar ' + n + ' tarjetas NFC de reseñas';
        wa.firstChild.nodeValue = 'Cotizar ' + n + ' tarjetas por WhatsApp';
      } else {
        var u = unitario(n), total = u * n, ahorro = base * n - total;
        strong.textContent = n + palabra + ': ' + pesos(total);
        out.appendChild(strong);
        out.appendChild(d.createTextNode(n === 1 ? '.' : ' (' + pesos(u) + ' cada una).'));
        if (ahorro > 0) out.appendChild(d.createTextNode(' Te ahorras ' + pesos(ahorro) + ' frente a comprarlas de a una.'));
        msg = 'Hola, quiero ' + n + palabra + ' NFC de reseñas (' + pesos(total) + ')';
        wa.firstChild.nodeValue = 'Pedir ' + n + palabra + ' por WhatsApp';
      }
      wa.href = waBase + '?text=' + encodeURIComponent(msg);
      wa.setAttribute('data-cantidad', String(n));
      Array.prototype.forEach.call(box.querySelectorAll('[data-qty-set]'), function (b) {
        b.setAttribute('aria-pressed', String(parseInt(b.getAttribute('data-qty-set'), 10) === n));
      });
    }
    function set(n) { input.value = Math.min(99, Math.max(1, n)); update(); }

    box.addEventListener('click', function (e) {
      var step = e.target.closest('[data-qty-step]');
      var pick = e.target.closest('[data-qty-set]');
      if (step) set(cantidad() + parseInt(step.getAttribute('data-qty-step'), 10));
      if (pick) set(parseInt(pick.getAttribute('data-qty-set'), 10));
    });
    input.addEventListener('input', function () { if (input.value !== '') update(); });
    input.addEventListener('blur', function () { input.value = cantidad(); update(); });
    update();
  });

  /* ---------- Calculadora "arma tu sitio" (/paginas-web/sitio-web/) ----------
     data-base = precio del sitio con data-base-paginas páginas; data-extra = cada página extra;
     data-blog = blog autoadministrable; data-seo = textos especializados para SEO, por página. */
  Array.prototype.forEach.call(d.querySelectorAll('[data-vx-webcalc]'), function (box) {
    var num = function (a) { return parseInt(box.getAttribute(a), 10) || 0; };
    var base = num('data-base'), incluidas = num('data-base-paginas'), extra = num('data-extra');
    var precioBlog = num('data-blog'), precioSeo = num('data-seo'), max = num('data-max') || 15;
    var st = { paginas: incluidas, seo: 0 };
    var blog = box.querySelector('[data-w-blog]');
    var total = box.querySelector('[data-w-total]');
    var wa = box.querySelector('[data-w-wa]');
    if (!blog || !total || !wa) return;
    var waBase = wa.href.split('?')[0];

    function update() {
      st.paginas = Math.min(max, Math.max(incluidas, st.paginas));
      st.seo = Math.min(st.paginas, Math.max(0, st.seo));
      box.querySelector('[data-w-out="paginas"]').textContent = st.paginas;
      box.querySelector('[data-w-out="seo"]').textContent = st.seo;
      var extras = st.paginas - incluidas;
      var suma = base + extras * extra + (blog.checked ? precioBlog : 0) + st.seo * precioSeo;
      var partes = [incluidas + ' páginas ' + pesos(base)];
      if (extras) partes.push(extras + (extras === 1 ? ' página extra ' : ' páginas extra ') + pesos(extras * extra));
      if (blog.checked) partes.push('blog ' + pesos(precioBlog));
      if (st.seo) partes.push('textos para SEO en ' + st.seo + (st.seo === 1 ? ' página ' : ' páginas ') + pesos(st.seo * precioSeo));
      total.textContent = '';
      var strong = d.createElement('strong');
      strong.textContent = 'Total: ' + pesos(suma);
      total.appendChild(strong);
      total.appendChild(d.createTextNode(' (' + partes.join(' + ') + '). IVA incluido.'));
      var msg = 'Hola, quiero cotizar un sitio web de ' + st.paginas + ' páginas' + (blog.checked ? ', con blog' : '') +
        (st.seo ? ' y textos para SEO en ' + st.seo + (st.seo === 1 ? ' página' : ' páginas') : '') + ' (' + pesos(suma) + ')';
      wa.href = waBase + '?text=' + encodeURIComponent(msg);
      wa.setAttribute('data-cantidad', String(st.paginas));
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-w-step]');
      if (!b) return;
      st[b.getAttribute('data-w-step')] += parseInt(b.getAttribute('data-d'), 10);
      update();
    });
    blog.addEventListener('change', update);
    update();
  });
})();
