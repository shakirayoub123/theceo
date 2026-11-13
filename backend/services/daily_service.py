import os
import requests
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


class DailyService:
    """Service for integrating with Daily.co video conferencing"""

    def __init__(self):
        self.rest_domain = os.getenv("DAILY_REST_DOMAIN", "https://api.daily.co/v1")

    @property
    def api_key(self):
        return os.getenv("DAILY_API_KEY")

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

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
            logger.warning(
                "DAILY_API_KEY environment variable not set. Generating dev fallback room."
            )
            fallback_name = room_name or f"room-{int(timezone.now().timestamp())}"
            domain = os.getenv("DAILY_DOMAIN", "theceoinfluencers.daily.co")
            return {
                "name": fallback_name,
                "url": f"https://{domain}/{fallback_name}",
            }

        url = f"{self.rest_domain}/rooms"

        # Default room properties
        default_properties = {
            "max_participants": 10,
            "enable_chat": True,
            "enable_screenshare": True,
            "start_video_off": False,
            "start_audio_off": False,
            "owner_only_broadcast": False,
            "eject_at_room_exp": True,
            "eject_after_elapsed": 3600,  # 1 hour
            "lang": "en",
        }
        if os.getenv("DAILY_ENABLE_CLOUD_RECORDING", "false").lower() == "true":
            default_properties["enable_recording"] = "cloud"

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
                domain = os.getenv("DAILY_DOMAIN", "theceoinfluencers.daily.co")
                room_data["url"] = f"https://{domain}/{room_name}"
                logger.info(f"Constructed room URL: {room_data['url']}")

            return room_data

        except requests.exceptions.RequestException as e:
            if (
                hasattr(e, "response")
                and e.response is not None
                and "enable_recording" in (e.response.text or "")
                and "enable_recording" in default_properties
            ):
                logger.warning(
                    "Daily plan does not support cloud recording. Retrying without enable_recording..."
                )
                default_properties.pop("enable_recording", None)
                data["properties"] = default_properties
                try:
                    retry_response = requests.post(
                        url, json=data, headers=self.headers
                    )
                    retry_response.raise_for_status()
                    room_data = retry_response.json()
                    logger.info(
                        f"Created Daily.co room on retry: {room_data.get('name')}"
                    )
                    if "url" not in room_data:
                        r_name = room_data.get("name")
                        domain = os.getenv("DAILY_DOMAIN", "theceoinfluencers.daily.co")
                        room_data["url"] = f"https://{domain}/{r_name}"
                    return room_data
                except Exception as retry_err:
                    logger.error(
                        f"Failed retry room creation without recording: {retry_err}"
                    )
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
        if not self.api_key:
            logger.warning(
                "DAILY_API_KEY environment variable not set. Skipping room token generation."
            )
            return None

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

        # Add recording capability only for owners when enabled
        if is_owner and os.getenv("DAILY_ENABLE_CLOUD_RECORDING", "false").lower() == "true":
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
