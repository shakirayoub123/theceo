from rest_framework import serializers
from .models import StripePayment, Order


class PaymentItemSerializer(serializers.Serializer):
    """Serializer for payment items"""

    id = serializers.CharField()
    name = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField(default=1)

    def to_representation(self, instance):
        """Convert Decimal to string for JSON serialization"""
        ret = super().to_representation(instance)
        if "price" in ret and ret["price"] is not None:
            ret["price"] = str(ret["price"])
        return ret


class CreatePaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating payment intent"""

    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = PaymentItemSerializer(many=True)
    metadata = serializers.DictField(required=False)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Items list cannot be empty")
        return value


class PaymentIntentResponseSerializer(serializers.Serializer):
    """Serializer for payment intent response"""

    client_secret = serializers.CharField()
    payment_intent_id = serializers.CharField()
    amount = serializers.IntegerField()
    currency = serializers.CharField()
    status = serializers.CharField()


class ConfirmPaymentSerializer(serializers.Serializer):
    """Serializer for confirming payment"""

    stripe_payment_intent_id = serializers.CharField()
    items = PaymentItemSerializer(many=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_status = serializers.CharField()


class OrderItemSerializer(serializers.Serializer):
    """Serializer for order items"""

    id = serializers.CharField()
    name = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField()


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order"""

    items = OrderItemSerializer(many=True, read_only=False)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "items",
            "subtotal",
            "tax",
            "total",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ConfirmPaymentResponseSerializer(serializers.Serializer):
    """Serializer for confirm payment response"""

    order_id = serializers.CharField()
    status = serializers.CharField()
    payment_status = serializers.CharField()
    payment_intent_id = serializers.CharField()
    items = OrderItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    created_at = serializers.DateTimeField()


class PaymentHistorySerializer(serializers.ModelSerializer):
    """Serializer for payment history"""

    items = serializers.SerializerMethodField()

    class Meta:
        model = StripePayment
        fields = [
            "id",
            "stripe_payment_intent_id",
            "amount",
            "status",
            "created_at",
            "items",
        ]
        read_only_fields = fields

    def get_items(self, obj):
        """Get items from related order"""
        try:
            if hasattr(obj, "order") and obj.order:
                return obj.order.items
        except Order.DoesNotExist:
            pass
        return []


class PaymentHistoryResponseSerializer(serializers.Serializer):
    """Serializer for payment history response"""

    payments = PaymentHistorySerializer(many=True)
    total_count = serializers.IntegerField()
    page = serializers.IntegerField()
    limit = serializers.IntegerField()


class OrderDetailSerializer(serializers.ModelSerializer):
    """Serializer for order details"""

    payment_intent_id = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "payment_intent_id",
            "items",
            "subtotal",
            "tax",
            "total",
            "user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_payment_intent_id(self, obj):
        """Get payment intent ID from related payment"""
        if obj.payment:
            return obj.payment.stripe_payment_intent_id
        return None

    def get_items(self, obj):
        """Parse items JSON"""
        if isinstance(obj.items, str):
            import json

            return json.loads(obj.items)
        return obj.items

    def get_user(self, obj):
        """Get user information"""
        return {
            "id": str(obj.user.id),
            "email": obj.user.email,
            "name": f"{obj.user.first_name} {obj.user.last_name}".strip()
            or obj.user.username,
        }
