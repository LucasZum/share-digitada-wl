from django.urls import path
from .views import StripeAccountListCreateView

urlpatterns = [
    path('accounts/', StripeAccountListCreateView.as_view(), name='stripe-accounts'),
]
