import path from "node:path";
import fs from "node:fs";

export async function uploadFile(file) {
  const filename = file.name;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadsFolderName = "uploads";
  const uploadsFolderPath = path.resolve(uploadsFolderName);

  const uploadPath = path.join(uploadsFolderPath, filename);

  const uploadsFolderExists = fs.existsSync(uploadsFolderPath);

  if (!uploadsFolderExists) {
    fs.mkdirSync(uploadsFolderPath);
  }

  fs.writeFileSync(uploadPath, buffer);

  return uploadPath;
}
