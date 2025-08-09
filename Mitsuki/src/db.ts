import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

type Listener = (data: any) => void;

class TempDatabase {
  private static instance: TempDatabase;
  private data: Record<string, any> = {};
  private listeners: Map<string, Set<Listener>> = new Map();
  private readonly dbFilePath = join(__dirname, 'db.json');

  private constructor() {
    this.loadFromFile();
  }

  public static getInstance(): TempDatabase {
    if (!TempDatabase.instance) {
      TempDatabase.instance = new TempDatabase();
    }
    return TempDatabase.instance;
  }

  // ---------- File I/O ----------
  private loadFromFile(): void {
    if (existsSync(this.dbFilePath)) {
      try {
        const content = readFileSync(this.dbFilePath, 'utf-8');
        this.data = JSON.parse(content);
      } catch (err) {
        console.error('Failed to parse database.json:', err);
        this.data = {};
      }
    } else {
      this.data = {};
      this.saveToFile();
    }
  }

  private saveToFile(): void {
    try {
      writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to db.json:', err);
    }
  }

  // ---------- Flat Key APIs ----------
  public get(key: string): any {
    return this.data[key];
  }

  public set(key: string, value: any): void {
    this.data[key] = value;
    this.saveToFile();
    this.notify(key, value);
  }

  // ---------- Nested Path APIs ----------
  public getPath(path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], this.data);
  }

  public setPath(path: string, value: any): void {
    const keys = path.split('.');
    let target = this.data;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;

    this.saveToFile();

    // Notify top-level change (similar to Firestore doc-level event)
    const topLevelKey = keys[0];
    this.notify(topLevelKey, this.data[topLevelKey]);
  }

  public updatePath(path: string, updater: (current: any) => any): void {
    const currentValue = this.getPath(path);
    const newValue = updater(currentValue);
    this.setPath(path, newValue);
  }

    public pushToArray(path: string, value: any): void {
    this.updatePath(path, (arr: any[] = []) => {
      if (!Array.isArray(arr)) {
        throw new Error(`Value at path "${path}" is not an array.`);
      }
      return [...arr, value];
    });
  }


  // ---------- Subscriptions ----------
  public subscribe(key: string, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notify(key: string, value: any): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        listener(value);
      }
    }
  }
}

const dbInstance = TempDatabase.getInstance();
export default dbInstance;
