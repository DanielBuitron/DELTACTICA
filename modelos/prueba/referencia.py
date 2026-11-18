# Mide las fotos reales de cada prenda y guarda recortes y botones.
# No inventa dibujos: si un detalle no se ve, no entra en la ficha.

import json
import os
import re

import numpy as np
from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VISTAS = os.path.join(RAIZ, "img", "vueltas")
SALIDA = os.path.dirname(__file__)
TEXTURAS = os.path.join(SALIDA, "texturas")


def familia(nombre):
    n = nombre.lower()
    if "falda" in n:
        return "falda"
    if "pantaloneta" in n:
        return "pantaloneta"
    if n.startswith("pantalon") or "pantalon " in n:
        return "pantalon"
    if "overol" in n or "buzo" in n or "uniforme" in n:
        return "cuerpo"
    if "chaqueta" in n or "chaleco" in n or "camisilla" in n:
        return "chaqueta"
    if "camisa" in n or "camiseta" in n or "licra" in n:
        return "torso"
    return "revisar"


def cargar(ruta):
    imagen = Image.open(ruta).convert("RGB")
    return np.asarray(imagen)


def mascaras(im):
    r = im[:, :, 0].astype(np.int16)
    g = im[:, :, 1].astype(np.int16)
    b = im[:, :, 2].astype(np.int16)
    beige = (r > 200) & (g > 190) & (b > 170) & (np.abs(r - g) < 35) & (np.abs(g - b) < 40)
    blanco = (r > 210) & (g > 210) & (b > 205) & (np.abs(r - g) < 22) & (np.abs(g - b) < 22)
    return beige, blanco


def correr(mascara, y, salto=14):
    xs = np.flatnonzero(mascara[y])
    if xs.size == 0:
        return []
    cortes = np.where(np.diff(xs) > salto)[0]
    tramos = []
    inicio = 0
    indices = list(cortes) + [len(xs) - 1]
    for corte in indices:
        if corte == len(xs) - 1:
            tramos.append((int(xs[inicio]), int(xs[-1])))
            break
        tramos.append((int(xs[inicio]), int(xs[corte])))
        inicio = corte + 1
    return [(a, b) for a, b in tramos if b - a > 18]


def caja_de(tramos):
    if not tramos:
        return None
    return [min(a for a, _ in tramos), min(b for _, b in tramos) and 0]


def unir(tramos_por_y):
    xs0, xs1, ys = [], [], []
    for y, tramos in tramos_por_y:
        for a, b in tramos:
            xs0.append(a)
            xs1.append(b)
            ys.append(y)
    if not ys:
        return None
    return [int(min(xs0)), int(min(ys)), int(max(xs1)), int(max(ys))]


def medir_foto(im):
    alto, ancho = im.shape[:2]
    beige, blanco = mascaras(im)
    figura = ~beige
    torso, manga_izq, manga_der, pierna_izq, pierna_der = [], [], [], [], []
    for y in range(0, alto, 8):
        tramos = correr(figura, y)
        if len(tramos) >= 2 and y > alto * 0.45:
            orden = sorted(tramos, key=lambda t: t[1] - t[0], reverse=True)[:2]
            orden = sorted(orden, key=lambda t: t[0])
            pierna_izq.append((y, [orden[0]]))
            pierna_der.append((y, [orden[1]]))
            continue
        if len(tramos) >= 3:
            orden = sorted(tramos, key=lambda t: t[0])
            manga_izq.append((y, [orden[0]]))
            manga_der.append((y, [orden[-1]]))
            torso.append((y, orden[1:-1]))
        elif len(tramos) == 1 and alto * 0.18 < y < alto * 0.62:
            torso.append((y, tramos))
    oro = (im[:, :, 0] > 165) & (im[:, :, 1] > 125) & (im[:, :, 2] < 110)
    oro &= im[:, :, 0] > im[:, :, 2] + 50
    botones = agrupar(oro)
    return {
        "ancho": int(ancho),
        "alto": int(alto),
        "torso": unir(torso),
        "manga_izquierda": unir(manga_izq),
        "manga_derecha": unir(manga_der),
        "pierna_izquierda": unir(pierna_izq),
        "pierna_derecha": unir(pierna_der),
        "botones": botones,
    }


