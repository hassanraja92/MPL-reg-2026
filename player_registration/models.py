from django.db import models
from django.utils import timezone


class Player(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    ROLE_CHOICES = [
        ('Batsman', 'Batsman'),
        ('Bowler', 'Bowler'),
        ('All-Rounder', 'All-Rounder'),
        ('Wicket Keeper', 'Wicket Keeper'),
    ]

    full_name = models.CharField(max_length=255)
    mobile_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    address = models.TextField(blank=True)
    district = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=120, blank=True)
    playing_role = models.CharField(max_length=32, choices=ROLE_CHOICES, blank=True)
    batting_style = models.CharField(max_length=64, blank=True)
    bowling_style = models.CharField(max_length=64, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_number = models.CharField(max_length=20, blank=True)

    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.mobile_number})"
