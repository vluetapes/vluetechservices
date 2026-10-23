# Web de ejemplo · ejemplo.vluetechservices.cl

Copia de la **Plantilla Web Cliente** que se muestra a los clientes como ejemplo de lo que hace Vlue.
El negocio ("Peluquería Ejemplo") y todos sus datos son **ficticios**.

- No se indexa en Google (`_data/noindex.json` = true) y lleva una franja azul que lo avisa y enlaza a vluetechservices.cl/paginas-web/.
- La web principal (GitHub Pages) **ignora esta carpeta** (`eleventy.config.js` → ignores `ejemplos/**`).
- Para cambiar colores o fuentes: `_data/marca.json`. Textos: `_data/inicio.json` y `_data/negocio.json`.

## Publicarla (una sola vez) en Cloudflare

Cloudflare juntó Workers y Pages: la pantalla «Create» ofrece plantillas que crean un repositorio nuevo y vacío. **No usar plantillas**: hay que importar el repositorio existente. Esta carpeta ya trae `wrangler.jsonc`, así que funciona como Worker.

1. dash.cloudflare.com → **Workers & Pages → Create application** → **Import a repository** (o «Continue with GitHub») → elige `vluetapes/vluetechservices`.
2. Configuración:
   - Project name: `vlue-ejemplo`
   - Build command: `npm ci && npx @11ty/eleventy`
   - Deploy command: `npx wrangler deploy`
   - **Advanced settings → Path (Root directory): `ejemplos/web-negocio`**
   - Variable de entorno: `NODE_VERSION` = `22`
3. **Deploy.**
4. En el Worker → **Settings → Domains & Routes → Add → Custom domain** → `ejemplo.vluetechservices.cl`. Como el dominio ya está en Cloudflare, el registro DNS se crea solo.
5. Opcional: en **Settings → Build → Build watch paths** pon `ejemplos/web-negocio/*` para que solo se vuelva a publicar cuando cambie esta carpeta.

## Verla en tu computador

```bash
cd ejemplos/web-negocio
npm install
npx @11ty/eleventy --serve --port=8090
```
