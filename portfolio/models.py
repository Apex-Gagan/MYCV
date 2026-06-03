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