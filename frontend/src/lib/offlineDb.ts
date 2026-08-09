import { openDB, type DBSchema } from "idb";

interface PendingScreening {
  id?: number;
  patientId: string;
  inputSnapshot: unknown;
  output: unknown;
  queuedAt: string;
}

interface HopOfflineDB extends DBSchema {
  pending_screenings: {
    key: number;
    value: PendingScreening;
  };
}

const dbPromise = openDB<HopOfflineDB>("hop-offline", 1, {
  upgrade(db) {
    db.createObjectStore("pending_screenings", { keyPath: "id", autoIncrement: true });
  },
});

export async function queueScreening(payload: Omit<PendingScreening, "id" | "queuedAt">) {
  const db = await dbPromise;
  await db.add("pending_screenings", { ...payload, queuedAt: new Date().toISOString() });
}

export async function getPendingScreenings(): Promise<PendingScreening[]> {
  const db = await dbPromise;
  return db.getAll("pending_screenings");
}

export async function removePendingScreening(id: number) {
  const db = await dbPromise;
  await db.delete("pending_screenings", id);
}

export async function countPendingScreenings(): Promise<number> {
  const db = await dbPromise;
  return db.count("pending_screenings");
}
