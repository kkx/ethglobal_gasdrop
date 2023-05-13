from rest_framework import serializers


class RelayerSerializer(serializers.Serializer):
    safeAddress = serializers.CharField(max_length=100)
    to = serializers.CharField(max_length=100)
    value = serializers.IntegerField()
    data = serializers.CharField(max_length=20000)
    operation = serializers.IntegerField()
    safeTxGas = serializers.IntegerField()
    baseGas = serializers.IntegerField()
    gasPrice = serializers.IntegerField()
    gasToken = serializers.CharField(max_length=100)
    refundReceiver = serializers.CharField(max_length=100)
    signatures = serializers.CharField(max_length=10000)
    # , to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, signatures

    def create(self, validated_data):
        return validated_data
