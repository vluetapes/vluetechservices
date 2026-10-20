/* Arma el archivo "Guardar contacto" (/enlaces/<nombre>/contacto.vcf) de cada página
   de enlaces que lo tenga activado. Los datos salen de la sección "Contacto" de Pages CMS. */
export const data = {
  pagination: {
    data: "collections.enlaces",
    size: 1,
    alias: "p",
    before: (paginas) => paginas.filter((x) => !x.data.contacto || x.data.contacto.guardar !== false),
  },
  permalink: (d) => `/enlaces/${d.p.data.slug_pagina}/contacto.vcf`,
  eleventyExcludeFromCollections: true,
};

export function render(d) {
  return this.vcard(d.p.data, d.sitio.url + d.p.url);
}
