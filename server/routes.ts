import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

interface PairRoom {
  devices: Map<string, WebSocket>;
}

const pairRooms = new Map<string, PairRoom>();

function getPairRoom(pairCode: string): PairRoom {
  if (!pairRooms.has(pairCode)) {
    pairRooms.set(pairCode, { devices: new Map() });
  }
  return pairRooms.get(pairCode)!;
}

function cleanupDevice(pairCode: string, deviceId: string) {
  const room = pairRooms.get(pairCode);
  if (!room) return;
  room.devices.delete(deviceId);
  if (room.devices.size === 0) {
    pairRooms.delete(pairCode);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let currentPairCode: string | null = null;
    let currentDeviceId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "join") {
          currentPairCode = msg.pairCode as string;
          currentDeviceId = msg.deviceId as string;

          const room = getPairRoom(currentPairCode);
          room.devices.set(currentDeviceId, ws);

          const partnerCount = room.devices.size - 1;
          ws.send(JSON.stringify({ type: "joined", partnerOnline: partnerCount > 0 }));

          room.devices.forEach((partnerWs, partnerId) => {
            if (partnerId !== currentDeviceId && partnerWs.readyState === WebSocket.OPEN) {
              partnerWs.send(JSON.stringify({ type: "partner_online", online: true }));
            }
          });
          return;
        }

        if (!currentPairCode || !currentDeviceId) return;
        const room = pairRooms.get(currentPairCode);
        if (!room) return;

        room.devices.forEach((partnerWs, partnerId) => {
          if (partnerId !== currentDeviceId && partnerWs.readyState === WebSocket.OPEN) {
            partnerWs.send(JSON.stringify(msg));
          }
        });
      } catch (e) {
        console.error("WS parse error:", e);
      }
    });

    ws.on("close", () => {
      if (!currentPairCode || !currentDeviceId) return;
      cleanupDevice(currentPairCode, currentDeviceId);
      const room = pairRooms.get(currentPairCode);
      if (room) {
        room.devices.forEach((partnerWs) => {
          if (partnerWs.readyState === WebSocket.OPEN) {
            partnerWs.send(JSON.stringify({ type: "partner_online", online: false }));
          }
        });
      }
    });
  });

  return httpServer;
}
