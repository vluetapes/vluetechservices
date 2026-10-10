/* Datos comunes a todos los artículos de blog/articulos/.
   - Usan el molde _includes/articulo.njk.
   - Su dirección es /blog/<nombre-del-archivo>/.
   - Si el campo "Borrador" está marcado, el artículo no se publica. */
import { slug } from "../../eleventy.config.js";

export default {
  layout: "articulo.njk",
  estilos: ["blog-listado.css", "blog.css"],   // blog-listado.css trae la portada blanca con brillo azul
  og_tipo: "article",
  eleventyComputed: {
    permalink: (data) => (data.borrador ? false : `/blog/${slug(data.page.fileSlug)}/`),
    // La imagen para redes debe ser JPG o PNG; si la miniatura es otra cosa, se usa la general del blog
    imagen_redes: (data) => (/\.(jpe?g|png)$/i.test(data.miniatura || "") ? data.miniatura : data.sitio.imagenRedes),
    imagen_alt: (data) => data.miniatura_alt || data.title,
  },
};
