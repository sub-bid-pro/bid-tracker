import { google } from 'googleapis';
import { oauth2Client } from '../lib/google';
import { Readable } from 'stream';

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export const findOrCreateFolder = async (
  folderName: string,
  parentId?: string,
): Promise<string> => {
  const query = parentId
    ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!; // Return existing folder ID
  }

  // Create it if it doesn't exist
  const fileMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) fileMetadata.parents = [parentId];

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return folder.data.id!;
};

export const uploadAttachmentToDrive = async (
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  projectFolderId: string,
) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: [projectFolderId],
  };

  const media = {
    mimeType: mimeType,
    body: stream,
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  return file.data;
};
