# -*- coding: utf-8 -*-
# Generated by Django 1.11.3 on 2017-11-07 20:48
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('crowdsourcing', '0010_merge_20171030_1751'),
    ]

    operations = [
        migrations.AddField(
            model_name='templateitem',
            name='group_id',
            field=models.IntegerField(db_index=True, null=True),
        ),
        migrations.AddField(
            model_name='templateitem',
            name='revised_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='templateitem',
            name='revision_log',
            field=models.CharField(blank=True, max_length=512, null=True),
        ),
    ]