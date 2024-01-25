import { getRandomId } from './random';
import type { FilesWithId, FileWithId, ImagesPreview } from './types/file';

const IMAGE_EXTENSIONS = [
  'apng',
  'avif',
  'gif',
  'jpg',
  'jpeg',
  'jfif',
  'pjpeg',
  'pjp',
  'png',
  'svg',
  'webp'
] as const;

type ImageExtensions = typeof IMAGE_EXTENSIONS[number];

function isValidImageExtension(
  extension: string
): extension is ImageExtensions {
  return IMAGE_EXTENSIONS.includes(
    extension.split('.').pop()?.toLowerCase() as ImageExtensions
  );
}

function isValidMedia(name: string, size: number): boolean {
  const allowedExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'mp4',
    'mov',
    'avi',
    'mkv'
  ];
  const maxFileSize = 50 * 1024 * 1024; // 50 MB

  const fileExtension = getFileExtension(name);
  return allowedExtensions.includes(fileExtension) && size <= maxFileSize;
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isValidImage(name: string, bytes: number): boolean {
  return isValidImageExtension(name) && bytes < 20 * Math.pow(1024, 2);
}

export function isValidUsername(
  username: string,
  value: string
): string | null {
  if (value.length < 4)
    return 'Your username must be longer than 4 characters.';
  if (value.length > 15)
    return 'Your username must be shorter than 15 characters.';
  if (!/^\w+$/i.test(value))
    return "Your username can only contain letters, numbers and '_'.";
  if (!/[a-z]/i.test(value)) return 'Include a non-number character.';
  if (value === username) return 'This is your current username.';

  return null;
}

type ImagesData = {
  imagesPreviewData: ImagesPreview;
  selectedImagesData: FilesWithId;
};

export function getImagesData(
  files: FileList | null,
  currentFiles?: number
): ImagesData | null {
  if (!files || !files.length) return null;

  const singleEditingMode = currentFiles === undefined;

  const rawImages =
    singleEditingMode ||
    !(currentFiles === 4 || files.length > 4 - currentFiles)
      ? Array.from(files).filter(({ name, size }) => isValidImage(name, size))
      : null;

  if (!rawImages || !rawImages.length) return null;

  const imagesId = rawImages.map(({ name }) => {
    const randomId = getRandomId();
    return {
      id: randomId,
      name: name === 'image.png' ? `${randomId}.png` : null
    };
  });

  const imagesPreviewData = rawImages.map((image, index) => ({
    id: imagesId[index].id,
    src: URL.createObjectURL(image),
    alt: imagesId[index].name ?? image.name,
    type: 'image'
  }));

  const selectedImagesData = rawImages.map((image, index) =>
    renameFile(image, imagesId[index].id, imagesId[index].name)
  );

  return { imagesPreviewData, selectedImagesData };
}

export function getMediaData(files: FileList | null): ImagesData | null {
  if (!files || !files.length) return null;

  const validMediaFiles = Array.from(files).filter(({ name, size }) =>
    isValidMedia(name, size)
  );

  if (!validMediaFiles.length) return null;

  const mediaId = validMediaFiles.map(({ name }) => {
    const randomId = getRandomId();
    const fileExtension = getFileExtension(name);
    return {
      id: randomId,
      name:
        name === `file.${fileExtension}` ? `${randomId}.${fileExtension}` : null
    };
  });

  const imagesPreviewData = validMediaFiles.map((media, index) => ({
    id: mediaId[index].id,
    src: URL.createObjectURL(media),
    alt: mediaId[index].name ?? media.name,
    type: media.type
  }));

  const selectedImagesData = validMediaFiles.map((media, index) =>
    renameFile(media, mediaId[index].id, mediaId[index].name)
  );

  return { imagesPreviewData, selectedImagesData };
}

function renameFile(
  file: File,
  newId: string,
  newName: string | null
): FileWithId {
  return Object.assign(
    newName
      ? new File([file], newName, {
          type: file.type,
          lastModified: file.lastModified
        })
      : file,
    { id: newId }
  );
}