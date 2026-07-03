import { db } from "./db";

export async function enqueueMutation(
  url: string,
  method: string,
  body?: Record<string, unknown>
) {
  await db.syncQueue.add({
    url,
    method,
    body: body ? JSON.parse(JSON.stringify(body)) : undefined,
    createdAt: Date.now(),
    status: "pending",
    retryCount: 0,
  });

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register("sync-mutations");
    } catch {
      // background sync unavailable
    }
  }
}

export async function processQueue() {
  const pending = await db.syncQueue
    .where("status")
    .anyOf("pending", "conflicted")
    .toArray();

  const token = localStorage.getItem("token");
  if (!token || pending.length === 0) return { processed: 0, failed: 0, conflicted: 0 };

  let processed = 0;
  let failed = 0;
  let conflicted = 0;

  for (const item of pending) {
    await db.syncQueue.update(item.id!, { status: "syncing" });

    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      if (res.ok) {
        await db.syncQueue.update(item.id!, { status: "synced" });
        processed++;
      } else if (res.status === 409) {
        const serverState = await res.json().catch(() => ({}));
        await db.syncQueue.update(item.id!, {
          status: "conflicted",
          errorMessage: `Conflict: ${serverState.message || "Data changed on server"}`,
        });
        conflicted++;
      } else {
        await db.syncQueue.update(item.id!, {
          status: "conflicted",
          errorMessage: `Server error: ${res.status} ${res.statusText}`,
        });
        conflicted++;
      }
    } catch (err) {
      await db.syncQueue.update(item.id!, {
        status: "pending",
        retryCount: item.retryCount + 1,
        errorMessage: `Network error: ${err instanceof Error ? err.message : "Unknown"}`,
      });
      failed++;
    }
  }

  return { processed, failed, conflicted };
}

export async function getQueueSize() {
  return db.syncQueue.where("status").equals("pending").count();
}

export async function getQueueStatus() {
  const pending = await db.syncQueue.where("status").equals("pending").count();
  const conflicted = await db.syncQueue.where("status").equals("conflicted").count();
  const synced = await db.syncQueue.where("status").equals("synced").count();
  return { pending, conflicted, synced, total: pending + conflicted + synced };
}

export async function resolveConflict(id: number, action: "retry" | "discard") {
  if (action === "retry") {
    await db.syncQueue.update(id, { status: "pending", errorMessage: undefined });
  } else {
    await db.syncQueue.update(id, { status: "synced" });
  }
}

export async function cacheApiResponse(
  path: string,
  data: Record<string, unknown>
) {
  if (path === "/api/rooms/map") {
    const floors = (data.floors || []) as Array<{ rooms: Array<Record<string, unknown>> }>;
    const rooms = floors.flatMap((f) => f.rooms || []);
    if (rooms.length > 0) {
      await db.rooms.clear();
      await db.rooms.bulkPut(
        rooms.map((r: any) => ({
          id: r.id as string,
          data: r as Record<string, unknown>,
          updatedAt: Date.now(),
        }))
      );
    }
  } else if (path === "/api/checkout-alerts") {
    const alerts = (data.alerts || []) as Array<Record<string, unknown>>;
    await db.alerts.clear();
    if (alerts.length > 0) {
      await db.alerts.bulkPut(
        alerts.map((a: any) => ({
          id: a.id as string,
          data: a as Record<string, unknown>,
          updatedAt: Date.now(),
        }))
      );
    }
  } else if (path.startsWith("/api/shift") && !path.includes("/expenses")) {
    if (data.shift) {
      await db.shift.put({
        id: "current",
        data: data.shift as Record<string, unknown>,
        updatedAt: Date.now(),
      });
    }
  }
}

export async function getCachedData(path: string) {
  if (path === "/api/rooms/map") {
    const rooms = await db.rooms.toArray();
    if (rooms.length === 0) return null;
    return {
      floors: [{ name: "Cached", rooms: rooms.map((r) => r.data) }],
      totalRooms: rooms.length,
      statusCounts: {},
    };
  }
  if (path === "/api/checkout-alerts") {
    const alerts = await db.alerts.toArray();
    if (alerts.length === 0) return null;
    return { alerts: alerts.map((a) => a.data) };
  }
  if (path.startsWith("/api/shift") && !path.includes("/expenses")) {
    const shift = await db.shift.get("current");
    return shift ? { shift: shift.data } : null;
  }
  return null;
}
