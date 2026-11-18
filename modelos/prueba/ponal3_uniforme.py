# Uniforme PONAL #3 — patrón paramétrico para Blender.
#
# Medidas en centímetros. Son una plantilla anatómica editable,
# no la talla certificada del producto. El diseño sale de las fotos
# dt1332-01.jpg (frente) y dt1332-03.jpg (espalda): cada panel tiene
# su propio recorte. No se pega la foto entera sobre una sola malla.
#
# Instalación en Windows (LTS, más estable que la 5.x para este script):
#   winget install -e --id BlenderFoundation.Blender.LTS.4.5
#
# Generar el GLB y las vistas:
#   blender --background --python modelos/prueba/ponal3_uniforme.py
#
# Salida:
#   modelos/prueba/ponal-3.glb
#   modelos/prueba/vistas/frente.png
#   modelos/prueba/vistas/espalda.png
#   modelos/prueba/vistas/perfil-izquierdo.png
#   modelos/prueba/vistas/perfil-derecho.png
#   modelos/prueba/vistas/tres-cuartos.png

import json
import math
import os
import sys

try:
    import bpy
    import bmesh
    from mathutils import Vector
except ImportError:
    sys.exit("Este script se ejecuta dentro de Blender, no con python suelto.")

# Plantilla editable. Cambiar un número y volver a ejecutar reconstruye la malla.
MEDIDAS = {
    # Anchos de lado a lado, en cm, medidos en dt1332-01.
    # El hombro exterior de esa foto (574 px) se toma como 48 cm.
    # Con esa escala: bajo 40 cm, muslo 19 cm, tobillo 11 cm,
    # largo de chaqueta 72 cm y manga 54 cm. La profundidad no sale
    # de la foto: es una estimación anatómica, no una talla certificada.
    "hombro_ancho": 48.0,
    "pecho_ancho": 39.0,
    "cintura_ancho": 37.0,
    "bajo_ancho": 40.2,
    "prof_pecho": 27.0,
    "prof_cintura": 24.0,
    "prof_cadera": 29.0,
    "largo_chaqueta": 72.0,
    "manga": 54.0,
    "manga_arriba": 10.0,
    "manga_puno": 8.4,
    "cuello": 40.0,
    "muslo_ancho": 18.6,
    "rodilla_ancho": 16.2,
    "tobillo_ancho": 11.4,
    "prof_muslo": 17.5,
    "centro_muslo": 10.0,
    "centro_tobillo": 11.6,
    "entrepierna": 67.0,
    "largo_pantalon": 100.0,
}

# Recortes dentro de cada foto (u, v). v=0 es el bajo de la imagen.
# Cada cifra sale del paño verde, fuera de las manos, los pies y el hueco
# blanco entre las piernas. Botones, placa, bolsillos y parches quedan
# en el panel que les corresponde.
RECORTES = {
    "chaqueta_frente": (0.42, 0.45, 0.63, 0.74),
    "chaqueta_espalda": (0.40, 0.45, 0.62, 0.74),
    "manga_derecha": (0.345, 0.58, 0.375, 0.72),
    "manga_izquierda": (0.655, 0.58, 0.695, 0.72),
    "manga_derecha_espalda": (0.325, 0.58, 0.365, 0.72),
    "manga_izquierda_espalda": (0.645, 0.58, 0.685, 0.72),
    "pantalon_derecha": (0.40, 0.14, 0.47, 0.40),
    "pantalon_izquierda": (0.55, 0.14, 0.62, 0.40),
    "pantalon_derecha_espalda": (0.38, 0.13, 0.46, 0.38),
    "pantalon_izquierda_espalda": (0.53, 0.13, 0.61, 0.38),
}

N = 16
SISA_IZQ = (2, 3, 4, 5, 6)
SISA_DER = (10, 11, 12, 13, 14)
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SALIDA = os.path.join(RAIZ, "modelos", "prueba", "ponal-3.glb")
VISTAS = os.path.join(RAIZ, "modelos", "prueba", "vistas")
FOTO_FRENTE = os.path.join(RAIZ, "img", "vueltas", "dt1332-01.jpg")
FOTO_ESPALDA = os.path.join(RAIZ, "img", "vueltas", "dt1332-03.jpg")
FICHA = os.path.join(os.path.dirname(__file__), "dt1332.json")


