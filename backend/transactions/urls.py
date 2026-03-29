from django.urls import path
from .views import (
    TransactionCreateView,
    TransactionStatusView,
    TransactionListView,
)

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction-list'),
    path('create/', TransactionCreateView.as_view(), name='transaction-create'),
    path('<uuid:pk>/status/', TransactionStatusView.as_view(), name='transaction-status'),
]
