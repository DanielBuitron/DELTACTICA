from django.db import models
from django.templatetags.static import static


class Prenda(models.Model):
    CATEGORIAS = [
        ("buzo", "Buzos tácticos"),
        ("camiseta", "Camisetas"),
        ("chaqueta", "Chaquetas"),
    ]

    nombre = models.CharField(max_length=120)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS, default="buzo")
    # PNG con fondo transparente, recortado al borde de la prenda y de frente
    imagen = models.FileField(upload_to="prendas/", blank=True)
    # Alternativa: ruta dentro de static/ (la usan las prendas de ejemplo)
    imagen_estatica = models.CharField(max_length=200, blank=True)
    # Puntos de ajuste de la prenda (hombro, codo, puño, borde...) en fracciones de la imagen.
    # Ver LEEME.md. Las prendas de ejemplo ya los traen; una prenda nueva sin ajuste usa valores por defecto.
    ajuste = models.JSONField(default=dict, blank=True)
    # Medidas de la tabla de tallas en cm, talla M, prenda plana: hombro, pecho (ancho plano), largo, manga, biceps, bajo.
    # Vacío = valores por defecto de la categoría. Cada talla suma/resta según el incremento del script.
    medidas = models.JSONField(default=dict, blank=True)
    # Descripción en INGLÉS (20-30 palabras) para el modo IA: color, material, cuello, cierres, parches, ajuste.
    prompt_ia = models.TextField(blank=True, help_text='Ej.: Substitute the current top with a black softshell tactical jacket with a hood and full front zipper')
    # Foto de la ESPALDA de la prenda (opcional, mismo formato). Sin ella se muestra el frente al girar.
    imagen_espalda = models.FileField(upload_to="prendas/", blank=True)
    imagen_espalda_estatica = models.CharField(max_length=200, blank=True)
    ajuste_espalda = models.JSONField(default=dict, blank=True, help_text="Vacío = usa el mismo ajuste del frente.")
    orden = models.PositiveIntegerField(default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ["orden", "nombre"]
        verbose_name = "prenda"
        verbose_name_plural = "prendas"

    def __str__(self):
        return self.nombre

    @property
    def url_imagen(self):
        if self.imagen:
            return self.imagen.url
        if self.imagen_estatica:
            return static(self.imagen_estatica)
        return ""

    @property
    def url_espalda(self):
        if self.imagen_espalda:
            return self.imagen_espalda.url
        if self.imagen_espalda_estatica:
            return static(self.imagen_espalda_estatica)
        return ""

    def as_dict(self):
        return {
            "id": self.pk,
            "nombre": self.nombre,
            "categoria": self.categoria,
            "categoria_label": self.get_categoria_display(),
            "img": self.url_imagen,
            "fit": self.ajuste or {},
            "dims": self.medidas or {},
            "prompt_ia": self.prompt_ia,
            "img_back": self.url_espalda,
            "fit_back": self.ajuste_espalda or None,
        }
