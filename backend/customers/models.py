from django.db import models


class Customer(models.Model):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    address = models.TextField()
    postal_code = models.CharField(max_length=20)
    city = models.CharField(max_length=255)
    country = models.CharField(max_length=2, help_text="ISO 3166-1 alpha-2 code")
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["last_name", "first_name"]
        verbose_name = "customer"
        verbose_name_plural = "customers"
        indexes = [
            models.Index(fields=["last_name", "first_name"], name="idx_customer_name"),
            models.Index(fields=["email"], name="idx_customer_email"),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
