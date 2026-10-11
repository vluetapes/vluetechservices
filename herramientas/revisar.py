"""Revisión de la web antes de publicar.

Uso (desde la carpeta del sitio):
    python herramientas/revisar.py

Hace seis cosas:
  0. Trae a esta carpeta los cambios hechos en GitHub (por ejemplo, artículos
     guardados en Pages CMS), para que nunca trabajes sobre una versión atrasada.
  1. Actualiza el ?v= de los CSS y JS en las páginas .html según su contenido,
     para que los navegadores no muestren una versión vieja. (Las páginas del
     blog lo calculan solas al armarse.)
  2. Arma el sitio con Eleventy en la carpeta _site/, igual que GitHub al publicar.
  3. Revisa que los datos para Google (JSON-LD) de cada página armada no tengan errores.
  4. Revisa que cada enlace interno, imagen, CSS y JS exista en el sitio armado.
  5. Lista los marcadores [PENDIENTE] y [CONFIRMAR] que quedan en el código y en los artículos.

El sitemap.xml ya no se toca a mano: Eleventy lo arma en cada publicación con la
fecha del último cambio de cada página.

Si encuentra errores, termina con código 1 (útil si algún día se automatiza).
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIO = RAIZ / "_site"
FUERA = {".git", "herramientas", "node_modules", "_site"}


def fuentes(*patrones):
    return sorted(p for patron in patrones for p in RAIZ.rglob(patron) if not FUERA & set(p.relative_to(RAIZ).parts))


PAGINAS = fuentes("*.html")
ASSETS_VERSIONADOS = ["style_work2.css", "vx-ui.css", "vx-ui.js"]


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


def armar():
    """Arma el sitio con Eleventy. Devuelve el mensaje de error si falla."""
    r = subprocess.run("npx @11ty/eleventy --quiet", cwd=RAIZ, shell=True, capture_output=True,
                       text=True, encoding="utf-8")
    return None if r.returncode == 0 else (r.stderr or r.stdout)


def paginas_armadas():
    return sorted(SITIO.rglob("*.html"))


def revisar_jsonld():
    errores = []
    for p in paginas_armadas():
        for bloque in re.findall(r'(?s)<script type="application/ld\+json">(.*?)</script>', leer(p)):
            try:
                json.loads(bloque)
            except json.JSONDecodeError as e:
                errores.append(f"{p.relative_to(SITIO)}: JSON-LD inválido ({e})")
    return errores


def existe(ruta):
    ruta = ruta.split("#")[0].split("?")[0]
    if not ruta or ruta == "/":
        return (SITIO / "index.html").exists()
    destino = SITIO / ruta.lstrip("/")
    return destino.is_file() or (destino / "index.html").is_file()


def revisar_enlaces():
    errores = []
    for p in paginas_armadas():
        texto = re.sub(r"(?s)<!--.*?-->", "", leer(p))
        for ruta in re.findall(r'(?:href|src)="(/[^"/][^"]*|/)"', texto):
            if not existe(ruta):
                errores.append(f"{p.relative_to(SITIO)}: no existe {ruta}")
    return sorted(set(errores))


def pendientes():
    lista = []
    for p in fuentes("*.html", "*.md", "*.njk", "*.json"):
        if p.parent == RAIZ and p.suffix in (".md", ".json"):   # README, package.json...
            continue
        for n, linea in enumerate(leer(p).splitlines(), 1):
            for m in re.finditer(r"\[(PENDIENTE|CONFIRMAR)[^\]]*\][^>]{0,80}", linea):
                lista.append(f"{p.relative_to(RAIZ)}:{n}  {m.group(0).strip()}")
    return lista


def traer_cambios():
    """Trae los cambios de GitHub (git pull). Si hay cambios tuyos sin subir, los guarda y los vuelve a poner."""
    try:
        r = subprocess.run(["git", "pull", "--ff-only", "--autostash"], cwd=RAIZ, capture_output=True,
                           text=True, encoding="utf-8")
    except OSError:
        return True, "Git no está instalado: no se trajeron los cambios de GitHub."
    if r.returncode != 0:
        return False, "No se pudieron traer los cambios de GitHub:\n" + (r.stderr or r.stdout)
    al_dia = "Already up to date" in r.stdout or "actualizado" in r.stdout
    return True, "Carpeta al día con GitHub." if al_dia else "Se trajeron los cambios de GitHub (Pages CMS)."


def main():
    ok, mensaje = traer_cambios()
    print(mensaje)
    if not ok:
        print("Revisa esto antes de seguir (o pídele ayuda a Claude): tu carpeta y GitHub tienen cambios distintos.")
        sys.exit(1)
    print(f"Versiones de CSS/JS actualizadas en {actualizar_versiones()} archivo(s).")
    error = armar()
    if error:
        print("\nEleventy no pudo armar el sitio:\n" + error)
        sys.exit(1)
    print(f"Sitio armado en _site/ ({len(paginas_armadas())} páginas).")
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
