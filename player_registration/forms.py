from django import forms
from .models import Player


class PlayerRegistrationForm(forms.ModelForm):
    class Meta:
        model = Player
        fields = [
            'full_name', 'mobile_number', 'email', 'date_of_birth', 'age', 'gender',
            'address', 'district', 'state', 'playing_role', 'batting_style',
            'bowling_style',
            'profile_photo', 'emergency_contact_name',
            'emergency_contact_number'
        ]
        widgets = {
            'date_of_birth': forms.DateInput(attrs={'type': 'date'}),
            'address': forms.Textarea(attrs={'rows': 2}),
            'address': forms.Textarea(attrs={'rows': 2}),
        }

    def clean_mobile_number(self):
        mobile = self.cleaned_data.get('mobile_number')
        if Player.objects.filter(mobile_number=mobile).exists():
            raise forms.ValidationError('A player with this mobile number is already registered.')
        return mobile
