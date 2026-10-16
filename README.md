# vluetechservices.cl

Sitio de Vlue Tech Services SpA (Santiago): fichas de Google Maps, tarjetas NFC de reseñas y gestión mensual para negocios locales.

Las páginas son HTML, CSS y JavaScript escritos a mano. El blog se arma con [Eleventy](https://www.11ty.dev/) y sus artículos se escriben en [Pages CMS](https://app.pagescms.org/). Cada cambio en `main` se publica solo en GitHub Pages con `.github/workflows/publicar.yml` (dominio en `CNAME`).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Inicio |
| `catalogo/` | Catálogo con packs y enlaces a las 4 categorías |
| `catalogo/tarjetas-nfc-resenas/`, `ficha-google-maps/`, `gestion-resenas-google/`, `tarjeta-profesional/` | Una página por categoría |
| `salud/` | Planes para clínicas y consultas |
| `contacto/` | Canales de contacto (WhatsApp, formulario Tally, correo) |
| `privacidad/` | Política de privacidad |
| `style_work2.css` | Estilos base |
| `vx-ui.css` | Componentes compartidos (cards, paneles, preguntas frecuentes) |
| `vx-ui.js` | Paneles de detalle, calculadora de salud y Google Analytics 4 |
| `img/` | Logo, íconos e imágenes; `img/og/` tiene una imagen para redes por página |
| `blog/articulos/*.md` | Artículos del blog (los escribe Pages CMS) |
| `blog/index.njk`, `_includes/` | Moldes del listado y de cada artículo |
| `_data/blog.json`, `_data/sitio.json` | Temas del blog, servicios que se ofrecen en los artículos, autor y datos del sitio |
| `sitemap.njk`, `blog/feed.njk` | Sitemap y RSS, se arman solos |
| `.pages.yml` | Campos que se ven en Pages CMS |
| `herramientas/revisar.py` | Revisión antes de publicar (también arma el sitio) |

## Antes de publicar

```bash
python herramientas/revisar.py
```

Actualiza solo el `?v=` de los CSS y JS en las páginas .html (para que nadie vea una versión vieja guardada), arma el sitio en `_site/` con Eleventy, revisa los datos para Google (JSON-LD) y los enlaces internos, y lista los `[PENDIENTE]` que quedan. Requiere Node.js y haber ejecutado `npm install` una vez.

Para ver el sitio en el computador mientras editas: `npm run ver` y abre http://localhost:8080. Si muestra errores, corrígelos antes de hacer el commit.

## Convenciones

- **Precios:** cada precio aparece en la card, en su panel de detalle y en el JSON-LD de la página. Al cambiar uno, cámbialo en los tres. El "Por separado" de los packs se calcula con precios piloto y muestra de qué productos sale.
- **Nombres:** cada servicio se llama siempre igual en todo el sitio (por ejemplo, "auditoría gratis" y "Página de enlaces").
- **Analítica:** el ID de Google Analytics 4 va en `GA4_ID`, al comienzo de `vx-ui.js`. Los botones de contacto llevan `data-evento` y `data-ubicacion` para medir los clics.
- **Imágenes:** formato WebP con `width` y `height`, y nombres sin tildes ni eñes.
- **Marcadores en el código:** `[PENDIENTE: ...]` indica algo que falta, `[CONFIRMAR]` un dato por validar y `[ACTUALIZAR el 1 de noviembre]` el fin del precio piloto.

- **Menú y pie:** están en cada página .html y también en `_includes/partes/` (lo usa el blog). Si cambias uno, cambia el otro.
- **Sitemap:** ya no se edita a mano. Una página .html nueva entra sola al sitemap.
