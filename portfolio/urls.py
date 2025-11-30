from django.urls import path
from .views import *

urlpatterns = [
    path("", Home.as_view(), name="home"),
    path("project/<slug:slug>", project_Details.as_view(), name="project"),
]
