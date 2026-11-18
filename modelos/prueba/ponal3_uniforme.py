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
    "hombros": 46.0,
    "pecho": 102.0,
    "cintura": 88.0,
    "cadera": 100.0,
    "largo_chaqueta": 76.0,
    "manga": 63.0,
    "biceps": 34.0,
    "puno": 27.0,
    "cuello": 40.0,
    "muslo": 58.0,
    "rodilla": 40.0,
    "tobillo": 36.0,
    "entrepierna": 80.0,
    "largo_pantalon": 106.0,
    "profundidad_pecho": 24.0,
    "profundidad_cintura": 21.0,
    "profundidad_cadera": 26.0,
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


def anillo(bm, n, rx, rz, z, frente=0.0, caida=0.0):
    verts = []
    for i in range(n):
        angulo = 2.0 * math.pi * i / n
        x = math.sin(angulo) * rx
        y = -math.cos(angulo) * rz
        if math.cos(angulo) > 0.0:
            y -= frente
        altura = z - caida * abs(math.sin(angulo))
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
    destino = origen + Vector((signo * 0.02, -0.012, -largo))
    direccion = (destino - origen).normalized()
    pasos = 8
    anterior = lazo
    anillos = [lazo]
    for paso in range(1, pasos + 1):
        t = paso / pasos
        centro = origen.lerp(destino, t)
        grueso = radio(MEDIDAS["biceps"]) * (1.0 - t) + radio(MEDIDAS["puno"]) * t
        if paso >= pasos - 1:
            grueso *= 1.08
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
    return origen, direccion


def construir_chaqueta(bm):
    pecho_x, pecho_y = ejes(MEDIDAS["pecho"], MEDIDAS["profundidad_pecho"])
    cintura_x, cintura_y = ejes(MEDIDAS["cintura"], MEDIDAS["profundidad_cintura"])
    hombro_x = metros(MEDIDAS["hombros"]) / 2.0
    cuello_r = radio(MEDIDAS["cuello"])
    bajo = metros(MEDIDAS["largo_pantalon"] - 8.0)
    cuello_z = bajo + metros(MEDIDAS["largo_chaqueta"])
    hombro_z = cuello_z - 0.045
    sisa_z = hombro_z - 0.13
    pecho_z = bajo + metros(MEDIDAS["largo_chaqueta"]) * 0.62
    cintura_z = bajo + metros(MEDIDAS["largo_chaqueta"]) * 0.38

    bajo_a = anillo(bm, N, cintura_x * 0.98, cintura_y * 0.95, bajo)
    cintura_a = anillo(bm, N, cintura_x, cintura_y, cintura_z)
    pecho_a = anillo(bm, N, pecho_x, pecho_y, pecho_z, frente=0.015)
    sisa_a = anillo(bm, N, pecho_x * 1.02, pecho_y, sisa_z)
    hombro_a = anillo(bm, N, hombro_x, pecho_y * 0.92, hombro_z, caida=0.04)
    cuello_a = anillo(bm, N, cuello_r * 1.15, cuello_r, cuello_z)
    cuello_b = anillo(bm, N, cuello_r * 1.28, cuello_r * 1.05, cuello_z + 0.018)
    cuello_c = anillo(bm, N, cuello_r * 1.12, cuello_r * 0.95, cuello_z + 0.034)

    coser_cerrado(bm, bajo_a, cintura_a)
    coser_cerrado(bm, cintura_a, pecho_a)
    coser_cerrado(bm, pecho_a, sisa_a)
    coser_sisa(bm, sisa_a, hombro_a)
    for i in range(N):
        j = (i + 1) % N
        cara(bm, (hombro_a[i], hombro_a[j], cuello_a[j], cuello_a[i]), parte_tronco(i, j))
        cara(bm, (cuello_a[i], cuello_a[j], cuello_b[j], cuello_b[i]), parte_tronco(i, j))
        cara(bm, (cuello_b[i], cuello_b[j], cuello_c[j], cuello_c[i]), parte_tronco(i, j))

    construir_manga(bm, lazo_sisa(hombro_a, sisa_a, SISA_DER), -1.0)
    construir_manga(bm, lazo_sisa(hombro_a, sisa_a, SISA_IZQ), 1.0)
    return {"bajo": bajo, "cuello": cuello_z, "hombro": hombro_x, "pecho": pecho_x}


def anillo_pierna(bm, centro_x, rx, rz, z):
    verts = []
    for i in range(8):
        angulo = 2.0 * math.pi * i / 8.0
        local_x = math.sin(angulo) * rx
        if centro_x < 0.0:
            local_x = -local_x
        y = -math.cos(angulo) * rz
        verts.append(vertice(bm, centro_x + local_x, y, z))
    return verts


