from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # Import the task function
        from .tasks import encrypt_model_if_needed
        
        # Run the function immediately on startup
        encrypt_model_if_needed()


