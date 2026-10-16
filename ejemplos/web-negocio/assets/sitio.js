/* sitio.js — menú del celular y filtro del blog. Sin dependencias. */
(function () {
  'use strict';

  /* Menú del celular */
  var boton = document.querySelector('.hamburguesa');
  var cabecera = document.querySelector('.cabecera');
  if (boton && cabecera) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });
  }

  /* Filtro del blog por tema */
  var botones = document.querySelectorAll('[data-filtro]');
  var articulos = document.querySelectorAll('[data-categoria]');
  var vacio = document.querySelector('[data-vacio]');
  botones.forEach(function (b) {
    b.addEventListener('click', function () {
      var filtro = b.getAttribute('data-filtro'), visibles = 0;
      botones.forEach(function (o) {
        o.classList.toggle('activo', o === b);
        o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
      });
      articulos.forEach(function (a) {
        var ok = filtro === 'todos' || a.getAttribute('data-categoria') === filtro;
        a.hidden = !ok;
        if (ok) visibles++;
      });
      if (vacio) vacio.style.display = visibles ? 'none' : 'block';
    });
  });
})();
