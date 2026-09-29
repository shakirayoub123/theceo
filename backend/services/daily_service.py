import os
import requests
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class DailyService:
    """Service for integrating with Daily.co video conferencing"""

    def __init__(self):
        self.api_key = os.getenv("DAILY_API_KEY")
        self.rest_domain = os.getenv("DAILY_REST_DOMAIN", "https://api.daily.co/v1")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        logger.info(
            f"DailyService initialized with API key present: {bool(self.api_key)}"
        )
        if self.api_key:
            logger.info(f"API key starts with: {self.api_key[:10]}...")
        else:
            logger.error("DAILY_API_KEY environment variable not set!")

    def create_room(self, room_name=None, properties=None):
        """
        Create a Daily.co room

        Args:
            room_name (str): Custom room name, if None generates UUID
            properties (dict): Room properties

        Returns:
            dict: Room data from Daily.co
        """
        if not self.api_key:
            raise ValueError("DAILY_API_KEY environment variable not set")

        url = f"{self.rest_domain}/rooms"

        # Default room properties
        default_properties = {
            "max_participants": 10,
            "enable_chat": True,
            "enable_screenshare": True,
            "start_video_off": False,
            "start_audio_off": False,
            "owner_only_broadcast": False,
            "enable_recording": "cloud",  # Allow cloud recording
            "eject_at_room_exp": True,
            "eject_after_elapsed": 3600,  # 1 hour
            "lang": "en",
        }

        # Merge with provided properties
        if properties:
            default_properties.update(properties)

        data = {
            "name": room_name,
            "privacy": "private",  # Private rooms require token
            "properties": default_properties,
        }

        try:
            response = requests.post(url, json=data, headers=self.headers)
            response.raise_for_status()

            room_data = response.json()
            logger.info(f"Created Daily.co room: {room_data.get('name')}")

            # If the API doesn't return a URL, construct it
            if "url" not in room_data:
                room_name = room_data.get("name")
                domain = os.getenv("DAILY_DOMAIN", "daily.co")
                room_data["url"] = f"https://{domain}/{room_name}"
                logger.info(f"Constructed room URL: {room_data['url']}")

            return room_data

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create Daily.co room: {e}")
            if hasattr(e, "response") and e.response:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            raise

    def get_room_url(self, room_name):
        """
        Get the room URL for joining

        Args:
            room_name (str): Room name

        Returns:
            str: Room URL
        """
        # Get the domain from environment or use the default Daily.co domain
        domain = os.getenv("DAILY_DOMAIN")
        if not domain:
            # For Daily.co, the default domain is usually your custom domain
            # If not set, we'll use the standard daily.co domain
            # The room URL should be https://yourdomain.daily.co/roomname
            # But since we don't have a custom domain, let's use the API response URL
            # Actually, Daily.co API returns the full URL in the room creation response
            # So this method should not be used for URL construction
            logger.warning(
                "DAILY_DOMAIN not set, room URL should come from API response"
            )
            return f"https://daily.co/{room_name}"

        return f"https://{domain}/{room_name}"

    def create_room_token(
        self, room_name, user_id, user_name, is_owner=False, properties=None
    ):
        """
        Create a room token for a participant

        Args:
            room_name (str): Room name
            user_id (str): User ID
            user_name (str): User display name
            is_owner (bool): Whether user is room owner
            properties (dict): Token properties

        Returns:
            str: Room token
        """
        url = f"{self.rest_domain}/meeting-tokens"

        # Default token properties
        default_properties = {
            "room_name": room_name,
            "is_owner": is_owner,
            "user_name": user_name,
            "user_id": str(user_id),  # Ensure user_id is a string
            "enable_screenshare": True,
            "start_video_off": False,
            "start_audio_off": False,
        }

        # Add recording capability only for owners
        if is_owner:
            default_properties["enable_recording"] = "cloud"

        # Set token expiration (24 hours from now)
        import time

        default_properties["exp"] = int(time.time()) + 86400  # 24 hours

        # Merge with provided properties
        if properties:
            default_properties.update(properties)

        data = {"properties": default_properties}

        try:
            response = requests.post(url, json=data, headers=self.headers)
            response.raise_for_status()

            token_data = response.json()
            logger.info(f"Created room token for user {user_id} in room {room_name}")
            return token_data.get("token")

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create room token: {e}")
            if hasattr(e, "response") and e.response:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            raise

    def delete_room(self, room_name):
        """
        Delete a Daily.co room

        Args:
            room_name (str): Room name to delete
        """
        url = f"{self.rest_domain}/rooms/{room_name}"

        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()

            logger.info(f"Deleted Daily.co room: {room_name}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete Daily.co room {room_name}: {e}")
            raise

    def get_room_info(self, room_name):
        """
        Get room information

        Args:
            room_name (str): Room name

        Returns:
            dict: Room information
        """
        url = f"{self.rest_domain}/rooms/{room_name}"

        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get room info for {room_name}: {e}")
            raise

    def start_recording(self, room_name, recording_properties=None):
        """
        Start recording a room

        Args:
            room_name (str): Room name
            recording_properties (dict): Recording properties

        Returns:
            dict: Recording information
        """
        url = f"{self.rest_domain}/rooms/{room_name}/recordings/start"

        default_properties = {
            "layout": {"preset": "default"},
            "streamId": f"recording_{room_name}_{int(timezone.now().timestamp())}",
        }

        if recording_properties:
            default_properties.update(recording_properties)

        try:
            response = requests.post(url, json=default_properties, headers=self.headers)
            response.raise_for_status()

            recording_data = response.json()
            logger.info(f"Started recording for room {room_name}")
            return recording_data

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to start recording for room {room_name}: {e}")
            raise

    def stop_recording(self, room_name, recording_id):
        """
        Stop recording a room

        Args:
            room_name (str): Room name
            recording_id (str): Recording ID
        """
        url = f"{self.rest_domain}/rooms/{room_name}/recordings/{recording_id}/stop"

        try:
            response = requests.post(url, headers=self.headers)
            response.raise_for_status()

            logger.info(f"Stopped recording {recording_id} for room {room_name}")

        except requests.exceptions.RequestException as e:
            logger.error(
                f"Failed to stop recording {recording_id} for room {room_name}: {e}"
            )
            raise


# Singleton instance
daily_service = DailyService()
