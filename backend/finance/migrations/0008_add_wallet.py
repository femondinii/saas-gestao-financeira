from decimal import Decimal
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models.functions import Lower


def create_default_wallets(apps, schema_editor):
    User = apps.get_model(settings.AUTH_USER_MODEL)
    Wallet = apps.get_model('finance', 'Wallet')
    Transaction = apps.get_model('finance', 'Transaction')
    for user in User.objects.all():
        w = Wallet.objects.create(
            user=user,
            name="Carteira Principal",
            kind="checking",
            initial_balance=Decimal("0.00"),
            color="#3B82F6",
        )
        Transaction.objects.filter(user=user, wallet__isnull=True).update(wallet=w)


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0007_category_name_ci_unique'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Wallet',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('name', models.CharField(max_length=60)),
                ('kind', models.CharField(
                    max_length=20,
                    choices=[
                        ('checking', 'Conta corrente'),
                        ('savings', 'Poupança'),
                        ('cash', 'Dinheiro'),
                        ('credit', 'Cartão de crédito'),
                        ('other', 'Outros'),
                    ],
                    default='checking'
                )),
                ('initial_balance', models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))),
                ('color', models.CharField(max_length=7, default='#3B82F6')),
                ('is_archived', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=django.db.models.deletion.CASCADE, related_name='wallets')),
            ],
            options={'ordering': ['name']},
        ),
        migrations.AddConstraint(
            model_name='wallet',
            constraint=models.UniqueConstraint(Lower('name'), 'user', name='uniq_wallet_name_per_user_insensitive'),
        ),

        migrations.AddField(
            model_name='transaction',
            name='wallet',
            field=models.ForeignKey(
                to='finance.wallet',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='transactions',
                null=True, blank=True,
            ),
        ),

        migrations.RunPython(create_default_wallets, migrations.RunPython.noop),

        migrations.AlterField(
            model_name='transaction',
            name='wallet',
            field=models.ForeignKey(
                to='finance.wallet',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='transactions',
            ),
        ),

        migrations.RemoveField(model_name='transaction', name='status'),
        migrations.RemoveField(model_name='transaction', name='notes'),

        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['wallet', 'date'], name='txn_wallet_date_idx'),
        ),
    ]
