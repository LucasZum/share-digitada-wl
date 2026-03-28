import csv
import io
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse

from core.permissions import IsAdminRole
from transactions.services import TransactionMetricsService


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        period = request.query_params.get('period', '30d')
        data = TransactionMetricsService.get_global_metrics(period)
        return Response(data)


class DashboardChartView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        period = request.query_params.get('period', '30d')
        data = TransactionMetricsService.get_chart_data(period)
        return Response(data)


class BillingReportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        from django.utils import timezone
        now = timezone.now()
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))
        fmt = request.query_params.get('format', 'json')

        data = TransactionMetricsService.get_billing_report(year, month)

        if fmt == 'csv':
            return self._csv_response(data, year, month)

        return Response({'year': year, 'month': month, 'records': data})

    def _csv_response(self, data, year, month):
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=['user_id', 'email', 'full_name', 'volume_cents', 'transaction_count', 'fee_cents'],
            extrasaction='ignore',
        )
        writer.writeheader()
        writer.writerows(data)

        response = HttpResponse(
            '\ufeff' + output.getvalue(),  # UTF-8-sig BOM for Excel
            content_type='text/csv; charset=utf-8-sig',
        )
        response['Content-Disposition'] = f'attachment; filename="billing_{year}_{month:02d}.csv"'
        return response
