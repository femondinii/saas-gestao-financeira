from django.contrib import admin
from .models import Category, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name","user","is_system")
    list_filter = ("name","is_system")
    search_fields = ("name","user__email")

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("user","type","amount","date","category")
    list_filter = ("type","category")
    search_fields = ("description","user__email")
    date_hierarchy = "date"
