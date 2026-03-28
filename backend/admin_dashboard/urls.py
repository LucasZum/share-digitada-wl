from django.urls import path
from .views import DashboardSummaryView, DashboardChartView, BillingReportView

urlpatterns = [
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/chart/', DashboardChartView.as_view(), name='dashboard-chart'),
    path('reports/billing/', BillingReportView.as_view(), name='billing-report'),
]
