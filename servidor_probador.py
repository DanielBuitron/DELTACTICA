# Servidor de la demo: sirve la carpeta demo/ y crea el token temporal para la IA (la clave NUNCA llega al navegador).
import asyncio, json, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.dirname(os.path.abspath(__file__))
DEMO = RAIZ


def cargar_env():
    ruta = os.path.join(RAIZ, ".env")
    if os.path.exists(ruta):
        for linea in open(ruta, encoding="utf-8"):
            linea = linea.strip()
            if linea and not linea.startswith("#") and "=" in linea:
                k, v = linea.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


cargar_env()
MODELO = os.environ.get("DECART_MODEL", "lucy-vton-latest")
MAXIMO = int(os.environ.get("DECART_MAX_SESSION", "120"))


def crear_token():
    key = os.environ.get("DECART_API_KEY", "")
    if not key:
        return 503, {"error": "Falta DECART_API_KEY (copia .env.ejemplo a .env y pega tu clave)."}
    try:
        from decart import DecartClient  # pip install decart
    except ImportError:
        return 503, {"error": "Falta instalar el paquete: pip install decart"}
    try:
        async def go():
            async with DecartClient(api_key=key) as c:
                return await c.tokens.create(expires_in=120, allowed_models=[MODELO], constraints={"realtime": {"maxSessionDuration": MAXIMO + 15}})
        t = asyncio.run(go())
        return 200, {"apiKey": t.api_key, "expiresAt": t.expires_at}
    except Exception as e:
        print("Error creando token:", type(e).__name__, e)
        return 502, {"error": "No se pudo crear el permiso de la IA (revisa la clave)."}


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DEMO, **k)

    def do_POST(self):
        if self.path.split("?")[0] == "/api/realtime-token":
            code, body = crear_token()
            data = json.dumps(body).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_error(404)


if __name__ == "__main__":
    puerto = int(os.environ.get("PORT", "8000"))
    print(f"Abre http://localhost:{puerto}/virtual.html  (Ctrl+C para detener)")
    print("IA:", "clave encontrada" if os.environ.get("DECART_API_KEY") else "SIN clave (solo funciona el modo 2D)")
    ThreadingHTTPServer(("127.0.0.1", puerto), H).serve_forever()
