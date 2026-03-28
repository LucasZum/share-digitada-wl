from .base import *  # noqa

DEBUG = True

INSTALLED_APPS += ['debug_toolbar']  # noqa

MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE  # noqa

INTERNAL_IPS = ['127.0.0.1']

DATABASES['default']['HOST'] = 'localhost'  # noqa: override for local dev without Docker

LOGGING['root']['level'] = 'DEBUG'  # noqa
