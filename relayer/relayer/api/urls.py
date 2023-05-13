# todo/todo_api/urls.py : API urls.py
from django.conf.urls import url
from django.urls import path, include
from .views import (
    RelayerApiView,
)

urlpatterns = [
    path('relayer/', RelayerApiView.as_view()),
]
