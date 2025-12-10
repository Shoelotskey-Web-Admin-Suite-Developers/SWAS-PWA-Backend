import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import type { ChangeStream, ChangeStreamDocument, ResumeToken } from "mongodb";

type WatchTarget = {
  collectionName: string;
  event: string;
};

const WATCH_TARGETS: WatchTarget[] = [
  { collectionName: "line_items", event: "lineItemUpdated" },
  { collectionName: "appointments", event: "appointmentUpdated" },
  { collectionName: "unavailabilities", event: "unavailabilityUpdated" },
];

export function initSocket(io: Server, db: mongoose.Connection) {
  io.on("connection", (socket: Socket) => {
    console.log("✅ Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  const activeStreams = new Map<string, ChangeStream>();

  const watchTarget = (
    target: WatchTarget,
    resumeToken?: ResumeToken,
    retryDelay = 1000
  ) => {
    const collection = db.collection(target.collectionName);

    console.log(`🔍 Starting watch for collection: ${target.collectionName}`);

    let stream: ChangeStream;
    try {
      stream = collection.watch([], resumeToken ? { resumeAfter: resumeToken } : undefined);
      console.log(`✅ Change stream initialized for ${target.collectionName}`);
    } catch (err) {
      const nextDelay = Math.min(retryDelay * 2, 30_000);
      console.error(
        `❌ Failed to start change stream for ${target.collectionName}, retrying in ${nextDelay}ms`,
        err
      );
      setTimeout(() => watchTarget(target, resumeToken, nextDelay), nextDelay);
      return;
    }

    activeStreams.set(target.event, stream);

    let currentToken: ResumeToken | undefined = resumeToken;
    let backoffDelay = retryDelay;

    const scheduleRestart = (reason: string, err?: unknown) => {
      if (activeStreams.get(target.event) !== stream) return;
      if (err) {
        console.error(reason, err);
      } else {
        console.warn(reason);
      }

      activeStreams.delete(target.event);
      stream.close().catch(() => undefined);

      const nextDelay = Math.min(backoffDelay * 2, 30_000);
      setTimeout(() => watchTarget(target, currentToken, nextDelay), nextDelay);
    };

    stream.on("change", (change: ChangeStreamDocument) => {
      currentToken = change._id;
      backoffDelay = 1000;
      console.log(`📢 ${target.collectionName} updated:`, change);
      console.log(`📤 Emitting event: ${target.event}`);
      console.log(`👥 Connected clients: ${io.sockets.sockets.size}`);
      io.emit(target.event, change);
    });

    stream.on("error", (err) => {
      scheduleRestart(`⚠️ Change stream error on ${target.collectionName}`, err);
    });

    stream.on("close", () => {
      scheduleRestart(`🔒 Change stream closed for ${target.collectionName}`);
    });
  };

  const openAllStreams = () => {
    console.log("🚀 Opening all change streams...");
    WATCH_TARGETS.forEach((target) => {
      activeStreams.get(target.event)?.close().catch(() => undefined);
      activeStreams.delete(target.event);
      watchTarget(target);
    });
  };

  openAllStreams();

  db.on("disconnected", () => {
    console.warn("⚠️ Mongo disconnected, closing change streams");
    activeStreams.forEach((stream) => stream.close().catch(() => undefined));
    activeStreams.clear();
  });

  db.on("reconnected", () => {
    console.info("🔄 Mongo reconnected, reopening change streams");
    openAllStreams();
  });
}
