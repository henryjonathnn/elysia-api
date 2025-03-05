import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export class FileUpload {
  private static instance: FileUpload;
  private uploadDir: string;

  private constructor() {
    this.uploadDir = join(process.cwd(), 'uploads');
  }

  public static getInstance(): FileUpload {
    if (!FileUpload.instance) {
      FileUpload.instance = new FileUpload();
    }
    return FileUpload.instance;
  }

  public async saveFile(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const fileName = `${Date.now()}-${randomUUID()}-${file.name}`;
      const filePath = join(this.uploadDir, fileName);
      
      await writeFile(filePath, Buffer.from(buffer));
      return fileName;
    } catch (error) {
      throw new Error('Failed to save file');
    }
  }

  public getFilePath(fileName: string): string {
    return join(this.uploadDir, fileName);
  }
} 