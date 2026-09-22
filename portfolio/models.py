from django.core.validators import URLValidator
from django.db import models
from django.templatetags.static import static

# Create your models here.
class Project(models.Model):
    title = models.CharField(max_length=200)
    short_description = models.TextField()
    long_description = models.TextField()
    # Holds a full image URL. Stays a TextField because the column is `text`:
    # URLField would map to varchar(200/500) and force an ALTER on a table that
    # does not need one. The validator gives the URL checking anyway.
    image = models.TextField(validators=[URLValidator()])
    live_link = models.URLField()
    tools_used = models.TextField()
    slug = models.SlugField(unique=True)

    @property
    def tool_list(self):
        """`tools_used` is a comma-separated blob; templates want a clean list."""
        return [tool.strip() for tool in self.tools_used.split(",") if tool.strip()]

    @property
    def image_url(self):
        """Ready-to-render URL for the project image.

        `image` now holds a full URL, so the common case is a straight
        passthrough. Rows created before the switch still hold a
        static-relative path ("/assets/jpeg/4.png"); those keep resolving
        through staticfiles instead of 404-ing.
        """
        raw = (self.image or "").strip()
        if not raw:
            return ""
        if raw.startswith(("http://", "https://", "//", "data:")):
            return raw
        return static(raw.lstrip("/"))

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