def metros(cm):
    return cm / 100.0


def radio(contorno_cm):
    return metros(contorno_cm) / (2.0 * math.pi)


def ejes(contorno_cm, profundidad_cm):
    objetivo = metros(contorno_cm)
    profundidad = metros(profundidad_cm) / 2.0
    ancho = objetivo / (2.0 * math.pi)
    for _ in range(10):
        actual = 2.0 * math.pi * math.sqrt((ancho * ancho + profundidad * profundidad) / 2.0)
        if actual <= 1e-6:
            break
        ancho *= objetivo / actual
    return ancho, profundidad


def limpiar_escena():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for bloque in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for dato in list(bloque):
            if dato.users == 0:
                bloque.remove(dato)


def nuevo_bmesh():
    bm = bmesh.new()
    bm.faces.layers.int.new("parte")
    bm.loops.layers.uv.new("UVMap")
    return bm


def parte_de(bm):
    return bm.faces.layers.int.get("parte")


def uv_de(bm):
    return bm.loops.layers.uv.get("UVMap")


def vertice(bm, x, y, z):
    return bm.verts.new((x, y, z))


def anillo(bm, n, rx, rz, z, frente=0.0, espalda=0.0, caida=0.0):
    verts = []
    for i in range(n):
        angulo = 2.0 * math.pi * i / n
        seno = math.sin(angulo)
        coseno = math.cos(angulo)
        x = seno * rx
        y = -coseno * rz
        if coseno > 0.0:
            y -= frente * coseno
        if coseno < 0.0:
            y += espalda * (-coseno)
        altura = z - caida * abs(seno)
        verts.append(vertice(bm, x, y, altura))
    return verts


def cara(bm, verts, parte):
    try:
        cara_nueva = bm.faces.new(tuple(verts))
    except ValueError:
        return None
    cara_nueva[parte_de(bm)] = parte
    cara_nueva.material_index = 0 if parte in (1, 3, 5, 7) else 1
    return cara_nueva


def coser(bm, a, b, parte, saltar=()):
    n = len(a)
    for i in range(n):
        j = (i + 1) % n
        if i in saltar and j in saltar:
            continue
        cara(bm, (a[i], a[j], b[j], b[i]), parte)


def es_frente(i):
    angulo = 2.0 * math.pi * i / N
    return math.cos(angulo) > 0.15


def parte_tronco(i, j):
    return 1 if es_frente(i) and es_frente(j) else 2


def coser_cerrado(bm, a, b):
    for i in range(N):
        j = (i + 1) % N
        cara(bm, (a[i], a[j], b[j], b[i]), parte_tronco(i, j))


def coser_sisa(bm, a, b):
    for i in range(N):
        j = (i + 1) % N
        if i in SISA_IZQ and j in SISA_IZQ:
            continue
        if i in SISA_DER and j in SISA_DER:
            continue
        cara(bm, (a[i], a[j], b[j], b[i]), parte_tronco(i, j))


def lazo_sisa(hombro, sisa, indices):
    return [hombro[i] for i in indices] + [sisa[i] for i in reversed(indices)]


def marco(direccion):
    arriba = Vector((0.0, -1.0, 0.0))
    if abs(direccion.dot(arriba)) > 0.92:
        arriba = Vector((1.0, 0.0, 0.0))
    lado = direccion.cross(arriba).normalized()
    frente = lado.cross(direccion).normalized()
    return lado, frente


def anillo_manga(bm, centro, direccion, radio_m, lazo):
    n = len(lazo)
    lado, frente = marco(direccion)

    def angulo_de(punto):
        relativo = Vector(punto) - centro
        return math.atan2(relativo.dot(frente), relativo.dot(lado))

    inicio = angulo_de(lazo[0].co)
    siguiente = angulo_de(lazo[1].co)
    delta = (siguiente - inicio + math.pi) % (2.0 * math.pi) - math.pi
    paso = (2.0 * math.pi / n) if delta >= 0.0 else -(2.0 * math.pi / n)
    verts = []
    for i in range(n):
        angulo = inicio + paso * i
        punto = centro + (math.cos(angulo) * lado + math.sin(angulo) * frente) * radio_m
        verts.append(vertice(bm, punto.x, punto.y, punto.z))
    return verts


