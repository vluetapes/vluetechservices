"""Genera las imágenes Open Graph (img/og/*.jpg) a partir de herramientas/og/og.html.

Uso (desde la raíz del sitio, con un servidor local corriendo):
    python -m http.server 8177
    python herramientas/og/generar.py            # todas
    python herramientas/og/generar.py catalogo   # solo una
"""
import subprocess, sys, tempfile, pathlib
from PIL import Image

PUERTO = 8177
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PAGINAS = ["inicio", "catalogo", "contacto", "ficha-google-maps", "gestion-resenas-google",
           "tarjetas-nfc-resenas", "tarjeta-profesional", "paginas-web", "landing-page",
           "sitio-web", "mejora-seo", "salud", "salud-dentistas", "salud-psicologos"]

raiz = pathlib.Path(__file__).resolve().parents[2]
destino = raiz / "img" / "og"

for p in sys.argv[1:] or PAGINAS:
    with tempfile.TemporaryDirectory() as tmp:
        png = pathlib.Path(tmp) / "og.png"
        subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
                        "--window-size=1200,630", "--virtual-time-budget=4000",
                        f"--user-data-dir={tmp}", f"--screenshot={png}",
                        f"http://localhost:{PUERTO}/herramientas/og/og.html?p={p}"],
                       check=True, capture_output=True)
        Image.open(png).convert("RGB").save(destino / f"{p}.jpg", quality=86, optimize=True, progressive=True)
    print("listo", p)
