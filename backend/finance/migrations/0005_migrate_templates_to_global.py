from django.db import migrations

FALLBACK_DATA = [
    ("Alimentação", "expense"),
    ("Moradia",     "expense"),
    ("Transporte",  "expense"),
    ("Saúde",       "expense"),
    ("Educação",    "expense"),
    ("Entretenimento", "expense"),
    ("Renda",       "income"),
]

def forwards(apps, schema_editor):
    Category = apps.get_model("finance", "Category")
    db = schema_editor.connection.alias

    try:
        CategoryTemplate = apps.get_model("finance", "CategoryTemplate")
    except Exception:
        CategoryTemplate = None

    rows = []
    if CategoryTemplate is not None:
        qs = (
            CategoryTemplate.objects.using(db)
            .filter(is_active=True)
            .order_by("order", "name")
        )
        for t in qs:
            rows.append(
                Category(user=None, name=t.name, kind=t.kind, is_system=True)
            )
    else:
        for name, kind in FALLBACK_DATA:
            rows.append(
                Category(user=None, name=name, kind=kind, is_system=True)
            )

    if rows:
        Category.objects.using(db).bulk_create(rows, ignore_conflicts=True)

def backwards(apps, schema_editor):
    Category = apps.get_model("finance", "Category")
    db = schema_editor.connection.alias

    try:
        CategoryTemplate = apps.get_model("finance", "CategoryTemplate")
    except Exception:
        CategoryTemplate = None

    if CategoryTemplate is not None:
        names = list(
            CategoryTemplate.objects.using(db).values_list("name", flat=True)
        )
    else:
        names = [n for n, _ in FALLBACK_DATA]

    if names:
        Category.objects.using(db).filter(user__isnull=True, name__in=names).delete()

class Migration(migrations.Migration):
    dependencies = [
        ("finance", "0004_category_globalize"),
    ]
    operations = [
        migrations.RunPython(forwards, backwards),
    ]
