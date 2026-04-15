from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/stripe/', include('stripe_accounts.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/payment-links/', include('payment_links.urls')),
    path('api/admin/', include('users.urls')),
    path('api/admin/', include('admin_dashboard.urls')),
    path('api/admin/', include('audit_logs.urls')),
    path('api/admin/', include('notifications.urls')),
    path('api/admin/', include('white_label.admin_urls')),
    path('api/config/', include('white_label.urls')),
    path('api/health/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar
        urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
