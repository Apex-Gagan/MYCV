from django.contrib.sitemaps import Sitemap
from django.urls import reverse
import os
from datetime import datetime
from .models import Project



class StaticViewSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.5

    def items(self):
        # Names of URL patterns for your static views
        return [
            "home",
        ]

    def location(self, item):
        return reverse(item)


class SupabaseDynamicSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.7

    def items(self):
        return Project.objects.all()

    def location(self, item):
        return reverse("project", kwargs={"slug": item.slug})
