"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const auth_1 = __importDefault(require("./routes/auth"));
const announcementsRoutes_1 = __importDefault(require("./routes/announcementsRoutes"));
const branchRoutes_1 = __importDefault(require("./routes/branchRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const promoRoutes_1 = __importDefault(require("./routes/promoRoutes"));
const unavailabilityRoutes_1 = __importDefault(require("./routes/unavailabilityRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const lineItemRoutes_1 = __importDefault(require("./routes/lineItemRoutes"));
const appointmentsRoutes_1 = __importDefault(require("./routes/appointmentsRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const serviceRequestRoutes_1 = __importDefault(require("./routes/serviceRequestRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const paymentsRoutes_1 = __importDefault(require("./routes/paymentsRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const socket_1 = require("./socket");
const lineItemImageRoutes_1 = __importDefault(require("./routes/lineItemImageRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Setup socket.io
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // adjust to your frontend domain later
    },
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api/announcements", announcementsRoutes_1.default);
app.use("/api/branches", branchRoutes_1.default);
app.use("/api", userRoutes_1.default);
app.use("/api/promos", promoRoutes_1.default);
app.use("/api/unavailability", unavailabilityRoutes_1.default);
app.use("/api/customers", customerRoutes_1.default);
app.use("/api/line-items", lineItemRoutes_1.default);
app.use("/api/appointments", appointmentsRoutes_1.default);
app.use("/api/services", serviceRoutes_1.default);
app.use("/api/service-request", serviceRequestRoutes_1.default);
app.use("/transactions", transactionRoutes_1.default);
app.use("/api/line-item-image", lineItemImageRoutes_1.default);
app.use("/api/transactions", transactionRoutes_1.default);
app.use("/api/payments", paymentsRoutes_1.default);
app.use("/api/analytics", analyticsRoutes_1.default);
// Test route
app.get("/", (req, res) => {
    res.send("API is running...");
});
// Auth routes
app.use("/api/auth", auth_1.default);
// Connect DB + Init Socket
const MONGO_URI = process.env.MONGO_URI || "";
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("✅ MongoDB connected");
    (0, socket_1.initSocket)(io, mongoose_1.default.connection); // 👈 pass DB + socket
})
    .catch((err) => console.error("❌ MongoDB connection error:", err));
// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
