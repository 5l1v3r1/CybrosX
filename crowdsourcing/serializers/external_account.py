from crowdsourcing import models
from rest_framework import serializers
from crowdsourcing.viewsets.google_drive import GoogleDriveUtil


class ExternalAccountSerializer(serializers.ModelSerializer):
    drive_contents = serializers.SerializerMethodField()

    class Meta:
        model = models.ExternalAccount
        read_only_fields = ('drive_contents')

    def get_drive_contents(self, request):
        drive_contents = []
        account_set = models.GoogleCredential.objects.filter(account=self.instance)
        for account_info in account_set:
            account = account_info.account
            if account.type == 'GOOGLEDRIVE':
                contents = GoogleDriveUtil.list_files_in_folder(request.folder_id, q=None)
                drive_contents.append([account.info, contents])
        return drive_contents
