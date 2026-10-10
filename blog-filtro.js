/* blog-filtro.js — Filtro por tema del listado del blog.
   Botones con data-filtro="tema"; artículos con data-categoria="tema1 tema2".
   Sin JavaScript se ven todos los artículos. */
(function () {
  'use strict';
  var botones = document.querySelectorAll('[data-filtro]');
  var articulos = document.querySelectorAll('[data-categoria]');
  var vacio = document.querySelector('[data-vacio]');

  botones.forEach(function (boton) {
    boton.addEventListener('click', function () {
      var filtro = boton.getAttribute('data-filtro');
      var visibles = 0;
      botones.forEach(function (b) {
        var activo = b === boton;
        b.classList.toggle('is-active', activo);
        b.setAttribute('aria-pressed', activo ? 'true' : 'false');
      });
      articulos.forEach(function (a) {
        var temas = ' ' + a.getAttribute('data-categoria') + ' ';
        var ok = filtro === 'todos' || temas.indexOf(' ' + filtro + ' ') > -1;
        a.hidden = !ok;
        if (ok) visibles++;
      });
      if (vacio) vacio.style.display = visibles ? 'none' : 'block';
    });
  });
})();
