/* Configuración de Eleventy — vluetechservices.cl
   ------------------------------------------------------------------
   Eleventy arma la carpeta _site/ (lo que se publica):
   - Las páginas .html de siempre se copian TAL CUAL, sin procesarlas.
     Las sigues editando como hoy.
   - El blog se arma con los moldes de _includes/ y los artículos de
     blog/articulos/*.md (los que escribe Pages CMS).
   - sitemap.xml y blog/feed.xml se generan solos en cada publicación.
   ------------------------------------------------------------------ */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/* "Cómo conseguir más reseñas" -> "como-conseguir-mas-resenas" */
export function slug(texto) {
  return String(texto)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* Fecha de la última modificación de un archivo: la del último commit en git
   (en GitHub) o, si no hay git, la del archivo en el computador. */
const cacheFechas = new Map();
function fechaArchivo(ruta) {
  if (cacheFechas.has(ruta)) return cacheFechas.get(ruta);
  let fecha = "";
  try {
    fecha = execFileSync("git", ["log", "-1", "--format=%cs", "--", ruta], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch { /* sin git */ }
  if (!fecha) fecha = fs.statSync(ruta).mtime.toISOString().slice(0, 10);
  cacheFechas.set(ruta, fecha);
  return fecha;
}

function aFecha(valor) {
  return valor instanceof Date ? valor : new Date(valor);
}

export default function (eleventyConfig) {
  /* ---------- Archivos que se copian sin cambios ---------- */
  [
    "CNAME", "robots.txt", "favicon.ico", "manifest.json", "img", "fonts",
    "style_work2.css", "vx-ui.css", "vx-ui.js",
    "blog.css", "blog-listado.css", "blog-filtro.js",
  ].forEach((ruta) => eleventyConfig.addPassthroughCopy(ruta));

  /* ---------- Lo que no es parte del sitio ---------- */
  ["README.md", "LEEME.md", "herramientas/**", "_site/**", "ejemplos/**"].forEach((r) => eleventyConfig.ignores.add(r));

  /* ---------- Colección de artículos (sin borradores, el más nuevo primero) ---------- */
  eleventyConfig.addCollection("articulos", (api) =>
    api.getFilteredByGlob("blog/articulos/*.md")
      .filter((a) => !a.data.borrador)
      .sort((a, b) => b.date - a.date)
  );

  /* ---------- Tablas de los artículos ----------
     Las tablas que se escriben en Pages CMS salen como <table> sin clase.
     Aquí se les pone el estilo de la web (vx-table) y una caja que deja
     deslizarlas de lado en el celular, sin ensanchar la página. */
  eleventyConfig.amendLibrary("md", (md) => {
    md.renderer.rules.table_open = () => '<div class="vx-table-wrap"><table class="vx-table">\n';
    md.renderer.rules.table_close = () => "</table></div>\n";
  });

  /* ---------- Filtros que usan los moldes ---------- */
  eleventyConfig.addFilter("slug", slug);

  // 9 oct 2026
  eleventyConfig.addFilter("fechaCorta", (f) => { const d = aFecha(f); return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`; });
  // 9 de octubre de 2026
  eleventyConfig.addFilter("fechaLarga", (f) => { const d = aFecha(f); return `${d.getUTCDate()} de ${MESES_LARGOS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`; });
  // 2026-10-09
  eleventyConfig.addFilter("fechaISO", (f) => aFecha(f).toISOString().slice(0, 10));
  // Fecha para el RSS
  eleventyConfig.addFilter("fechaRSS", (f) => aFecha(f).toUTCString());

  // Fecha de la última modificación de una página (para el sitemap y dateModified)
  eleventyConfig.addFilter("actualizado", (item) => {
    if (item.data && item.data.actualizado) return aFecha(item.data.actualizado).toISOString().slice(0, 10);
    return fechaArchivo(item.inputPath);
  });

  // Minutos de lectura (200 palabras por minuto)
  eleventyConfig.addFilter("minutosLectura", (html) => {
    const palabras = String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(palabras / 200));
  });

  // Agrega id a cada <h2> del artículo para el índice y los enlaces directos
  eleventyConfig.addFilter("conIds", (html) =>
    String(html).replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`)
  );
  // Lista de subtítulos para el índice "En este artículo"
  eleventyConfig.addFilter("indice", (html) =>
    [...String(html).matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map((m) => ({ id: m[1], texto: m[2].replace(/<[^>]+>/g, "") }))
  );
  // Pone el recuadro del servicio antes del tercer subtítulo (a mitad del artículo)
  eleventyConfig.addFilter("insertarCta", (html, cta) => {
    if (!cta) return html;
    let n = 0;
    const resultado = String(html).replace(/<h2[ >]/g, (m) => (++n === 3 ? cta + "\n" + m : m));
    return n >= 3 ? resultado : resultado + "\n" + cta;
  });

  // Artículos relacionados: primero los de la misma categoría
  eleventyConfig.addFilter("relacionados", (articulos, url, categoria, cantidad = 2) =>
    (articulos || [])
      .filter((a) => a.url !== url)
      .sort((a, b) => (b.data.categoria === categoria) - (a.data.categoria === categoria))
      .slice(0, cantidad)
  );

  // Artículo destacado: el que tiene "Destacar arriba" marcado o, si no hay, el más nuevo
  eleventyConfig.addFilter("destacadoDe", (articulos) =>
    (articulos || []).find((a) => a.data.destacado) || (articulos || [])[0] || null
  );
  // La lista sin un artículo (para no repetir el destacado en la grilla)
  eleventyConfig.addFilter("sinArticulo", (articulos, quitar) =>
    (articulos || []).filter((a) => !quitar || a.url !== quitar.url)
  );
  // Solo las categorías que tienen al menos un artículo publicado
  eleventyConfig.addFilter("conArticulos", (categorias, articulos) =>
    (categorias || []).filter((c) => (articulos || []).some((a) => a.data.categoria === c.slug))
  );

  // Busca un elemento de una lista por su slug (categorías)
  eleventyConfig.addFilter("porSlug", (lista, s) => (lista || []).find((x) => x.slug === s) || {});

  // Número de dos cifras: 1 -> "01"
  eleventyConfig.addFilter("dosCifras", (n) => String(n).padStart(2, "0"));

  // Versión de un CSS/JS según su contenido (?v=...), para que nadie vea una versión vieja
  const cacheVersiones = new Map();
  eleventyConfig.addFilter("version", (archivo) => {
    if (!cacheVersiones.has(archivo)) {
      cacheVersiones.set(archivo, createHash("sha1").update(fs.readFileSync(archivo)).digest("hex").slice(0, 8));
    }
    return cacheVersiones.get(archivo);
  });

  // Agrega ?v=... a una imagen del sitio según su contenido. Cloudflare guarda las imágenes
  // un año en el navegador: así, si cambias una imagen sin cambiarle el nombre, se ve la nueva.
  eleventyConfig.addFilter("conVersion", (url) => {
    if (!url || /^https?:/.test(url)) return url;
    const archivo = url.replace(/^\//, "").split("?")[0];
    if (!fs.existsSync(archivo)) return url;
    if (!cacheVersiones.has(archivo)) {
      cacheVersiones.set(archivo, createHash("sha1").update(fs.readFileSync(archivo)).digest("hex").slice(0, 8));
    }
    return `${url.split("?")[0]}?v=${cacheVersiones.get(archivo)}`;
  });

  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: false,       // las páginas .html se copian tal cual
    markdownTemplateEngine: false,   // el texto de los artículos no ejecuta código
  };
}