def construir_manga(bm, lazo, signo):
    n = len(lazo)
    origen = Vector((0.0, 0.0, 0.0))
    for vert in lazo:
        origen += vert.co
    origen /= n
    largo = metros(MEDIDAS["manga"])
    pasos = 12
    radio_arriba = metros(MEDIDAS["manga_arriba"]) / 2.0
    radio_puno = metros(MEDIDAS["manga_puno"]) / 2.0

    def centro_en(t):
        # La sisa queda en el hombro. El brazo se abre hasta dejar
        # un hueco visible junto al torso, cerca de 9 cm en el puño.
        afuera = signo * 0.09 * (1.0 - math.exp(-t * 3.5))
        x = origen.x + afuera
        y = origen.y * (1.0 - t) - 0.006 * t
        return Vector((x, y, origen.z - largo * t))

    anillos = [lazo]
    for paso in range(1, pasos + 1):
        t = paso / pasos
        centro = centro_en(t)
        direccion = (centro_en(min(1.0, t + 0.08)) - centro_en(max(0.0, t - 0.08))).normalized()
        grueso = radio_arriba * (1.0 - t) + radio_puno * t
        if t < 0.22:
            grueso = max(grueso, radio_arriba * 1.05)
        if paso >= pasos - 1:
            grueso *= 1.05
        anillos.append(anillo_manga(bm, centro, direccion, grueso, lazo))
    for a, b in zip(anillos, anillos[1:]):
        for i in range(n):
            j = (i + 1) % n
            muestra = (a[i].co + a[j].co + b[j].co + b[i].co) / 4.0
            al_frente = (muestra - origen).dot(Vector((0.0, -1.0, 0.0))) > -0.01
            if signo < 0:
                parte = 3 if al_frente else 4
            else:
                parte = 5 if al_frente else 6
            cara(bm, (a[i], a[j], b[j], b[i]), parte)
    return centro_en(1.0)


def mitad(clave):
    return metros(MEDIDAS[clave]) / 2.0


def construir_chaqueta(bm):
    pecho_x = mitad("pecho_ancho")
    pecho_y = mitad("prof_pecho")
    cintura_x = mitad("cintura_ancho")
    cintura_y = mitad("prof_cintura")
    hombro_x = mitad("hombro_ancho")
    bajo_x = mitad("bajo_ancho")
    cuello_r = radio(MEDIDAS["cuello"])
    largo = metros(MEDIDAS["largo_chaqueta"])
    bajo = metros(MEDIDAS["entrepierna"]) + 0.07
    cuello_z = bajo + largo
    hombro_z = cuello_z - 0.04
    sisa_z = hombro_z - 0.145
    pecho_z = bajo + largo * 0.62
    cintura_z = bajo + largo * 0.38

    bajo_a = anillo(bm, N, bajo_x, pecho_y * 0.98, bajo, frente=0.014, espalda=0.022)
    cadera_a = anillo(bm, N, bajo_x * 0.98, pecho_y * 1.02, bajo + largo * 0.16, frente=0.016, espalda=0.032)
    cintura_a = anillo(bm, N, cintura_x, cintura_y, cintura_z, frente=0.014, espalda=0.024)
    bajo_pecho = anillo(bm, N, pecho_x * 0.99, pecho_y * 1.04, pecho_z - 0.06, frente=0.03, espalda=0.032)
    pecho_a = anillo(bm, N, pecho_x, pecho_y * 1.08, pecho_z, frente=0.042, espalda=0.038)
    sisa_a = anillo(bm, N, pecho_x * 1.02, pecho_y, sisa_z, frente=0.018, espalda=0.026)
    hombro_a = anillo(bm, N, hombro_x, pecho_y * 0.72, hombro_z, frente=0.006, caida=0.0)
    for vert in hombro_a:
        lateral = min(1.0, abs(vert.co.x) / max(0.001, hombro_x))
        curva = lateral ** 1.7
        vert.co.z -= 0.09 * curva
        vert.co.x *= 1.0 - 0.08 * (lateral ** 2)
    cuello_a = anillo(bm, N, cuello_r * 1.15, cuello_r, cuello_z)
    cuello_b = anillo(bm, N, cuello_r * 1.28, cuello_r * 1.05, cuello_z + 0.018)
    cuello_c = anillo(bm, N, cuello_r * 1.12, cuello_r * 0.95, cuello_z + 0.034)

    coser_cerrado(bm, bajo_a, cadera_a)
    coser_cerrado(bm, cadera_a, cintura_a)
    coser_cerrado(bm, cintura_a, bajo_pecho)
    coser_cerrado(bm, bajo_pecho, pecho_a)
    coser_cerrado(bm, pecho_a, sisa_a)
    coser_sisa(bm, sisa_a, hombro_a)
    for i in range(N):
        j = (i + 1) % N
        cara(bm, (hombro_a[i], hombro_a[j], cuello_a[j], cuello_a[i]), parte_tronco(i, j))
        cara(bm, (cuello_a[i], cuello_a[j], cuello_b[j], cuello_b[i]), parte_tronco(i, j))
        cara(bm, (cuello_b[i], cuello_b[j], cuello_c[j], cuello_c[i]), parte_tronco(i, j))

    puno = construir_manga(bm, lazo_sisa(hombro_a, sisa_a, SISA_DER), -1.0)
    construir_manga(bm, lazo_sisa(hombro_a, sisa_a, SISA_IZQ), 1.0)
    return {"bajo": bajo, "cuello": cuello_z, "hombro": hombro_x, "pecho": pecho_x, "puno_z": puno.z, "puno_x": abs(puno.x)}


