from django.shortcuts import render
from django.views import View

# Create your views here.
import os
from django.http import JsonResponse
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


class Home(View):
    def get(self, request):
        try:
            res = supabase.table("Projects").select("*").order("id").execute()
            # res.data is the returned list of rows

            data = {"projects": res.data}

            return render(request, "index.html", data)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def post(self, request):
        pass


class project_Details(View):
    def get(self, request, slug):
        res = supabase.table("Projects").select("*").eq("slug", slug).single().execute()
        print(res.data)
        data = {"project": res.data, "skills": list(res.data["tools"].split(","))}

        return render(request, "project.html", data)
