const MAX_FILE_SIZE_MB = 10;

export const checkFileSize = (
  file: File,
  limitInMB: number = MAX_FILE_SIZE_MB,
): boolean => {
  const fileSizeInMB = file.size / 1024 / 1024;
  return fileSizeInMB <= limitInMB;
};
