from django.db import OperationalError
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.paginator import Paginator
from django.http import HttpResponse
from django.urls import reverse
from .forms import PlayerRegistrationForm
from .models import Player
import csv


def register_player(request):
    if request.method == 'POST':
        form = PlayerRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, 'Registration submitted successfully.')
            return redirect('player_registration:success')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = PlayerRegistrationForm()
    return render(request, 'player_registration/register.html', {'form': form})


def registration_success(request):
    return render(request, 'player_registration/success.html')


def admin_login_view(request):
    if request.user.is_authenticated:
        return redirect('player_registration:dashboard')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None and user.is_staff:
            login(request, user)
            return redirect('player_registration:dashboard')
        messages.error(request, 'Invalid credentials or not an admin user.')
    return render(request, 'player_registration/admin_login.html')


def admin_logout_view(request):
    logout(request)
    return redirect('player_registration:admin_login')


def staff_required(view_func):
    decorated = login_required(user_passes_test(lambda u: u.is_staff)(view_func))
    return decorated


def player_table_unavailable(request):
    return render(request, 'player_registration/db_unavailable.html')


def safe_player_query(func):
    def wrapper(request, *args, **kwargs):
        try:
            return func(request, *args, **kwargs)
        except OperationalError:
            return player_table_unavailable(request)
    return wrapper


@staff_required
@safe_player_query
def dashboard(request):
    total = Player.objects.count()
    approved = Player.objects.filter(is_approved=True).count()
    pending = total - approved
    recent = Player.objects.order_by('-created_at')[:5]
    return render(request, 'player_registration/dashboard.html', {'total': total, 'approved': approved, 'pending': pending, 'recent': recent})


@staff_required
@safe_player_query
def player_list(request):
    qs = Player.objects.all().order_by('-created_at')
    q = request.GET.get('q')
    role = request.GET.get('role')
    district = request.GET.get('district')
    start = request.GET.get('start')
    end = request.GET.get('end')
    if q:
        qs = qs.filter(full_name__icontains=q) | qs.filter(mobile_number__icontains=q)
    if role:
        qs = qs.filter(playing_role=role)
    if district:
        qs = qs.filter(district__icontains=district)
    if start:
        qs = qs.filter(created_at__date__gte=start)
    if end:
        qs = qs.filter(created_at__date__lte=end)

    paginator = Paginator(qs, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, 'player_registration/player_list.html', {'page_obj': page_obj})


@staff_required
@safe_player_query
def player_detail(request, pk):
    player = get_object_or_404(Player, pk=pk)
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'approve':
            player.is_approved = True
            player.save()
            messages.success(request, 'Player approved.')
        elif action == 'reject':
            player.is_approved = False
            player.save()
            messages.success(request, 'Player rejected.')
        elif action == 'delete':
            player.delete()
            messages.success(request, 'Player deleted.')
            return redirect('player_registration:player_list')
        return redirect('player_registration:player_detail', pk=player.pk)
    return render(request, 'player_registration/player_detail.html', {'player': player})


@staff_required
@safe_player_query
def player_edit(request, pk):
    player = get_object_or_404(Player, pk=pk)
    if request.method == 'POST':
        form = PlayerRegistrationForm(request.POST, request.FILES, instance=player)
        if form.is_valid():
            form.save()
            messages.success(request, 'Player updated.')
            return redirect('player_registration:player_detail', pk=player.pk)
    else:
        form = PlayerRegistrationForm(instance=player)
    return render(request, 'player_registration/player_edit.html', {'form': form, 'player': player})


@staff_required
@safe_player_query
def player_delete(request, pk):
    player = get_object_or_404(Player, pk=pk)
    if request.method == 'POST':
        player.delete()
        messages.success(request, 'Player deleted.')
        return redirect('player_registration:player_list')
    return render(request, 'player_registration/player_delete.html', {'player': player})


@staff_required
@safe_player_query
def export_players_csv(request):
    qs = Player.objects.all().order_by('-created_at')
    ids = request.GET.get('ids')
    q = request.GET.get('q')
    if ids:
        id_list = [int(x) for x in ids.split(',') if x.strip().isdigit()]
        qs = qs.filter(id__in=id_list)
    if q:
        qs = qs.filter(full_name__icontains=q) | qs.filter(mobile_number__icontains=q)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="mpl2026_players.csv"'
    writer = csv.writer(response)
    header = [
        'id', 'full_name', 'mobile_number', 'email', 'date_of_birth', 'age', 'gender', 'address', 'district', 'state',
        'playing_role', 'batting_style', 'bowling_style',
        'profile_photo', 'emergency_contact_name', 'emergency_contact_number',
        'is_approved', 'created_at'
    ]
    writer.writerow(header)
    for p in qs:
        writer.writerow([
            p.id, p.full_name, p.mobile_number, p.email, p.date_of_birth, p.age, p.get_gender_display() if p.gender else p.gender,
            p.address, p.district, p.state, p.playing_role, p.batting_style, p.bowling_style,
            p.profile_photo.url if p.profile_photo else '',
            p.emergency_contact_name, p.emergency_contact_number, p.is_approved, p.created_at,
        ])
    return response
