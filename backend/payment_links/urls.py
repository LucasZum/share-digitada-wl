from django.urls import path
from .views import (
    PaymentLinkListCreateView,
    PaymentLinkDetailView,
    PublicPaymentLinkView,
    PublicPaymentLinkConfirmView,
)

urlpatterns = [
    path('', PaymentLinkListCreateView.as_view(), name='payment-link-list-create'),
    path('<uuid:pk>/', PaymentLinkDetailView.as_view(), name='payment-link-detail'),
    # Public endpoints: accept both with and without trailing slash to avoid
    # redirect loops when proxied through Next.js (which strips trailing slashes)
    path('public/<slug:slug>/', PublicPaymentLinkView.as_view(), name='payment-link-public'),
    path('public/<slug:slug>', PublicPaymentLinkView.as_view(), name='payment-link-public-noslash'),
    path('public/<slug:slug>/confirm/', PublicPaymentLinkConfirmView.as_view(), name='payment-link-confirm'),
    path('public/<slug:slug>/confirm', PublicPaymentLinkConfirmView.as_view(), name='payment-link-confirm-noslash'),
]
