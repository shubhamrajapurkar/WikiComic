from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # API endpoints
    path('api/generate/', views.api_generate_comic, name='api_generate_comic'),
    path('api/status/<str:request_id>/', views.api_check_status, name='api_check_status'),
    path('api/comic/<str:comic_id>/', views.api_get_comic, name='api_get_comic'),
    path('api/search/', views.api_search_wikipedia, name='api_search_wikipedia'),
    path('api/options/', views.api_get_options, name='api_get_options'),
    
    # Regular views
    path('', views.home, name='home'),
    path('search/', views.search_wikipedia, name='search_wikipedia'),
    path('options/', views.comic_options, name='comic_options'),
    path('generate/', views.generate_comic, name='generate_comic'),
    path('status/<str:request_id>/', views.check_status, name='check_status'),
    path('comic/<str:comic_id>/', views.view_comic, name='view_comic'),
    path('comic/<str:comic_id>/download/<str:format>/', views.download_comic, name='download_comic'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 