export type MediaData = {
  src: string;
  alt: string;
  type?: string;
};

export type ImagesPreview = (MediaData & {
  id: string;
})[];

export type ImagePreview = MediaData & { id: string };
export type FileWithId = File & { id: string };

export type FilesWithId = (File & {
  id: string;
})[];
