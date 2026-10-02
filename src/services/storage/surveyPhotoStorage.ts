import { Directory, File, Paths } from 'expo-file-system';

const PHOTO_DIR_NAME = 'survey-photos';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

function photoDir(): Directory {
  return new Directory(Paths.document, PHOTO_DIR_NAME);
}

/**
 * Keeps survey photos in the app's document directory until they are uploaded.
 * The image picker returns a cache URI that the OS may purge at any time.
 */
export const surveyPhotoStorage = {
  /** Copies the picked photo into persistent storage and returns its new URI */
  async persist(sourceUri: string, captureId: string, mimeType = 'image/jpeg'): Promise<string> {
    const dir = photoDir();
    dir.create({ intermediates: true, idempotent: true });

    const ext = EXT_BY_MIME[mimeType] || 'jpg';
    const target = new File(dir, `${captureId}.${ext}`);
    if (target.exists) {
      target.delete();
    }
    await new File(sourceUri).copy(target);
    return target.uri;
  },

  exists(uri: string): boolean {
    try {
      return new File(uri).exists;
    } catch {
      return false;
    }
  },

  /** Deletes a photo, but only if it lives in our own survey photo directory */
  remove(uri?: string | null) {
    if (!uri || !uri.startsWith(photoDir().uri)) return;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('[surveyPhotoStorage] Could not delete photo:', uri, e);
    }
  },
};
