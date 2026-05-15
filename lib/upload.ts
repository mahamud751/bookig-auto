export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFiles(files: File[]) {
  const tooLarge = files.find((file) => file.size > MAX_IMAGE_BYTES);
  if (tooLarge) {
    throw new Error(`"${tooLarge.name}" is too large. Maximum size is 5MB per image.`);
  }
}