N_PIERNA = 16


def anillo_pierna(bm, centro_x, rx, rz, z):
    verts = []
    for i in range(N_PIERNA):
        angulo = 2.0 * math.pi * i / N_PIERNA
        local_x = math.sin(angulo) * rx
        if centro_x < 0.0:
            local_x = -local_x
        y = -math.cos(angulo) * rz
        verts.append(vertice(bm, centro_x + local_x, y, z))
    return verts


def construir_pantalon(bm):
    muslo_r = mitad("muslo_ancho")
    tobillo_r = mitad("tobillo_ancho")
    muslo_z = mitad("prof_muslo")
    cintura_z = metros(MEDIDAS["largo_pantalon"])
    tiro_z = metros(MEDIDAS["entrepierna"])
    sep_arriba = metros(MEDIDAS["centro_muslo"])
    sep_abajo = metros(MEDIDAS["centro_tobillo"])

    def separacion(z, signo):
        t = max(0.0, min(1.0, z / max(0.01, tiro_z)))
        return signo * (sep_abajo * (1.0 - t) + sep_arriba * t)

    def radio_en(z):
        t = max(0.0, min(1.0, z / max(0.01, tiro_z)))
        base = tobillo_r * (1.0 - t) + muslo_r * t
        if 0.40 < t < 0.64:
            base += 0.008 * (1.0 - abs(t - 0.52) / 0.12)
        return base

    def pierna(signo):
        alturas = (0.012, tiro_z * 0.16, tiro_z * 0.34, tiro_z * 0.50, tiro_z * 0.66, tiro_z * 0.84, tiro_z)
        anillos = []
        for z in alturas:
            rx = radio_en(z) * (1.06 if z <= 0.02 else 1.0)
            rz = rx * (muslo_z / max(0.01, muslo_r))
            anillos.append(anillo_pierna(bm, separacion(z, signo), rx, rz, z))
        cadera = anillos[-1]
        muslo = anillos[-2]
        for indice in (6, 7, 8, 9, 10):
            peso = 1.0 - abs(indice - 8) / 3.0
            cadera[indice].co.y += 0.032 * peso
            muslo[indice].co.y += 0.016 * peso
        for a, b in zip(anillos, anillos[1:]):
            for i in range(N_PIERNA):
                j = (i + 1) % N_PIERNA
                cara(bm, (a[i], a[j], b[j], b[i]), 7 if i < 8 else 8)
        return cadera

    izquierda = pierna(1.0)
    derecha = pierna(-1.0)
    for anillo_sup, signo in ((izquierda, 1.0), (derecha, -1.0)):
        anillo_sup[12].co.x = signo * 0.006
        anillo_sup[12].co.z -= 0.032
        anillo_sup[11].co.x = signo * 0.026
        anillo_sup[11].co.z -= 0.012
        anillo_sup[11].co.y += 0.01
        anillo_sup[13].co.x = signo * 0.026
        anillo_sup[13].co.z -= 0.01
    cara(bm, (izquierda[13], izquierda[12], derecha[12], derecha[13]), 7)
    cara(bm, (izquierda[12], izquierda[11], derecha[11], derecha[12]), 8)

    def cinturon(signo):
        return anillo_pierna(
            bm,
            signo * mitad("cintura_ancho") * 0.42,
            mitad("cintura_ancho") * 0.58,
            mitad("prof_cintura") * 0.9,
            cintura_z,
        )

    cin_izq = cinturon(1.0)
    cin_der = cinturon(-1.0)
    for origen, destino in ((izquierda, cin_izq), (derecha, cin_der)):
        for i in range(N_PIERNA):
            j = (i + 1) % N_PIERNA
            if i in (11, 12):
                continue
            cara(bm, (origen[i], origen[j], destino[j], destino[i]), 7 if i < 8 else 8)
    cara(bm, (izquierda[13], cin_izq[13], cin_der[13], derecha[13]), 7)
    cara(bm, (izquierda[11], cin_izq[11], cin_der[11], derecha[11]), 8)
    cara(bm, (cin_izq[12], cin_izq[13], cin_der[13], cin_der[12]), 7)
    cara(bm, (cin_izq[12], cin_izq[11], cin_der[11], cin_der[12]), 8)
    return {"bajo": 0.02, "cintura": cintura_z, "centro_pierna": sep_arriba}


