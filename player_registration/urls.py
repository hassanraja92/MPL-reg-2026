from django.urls import path
from . import views

app_name = 'player_registration'

urlpatterns = [
    path('', views.register_player, name='register'),
    path('success/', views.registration_success, name='success'),
    path('dashboard/login/', views.admin_login_view, name='admin_login'),
    path('dashboard/logout/', views.admin_logout_view, name='admin_logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('dashboard/players/', views.player_list, name='player_list'),
    path('dashboard/players/<int:pk>/', views.player_detail, name='player_detail'),
    path('dashboard/players/<int:pk>/edit/', views.player_edit, name='player_edit'),
    path('dashboard/players/<int:pk>/delete/', views.player_delete, name='player_delete'),
    path('dashboard/players/export/csv/', views.export_players_csv, name='export_players_csv'),
]