def agrupar(mascara):
    ys, xs = np.nonzero(mascara)
    if len(xs) == 0:
        return []
    puntos = np.stack([xs, ys], 1)
    usado = np.zeros(len(puntos), dtype=bool)
    grupos = []
    for i in range(len(puntos)):
        if usado[i]:
            continue
        cerca = np.abs(puntos - puntos[i]).sum(1) < 22
        usado[cerca] = True
        if cerca.sum() < 18 or cerca.sum() > 280:
            continue
        centro = puntos[cerca].mean(0)
        grupos.append([int(round(centro[0])), int(round(centro[1]))])
    grupos.sort(key=lambda p: (p[1], p[0]))
    limpios = []
    for punto in grupos:
        if any(abs(punto[0] - otro[0]) < 16 and abs(punto[1] - otro[1]) < 16 for otro in limpios):
            continue
        limpios.append(punto)
    return limpios


def limpiar_blanco(im):
    arr = im.astype(np.float32)
    _, blanco = mascaras(im)
    alto, ancho = blanco.shape
    valido = ~blanco
    color = arr.copy()
    for _ in range(30):
        pad_c = np.pad(color, ((1, 1), (1, 1), (0, 0)), mode="edge")
        pad_v = np.pad(valido, 1, constant_values=False)
        suma = np.zeros_like(color)
        peso = np.zeros((alto, ancho), np.float32)
        for dy in range(3):
            for dx in range(3):
                vista = pad_v[dy:dy + alto, dx:dx + ancho]
                suma += pad_c[dy:dy + alto, dx:dx + ancho] * vista[:, :, None]
                peso += vista
        tomar = (~valido) & (peso > 0)
        if not tomar.any():
            break
        color[tomar] = suma[tomar] / peso[tomar, None]
        valido[tomar] = True
    return np.clip(color, 0, 255).astype(np.uint8)


def guardar_textura(im, nombre):
    os.makedirs(TEXTURAS, exist_ok=True)
    ruta = os.path.join(TEXTURAS, nombre)
    Image.fromarray(limpiar_blanco(im)).save(ruta, quality=92)
    return ruta


def catalogo():
    texto = open(os.path.join(RAIZ, "js", "productos.js"), encoding="utf-8").read()
    datos = json.loads(texto[texto.find("["):texto.rfind("]") + 1])
    return {item["id"]: item for item in datos}


def ids_vistas():
    texto = open(os.path.join(RAIZ, "js", "store.js"), encoding="utf-8").read()
    bloque = texto.split("window.DT_VISTAS", 1)[1].split("};", 1)[0]
    return re.findall(r"DT-\d+", bloque)


def fotos_de(codigo):
    base = codigo.lower().replace("-", "")
    rutas = [os.path.join(VISTAS, f"{base}-0{n}.jpg") for n in (1, 2, 3, 4)]
    return rutas if all(os.path.isfile(ruta) for ruta in rutas) else None


def ficha(codigo, item):
    rutas = fotos_de(codigo)
    estado = {
        "id": codigo,
        "nombre": item.get("name", ""),
        "linea": item.get("line", ""),
        "familia": familia(item.get("name", "")),
        "fotos": [os.path.relpath(ruta, RAIZ).replace("\\", "/") for ruta in rutas] if rutas else [],
        "estado": "referencias insuficientes" if not rutas else "pendiente de revision",
    }
    return estado


def principal():
    items = catalogo()
    registro = []
    for codigo in ids_vistas():
        item = items.get(codigo, {"name": "", "line": ""})
        registro.append(ficha(codigo, item))
    frente = cargar(os.path.join(VISTAS, "dt1332-01.jpg"))
    espalda = cargar(os.path.join(VISTAS, "dt1332-03.jpg"))
    medida = {
        "id": "DT-1332",
        "frente": medir_foto(frente),
        "espalda": medir_foto(espalda),
        "textura_frente": os.path.relpath(guardar_textura(frente, "dt1332-frente.jpg"), RAIZ).replace("\\", "/"),
        "textura_espalda": os.path.relpath(guardar_textura(espalda, "dt1332-espalda.jpg"), RAIZ).replace("\\", "/"),
    }
    for fila in registro:
        if fila["id"] == "DT-1332":
            fila["estado"] = "geometria conservada, diseno en correccion"
            fila["botones_frente"] = len(medida["frente"]["botones"])
            fila["botones_espalda"] = len(medida["espalda"]["botones"])
    ruta_registro = os.path.join(SALIDA, "registro.json")
    ruta_medida = os.path.join(SALIDA, "dt1332.json")
    json.dump(registro, open(ruta_registro, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(medida, open(ruta_medida, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(json.dumps(medida, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    principal()