def cargar_ficha():
    with open(FICHA, encoding="utf-8") as archivo:
        return json.load(archivo)


def uv_de_pixel(px, py, ancho, alto):
    return px / float(ancho), 1.0 - py / float(alto)


def proyectar(caja, tx, tz, ancho, alto, voltear_x=False):
    if voltear_x:
        tx = 1.0 - tx
    tx = max(0.0, min(1.0, tx))
    tz = max(0.0, min(1.0, tz))
    px = caja[0] + tx * (caja[2] - caja[0])
    py = caja[3] + tz * (caja[1] - caja[3])
    return uv_de_pixel(px, py, ancho, alto)


def mapear(bm, chaqueta, pantalon, ficha):
    uv = uv_de(bm)
    capa = parte_de(bm)
    frente = ficha["frente"]
    espalda = ficha["espalda"]
    span = max(0.05, chaqueta["pecho"])
    hombro = max(span + 0.01, chaqueta["hombro"])
    z0 = chaqueta["bajo"]
    z1 = chaqueta["cuello"]
    largo = max(0.01, metros(MEDIDAS["manga"]))
    for cara_uv in bm.faces:
        parte = cara_uv[capa]
        equis = [lazo.vert.co.x for lazo in cara_uv.loops]
        cruza = min(equis) < -0.01 and max(equis) > 0.01
        for lazo in cara_uv.loops:
            co = lazo.vert.co
            ax = abs(co.x)
            if ax <= span:
                tx = (co.x + span) / (2.0 * span)
            else:
                t_h = min(1.0, (ax - span) / (hombro - span))
                borde = 0.76 + 0.12 * t_h
                tx = borde if co.x > 0.0 else 1.0 - borde
            tz = (co.z - z0) / max(0.01, z1 - z0)
            if parte == 1 and tz > 0.82 and abs(tx - 0.5) < 0.16:
                tx = 0.36 if tx < 0.5 else 0.64
                tz = min(tz, 0.78)
            if parte == 1:
                u, v = proyectar(frente["torso"], tx, tz, frente["ancho"], frente["alto"])
            elif parte == 2:
                u, v = proyectar(espalda["torso"], tx, tz, espalda["ancho"], espalda["alto"], voltear_x=True)
            elif parte in (3, 4, 5, 6):
                foto = espalda if parte in (4, 6) else frente
                if parte in (3, 4):
                    caja = foto["manga_vista_derecha"] if parte == 4 else foto["manga_vista_izquierda"]
                    signo = -1.0
                else:
                    caja = foto["manga_vista_izquierda"] if parte == 6 else foto["manga_vista_derecha"]
                    signo = 1.0
                base_z = chaqueta.get("puno_z", z1 - largo)
                v_n = max(0.0, min(1.0, (co.z - base_z) / max(0.01, z1 - 0.08 - base_z)))
                eje = signo * hombro * 0.9
                angulo = math.atan2((co.x - eje) * signo, -(co.y + 0.015))
                u_n = 0.5 + 0.08 * max(-1.0, min(1.0, angulo))
                v_tela = 0.22 + 0.58 * v_n
                parche = None
                if parte == 3:
                    parche = frente.get("parche_manga_izquierda")
                elif parte == 5:
                    parche = frente.get("parche_manga_derecha")
                fuera = co.x * signo
                if parche and v_n > 0.62 and fuera > hombro + 0.012:
                    u_p = max(0.0, min(1.0, (fuera - hombro - 0.012) / 0.05))
                    v_p = max(0.0, min(1.0, (v_n - 0.58) / 0.40))
                    u, v = proyectar(parche, u_p, v_p, frente["ancho"], frente["alto"])
                else:
                    u, v = proyectar(caja, u_n, v_tela, foto["ancho"], foto["alto"])
            elif cruza:
                caja = frente["pierna_vista_izquierda"]
                u, v = proyectar(caja, 0.5, (co.z - pantalon["bajo"]) / max(0.01, pantalon["cintura"] - pantalon["bajo"]), frente["ancho"], frente["alto"])
            else:
                foto = espalda if parte == 8 else frente
                del_lado_positivo = co.x >= 0.0
                if parte == 8:
                    caja = foto["pierna_vista_izquierda"] if del_lado_positivo else foto["pierna_vista_derecha"]
                else:
                    caja = foto["pierna_vista_derecha"] if del_lado_positivo else foto["pierna_vista_izquierda"]
                t_pierna = max(0.0, min(1.0, co.z / max(0.01, metros(MEDIDAS["entrepierna"]))))
                sep = metros(MEDIDAS["centro_tobillo"]) * (1.0 - t_pierna) + pantalon.get("centro_pierna", 0.1) * t_pierna
                centro = sep if del_lado_positivo else -sep
                fuera = (co.x - centro) if del_lado_positivo else (centro - co.x)
                giro = math.atan2(fuera, -co.y)
                u_n = 0.5 + 0.22 * math.sin(giro)
                if not del_lado_positivo:
                    u_n = 1.0 - u_n
                if parte == 8:
                    u_n = 1.0 - u_n
                alto = max(0.01, pantalon["cintura"] - pantalon["bajo"])
                u, v = proyectar(caja, u_n, (co.z - pantalon["bajo"]) / alto, foto["ancho"], foto["alto"])
            lazo[uv].uv = (max(0.0, min(0.999, u)), max(0.0, min(0.999, v)))


