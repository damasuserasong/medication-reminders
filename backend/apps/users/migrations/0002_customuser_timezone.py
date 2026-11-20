import apps.users.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='timezone',
            field=models.CharField(
                default='UTC',
                max_length=64,
                validators=[apps.users.models.validate_timezone],
                verbose_name='time zone',
            ),
            preserve_default=False,
        ),
    ]
