# Deltactica · Probador virtual (VERSIÓN DE PRUEBA)

Dos modos, en este orden de calidad:

1. **IA realista** (el del video de referencia): un modelo de IA en tiempo real (*Lucy V-TON* de Decart, la tecnología de Anywear)
   viste a la persona con la prenda mientras se mueve: gira, levanta los brazos, camina, y no se ve su ropa original.
   Es de pago por segundo y necesita internet y una clave de API.
2. **2D básico** (gratis, de respaldo): deforma la foto de la prenda sobre tu esqueleto. Mucho menos realista; no oculta bien tu ropa
   ni sabe cómo es la espalda.

## Cómo se usa (flujo)

1. Activar cámara -> **Paso 1: Escaneo del cuerpo.** Sigue la silueta; la app comprueba que se vean rostro, hombros y codos, la distancia,
   el centrado, que estés quieto y que haya luz de frente. Al completarse (barra verde) queda ✓ y se habilitan los modos.
2. Elegir prenda y talla -> **IA realista** (o 2D básico). Cambiar de prenda en pleno uso no reconecta: la IA cambia al instante.
3. **Tomar foto** descarga la imagen (con la marca de versión de prueba).

## Probar la demo en tu computador

1. Crea una cuenta en https://platform.decart.ai y genera una clave de API (las cuentas nuevas reciben créditos de prueba).
2. Copia `.env.ejemplo` como `.env` y pega la clave.
3. Windows: doble clic en `iniciar_demo.bat` · Linux/Mac: `sh iniciar_demo.sh` (instala el paquete `decart` y abre http://localhost:8000).
   Sin clave igual funciona el modo 2D.

La cámara solo funciona desde `http://localhost` o HTTPS. Para que se vea bien: luz de FRENTE (nunca una ventana detrás),
a ~1.5 m, de frente, con rostro, hombros y brazos dentro del cuadro.

## Costos y control

Precio publicado por Decart (consúltalo, puede cambiar): Lucy VTON en tiempo real US$0.02 por segundo (~US$1.20 por minuto);
modo rápido (`DECART_FAST`) el doble. Esta demo corta cada sesión IA a **120 s** (`DECART_MAX_SESSION`), es decir unos US$2.40 como máximo
por sesión, y muestra el costo aproximado en pantalla. Pon tu propio límite antes de abrirlo al público.

## Privacidad (importante)

En modo IA el video de la cámara se envía en vivo al servicio de IA (Decart). La app pide una confirmación la primera vez.
Antes de publicarlo a clientes agrega tu aviso de privacidad y la autorización de tratamiento de datos que exija tu normativa
(en Colombia, Ley 1581 de 2012 / habeas data; la imagen del rostro puede ser dato sensible: consúltalo con tu asesor legal).
La clave permanente nunca va al navegador: el servidor entrega un token que dura minutos.

## Añadirlo a tu proyecto Django

1. Copia `django_app/probador` a la raíz de tu proyecto (junto a `manage.py`) y `pip install decart`.
2. `settings.py`: añade `"probador"` a `INSTALLED_APPS` y
   ```python
   DECART_API_KEY = os.environ["DECART_API_KEY"]   # nunca en el código
   # opcionales: DECART_MODEL = "lucy-vton-latest"; DECART_MAX_SESSION = 120; DECART_FAST = False
   ```
3. `urls.py` principal: `path("probador/", include("probador.urls")),`
4. `python manage.py makemigrations probador && python manage.py migrate && python manage.py cargar_prendas`
5. Abre `/probador/` (pide login). Las prendas nuevas se suben desde el Admin.

## Prendas para la IA

- Imagen de la prenda sola, sobre fondo blanco o transparente, de al menos 512x512 (la app la pone sobre fondo blanco).
- Campo **prompt_ia** (en inglés, 20-30 palabras): "Substitute the current top with [color, material, cuello, cierres, parches, ajuste]".
  Es lo que más influye en el parecido. Las 8 prendas de ejemplo ya traen uno; revísalos con la prenda real en la mano.
- La IA reproduce lo que ve: logos, textos y parches pueden salir alterados. Comprueba cada prenda antes de venderla así.

## Medidas y talla (modo 2D)

Ancho de hombros real: Hombre 41.5 cm, Mujer 36.7 cm por defecto (editable). Referencias: hombros (biacromial) mediana 41.5 cm, ANSUR II del
Ejército de EE. UU.; promedios 41.1 cm y 36.7 cm, NHANES III; hombro con deltoides ~1.16 veces el biacromial (muestra ANSUR II).
Las medidas base de las prendas (talla M) son valores típicos: **reemplázalas por la tabla de tallas de Deltactica** en `prendas.js`
(`"dims": {"hombro":46,"pecho":54,"largo":70,"manga":63,"biceps":19,"bajo":52}`) o en el campo *Medidas* del Admin (pecho y bajo = ancho plano).
En modo IA la talla solo influye en la descripción del ajuste (ajustada/holgada), no en medidas exactas.

## Espalda y perfil (modo 2D)

El 2D detecta frente/espalda. Para ver la espalda hace falta su foto: `img/prendas/NOMBRE_espalda.png` (se detecta sola) o el campo
*Imagen espalda* en Django. Sin ella se sigue mostrando el frente y se avisa. En modo IA esto no hace falta (la IA lo infiere).

## Límites

- La IA no es 100 % fiel a la prenda real (detalles, proporciones). El 2D es solo una referencia.
- No pude probar en mi entorno la conexión real con Decart (sin internet ni clave): la integración sigue su documentación oficial
  (`@decartai/sdk`, `lucy-vton-latest`, token de cliente), pero la primera prueba con tu clave es la que confirma todo.
- Si el SDK no carga desde el CDN (`esm.sh`/jsDelivr), empaquétalo con tu bundler (`npm i @decartai/sdk`) o fija una versión en
  `decartSdkUrl` dentro de la configuración.
- Alternativa sin desarrollo: Decart ofrece el widget Anywear para tiendas (una línea de código), con prueba gratuita limitada.
