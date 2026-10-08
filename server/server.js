require("dotenv").config();
const express = require("express"), http = require("http"), cors = require("cors");
const mongoose = require("mongoose"), bcrypt = require("bcryptjs"), jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = express(); const server = http.createServer(app);
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"))
    .catch(e => console.error(e));
const User = mongoose.model("User", new mongoose.Schema({
    name: String, email: { type: String, unique: true }, passwordHash: String
}));
const auth = async (req, res, next) => {
    try {
        const token = (req.headers.authorization || "").replace("Bearer ", "");
        req.user = jwt.verify(token, process.env.JWT_SECRET); next();
    } catch (e) { res.status(401).json({ message: "Unauthorized" }); }
};
app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 12);
    const u = await User.create({ name, email, passwordHash });
    res.json({ message: "Registered", user: { id: u._id, name: u.name, email: u.email } });
});
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body; const u = await User.findOne({ email });
    if (!u || !(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: u._id, name: u.name, email: u.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: u._id, name: u.name, email: u.email } });
});
app.get("/api/me", auth, (req, res) => res.json(req.user));
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" } });
io.on("connection", socket => {
    socket.on("join-room", room => {
        socket.join(room);
        socket.to(room).emit("user-joined", socket.id);
        socket.emit("room-users", Array.from(io.sockets.adapter.rooms.get(room) || []).filter(id => id !== socket.id));
    });
    socket.on("signal", ({ to, data }) => io.to(to).emit("signal", { from: socket.id, data }));
    socket.on("chat", ({ room, message, user }) => io.to(room).emit("chat", { message, user }));
    socket.on("whiteboard", ({ room, action }) => socket.to(room).emit("whiteboard", action));
    socket.on("disconnect", () => socket.broadcast.emit("user-left", socket.id));
});
server.listen(process.env.PORT || 5000, () => console.log("Server running on port 5000"));