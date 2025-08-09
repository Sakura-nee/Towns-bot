import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

type Listener = (data: any) => void;

class TempDatabase {
  private static instance: TempDatabase;
  private data: Record<string, any> = {};
  private listeners: Map<string, Set<Listener>> = new Map();
  private readonly dbFilePath = join(__dirname, 'database.json');

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
      console.error('Failed to write to database.json:', err);
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
    if (!path || typeof path !== 'string') {
      console.error('Invalid path:', path);
      return undefined;
    }
    
    try {
      return path.split('.').reduce((acc: Record<string, any> | undefined, key) => {
        if (acc === null || acc === undefined || typeof acc !== 'object') {
          return undefined;
        }
        return acc[key];
      }, this.data);
    } catch (err) {
      console.error(`Error getting path "${path}":`, err);
      return undefined;
    }
  }

  public setPath(path: string, value: any): void {
    if (!path || typeof path !== 'string') {
      console.error('Invalid path:', path);
      return;
    }

    const keys = path.split('.');
    let target: Record<string, any> = this.data;

    try {
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i] as string;
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        target = target[key];
      }

      target[keys[keys.length - 1] as string] = value;
      this.saveToFile();

      // Notify top-level change (similar to Firestore doc-level event)
      if (keys.length > 0) {
        const topLevelKey = keys[0];
        if (topLevelKey && this.data[topLevelKey] !== undefined) {
          this.notify(topLevelKey, this.data[topLevelKey]);
        }
      }
    } catch (err) {
      console.error(`Error setting path "${path}":`, err);
    }
  }

  public updatePath(path: string, updater: (current: any) => any): void {
    const currentValue = this.getPath(path);
    const newValue = updater(currentValue);
    this.setPath(path, newValue);
  }

    public pushToArray(path: string, value: any): boolean {
        try {
            this.updatePath(path, (arr: any[] = []) => {
                if (!Array.isArray(arr)) {
                    console.error(`Cannot push to path "${path}" - value is not an array`);
                    return arr; // Return unchanged
                }
                return [...arr, value];
            });
            return true;
        } catch (err) {
            console.error(`Error pushing to array at path "${path}":`, err);
            return false;
        }
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
