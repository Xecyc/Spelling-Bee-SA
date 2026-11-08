import fs from 'fs';
import path from 'path';

export class AtomicStore<T> {
  private filePath: string;
  private tempPath: string;
  private backupPath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
    this.tempPath = `${this.filePath}.tmp`;
    this.backupPath = `${this.filePath}.bak`;

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  read(fallback: T): T {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.error(
        `[AtomicStore] Corruption detected while reading ${this.filePath}. Attempting backup recovery...`,
        err
      );
      if (fs.existsSync(this.backupPath)) {
        try {
          const backupRaw = fs.readFileSync(this.backupPath, 'utf-8');
          const data = JSON.parse(backupRaw) as T;
          this.write(data);
          console.log(`[AtomicStore] Successfully restored from backup: ${this.backupPath}`);
          return data;
        } catch (backupErr) {
          console.error(`[AtomicStore] Backup also corrupted:`, backupErr);
        }
      }
    }
    return fallback;
  }

  write(data: T): boolean {
    try {
      const serialized = JSON.stringify(data, null, 2);

      // 1. Write to temporary file
      fs.writeFileSync(this.tempPath, serialized, 'utf-8');

      // 2. Rotate current healthy file to backup
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath);
      }

      // 3. Atomically rename temp file to target
      fs.renameSync(this.tempPath, this.filePath);
      return true;
    } catch (err) {
      console.error(`[AtomicStore] Failed atomic write to ${this.filePath}:`, err);
      if (fs.existsSync(this.tempPath)) {
        try {
          fs.unlinkSync(this.tempPath);
        } catch {}
      }
      return false;
    }
  }
}