def construir_pantalon(bm):
    cadera_x, cadera_y = ejes(MEDIDAS["cadera"], MEDIDAS["profundidad_cadera"])
    cintura_x, cintura_y = ejes(MEDIDAS["cintura"], MEDIDAS["profundidad_cintura"])
    muslo_r = radio(MEDIDAS["muslo"])
    rodilla_r = radio(MEDIDAS["rodilla"])
    tobillo_r = radio(MEDIDAS["tobillo"])
    cintura_z = metros(MEDIDAS["largo_pantalon"])
    tiro_z = metros(MEDIDAS["entrepierna"])
    separacion = muslo_r * 1.02

    def pierna(signo):
        centro = signo * separacion
        tobillo = anillo_pierna(bm, centro, tobillo_r, tobillo_r * 0.82, 0.02)
        rodilla = anillo_pierna(bm, centro, rodilla_r, rodilla_r * 0.9, tiro_z * 0.48)
        muslo = anillo_pierna(bm, centro, muslo_r, muslo_r * 0.95, tiro_z * 0.82)
        cadera = anillo_pierna(bm, centro, muslo_r * 1.05, muslo_r, tiro_z)
        for a, b in ((tobillo, rodilla), (rodilla, muslo), (muslo, cadera)):
            for i in range(8):
                j = (i + 1) % 8
                cara(bm, (a[i], a[j], b[j], b[i]), 7 if i < 4 else 8)
        return cadera

    izquierda = pierna(1.0)
    derecha = pierna(-1.0)
    for anillo_sup in (izquierda, derecha):
        anillo_sup[5].co.z -= 0.025
        anillo_sup[6].co.z -= 0.055
        anillo_sup[7].co.z -= 0.02
        anillo_sup[6].co.x *= 0.25
        anillo_sup[6].co.y -= 0.008
    cara(bm, (izquierda[6], izquierda[7], derecha[7], derecha[6]), 7)
    cara(bm, (izquierda[6], izquierda[5], derecha[5], derecha[6]), 8)

    def cinturon(signo):
        return anillo_pierna(bm, signo * cadera_x * 0.48, cintura_x * 0.55, cintura_y * 0.72, cintura_z)

    cin_izq = cinturon(1.0)
    cin_der = cinturon(-1.0)
    for origen, destino in ((izquierda, cin_izq), (derecha, cin_der)):
        for i in range(8):
            j = (i + 1) % 8
            if i in (5, 6):
                continue
            cara(bm, (origen[i], origen[j], destino[j], destino[i]), 7 if i < 4 else 8)
    cara(bm, (izquierda[7], cin_izq[7], cin_der[7], derecha[7]), 7)
    cara(bm, (izquierda[5], cin_izq[5], cin_der[5], derecha[5]), 8)
    cara(bm, (cin_izq[6], cin_izq[7], cin_der[7], cin_der[6]), 7)
    cara(bm, (cin_izq[6], cin_izq[5], cin_der[5], cin_der[6]), 8)
    return {"bajo": 0.02, "cintura": cintura_z}


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
    z0 = chaqueta["bajo"]
    z1 = chaqueta["cuello"]
    largo = max(0.01, metros(MEDIDAS["manga"]))
    for cara_uv in bm.faces:
        parte = cara_uv[capa]
        equis = [lazo.vert.co.x for lazo in cara_uv.loops]
        cruza = min(equis) < -0.01 and max(equis) > 0.01
        for lazo in cara_uv.loops:
            co = lazo.vert.co
            tx = (co.x + span) / (2.0 * span)
            tz = (co.z - z0) / max(0.01, z1 - z0)
            if parte == 1:
                u, v = proyectar(frente["torso"], tx, tz, frente["ancho"], frente["alto"])
            elif parte == 2:
                u, v = proyectar(espalda["torso"], tx, tz, espalda["ancho"], espalda["alto"], voltear_x=True)
            elif parte in (3, 4, 5, 6):
                foto = espalda if parte in (4, 6) else frente
                if parte in (3, 4):
                    caja = foto["manga_vista_derecha"] if parte == 4 else foto["manga_vista_izquierda"]
                    hacia_afuera = -1.0
                else:
                    caja = foto["manga_vista_izquierda"] if parte == 6 else foto["manga_vista_derecha"]
                    hacia_afuera = 1.0
                v_n = max(0.0, min(1.0, (co.z - (z1 - largo)) / largo))
                frente_manga = max(0.0, min(1.0, 0.5 - co.y / 0.08))
                u_n = 0.28 + 0.44 * frente_manga if hacia_afuera < 0.0 else 0.72 - 0.44 * frente_manga
                u, v = proyectar(caja, u_n, v_n, foto["ancho"], foto["alto"])
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
                centro = radio(MEDIDAS["muslo"]) * 1.02 * (1.0 if del_lado_positivo else -1.0)
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


def disco(nombre, x, y, z, oro, radio_m=0.011):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radio_m, depth=0.004, location=(x, y, z))
    obj = bpy.context.active_object
    obj.name = nombre
    obj.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    obj.data.materials.append(oro)
    return obj


def colocar_botones(ficha, chaqueta):
    oro = material_oro()
    frente = ficha["frente"]
    caja = frente["torso"]
    span = chaqueta["pecho"]
    z0 = chaqueta["bajo"]
    z1 = chaqueta["cuello"]
    for indice, (px, py) in enumerate(frente["botones"]):
        tx = (px - caja[0]) / float(caja[2] - caja[0])
        tz = (caja[3] - py) / float(caja[3] - caja[1])
        x = -span + tx * 2.0 * span
        z = z0 + tz * (z1 - z0)
        disco("boton_%02d" % indice, x, -0.132, z, oro)
    espalda = ficha["espalda"]
    punos = espalda["botones_puno"]
    largo = metros(MEDIDAS["manga"])
    base = z1 - largo + 0.02
    for indice, (px, py) in enumerate(punos):
        lado = 1.0 if px < espalda["ancho"] / 2.0 else -1.0
        orden = indice % 3
        disco("puno_%02d" % indice, lado * span * 0.78, 0.03, base + orden * 0.022, oro, 0.008)


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
    a_objeto(chaqueta_bm, "PONAL3_chaqueta", (frente, espalda))
    a_objeto(pantalon_bm, "PONAL3_pantalon", (frente, espalda))
    colocar_botones(ficha, medidas_chaqueta)
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        if obj.type == "MESH":
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
