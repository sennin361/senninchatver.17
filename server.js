const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const ADMIN_PASSWORD = 'sennin25251515';
let chatLog = [];
let bannedUsers = new Set();
let userRooms = {};
let socketUsernames = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('接続:', socket.id);

  socket.on('join', ({ nickname, room }) => {
    if (bannedUsers.has(nickname)) {
      socket.emit('banned');
      return;
    }
    socket.join(room);
    userRooms[socket.id] = room;
    socketUsernames[socket.id] = nickname;
    const joinMsg = `${nickname} が ${room} に入室`;
    io.to(room).emit('message', { nickname: 'SYSTEM', message: joinMsg, type: 'text' });
    chatLog.push(joinMsg);
  });

  socket.on('message', (data) => {
    const room = userRooms[socket.id];
    const nickname = socketUsernames[socket.id];
    if (!room || !nickname) return;

    io.to(room).emit('message', { ...data, nickname });
    chatLog.push(`[${nickname}] ${data.type === 'text' ? data.message : '[ファイル]'}`);
  });

  socket.on('disconnect', () => {
    const nickname = socketUsernames[socket.id];
    const room = userRooms[socket.id];
    if (room && nickname) {
      const msg = `${nickname} が ${room} を退出`;
      io.to(room).emit('message', { nickname: 'SYSTEM', message: msg, type: 'text' });
      chatLog.push(msg);
    }
    delete userRooms[socket.id];
    delete socketUsernames[socket.id];
  });

  // 管理者機能
  socket.on('admin_broadcast', ({ password, message }) => {
    if (password !== ADMIN_PASSWORD) return socket.emit('admin_error', '認証失敗');
    io.emit('message', { nickname: '管理者', message, type: 'text' });
    chatLog.push(`[管理者] ${message}`);
  });

  socket.on('admin_room_message', ({ password, room, message }) => {
    if (password !== ADMIN_PASSWORD) return socket.emit('admin_error', '認証失敗');
    io.to(room).emit('message', { nickname: '管理者', message, type: 'text' });
    chatLog.push(`[管理者→${room}] ${message}`);
  });

  socket.on('admin_ban_user', ({ password, username }) => {
    if (password !== ADMIN_PASSWORD) return socket.emit('admin_error', '認証失敗');
    bannedUsers.add(username);
    for (let [id, name] of Object.entries(socketUsernames)) {
      if (name === username) {
        io.to(id).emit('banned');
        io.sockets.sockets.get(id)?.disconnect();
      }
    }
    chatLog.push(`[管理者] ${username} をBAN`);
  });

  socket.on('admin_reset', ({ password }) => {
    if (password !== ADMIN_PASSWORD) return socket.emit('admin_error', '認証失敗');
    chatLog = [];
    bannedUsers.clear();
    chatLog.push('[管理者] チャットログを全削除');
    io.emit('message', { nickname: 'SYSTEM', message: 'チャット履歴が管理者によりリセットされました', type: 'text' });
  });

  socket.on('admin_get_logs', ({ password }) => {
    if (password !== ADMIN_PASSWORD) return socket.emit('admin_error', '認証失敗');
    socket.emit('admin_log', chatLog.slice(-50));
  });

  socket.on('admin_get_keywords', ({ password }) => {
    if (password !== ADMIN_PASSWORD) return socket.emit('admin_error', '認証失敗');
    const words = chatLog
      .filter(l => !l.includes('[ファイル]'))
      .flatMap(l => l.split(/\s|　|[。、！]/))
      .filter(w => w.length > 3);
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(w => w[0]);
    socket.emit('admin_keywords', sorted);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('サーバー起動中');
});
