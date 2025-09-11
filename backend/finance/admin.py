from django.contrib import admin
from .models import Category, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name","user","is_system")
    list_filter = ("name","is_system")
    search_fields = ("name","user__email")

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("user","type","amount","date","category","status")
    list_filter = ("type","status","category")
    search_fields = ("description","notes","user__email")
    date_hierarchy = "date"
