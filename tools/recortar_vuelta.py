"""Parte una hoja 16:9 en las cuatro vistas de una prenda."""
import sys
from pathlib import Path
from PIL import Image


def fondo(pixel, esquina, tolerancia=28):
    return max(abs(pixel[channel] - esquina[channel]) for channel in range(3)) <= tolerancia


def recortar(origen, carpeta, nombre, piezas=4):
    imagen = Image.open(origen).convert("RGB")
    ancho, alto = imagen.size
    pixeles = imagen.load()
    esquina = pixeles[2, 2]
    carpeta.mkdir(parents=True, exist_ok=True)
    for indice in range(piezas):
        x0 = indice * ancho // piezas
        x1 = (indice + 1) * ancho // piezas
        abierto = bytearray((x1 - x0) * alto)
        pila = [(x, 0) for x in range(x0, x1)] + [(x, alto - 1) for x in range(x0, x1)]
        pila += [(x0, y) for y in range(alto)] + [(x1 - 1, y) for y in range(alto)]
        while pila:
            x, y = pila.pop()
            if x < x0 or x >= x1 or y < 0 or y >= alto:
                continue
            local = (y * (x1 - x0)) + (x - x0)
            if abierto[local] or not fondo(pixeles[x, y], esquina):
                continue
            abierto[local] = 1
            pila.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
        minx, miny, maxx, maxy = x1, alto, x0, 0
        for y in range(alto):
            for x in range(x0, x1):
                local = (y * (x1 - x0)) + (x - x0)
                if abierto[local]:
                    continue
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
        if maxx <= minx or maxy <= miny:
            continue
        minx = max(x0, minx - 18)
        miny = max(0, miny - 18)
        maxx = min(x1 - 1, maxx + 18)
        maxy = min(alto - 1, maxy + 18)
        figura = imagen.crop((minx, miny, maxx + 1, maxy + 1))
        escala = min(860 / figura.width, 1160 / figura.height)
        figura = figura.resize((max(1, round(figura.width * escala)), max(1, round(figura.height * escala))), Image.Resampling.LANCZOS)
        cuadro = Image.new("RGB", (900, 1200), esquina)
        cuadro.paste(figura, ((900 - figura.width) // 2, (1200 - figura.height) // 2))
        salida = carpeta / f"{nombre}-{indice + 1:02d}.jpg"
        cuadro.save(salida, "JPEG", quality=82, optimize=True)
        print(salida)


if __name__ == "__main__":
    recortar(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 4)
