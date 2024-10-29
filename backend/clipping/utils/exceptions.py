from rest_framework.response import Response
from rest_framework.views import exception_handler
from rest_framework import exceptions


class ProjectBaseException(exceptions.APIException):
    code = 1  # 代表异常，0表示正常，非0则为异常
    message = "Unknown error occurred, please contact us for help."

    @classmethod
    def get_message(cls):
        return {"status_code": 200, "detail": "unknown error occurred, contact us for help."}


# 避免暴露内部细节，用自定义异常类替换
exc_map = {

}


def global_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None:
        response.data['status_code'] = response.status_code
        error_msg = exc_map.get(exc.__class__.__name__, ProjectBaseException).get_message()
        return Response(error_msg, status=200)

    return response