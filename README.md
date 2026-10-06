# vluetechservices.cl

Sitio de Vlue Tech Services SpA (Santiago): fichas de Google Maps, tarjetas NFC de reseñas y gestión mensual para negocios locales.

HTML, CSS y JavaScript sin framework ni compilación. Se publica con GitHub Pages desde la rama `main` (dominio en `CNAME`).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | Inicio |
| `catalogo/` | Catálogo con packs y enlaces a las 4 categorías |
| `catalogo/tarjetas-nfc-resenas/`, `ficha-google-maps/`, `gestion-resenas-google/`, `tarjeta-digital/` | Una página por categoría |
| `salud/` | Planes para clínicas y consultas |
| `contacto/` | Canales de contacto (WhatsApp, formulario Tally, correo) |
| `privacidad/` | Política de privacidad |
| `style_work2.css` | Estilos base |
| `vx-ui.css` | Componentes compartidos (cards, paneles, preguntas frecuentes) |
| `vx-ui.js` | Paneles de detalle, calculadora de salud y Google Analytics 4 |
| `img/` | Logo, íconos e imágenes; `img/og/` tiene una imagen para redes por página |
| `herramientas/revisar.py` | Revisión antes de publicar |

## Antes de publicar

```bash
python herramientas/revisar.py
```

Actualiza solo el `?v=` de los CSS y JS en todas las páginas (para que nadie vea una versión vieja guardada), revisa los datos para Google (JSON-LD) y los enlaces internos, y lista los `[PENDIENTE]` que quedan en el código. Si muestra errores, corrígelos antes de hacer el commit.

## Convenciones

- **Precios:** cada precio aparece en la card, en su panel de detalle y en el JSON-LD de la página. Al cambiar uno, cámbialo en los tres. El "Por separado" de los packs se calcula con precios piloto y muestra de qué productos sale.
- **Nombres:** cada servicio se llama siempre igual en todo el sitio (por ejemplo, "auditoría gratis" y "Página de enlaces").
- **Analítica:** el ID de Google Analytics 4 va en `GA4_ID`, al comienzo de `vx-ui.js`. Los botones de contacto llevan `data-evento` y `data-ubicacion` para medir los clics.
- **Imágenes:** formato WebP con `width` y `height`, y nombres sin tildes ni eñes.
- **Marcadores en el código:** `[PENDIENTE: ...]` indica algo que falta, `[CONFIRMAR]` un dato por validar y `[ACTUALIZAR el 1 de noviembre]` el fin del precio piloto.
