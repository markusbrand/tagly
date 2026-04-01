import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tagly.settings")

app = Celery("tagly")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "check-overdue-borrows": {
        "task": "notifications.tasks.check_overdue_borrows",
        "schedule": crontab(minute=0),
    },
}
