from django.urls import path

from . import views

app_name = "probador"

urlpatterns = [
    path("", views.probador, name="probador"),
    path("token/", views.token_decart, name="token"),
]
