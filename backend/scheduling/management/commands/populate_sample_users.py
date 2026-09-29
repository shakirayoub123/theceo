from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from people.models import Client

User = get_user_model()


class Command(BaseCommand):
    help = "Populate sample users for testing"

    def handle(self, *args, **options):
        # Create sample sales users
        sales_users = [
            {
                "username": "sales1",
                "email": "sales1@example.com",
                "first_name": "Alice",
                "last_name": "Johnson",
                "role": "sales",
            },
            {
                "username": "sales2",
                "email": "sales2@example.com",
                "first_name": "Bob",
                "last_name": "Smith",
                "role": "sales",
            },
        ]

        # Create sample trainers
        trainers = [
            {
                "username": "trainer1",
                "email": "trainer1@example.com",
                "first_name": "John",
                "last_name": "Trainer",
                "role": "trainer",
            },
            {
                "username": "trainer2",
                "email": "trainer2@example.com",
                "first_name": "Sarah",
                "last_name": "Fitness",
                "role": "trainer",
            },
        ]

        # Create sample clients
        clients = [
            {
                "username": "client1",
                "email": "client1@example.com",
                "first_name": "Mike",
                "last_name": "Davis",
                "role": "client",
            },
            {
                "username": "client2",
                "email": "client2@example.com",
                "first_name": "Emma",
                "last_name": "Wilson",
                "role": "client",
            },
            {
                "username": "client3",
                "email": "client3@example.com",
                "first_name": "David",
                "last_name": "Brown",
                "role": "client",
            },
        ]

        created_users = 0
        created_clients = 0

        # Create sales users
        for user_data in sales_users:
            if not User.objects.filter(username=user_data["username"]).exists():
                user = User.objects.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password="password123",
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    is_approved=True,
                )
                created_users += 1
                self.stdout.write(f"Created sales user: {user.username}")

        # Create trainers
        for user_data in trainers:
            if not User.objects.filter(username=user_data["username"]).exists():
                user = User.objects.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password="password123",
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    is_approved=True,
                )
                created_users += 1
                self.stdout.write(f"Created trainer: {user.username}")

        # Create clients and their Client profiles
        for user_data in clients:
            if not User.objects.filter(username=user_data["username"]).exists():
                user = User.objects.create_user(
                    username=user_data["username"],
                    email=user_data["email"],
                    password="password123",
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    role=user_data["role"],
                    is_approved=True,
                )
                created_users += 1

                # Create Client profile
                client_profile = Client.objects.create(
                    user=user,
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    email=user_data["email"],
                    phone="555-0100",
                    meeting_status="pending",
                    program_status="unpaid",
                    contract_status="not_sent",
                )
                created_clients += 1
                self.stdout.write(f"Created client: {user.username}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created {created_users} users and {created_clients} client profiles"
            )
        )
