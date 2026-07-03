import Dexie, { type Table } from "dexie";

export interface CachedRoom {
  id: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface CachedBooking {
  id: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface SyncQueueItem {
  id?: number;
  url: string;
  method: string;
  body?: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "syncing" | "synced" | "conflicted";
  errorMessage?: string;
  retryCount: number;
}

export interface CachedShift {
  id: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface CachedAlert {
  id: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

class MrglaDB extends Dexie {
  rooms!: Table<CachedRoom, string>;
  bookings!: Table<CachedBooking, string>;
  shift!: Table<CachedShift, string>;
  alerts!: Table<CachedAlert, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("mrgla-db");
    this.version(1).stores({
      rooms: "id, updatedAt",
      bookings: "id, updatedAt",
      shift: "id",
      alerts: "id, updatedAt",
      syncQueue: "++id, status, createdAt",
    });
  }
}

export const db = new MrglaDB();
