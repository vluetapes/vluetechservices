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

/* RUT siempre con puntos y guion, se escriba como se escriba: "785143566" -> "78.514.356-6".
   Si el dígito verificador no calza, lo avisa al armar la web (pero igual lo muestra). */
export function formatoRut(valor) {
  const limpio = String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2) return String(valor ?? "");
  const cuerpo = limpio.slice(0, -1), dv = limpio.slice(-1);
  let suma = 0, factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { suma += +cuerpo[i] * factor; factor = factor === 7 ? 2 : factor + 1; }
  const esperado = { 11: "0", 10: "K" }[11 - (suma % 11)] ?? String(11 - (suma % 11));
  if (esperado !== dv) console.warn(`[enlaces] Revisa el RUT ${valor}: el dígito verificador debería ser ${esperado}.`);
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
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

  /* ---------- Páginas de enlaces (link en bio de clientes) ----------
     Cada cliente es un archivo enlaces/<nombre>.md que se edita en Pages CMS.
     Los moldes están en _includes/enlaces/. */
  eleventyConfig.addCollection("enlaces", (api) =>
    api.getFilteredByGlob("enlaces/*.md").filter((p) => p.url)
  );

  const escaparHtml = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // "No aparezco en Google Maps" + "aparezco en Google Maps" -> No <b>aparezco en Google Maps</b>
  eleventyConfig.addFilter("resaltar", (texto, parte, etiqueta = "b") => {
    const t = escaparHtml(texto);
    if (!parte) return t;
    const p = escaparHtml(parte);
    const i = t.toLowerCase().indexOf(p.toLowerCase());
    return i < 0 ? t : `${t.slice(0, i)}<${etiqueta}>${t.slice(i, i + p.length)}</${etiqueta}>${t.slice(i + p.length)}`;
  });

  // Saltos de línea que se escriben con Enter en Pages CMS -> <br> (se usa después de "resaltar")
  eleventyConfig.addFilter("saltos", (html) => String(html ?? "").trim().replace(/\s*\r?\n\s*/g, "<br>"));

  // Enlace de WhatsApp con el mensaje ya escrito
  eleventyConfig.addFilter("wa", (numero, mensaje, saludo = "") => {
    const n = String(numero || "").replace(/\D/g, "");
    const texto = `${saludo || ""}${mensaje || ""}`.trim();
    return `https://wa.me/${n}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;
  });

  // Días del horario: ["lun","mar","mie","jue","vie"] -> "Lun a Vie"
  const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
  const NOMBRE_DIA = { lun: "Lun", mar: "Mar", mie: "Mié", jue: "Jue", vie: "Vie", sab: "Sáb", dom: "Dom" };
  eleventyConfig.addFilter("dias", (lista) => {
    const d = [...(lista || [])].filter((x) => DIAS.includes(x)).sort((a, b) => DIAS.indexOf(a) - DIAS.indexOf(b));
    const seguidos = d.every((x, i) => i === 0 || DIAS.indexOf(x) === DIAS.indexOf(d[i - 1]) + 1);
    return seguidos && d.length > 2 ? `${NOMBRE_DIA[d[0]]} a ${NOMBRE_DIA[d.at(-1)]}` : d.map((x) => NOMBRE_DIA[x]).join(", ");
  });

  // Todos los datos para copiar de una vez: solo los valores, uno por línea (sin "RUT:" ni títulos)
  eleventyConfig.addFilter("datosTexto", (lista) =>
    (lista || []).map((d) => (/\brut\b/i.test(d.etiqueta || "") ? formatoRut(d.valor) : d.valor)).filter(Boolean).join("\n")
  );
  // Datos de transferencia en el orden de los bancos, solo los valores
  eleventyConfig.addFilter("transferenciaTexto", (t) =>
    ["nombre", "rut", "banco", "tipo", "numero", "email"].map((k) => (k === "rut" ? formatoRut((t || {})[k]) : (t || {})[k])).filter(Boolean).join("\n")
  );
  eleventyConfig.addFilter("rut", formatoRut);

  // Teléfono para tel: (+56926191935)
  eleventyConfig.addFilter("tel", (n) => "+" + String(n || "").replace(/\D/g, ""));

  // Archivo de contacto (.vcf) para el botón "Guardar contacto"
  eleventyConfig.addFilter("vcard", (d, urlPagina) => {
    const e = (v) => String(v ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
    const c = d.contacto || {};
    const telefono = c.telefono || d.whatsapp;
    const L = ["BEGIN:VCARD", "VERSION:3.0"];
    if (c.nombre) {
      const partes = c.nombre.trim().split(/\s+/);
      L.push(`N:${e(partes.slice(1).join(" "))};${e(partes[0])};;;`, `FN:${e(c.nombre)}`);
    } else {
      L.push(`N:${e(d.title)};;;;`, `FN:${e(d.title)}`, "X-ABShowAs:COMPANY");
    }
    L.push(`ORG:${e(d.title)}`);
    if (c.cargo) L.push(`TITLE:${e(c.cargo)}`);
    if (telefono) L.push(`TEL;TYPE=CELL,VOICE:+${String(telefono).replace(/\D/g, "")}`);
    if (c.email) L.push(`EMAIL;TYPE=INTERNET:${e(c.email)}`);
    if (c.web) L.push(`URL:${e(c.web)}`);
    L.push(`URL:${e(urlPagina)}`);
    if (c.direccion) L.push(`ADR;TYPE=WORK:;;${e(c.direccion)};;;;`);
    if (c.nota) L.push(`NOTE:${e(c.nota)}`);
    // Foto o logo dentro del contacto (solo JPG o PNG del sitio, de menos de 200 KB)
    const foto = String(c.foto || d.logo || "").split("?")[0].replace(/^\//, "");
    const tipo = /\.png$/i.test(foto) ? "PNG" : /\.jpe?g$/i.test(foto) ? "JPEG" : "";
    if (tipo && fs.existsSync(foto) && fs.statSync(foto).size < 200_000) {
      L.push(`PHOTO;ENCODING=b;TYPE=${tipo}:${fs.readFileSync(foto).toString("base64")}`);
    }
    L.push("END:VCARD");
    // Las líneas largas se doblan cada 74 caracteres, como pide el formato
    return L.map((l) => l.match(/.{1,74}/g).join("\r\n ")).join("\r\n") + "\r\n";
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

  /* Imagen visible en WebP si existe la copia .webp al lado (la JPG queda para redes) */
  eleventyConfig.addFilter("webp", (url) => {
    const webp = String(url || "").replace(/\.(jpe?g|png)$/i, ".webp");
    return webp !== url && fs.existsSync(webp.replace(/^\//, "")) ? webp : url;
  });

  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md", "html", "11ty.js"],
    htmlTemplateEngine: false,       // las páginas .html se copian tal cual
    markdownTemplateEngine: false,   // el texto de los artículos no ejecuta código
  };
}
