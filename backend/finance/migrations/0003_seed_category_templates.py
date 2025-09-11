from django.db import migrations

DATA = [
    ("Alimentação", "expense", 1),
    ("Moradia",     "expense", 2),
    ("Transporte",  "expense", 3),
    ("Saúde",       "expense", 4),
    ("Renda",       "income",  5),
]

def forwards(apps, schema_editor):
    CategoryTemplate = apps.get_model("finance", "CategoryTemplate")
    rows = [
        CategoryTemplate(name=n, kind=k, order=o, is_active=True)
        for (n, k, o) in DATA
    ]
    CategoryTemplate.objects.bulk_create(rows, ignore_conflicts=True)

def backwards(apps, schema_editor):
    CategoryTemplate = apps.get_model("finance", "CategoryTemplate")
    names = [n for (n, _, __) in DATA]
    CategoryTemplate.objects.filter(name__in=names).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0002_categorytemplate"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