def material(nombre, ruta, color):
    mat = bpy.data.materials.new(nombre)
    mat.use_nodes = True
    nodos = mat.node_tree.nodes
    nodos.clear()
    salida = nodos.new("ShaderNodeOutputMaterial")
    bsdf = nodos.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.72
    if os.path.isfile(ruta):
        imagen = bpy.data.images.load(ruta)
        textura = nodos.new("ShaderNodeTexImage")
        textura.image = imagen
        mat.node_tree.links.new(textura.outputs["Color"], bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = color
        print("Sin foto, se usa color plano:", ruta)
    mat.node_tree.links.new(bsdf.outputs["BSDF"], salida.inputs["Surface"])
    return mat


def a_objeto(bm, nombre, materiales):
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    abiertos = [arista for arista in bm.edges if arista.is_boundary]
    print(nombre, "bordes abiertos", len(abiertos))
    malla = bpy.data.meshes.new(nombre)
    bm.to_mesh(malla)
    bm.free()
    obj = bpy.data.objects.new(nombre, malla)
    bpy.context.scene.collection.objects.link(obj)
    for mat in materiales:
        obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    grosor = obj.modifiers.new("grosor", "SOLIDIFY")
    grosor.thickness = 0.0016
    grosor.offset = 0.0
    bpy.ops.object.modifier_apply(modifier="grosor")
    obj.select_set(False)
    return obj


def preparar_mundo():
    escena = bpy.context.scene
    mundo = bpy.data.worlds.new("FondoBlanco")
    escena.world = mundo
    mundo.use_nodes = True
    fondo = mundo.node_tree.nodes.get("Background")
    if fondo:
        fondo.inputs[0].default_value = (1.0, 1.0, 1.0, 1.0)
        fondo.inputs[1].default_value = 1.0
    sol = bpy.data.lights.new("Sol", "SUN")
    sol.energy = 3.5
    obj = bpy.data.objects.new("Sol", sol)
    escena.collection.objects.link(obj)
    obj.rotation_euler = (0.9, 0.2, 0.6)
    for motor in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            escena.render.engine = motor
            break
        except TypeError:
            continue
    escena.render.resolution_x = 900
    escena.render.resolution_y = 1200
    escena.render.film_transparent = False


def mirar(obj, objetivo):
    vacio = bpy.data.objects.new(obj.name + "_mira", None)
    bpy.context.scene.collection.objects.link(vacio)
    vacio.location = objetivo
    giro = obj.constraints.new("TRACK_TO")
    giro.target = vacio
    giro.track_axis = "TRACK_NEGATIVE_Z"
    giro.up_axis = "UP_Y"


def renderizar():
    os.makedirs(VISTAS, exist_ok=True)
    preparar_mundo()
    objetivo = Vector((0.0, 0.0, 0.98))
    camaras = {
        "frente": Vector((0.0, -3.6, 1.05)),
        "espalda": Vector((0.0, 3.6, 1.05)),
        "perfil-izquierdo": Vector((3.6, 0.0, 1.05)),
        "perfil-derecho": Vector((-3.6, 0.0, 1.05)),
        "tres-cuartos": Vector((2.1, -2.6, 1.15)),
        "tres-cuartos-derecho": Vector((-2.1, -2.6, 1.15)),
    }
    escena = bpy.context.scene
    for nombre, ubicacion in camaras.items():
        datos = bpy.data.cameras.new(nombre)
        datos.lens = 55
        cam = bpy.data.objects.new(nombre, datos)
        escena.collection.objects.link(cam)
        cam.location = ubicacion
        mirar(cam, objetivo)
        escena.camera = cam
        escena.render.filepath = os.path.join(VISTAS, nombre + ".png")
        try:
            bpy.ops.render.render(write_still=True)
            print("vista", escena.render.filepath)
        except Exception as error:
            print("No se pudo renderizar", nombre, error)


def material_oro():
    mat = bpy.data.materials.new("OroPONAL")
    mat.use_nodes = True
    nodos = mat.node_tree.nodes
    nodos.clear()
    salida = nodos.new("ShaderNodeOutputMaterial")
    bsdf = nodos.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.74, 0.56, 0.16, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.82
    bsdf.inputs["Roughness"].default_value = 0.34
    mat.node_tree.links.new(bsdf.outputs["BSDF"], salida.inputs["Surface"])
    return mat


def superficie(obj, x, z, lado_y):
    mejor = None
    for poly in obj.data.polygons:
        centro = poly.center
        if lado_y < 0.0 and centro.y > 0.02:
            continue
        if lado_y > 0.0 and centro.y < -0.015:
            continue
        distancia = (centro.x - x) ** 2 + (centro.z - z) ** 2
        if mejor is None or distancia < mejor[0]:
            mejor = (distancia, centro.copy(), poly.normal.copy())
    if mejor is None or mejor[0] > 0.075 ** 2:
        return None
    normal = mejor[2].normalized()
    return mejor[1] + normal * 0.004, normal


def disco_anclado(nombre, lugar, normal, oro, padre, radio_m=0.011):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radio_m, depth=0.003, location=(0.0, 0.0, 0.0))
    obj = bpy.context.active_object
    obj.name = nombre
    obj.location = lugar
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(normal)
    obj.data.materials.append(oro)
    obj.parent = padre
    obj.matrix_parent_inverse = padre.matrix_world.inverted()
    return obj


