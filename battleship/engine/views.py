from django.http import HttpRequest, HttpResponse
from django.shortcuts import render


def index(request: HttpRequest) -> HttpResponse:
    context = {'table_range': range(10)}
    return render(request, 'engine/index.html', context)
