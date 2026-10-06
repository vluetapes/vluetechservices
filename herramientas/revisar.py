"""Revisión de la web antes de publicar.

Uso (desde la carpeta del sitio):
    python herramientas/revisar.py

Hace cinco cosas:
  1. Actualiza el ?v= de los CSS y JS en todas las páginas según su contenido,
     para que los navegadores no muestren una versión vieja. Ya no hay que
     cambiar el número a mano.
  2. Revisa que los datos para Google (JSON-LD) de cada página no tengan errores.
  3. Revisa que cada enlace interno, imagen, CSS y JS exista.
  4. Lista los marcadores [PENDIENTE] y [CONFIRMAR] que quedan en el código.
  5. Pone la fecha de hoy en el sitemap.xml (lastmod) de cada página con cambios
     sin commit, para que Google sepa qué páginas cambiaron.

Si encuentra errores, termina con código 1 (útil si algún día se automatiza).
"""
import hashlib
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PAGINAS = sorted(p for p in RAIZ.rglob("*.html") if ".git" not in p.parts and "herramientas" not in p.parts)
ASSETS_VERSIONADOS = ["estilos.css", "vx-ui.js"]


def leer(p):
    return p.read_text(encoding="utf-8")


def escribir(p, texto):
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(texto)


def actualizar_versiones():
    cambios = 0
    for nombre in ASSETS_VERSIONADOS:
        version = hashlib.sha1((RAIZ / nombre).read_bytes()).hexdigest()[:8]
        patron = re.compile(r"(/" + re.escape(nombre) + r")\?v=[\w.-]+")
        for p in PAGINAS:
            texto = leer(p)
            nuevo = patron.sub(r"\1?v=" + version, texto)
            if nuevo != texto:
                escribir(p, nuevo)
                cambios += 1
    return cambios


def actualizar_lastmod():
    """Pone la fecha de hoy en el <lastmod> del sitemap de cada página con cambios sin commit."""
    import datetime
    import subprocess
    try:
        salida = subprocess.run(["git", "status", "--porcelain"], cwd=RAIZ, capture_output=True,
                                text=True, encoding="utf-8").stdout
    except OSError:
        return []
    hoy = datetime.date.today().isoformat()
    sitemap = RAIZ / "sitemap.xml"
    texto = leer(sitemap)
    cambiadas = []
    for linea in salida.splitlines():
        archivo = linea[3:].strip().strip('"')
        if not archivo.endswith("index.html"):
            continue
        ruta = "/" + archivo[: -len("index.html")]
        patron = re.compile(r"(<loc>https?://[^<]+?" + re.escape(ruta) + r"</loc>\s*<lastmod>)[^<]*(</lastmod>)")
        nuevo = patron.sub(r"\g<1>" + hoy + r"\2", texto)
        if nuevo != texto:
            texto = nuevo
            cambiadas.append(ruta)
    if cambiadas:
        escribir(sitemap, texto)
    return cambiadas


def revisar_jsonld():
    errores = []
    for p in PAGINAS:
        for bloque in re.findall(r'(?s)<script type="application/ld\+json">(.*?)</script>', leer(p)):
            try:
                json.loads(bloque)
            except json.JSONDecodeError as e:
                errores.append(f"{p.relative_to(RAIZ)}: JSON-LD inválido ({e})")
    return errores


def existe(ruta):
    ruta = ruta.split("#")[0].split("?")[0]
    if not ruta or ruta == "/":
        return (RAIZ / "index.html").exists()
    destino = RAIZ / ruta.lstrip("/")
    return destino.exists() if destino.suffix else (destino / "index.html").exists()


def revisar_enlaces():
    errores = []
    for p in PAGINAS:
        texto = re.sub(r"(?s)<!--.*?-->", "", leer(p))
        for ruta in re.findall(r'(?:href|src)="(/[^"/][^"]*|/)"', texto):
            if not existe(ruta):
                errores.append(f"{p.relative_to(RAIZ)}: no existe {ruta}")
    return sorted(set(errores))


def pendientes():
    lista = []
    for p in PAGINAS:
        for n, linea in enumerate(leer(p).splitlines(), 1):
            for m in re.finditer(r"\[(PENDIENTE|CONFIRMAR)[^\]]*\][^>]{0,80}", linea):
                lista.append(f"{p.relative_to(RAIZ)}:{n}  {m.group(0).strip()}")
    return lista


def main():
    print(f"Versiones de CSS/JS actualizadas en {actualizar_versiones()} archivo(s).")
    fechas = actualizar_lastmod()
    if fechas:
        print("Fecha del sitemap (lastmod) actualizada a hoy en: " + ", ".join(fechas))
        print("Después de publicar, pide en Search Console la indexación de esas páginas.")
    errores = revisar_jsonld() + revisar_enlaces()
    if errores:
        print(f"\n{len(errores)} error(es):")
        for e in errores:
            print("  -", e)
    else:
        print("Datos para Google y enlaces internos: sin errores.")
    lista = pendientes()
    if lista:
        print(f"\n{len(lista)} pendiente(s) en el código:")
        for item in lista:
            print("  -", item)
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
