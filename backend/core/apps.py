# core/apps.py

from django.apps import AppConfig
from django.db.models.signals import post_migrate
from .tasks import encrypt_model_if_needed


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        post_migrate.connect(run_encryption_on_startup, sender=self)
        encrypt_model_if_needed()


def run_encryption_on_startup(sender, **kwargs):
    """
    A helper function that will run encrypt_model_if_needed after Django has finished migrating.
    """
    print("In run_encryption_on_startup function")

