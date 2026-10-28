"""Recorta las vistas: torso si es de arriba, piernas si es de abajo."""
import sys
from pathlib import Path
from PIL import Image

ABAJO = {
    "dt1079", "dt1080", "dt1323", "dt1325", "dt1326", "dt1327",
    "dt1328", "dt1329", "dt1330",
}
COMPLETO = {"dt1324", "dt1331", "dt1332", "dt1333", "dt1334", "dt1335"}


def fondo(pixel, esquina):
    return max(abs(int(pixel[0]) - int(esquina[0])), abs(int(pixel[1]) - int(esquina[1])), abs(int(pixel[2]) - int(esquina[2]))) <= 28


def maniqui(pixel):
    rojo, verde, azul = (int(pixel[0]), int(pixel[1]), int(pixel[2]))
    return min(rojo, verde, azul) > 185 and max(rojo, verde, azul) - min(rojo, verde, azul) < 36


def medir(imagen):
    chica = imagen.resize((160, 220), Image.Resampling.BOX)
    pixeles = list(chica.getdata())
    ancho = chica.size[0]
    esquina = pixeles[2 * ancho + 2]
    cuerpo = []
    prenda = []
    for y in range(chica.size[1]):
        cuerpo_n = 0
        prenda_n = 0
        base = y * ancho
        for x in range(ancho):
            pixel = pixeles[base + x]
            if fondo(pixel, esquina):
                continue
            cuerpo_n += 1
            if not maniqui(pixel):
                prenda_n += 1
        if cuerpo_n > 4:
            cuerpo.append(y)
        if prenda_n > 6:
            prenda.append(y)
    return cuerpo, prenda


def franja(imagen, modo):
    cuerpo, prenda = medir(imagen)
    if len(cuerpo) < 4:
        return 0.0, 1.0
    alto = max(1, cuerpo[-1] - cuerpo[0])
    if modo == "abajo":
        if len(prenda) < 4:
            return 0.40, 1.0
        inicio = (prenda[0] - cuerpo[0]) / alto
        return max(0.30, inicio - 0.03), 1.0
    if len(prenda) < 4:
        return 0.0, 0.58
    fin = (prenda[-1] - cuerpo[0]) / alto
    return 0.0, min(0.74, max(0.46, fin + 0.035))


def limites(imagen, y0, y1):
    chica = imagen.resize((160, 220), Image.Resampling.BOX)
    pixeles = list(chica.getdata())
    ancho, alto = chica.size
    esquina = pixeles[2 * ancho + 2]
    cuerpo = [y for y in range(alto) if any(not fondo(pixeles[y * ancho + x], esquina) for x in range(ancho))]
    if len(cuerpo) < 4:
        return None
    alto_cuerpo = max(1, cuerpo[-1] - cuerpo[0])
    corte0 = max(0, int(cuerpo[0] + alto_cuerpo * y0) - 2)
    corte1 = min(alto - 1, int(cuerpo[0] + alto_cuerpo * y1) + 2)
    minx, maxx = ancho, 0
    for y in range(corte0, corte1 + 1):
        base = y * ancho
        for x in range(ancho):
            if fondo(pixeles[base + x], esquina):
                continue
            if x < minx:
                minx = x
            if x > maxx:
                maxx = x
    if maxx <= minx:
        return None
    escala_x = imagen.size[0] / ancho
    escala_y = imagen.size[1] / alto
    return (
        max(0, int(minx * escala_x) - 18),
        max(0, int(corte0 * escala_y) - 16),
        min(imagen.size[0] - 1, int((maxx + 1) * escala_x) + 18),
        min(imagen.size[1] - 1, int((corte1 + 1) * escala_y) + 16),
        esquina,
    )


def aplicar(imagen, y0, y1):
    caja = limites(imagen, y0, y1)
    if not caja:
        return imagen
    minx, miny, maxx, maxy, esquina = caja
    figura = imagen.crop((minx, miny, maxx + 1, maxy + 1))
    escala = min(860 / max(1, figura.width), 1160 / max(1, figura.height))
    figura = figura.resize(
        (max(1, round(figura.width * escala)), max(1, round(figura.height * escala))),
        Image.Resampling.LANCZOS,
    )
    cuadro = Image.new("RGB", (900, 1200), esquina[:3])
    cuadro.paste(figura, ((900 - figura.width) // 2, (1200 - figura.height) // 2))
    return cuadro


def main():
    carpeta = Path(sys.argv[1] if len(sys.argv) > 1 else "img/vueltas")
    for frente in sorted(carpeta.glob("dt*-01.jpg")):
        nombre = frente.stem.rsplit("-", 1)[0]
        if nombre in COMPLETO:
            print(nombre, "completo", flush=True)
            continue
        modo = "abajo" if nombre in ABAJO else "arriba"
        with Image.open(frente) as origen:
            y0, y1 = franja(origen.convert("RGB"), modo)
        print(nombre, modo, round(y0, 3), round(y1, 3), flush=True)
        for indice in range(1, 5):
            ruta = carpeta / f"{nombre}-{indice:02d}.jpg"
            if not ruta.exists():
                continue
            with Image.open(ruta) as origen:
                imagen = origen.convert("RGB")
            cuadro = aplicar(imagen, y0, y1)
            temporal = ruta.with_suffix(".nuevo.jpg")
            cuadro.save(temporal, "JPEG", quality=86, optimize=True)
            temporal.replace(ruta)


if __name__ == "__main__":
    main()
