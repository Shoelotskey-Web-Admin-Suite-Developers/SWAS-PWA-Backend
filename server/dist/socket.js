"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
const WATCH_TARGETS = [
    { collectionName: "line_items", event: "lineItemUpdated" },
    { collectionName: "appointments", event: "appointmentUpdated" },
    { collectionName: "unavailabilities", event: "unavailabilityUpdated" },
];
function initSocket(io, db) {
    io.on("connection", (socket) => {
        console.log("✅ Client connected:", socket.id);
        socket.on("disconnect", () => {
            console.log("❌ Client disconnected:", socket.id);
        });
    });
    const activeStreams = new Map();
    const watchTarget = (target, resumeToken, retryDelay = 1000) => {
        const collection = db.collection(target.collectionName);
        let stream;
        try {
            stream = collection.watch([], resumeToken ? { resumeAfter: resumeToken } : undefined);
        }
        catch (err) {
            const nextDelay = Math.min(retryDelay * 2, 30000);
            console.error(`Failed to start change stream for ${target.collectionName}, retrying in ${nextDelay}ms`, err);
            setTimeout(() => watchTarget(target, resumeToken, nextDelay), nextDelay);
            return;
        }
        activeStreams.set(target.event, stream);
        let currentToken = resumeToken;
        let backoffDelay = retryDelay;
        const scheduleRestart = (reason, err) => {
            if (activeStreams.get(target.event) !== stream)
                return;
            if (err) {
                console.error(reason, err);
            }
            else {
                console.warn(reason);
            }
            activeStreams.delete(target.event);
            stream.close().catch(() => undefined);
            const nextDelay = Math.min(backoffDelay * 2, 30000);
            setTimeout(() => watchTarget(target, currentToken, nextDelay), nextDelay);
        };
        stream.on("change", (change) => {
            currentToken = change._id;
            backoffDelay = 1000;
            console.log(`📢 ${target.collectionName} updated:`, change);
            io.emit(target.event, change);
        });
        stream.on("error", (err) => {
            scheduleRestart(`Change stream error on ${target.collectionName}`, err);
        });
        stream.on("close", () => {
            scheduleRestart(`Change stream closed for ${target.collectionName}`);
        });
    };
    const openAllStreams = () => {
        WATCH_TARGETS.forEach((target) => {
            activeStreams.get(target.event)?.close().catch(() => undefined);
            activeStreams.delete(target.event);
            watchTarget(target);
        });
    };
    openAllStreams();
    db.on("disconnected", () => {
        console.warn("Mongo disconnected, closing change streams");
        activeStreams.forEach((stream) => stream.close().catch(() => undefined));
        activeStreams.clear();
    });
    db.on("reconnected", () => {
        console.info("Mongo reconnected, reopening change streams");
        openAllStreams();
    });
}
