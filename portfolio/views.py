from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views import View

from email_validator import EmailNotValidError, validate_email

from .email import send_email
from .models import *


def is_valid_email_address(email):
    try:
        # validate and get normalized email (lowercase, unicode normalized)
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


class Home(View):
    def get(self, request):
        try:
            projects = Project.objects.all()
            experiences = Experience.objects.all()

            data = {"projects": projects, "experiences": experiences}

            return render(request, "index.html", data)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def post(self, request):

        """Contact form: validate, email the lead, persist nothing."""
        name = (request.POST.get("name") or "").strip()
        email = (request.POST.get("email") or "").strip()
        message = (request.POST.get("message") or "").strip()

        if not name:
            return self._field_error("name", "Please enter your name.")
        if not email or not is_valid_email_address(email):
            return self._field_error("email", "Please enter a valid email address.")
        if not message:
            return self._field_error("message", "Please enter a message.")

        sent = send_email(
            subject_field="Lead",
            name=name,
            message_body=message,
            sender_email=email,
        )
        if not sent:
            return JsonResponse(
                {
                    "status": "error",
                    "field": "form",
                    "message": "Could not send your message right now. Please try again shortly.",
                },
                status=502,
            )

        return JsonResponse({"status": "success"}, status=200)

    @staticmethod
    def _field_error(field, message):
        # `field` stays the plain body text so older clients keep working.
        return JsonResponse(
            {"status": "error", "field": field, "message": message}, status=400
        )

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
            # contact = Contact.objects.create(name=name, email=email, message=message)
            # contact.save()
            send_email(subject_field="Lead", name=name, message_body=message, sender_email=email)

            return HttpResponse(content="success", status=200)



class project_Details(View):
    def get(self, request, slug):
        try:
            project = Project.objects.get(slug=slug)

            data = {
                "project": project,
                "skills": [
                    tool.strip()
                    for tool in project.tools_used.split(",")
                    if tool.strip()
                ],
            }
            return render(request, "project.html", data)

        except Exception:
            raise Http404("Project not found")


class Robots(View):
    def get(self, request):
        content = (
            "User-agent: *\n"
            "Disallow: /admin/\n"
            "Allow: /\n"
            "Sitemap: https://www.gagandeepsingh.in/sitemap.xml\n"
        )

        return HttpResponse(content, content_type="text/plain")
