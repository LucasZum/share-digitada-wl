from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {'detail': 'Erro interno do servidor.', 'code': 'internal_error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(response.data, dict) and 'detail' not in response.data:
        response.data = {'detail': response.data, 'code': 'validation_error'}

    return response
