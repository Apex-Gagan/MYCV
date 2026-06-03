from django.urls import path
from .views import *
from .sitemaps import StaticViewSitemap, SupabaseDynamicSitemap  # we’ll define these
from django.contrib.sitemaps.views import sitemap

sitemaps = {
    "static": StaticViewSitemap,
    "supabase": SupabaseDynamicSitemap,
}
urlpatterns = [
    path("", Home.as_view(), name="home"),
    path("project/<slug:slug>", project_Details.as_view(), name="project"),
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
       path("robots.txt", Robots.as_view(), name="robots"),
]
