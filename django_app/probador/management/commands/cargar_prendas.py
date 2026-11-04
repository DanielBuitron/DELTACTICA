from django.core.management.base import BaseCommand

from probador.models import Prenda

PRENDAS = [
    [
        "BUZO_TACTICO_LICRADO_KAKI.png",
        "Buzo táctico licrado kaki",
        "buzo",
        {
            "sh": [
                0.15,
                0.2
            ],
            "tx": 0.21,
            "hy": 0.97,
            "hem": 1.2,
            "r": 0.08,
            "cy": 0.02,
            "neck": 0.85,
            "el": [
                0.1,
                0.53
            ],
            "wr": [
                0.11,
                0.93
            ]
        },
        0,
        {},
        "Substitute the current top with a khaki olive tactical quarter-zip long sleeve shirt with a stand collar, front half zipper and velcro pocket panels on both sleeves"
    ],
    [
        "BUZO_TACTICO_PONAL_LAFAYETTE__4_AZUL.png",
        "Buzo táctico PONAL Lafayette azul",
        "buzo",
        {
            "sh": [
                0.15,
                0.2
            ],
            "tx": 0.22,
            "hy": 0.97,
            "hem": 1.2,
            "r": 0.08,
            "cy": 0.05,
            "neck": 0.6,
            "el": [
                0.1,
                0.53
            ],
            "wr": [
                0.1,
                0.93
            ]
        },
        1,
        {},
        "Substitute the current top with a dark navy blue tactical long sleeve polo shirt with neon yellow shoulder yokes, neon yellow embroidered chest patches and a buttoned placket"
    ],
    [
        "BUZO_TACTICO_PONAL_RISTOP.png",
        "Buzo táctico PONAL Ripstop verde",
        "buzo",
        {
            "sh": [
                0.17,
                0.22
            ],
            "tx": 0.24,
            "hy": 0.95,
            "hem": 1.2,
            "r": 0.08,
            "cy": 0.02,
            "neck": 0.85,
            "el": [
                0.09,
                0.55
            ],
            "wr": [
                0.1,
                0.93
            ]
        },
        2,
        {},
        "Substitute the current top with an olive green ripstop tactical combat shirt with a high mock collar, white embroidered chest patches and sleeve pockets with velcro flaps"
    ],
    [
        "CAMISETA_DEPORTES_EJERCITO.png",
        "Camiseta deportes Ejército",
        "camiseta",
        {
            "sh": [
                0.2,
                0.15
            ],
            "tx": 0.19,
            "hy": 0.99,
            "hem": 1.25,
            "r": 0.09,
            "cy": 0.02,
            "end": [
                0.08,
                0.4,
                0.55
            ]
        },
        3,
        {
            "manga": 24,
            "biceps": 19
        },
        "Substitute the current top with a white short sleeve sports jersey with a red and black digital camouflage chest band, black sleeve cuffs, black piping and a round badge on the chest"
    ],
    [
        "CAMISETA_LICRADA_MANGA_CORTA_BLANCA.png",
        "Camiseta licrada manga corta blanca",
        "camiseta",
        {
            "sh": [
                0.2,
                0.14
            ],
            "tx": 0.2,
            "hy": 0.98,
            "hem": 1.25,
            "r": 0.09,
            "cy": 0.02,
            "end": [
                0.07,
                0.31,
                0.5
            ]
        },
        4,
        {
            "manga": 22,
            "biceps": 18
        },
        "Substitute the current top with a plain white fitted short sleeve crew neck athletic t-shirt made of smooth stretch fabric"
    ],
    [
        "CAMISETA_LICRADA_MANGA_LARGA_NEGRA.png",
        "Camiseta licrada manga larga negra",
        "camiseta",
        {
            "sh": [
                0.17,
                0.17
            ],
            "tx": 0.21,
            "hy": 0.98,
            "hem": 1.25,
            "r": 0.08,
            "cy": 0.02,
            "el": [
                0.1,
                0.52
            ],
            "wr": [
                0.09,
                0.93
            ]
        },
        5,
        {},
        "Substitute the current top with a plain black fitted long sleeve crew neck athletic shirt made of smooth stretch fabric"
    ],
    [
        "CHAQUETA_PONAL.png",
        "Chaqueta PONAL reflectiva",
        "chaqueta",
        {
            "sh": [
                0.15,
                0.2
            ],
            "tx": 0.2,
            "hy": 0.98,
            "hem": 1.3,
            "r": 0.08,
            "cy": 0.02,
            "neck": 0.85,
            "el": [
                0.08,
                0.53
            ],
            "wr": [
                0.06,
                0.93
            ]
        },
        6,
        {},
        "Substitute the current top with a neon yellow and black high visibility police jacket with reflective silver bands, black and yellow checkered stripes, a full front zipper and a black stand collar"
    ],
    [
        "CHAQUETA_TACTICA_NEGRA.png",
        "Chaqueta táctica negra softshell",
        "chaqueta",
        {
            "sh": [
                0.15,
                0.27
            ],
            "tx": 0.2,
            "hy": 0.97,
            "hem": 1.3,
            "r": 0.08,
            "cy": 0.02,
            "neck": 0.9,
            "el": [
                0.07,
                0.58
            ],
            "wr": [
                0.08,
                0.93
            ]
        },
        7,
        {},
        "Substitute the current top with a black softshell tactical jacket with a hood, full front zipper, chest zip pockets and velcro patch panels with zippered pockets on both sleeves"
    ]
]


class Command(BaseCommand):
    help = "Carga las 8 prendas de ejemplo del probador virtual de Deltactica (se puede ejecutar varias veces)."

    def handle(self, *args, **options):
        for archivo, nombre, categoria, ajuste, orden, medidas, prompt_ia in PRENDAS:
            obj, creada = Prenda.objects.update_or_create(
                nombre=nombre,
                defaults={
                    "categoria": categoria,
                    "imagen_estatica": "probador/img/prendas/" + archivo,
                    "ajuste": ajuste,
                    "medidas": medidas,
                    "prompt_ia": prompt_ia,
                    "orden": orden,
                    "activo": True,
                },
            )
            self.stdout.write(("Creada: " if creada else "Actualizada: ") + nombre)
