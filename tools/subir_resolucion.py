"""Sube las vistas a un tamaño nítido para pantalla retina, sin fundir las fotos."""
from pathlib import Path
from PIL import Image, ImageFilter

carpeta = Path("img/vueltas")
for ruta in sorted(carpeta.glob("dt*-*.jpg")):
    with Image.open(ruta) as origen:
        imagen = origen.convert("RGB")
    ancho, alto = imagen.size
    grande = imagen.resize((ancho * 2, alto * 2), Image.Resampling.LANCZOS)
    grande = grande.filter(ImageFilter.UnsharpMask(radius=1.3, percent=70, threshold=3))
    temporal = ruta.with_suffix(".hd.jpg")
    grande.save(temporal, "JPEG", quality=92, optimize=True, subsampling=0)
    temporal.replace(ruta)
    print(ruta.name, grande.size, flush=True)
