from django.db import migrations, models
from django.db.models.functions import Lower

class Migration(migrations.Migration):

    dependencies = [
        ("finance", "0009_remove_transaction_finance_tra_user_id_f69cf8_idx_and_more"),
    ]

    operations = [
        # Se existir a constraint antiga, remove (nome mais comum)
        migrations.RunSQL(
            sql='ALTER TABLE "finance_wallet" DROP CONSTRAINT IF EXISTS "uniq_wallet_name_per_user_insensitive";',
            reverse_sql='''
                ALTER TABLE "finance_wallet"
                ADD CONSTRAINT "uniq_wallet_name_per_user_insensitive"
                UNIQUE (user_id, (LOWER(name)));
            ''',
        ),
        # Garante a nova constraint condicional (apenas carteiras ativas)
        migrations.AddConstraint(
            model_name="wallet",
            constraint=models.UniqueConstraint(
                Lower("name"), "user",
                condition=models.Q(is_archived=False),
                name="uniq_active_wallet_name_per_user_insensitive",
            ),
        ),
    ]
