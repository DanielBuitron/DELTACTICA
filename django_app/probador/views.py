import asyncio
import os

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from .models import Prenda


def _config_ia():
    return {
        "tokenUrl": "/probador/token/",  # se reemplaza abajo con reverse()
        "decartModel": getattr(settings, "DECART_MODEL", "lucy-vton-latest"),
        "decartFast": bool(getattr(settings, "DECART_FAST", False)),
        "maxAiSeconds": int(getattr(settings, "DECART_MAX_SESSION", 120)),
    }


@login_required
def probador(request):
    from django.urls import reverse

    prendas = [p.as_dict() for p in Prenda.objects.filter(activo=True) if p.url_imagen]
    cfg = _config_ia()
    cfg["tokenUrl"] = reverse("probador:token")
    return render(request, "probador/probador.html", {"prendas": prendas, "config": cfg})


@login_required
@require_POST
def token_decart(request):
    """Crea un token de corta duración para que el NAVEGADOR hable con Decart.
    La clave permanente (DECART_API_KEY) nunca sale del servidor."""
    key = getattr(settings, "DECART_API_KEY", "") or os.environ.get("DECART_API_KEY", "")
    if not key:
        return JsonResponse({"error": "Falta configurar DECART_API_KEY en el servidor."}, status=503)
    try:
        from decart import DecartClient  # pip install decart

        modelo = getattr(settings, "DECART_MODEL", "lucy-vton-latest")
        maximo = int(getattr(settings, "DECART_MAX_SESSION", 120))

        async def crear():
            async with DecartClient(api_key=key) as client:
                return await client.tokens.create(
                    expires_in=120,
                    allowed_models=[modelo],
                    constraints={"realtime": {"maxSessionDuration": maximo + 15}},
                )

        token = asyncio.run(crear())
        return JsonResponse({"apiKey": token.api_key, "expiresAt": token.expires_at})
    except ImportError:
        return JsonResponse({"error": "Falta instalar el paquete: pip install decart"}, status=503)
    except Exception:
        return JsonResponse({"error": "No se pudo crear el permiso de la IA."}, status=502)