def colocar_botones(ficha, chaqueta, chaqueta_obj):
    oro = material_oro()
    frente = ficha["frente"]
    caja = frente["torso"]
    span = chaqueta["pecho"]
    z0 = chaqueta["bajo"]
    z1 = chaqueta["cuello"]
    puestos = 0
    for indice, (px, py) in enumerate(frente["botones"]):
        tx = (px - caja[0]) / float(caja[2] - caja[0])
        tz = (caja[3] - py) / float(caja[3] - caja[1])
        x = -span + tx * 2.0 * span
        z = z0 + tz * (z1 - z0)
        ancla = superficie(chaqueta_obj, x, z, -1.0)
        if ancla is None:
            print("boton sin tela", indice)
            continue
        disco_anclado("boton_%02d" % indice, ancla[0], ancla[1], oro, chaqueta_obj)
        puestos += 1
    espalda = ficha["espalda"]
    base = chaqueta.get("puno_z", z1 - metros(MEDIDAS["manga"]))
    for indice, (px, py) in enumerate(espalda["botones_puno"]):
        lado = 1.0 if px < espalda["ancho"] / 2.0 else -1.0
        orden = indice % 3
        ancla = superficie(chaqueta_obj, lado * chaqueta.get("puno_x", span + 0.05), base + 0.03 + orden * 0.022, 1.0)
        if ancla is None:
            print("puno sin tela", indice)
            continue
        disco_anclado("puno_%02d" % indice, ancla[0], ancla[1], oro, chaqueta_obj, 0.008)
        puestos += 1
    print("botones anclados", puestos)


