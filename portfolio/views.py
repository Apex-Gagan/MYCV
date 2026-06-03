from django.shortcuts import render
from django.views import View
from django.http import Http404

# Create your views here.

from .email import send_email
from django.http import JsonResponse, HttpResponse

from email_validator import validate_email, EmailNotValidError
from .models import *

def is_valid_email_address(email):
    try:
        # validate and get normalized email (lowercase, unicode normalized)
        valid = validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError as e:
        return False




class Home(View):
    def get(self, request):
        try:
            projects = Project.objects.all()
            experiences = Experience.objects.all()
            # res.data is the returned list of rows

            data = {"projects": projects, "experiences": experiences}

            return render(request, "index.html", data)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def post(self, request):
        name = request.POST.get("name")
        email = request.POST.get("email")
        message = request.POST.get("message")
        if len(name) == 0:
            return HttpResponse(content="name", status=400)
        if email == "" or not is_valid_email_address(email):
            return HttpResponse(content="email", status=400)
        if message == "":
            return HttpResponse(content="message", status=400)
        else:
            contact = Contact.objects.create(name=name, email=email, message=message)
            contact.save()
            send_email(subject_field="Lead", name=name, message_body=message, sender_email=email)

            return HttpResponse(content="success", status=200)


class project_Details(View):
    def get(self, request, slug):
        try:
            project = Project.objects.get(slug=slug)


            data = {
                "project": project,
                "skills": list(project.tools_used.split(",")),
            }
            return render(request, "project.html", data)

        except Exception:
            raise Http404("Project not found or Supabase error")




class Robots(View):
    def get(self, request):
        content = (
            "User-agent: *\n"
            "Disallow: /admin/\n"
            "Allow: /\n"
            "Sitemap: https://www.gagandeepsingh.in/sitemap.xml\n"
        )

        return HttpResponse(content, content_type="text/plain")