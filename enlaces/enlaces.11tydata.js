/* Datos comunes a todas las páginas de enlaces (link en bio) de enlaces/.
   - Usan el molde _includes/enlaces/pagina.njk, que elige el diseño ("buscador" o "vitrina").
   - Su dirección es /enlaces/<nombre-del-archivo>/.
   - Si "Borrador" está marcado, no se publica. Sí se ve en tu computador (VER-EN-EL-NAVEGADOR.cmd).
   - Por defecto no salen en Google (noindex y fuera del sitemap), salvo que marques "Mostrar en Google". */
import { slug } from "../eleventy.config.js";

const verBorradores = process.env.ELEVENTY_RUN_MODE === "serve" || !!process.env.VER_BORRADORES;

export default {
  layout: "enlaces/pagina.njk",
  eleventyComputed: {
    slug_pagina: (d) => slug(d.page.fileSlug),
    permalink: (d) => (d.borrador && !verBorradores ? false : `/enlaces/${slug(d.page.fileSlug)}/`),
    noindex: (d) => !d.mostrar_en_google || !!d.borrador,
  },
};
