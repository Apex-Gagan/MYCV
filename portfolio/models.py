from django.db import models

# Create your models here.
class Project(models.Model):
    title = models.CharField(max_length=200)
    short_description = models.TextField()
    long_description = models.TextField()
    image = models.TextField()
    live_link = models.URLField()
    tools_used = models.TextField()
    slug = models.SlugField(unique=True)

    @property
    def tool_list(self):
        """`tools_used` is a comma-separated blob; templates want a clean list."""
        return [tool.strip() for tool in self.tools_used.split(",") if tool.strip()]

    @property
    def image_path(self):
        """Static-relative image key.

        Rows store the path with a leading slash ("/assets/jpeg/4.png"), which
        never matches a staticfiles manifest key and breaks {% static %} once
        hashed storage is enabled. Normalise it here rather than in each
        template.
        """
        return (self.image or "").strip().lstrip("/")

    def __str__(self):
        return self.title


class Contact(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    message = models.TextField()
    def __str__(self):
        return self.email

class Experience(models.Model):
    company = models.CharField(max_length=200)
    designation = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True,blank=True)
    is_pursuing = models.BooleanField(default=True)
    def __str__(self):
        return f"{self.company} - {self.designation}"