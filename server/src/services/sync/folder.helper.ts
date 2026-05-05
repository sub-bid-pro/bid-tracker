import { findOrCreateFolder } from '../drive.service';

/**
 * Ensures the nested folder structure exists and returns the IDs.
 * Structure: [Root Folder] / [Year] / [Project Name] / [Invitations | Submissions]
 */
export const getProjectFolderStructure = async (
  projectName: string,
  emailType: 'ITB' | 'SUBMISSION',
  rootFolderName: string = 'Bid Tracker App',
) => {
  const currentYear = new Date().getFullYear().toString();
  const safeJobName = (projectName || 'Unknown Project').replace(/[/\\?%*:|"<>]/g, '-');
  const typeFolderName = emailType === 'ITB' ? 'Invitations' : 'Submissions';

  const rootId = await findOrCreateFolder(rootFolderName);
  const yearId = await findOrCreateFolder(currentYear, rootId);
  const projectFolderId = await findOrCreateFolder(safeJobName, yearId);
  const typeFolderId = await findOrCreateFolder(typeFolderName, projectFolderId);

  return { projectFolderId, typeFolderId };
};
