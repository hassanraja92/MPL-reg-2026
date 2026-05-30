from django.contrib import admin, messages
from django.urls import path
from django.shortcuts import redirect
from django.utils.html import format_html
from .models import Player


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'mobile_number', 'playing_role', 'district', 'is_approved', 'created_at')
    list_filter = ('playing_role', 'district', 'is_approved')
    search_fields = ('full_name', 'mobile_number', 'district')
    readonly_fields = ('profile_preview',)
    actions = ['delete_players']
    actions_on_top = True
    actions_on_bottom = False

    def delete_players(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        messages.success(request, f"Successfully deleted {count} player(s).")
    delete_players.short_description = 'Delete selected players'

    def profile_preview(self, obj):
        if obj.profile_photo:
            return format_html('<img src="{}" style="height:100px;"/>', obj.profile_photo.url)
        return '-'

    profile_preview.short_description = 'Profile Photo'
