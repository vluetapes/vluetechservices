/* Plantilla Web Cliente — Vlue Tech Services
   ------------------------------------------------------------------
   Sitio de un negocio local con blog autoadministrable.
   - Todo el contenido sale de _data/*.json y blog/articulos/*.md,
     que se editan desde Pages CMS sin tocar código.
   - Colores y fuentes salen de _data/marca.json.
   - Eleventy arma la carpeta _site/, que publica Cloudflare Pages.
   ------------------------------------------------------------------ */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function slug(texto) {
  return String(texto)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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

const aFecha = (v) => (v instanceof Date ? v : new Date(v));

export default function (eleventyConfig) {
  ["assets", "img", "_headers", "favicon.svg"].forEach((r) => eleventyConfig.addPassthroughCopy(r));
  ["README.md", "LEEME.md", "GUIA-CLIENTE.md", "_site/**"].forEach((r) => eleventyConfig.ignores.add(r));

  eleventyConfig.addCollection("articulos", (api) =>
    api.getFilteredByGlob("blog/articulos/*.md").filter((a) => !a.data.borrador).sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addFilter("slug", slug);
  eleventyConfig.addFilter("fechaCorta", (f) => { const d = aFecha(f); return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`; });
  eleventyConfig.addFilter("fechaLarga", (f) => { const d = aFecha(f); return `${d.getUTCDate()} de ${MESES_LARGOS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`; });
  eleventyConfig.addFilter("fechaISO", (f) => aFecha(f).toISOString().slice(0, 10));
  eleventyConfig.addFilter("fechaRSS", (f) => aFecha(f).toUTCString());
  eleventyConfig.addFilter("actualizado", (item) =>
    item.data && item.data.actualizado ? aFecha(item.data.actualizado).toISOString().slice(0, 10) : fechaArchivo(item.inputPath)
  );
  eleventyConfig.addFilter("minutosLectura", (html) => {
    const palabras = String(html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(palabras / 200));
  });
  eleventyConfig.addFilter("conIds", (html) => String(html).replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`));
  eleventyConfig.addFilter("indice", (html) =>
    [...String(html).matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map((m) => ({ id: m[1], texto: m[2].replace(/<[^>]+>/g, "") }))
  );
  eleventyConfig.addFilter("insertarCta", (html, cta) => {
    if (!cta) return html;
    let n = 0;
    const r = String(html).replace(/<h2[ >]/g, (m) => (++n === 3 ? cta + "\n" + m : m));
    return n >= 3 ? r : r + "\n" + cta;
  });
  eleventyConfig.addFilter("relacionados", (lista, url, categoria, cantidad = 2) =>
    (lista || []).filter((a) => a.url !== url)
      .sort((a, b) => (b.data.categoria === categoria) - (a.data.categoria === categoria)).slice(0, cantidad)
  );
  eleventyConfig.addFilter("destacadoDe", (lista) => (lista || []).find((a) => a.data.destacado) || (lista || [])[0] || null);
  eleventyConfig.addFilter("sinArticulo", (lista, quitar) => (lista || []).filter((a) => !quitar || a.url !== quitar.url));
  eleventyConfig.addFilter("conArticulos", (cats, lista) => (cats || []).filter((c) => (lista || []).some((a) => a.data.categoria === c.slug)));
  eleventyConfig.addFilter("porSlug", (lista, s) => (lista || []).find((x) => x.slug === s) || {});
  eleventyConfig.addFilter("dosCifras", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("primeros", (lista, n) => (lista || []).slice(0, n));
  eleventyConfig.addFilter("sinVacios", (lista) => (lista || []).filter(Boolean));

  // Enlace de Google Fonts con las dos fuentes de marca.json
  eleventyConfig.addFilter("fuentesGoogle", (marca) => {
    const familias = [...new Set([marca.fuenteTitulos, marca.fuenteTexto])].filter(Boolean);
    const params = familias.map((f) => {
      const pesos = f === marca.fuenteTitulos && f !== marca.fuenteTexto ? `wght@${marca.pesoTitulos || 700}` : "wght@400;600;700";
      return "family=" + f.trim().replace(/ /g, "+") + ":" + pesos;
    });
    return `https://fonts.googleapis.com/css2?${params.join("&")}&display=swap`;
  });

  const cacheVersiones = new Map();
  eleventyConfig.addFilter("version", (archivo) => {
    if (!cacheVersiones.has(archivo)) cacheVersiones.set(archivo, createHash("sha1").update(fs.readFileSync(archivo)).digest("hex").slice(0, 8));
    return cacheVersiones.get(archivo);
  });

  return {
    dir: { input: ".", includes: "_includes", data: "_data", output: "_site" },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: false,
  };
}
