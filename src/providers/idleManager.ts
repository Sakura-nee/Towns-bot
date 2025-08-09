import db from "./nDB";

class IdleManager {
  private static instance: IdleManager;
  private userTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly idleTimeMs = 10 * 60 * 1000; // 5 menit

  private constructor() {}

  public static getInstance(): IdleManager {
    if (!IdleManager.instance) {
      IdleManager.instance = new IdleManager();
    }
    return IdleManager.instance;
  }

  public markUserActive(address: string): void {
    // 1. Set aiEnabled = true
    db.setPath(`userPersonas.${address}.aiEnabled`, true);

    // 2. Reset timer kalau ada
    if (this.userTimers.has(address)) {
      clearTimeout(this.userTimers.get(address)!);
    }

    // 3. Set timeout baru untuk jadi idle
    const timeout = setTimeout(() => {
      db.setPath(`userPersonas.${address}.aiEnabled`, false);
      this.userTimers.delete(address);
      console.log(`User ${address} is now idle`);
    }, this.idleTimeMs);

    this.userTimers.set(address, timeout);
  }
}

export default IdleManager.getInstance();
