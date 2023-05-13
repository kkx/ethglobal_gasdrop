# todo/todo_api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .serializers import RelayerSerializer
from .safeApi import execSafeTransaction


class RelayerApiView(APIView):
    # 1. List all
    def get(self, request, *args, **kwargs):
        '''
        List all the todo items for given requested user
        '''
        return Response({}, status=status.HTTP_200_OK)

    # 2. Create
    def post(self, request, *args, **kwargs):
        '''
        relayer the transaction
        '''
        serializer = RelayerSerializer(data=request.data)
        print(serializer.is_valid())
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            try:
                data['txHash'] = str(execSafeTransaction(**data))
            except:
                data['txHash'] = ''
            print(data)
            return Response(data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
