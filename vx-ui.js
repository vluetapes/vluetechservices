/* =====================================================================
   vx-ui.js  v1  —  Vlue Tech Services
   Se carga al final de cada página con defer. El ?v= lo actualiza
   herramientas/revisar.py (córrelo antes de publicar).
   Hace 3 cosas:
     1. Paneles de detalle (<dialog>) con fondo difuminado: abrir, cerrar,
        enlace propio (#pack-despegue) y botón Atrás del celular.
     2. Calculadora de retorno de /salud/.
     3. Carga Google Analytics 4 (si GA4_ID tiene tu ID) y le envía los clics
        marcados con data-evento. Sin ID no carga nada ni envía nada.
   ===================================================================== */
(function () {
  'use strict';

  var d = document;
  var html = d.documentElement;
  var hasDialog = typeof HTMLDialogElement === 'function' &&
                  typeof HTMLDialogElement.prototype.showModal === 'function';

  if (!hasDialog) html.classList.add('vx-nodialog');

  /* ---------- Medición ----------
     Pega aquí tu ID de medición de Google Analytics 4 (empieza con "G-").
     Vacío = no se carga GA4 y los clics no se envían a ningún lado. */
  var GA4_ID = 'G-LJNVK597JG';

  if (GA4_ID && typeof window.gtag !== 'function') {
    var ga = d.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID);
    d.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

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
      producto: el.getAttribute('data-producto') || ''
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

  function getDialog(id) {
    if (!id) return null;
    try { id = decodeURIComponent(id); } catch (err) {}
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
})();
