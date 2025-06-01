const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const adminPassword = "sennin25251515";
let maintenanceMode = false;

let users = {};      // socket.id -> { name, room }
let rooms = {};      // roomName -> [messages]
let bannedUsers = new Set();

// 管理者ログイン
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === adminPassword) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 接続ユーザー数
app.get("/admin/users", (req, res) => {
  res.json({ count: Object.keys(users).length });
});

// 全チャットログ取得
app.get("/admin/logs", (req, res) => {
  res.json({ logs: rooms });
});

// サーバーリセット
app.post("/admin/reset", (req, res) => {
  rooms = {};
  bannedUsers = new Set();
  io.emit("system", "💥 サーバーがリセットされました");
  res.json({ success: true });
});

// メンテナンス切替
app.post("/admin/maintenance", (req, res) => {
  const { status } = req.body;
  maintenanceMode = status;
  io.emit("maintenance", maintenanceMode);
  res.json({ success: true });
});

// BAN処理
app.post("/admin/ban", (req, res) => {
  const { name } = req.body;
  const target = Object.entries(users).find(([id, u]) => u.name === name);
  if (target) {
    const [id, u] = target;
    bannedUsers.add(name);
    io.to(id).emit("banned");
    io.to(u.room).emit("system", `⚠️ ${name} はBANされました`);
    io.sockets.sockets.get(id).disconnect();
    delete users[id];
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 一斉送信
app.post("/admin/broadcast", (req, res) => {
  const { text } = req.body;
  io.emit("message", { user: "【管理者】", msg: text, type: "text" });
  res.json({ success: true });
});

io.on("connection", (socket) => {
  socket.on("join", ({ name, room }) => {
    if (maintenanceMode) {
      socket.emit("maintenance", true);
      return;
    }
    if (bannedUsers.has(name)) {
      socket.emit("banned");
      return;
    }

    users[socket.id] = { name, room };
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    socket.emit("system", `🌿 ようこそ ${name} さん`);
    socket.to(room).emit("system", `👤 ${name} さんが入室しました`);
  });

  socket.on("message", (msg, room) => {
    const user = users[socket.id];
    if (!user) return;
    const { name } = user;

    const entry = {
      user: name,
      msg: msg.text || "",
      type: msg.type || "text",
      data: msg.data || null,
    };

    rooms[room] = rooms[room] || [];
    rooms[room].push(entry);
    io.to(room).emit("message", entry);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      socket.to(user.room).emit("system", `👋 ${user.name} さんが退室しました`);
      delete users[socket.id];
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
