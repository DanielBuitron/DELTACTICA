from django.contrib import admin

from .models import Prenda


@admin.register(Prenda)
class PrendaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "categoria", "orden", "activo")
    list_filter = ("categoria", "activo")
    search_fields = ("nombre",)
    list_editable = ("orden", "activo")
