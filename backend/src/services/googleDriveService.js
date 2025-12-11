const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = google.drive({
      version: 'v3',
      auth: new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      )
    });
  }

  setCredentials(tokens) {
    this.drive.auth.setCredentials(tokens);
  }

  async uploadFile(filePath, folderId = null) {
    try {
      const fileMetadata = {
        name: path.basename(filePath),
        parents: folderId ? [folderId] : null
      };

      const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  async createFolder(folderName, parentFolderId = null) {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : []
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder in Google Drive:', error);
      throw error;
    }
  }
}

module.exports = new GoogleDriveService();