def cuerpo_guia():
    # Referencia masculina interna, más estrecha que el uniforme. Queda oculta.
    bajo = metros(MEDIDAS["entrepierna"]) + 0.07
    largo = metros(MEDIDAS["largo_chaqueta"])
    piezas = (
        ("CUERPO_pecho", (0.0, -0.01, bajo + largo * 0.62), (0.16, 0.12, 0.13)),
        ("CUERPO_cintura", (0.0, 0.0, bajo + largo * 0.38), (0.15, 0.11, 0.08)),
        ("CUERPO_cadera", (0.0, 0.015, metros(MEDIDAS["entrepierna"]) + 0.02), (0.17, 0.13, 0.09)),
    )
    for nombre, lugar, escala in piezas:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1.0, location=lugar)
        obj = bpy.context.active_object
        obj.name = nombre
        obj.scale = escala
        obj.hide_render = True
        obj.hide_set(True)


def main():
    print("Plantilla PONAL #3, centímetros editables, no son talla certificada.")
    for clave in sorted(MEDIDAS):
        print(" ", clave, MEDIDAS[clave])
    ficha = cargar_ficha()
    limpiar_escena()
    frente = material("FrentePONAL", FOTO_FRENTE, (0.16, 0.20, 0.12, 1.0))
    espalda = material("EspaldaPONAL", FOTO_ESPALDA, (0.14, 0.18, 0.11, 1.0))
    chaqueta_bm = nuevo_bmesh()
    medidas_chaqueta = construir_chaqueta(chaqueta_bm)
    mapear(chaqueta_bm, medidas_chaqueta, {"bajo": 0.02, "cintura": metros(MEDIDAS["largo_pantalon"])}, ficha)
    pantalon_bm = nuevo_bmesh()
    medidas_pantalon = construir_pantalon(pantalon_bm)
    mapear(pantalon_bm, medidas_chaqueta, medidas_pantalon, ficha)
    chaqueta_obj = a_objeto(chaqueta_bm, "PONAL3_chaqueta", (frente, espalda))
    a_objeto(pantalon_bm, "PONAL3_pantalon", (frente, espalda))
    colocar_botones(ficha, medidas_chaqueta, chaqueta_obj)
    cuerpo_guia()
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type == "MESH" and not obj.name.startswith("CUERPO"):
            obj.select_set(True)
    try:
        bpy.ops.preferences.addon_enable(module="io_scene_gltf2")
    except Exception:
        pass
    bpy.ops.export_scene.gltf(filepath=SALIDA, export_format="GLB", use_selection=True)
    print("GLB", SALIDA)
    renderizar()


if __name__ == "__main__":
    main()
