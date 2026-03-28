from django.urls import path
from .views import (
    TransactionCreateView,
    TransactionConfirmView,
    TransactionStatusView,
    TransactionListView,
)

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction-list'),
    path('create/', TransactionCreateView.as_view(), name='transaction-create'),
    path('<uuid:pk>/confirm/', TransactionConfirmView.as_view(), name='transaction-confirm'),
    path('<uuid:pk>/status/', TransactionStatusView.as_view(), name='transaction-status'),
]
