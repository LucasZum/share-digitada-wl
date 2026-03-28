from django.urls import path
from .views import WhiteLabelAdminView

urlpatterns = [
    path('white-label/', WhiteLabelAdminView.as_view(), name='white-label-admin'),
]
