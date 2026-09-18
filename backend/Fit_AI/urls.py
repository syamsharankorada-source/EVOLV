from django.contrib import admin
from django.urls import path, include
from users.views import index
from wellness.views import mobile_connect_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='index'),
    path('mobile-connect/<str:token>/', mobile_connect_view, name='mobile-connect'),
    path('api/auth/', include('users.urls')),
    path('api/profile/', include('users.profile_urls')),
    path('api/kang/', include('kang.urls')),
    path('api/fitness/', include('fitness.urls')),
    path('api/nutrition/', include('fitness.nutrition_urls')),
    path('api/wellness/', include('wellness.urls')),
    path('api/community/', include('community.urls')),
    path('api/neuro/', include('neuro_readiness.urls')),
]