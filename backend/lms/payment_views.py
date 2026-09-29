import json
import stripe
from decimal import Decimal
from django.conf import settings
from django.core.paginator import Paginator
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from comms.utils import send_ops_email
from .models import StripePayment, Order
from .payment_serializers import (
    CreatePaymentIntentSerializer,
    PaymentIntentResponseSerializer,
    ConfirmPaymentSerializer,
    ConfirmPaymentResponseSerializer,
    PaymentHistorySerializer,
    OrderDetailSerializer,
)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class CreatePaymentIntentView(APIView):
    """Create a Stripe payment intent"""

    permission_classes = [AllowAny]
    throttle_scope = "public_checkout"

    def post(self, request):
        serializer = CreatePaymentIntentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = serializer.validated_data["amount"]
        items = serializer.validated_data["items"]
        metadata = serializer.validated_data.get("metadata", {})
        user = request.user if request.user.is_authenticated else None

        try:
            # Convert amount to cents for Stripe
            amount_cents = int(amount * 100)

            # Convert items to serializable format (convert Decimal to string)
            items_serializable = []
            for item in items:
                items_serializable.append(
                    {
                        "id": str(item["id"]),
                        "name": str(item["name"]),
                        "price": str(item["price"]),
                        "quantity": int(item["quantity"]),
                    }
                )

            metadata_serializable = {
                str(key): str(value)
                for key, value in metadata.items()
                if value not in (None, "")
            }

            stripe_metadata = {
                "items": json.dumps(items_serializable),
                **metadata_serializable,
            }
            if user:
                stripe_metadata["user_id"] = str(user.id)

            # Create payment intent
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                metadata=stripe_metadata,
            )

            # Persist authenticated payment intents for order history.
            if user:
                StripePayment.objects.create(
                    user=user,
                    stripe_payment_intent_id=payment_intent.id,
                    amount=amount,
                    currency="usd",
                    status=payment_intent.status,
                    metadata={"items": items_serializable, **metadata_serializable},
                )

            # Notify ops for bookkeeping
            customer_label = (
                user.email
                if user
                else metadata_serializable.get("customer_email", "guest checkout")
            )
            send_ops_email(
                subject="Payment Intent Created",
                message=(
                    f"User: {customer_label}\n"
                    f"Amount: ${amount}\n"
                    f"Currency: USD\n"
                    f"Items: {items_serializable}\n"
                    f"Stripe Intent: {payment_intent.id}"
                ),
            )

            response_serializer = PaymentIntentResponseSerializer(
                {
                    "client_secret": payment_intent.client_secret,
                    "payment_intent_id": payment_intent.id,
                    "amount": amount_cents,
                    "currency": "usd",
                    "status": payment_intent.status,
                }
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except stripe.error.StripeError as e:
            return Response(
                {"error": "Stripe error", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": "Server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ConfirmPaymentView(APIView):
    """Confirm payment and create order"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConfirmPaymentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Validation failed", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stripe_payment_intent_id = serializer.validated_data["stripe_payment_intent_id"]
        items = serializer.validated_data["items"]
        total = serializer.validated_data["total"]
        payment_status = serializer.validated_data["payment_status"]

        try:
            # Verify payment with Stripe
            payment_intent = stripe.PaymentIntent.retrieve(stripe_payment_intent_id)

            if payment_intent.status != "succeeded":
                return Response(
                    {"error": "Payment not succeeded"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Convert items to serializable format (convert Decimal to string)
            items_serializable = []
            for item in items:
                items_serializable.append(
                    {
                        "id": str(item["id"]),
                        "name": str(item["name"]),
                        "price": str(item["price"]),
                        "quantity": int(item["quantity"]),
                    }
                )

            # Get or create payment record
            payment, created = StripePayment.objects.get_or_create(
                stripe_payment_intent_id=stripe_payment_intent_id,
                defaults={
                    "user": request.user,
                    "amount": total,
                    "currency": "usd",
                    "status": "succeeded",
                    "metadata": {"items": items_serializable},
                },
            )

            # Verify payment belongs to current user
            if payment.user != request.user:
                return Response(
                    {"error": "Unauthorized access to payment"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Update payment status
            payment.status = "succeeded"
            payment.save()

            # Create order
            order = Order.objects.create(
                user=request.user,
                stripe_payment=payment,
                items=items_serializable,
                subtotal=total,
                tax=Decimal("0.00"),
                total=total,
                status="completed",
            )

            # Ops notification for completed orders
            send_ops_email(
                subject="Payment Completed",
                message=(
                    f"User: {request.user.email}\n"
                    f"Order ID: {order.id}\n"
                    f"Total: ${total}\n"
                    f"Items: {items_serializable}\n"
                    f"Stripe Intent: {stripe_payment_intent_id}"
                ),
            )

            response_serializer = ConfirmPaymentResponseSerializer(
                {
                    "order_id": str(order.id),
                    "status": "completed",
                    "payment_status": "succeeded",
                    "payment_intent_id": stripe_payment_intent_id,
                    "items": items_serializable,
                    "subtotal": str(total),
                    "tax": "0.00",
                    "total": str(total),
                    "created_at": order.created_at,
                }
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except stripe.error.StripeError as e:
            return Response(
                {"error": "Stripe error", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except StripePayment.DoesNotExist:
            return Response(
                {"error": "Payment not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": "Server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PaymentHistoryView(APIView):
    """Get payment history for current user"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page = int(request.query_params.get("page", 1))
            limit = int(request.query_params.get("limit", 20))

            # Query payments for current user
            payments_qs = StripePayment.objects.filter(user=request.user).order_by(
                "-created_at"
            )
            total_count = payments_qs.count()

            # Paginate
            paginator = Paginator(payments_qs, limit)
            payments_page = paginator.get_page(page)

            # Serialize
            serializer = PaymentHistorySerializer(payments_page, many=True)

            response_data = {
                "payments": serializer.data,
                "total_count": total_count,
                "page": page,
                "limit": limit,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OrderDetailView(APIView):
    """Get specific order details"""

    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)

            # Verify authorization
            if order.user != request.user:
                return Response(
                    {"error": "Unauthorized access to order"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = OrderDetailSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": "Server error", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
