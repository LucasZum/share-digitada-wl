from django.urls import path
from .views import WhiteLabelPublicView

urlpatterns = [
    path('white-label/', WhiteLabelPublicView.as_view(), name='white-label-public'),
]
