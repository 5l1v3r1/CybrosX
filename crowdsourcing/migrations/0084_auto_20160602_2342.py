# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-02 23:42
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsourcing', '0083_auto_20160602_1943'),
    ]

    operations = [
        migrations.AlterField(
            model_name='taskworker',
            name='task',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_workers', to='crowdsourcing.Task'),
        ),
        migrations.AlterField(
            model_name='taskworker',
            name='worker',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='task_workers', to=settings.AUTH_USER_MODEL),
        ),
    ]