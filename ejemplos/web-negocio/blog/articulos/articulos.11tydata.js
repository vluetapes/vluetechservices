/* Datos comunes a todos los artículos: molde, dirección /blog/<archivo>/ y borradores. */
import { slug } from "../../eleventy.config.js";

export default {
  layout: "articulo.njk",
  og_tipo: "article",
  eleventyComputed: {
    permalink: (data) => (data.borrador ? false : `/blog/${slug(data.page.fileSlug)}/`),
    imagen_redes: (data) => (/\.(jpe?g|png)$/i.test(data.miniatura || "") ? data.miniatura : data.negocio.imagenRedes),
    imagen_alt: (data) => data.miniatura_alt || data.title,
  },
};
