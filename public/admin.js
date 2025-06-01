const socket = io();
let password = '';

document.getElementById('adminPassword').addEventListener('input', (e) => {
  password = e.target.value;
});

function sendBroadcast() {
  const msg = document.getElementById('broadcastMessage').value;
  socket.emit('admin_broadcast', { password, message: msg });
}

function sendToRoom() {
  const room = document.getElementById('roomName').value;
  const msg = document.getElementById('roomMessage').value;
  socket.emit('admin_room_message', { password, room, message: msg });
}

function banUser() {
  const username = document.getElementById('banUsername').value;
  socket.emit('admin_ban_user', { password, username });
}

function resetServer() {
  if (confirm('本当に全チャット履歴を削除しますか？')) {
    socket.emit('admin_reset', { password });
  }
}

socket.on('admin_log', data => {
  document.getElementById('logs').textContent = data.join('\n');
});

socket.on('admin_keywords', data => {
  document.getElementById('keywords').textContent = data.join(', ');
});

socket.on('admin_error', msg => {
  alert("管理エラー: " + msg);
});

// 起動時にログとキーワード取得
setInterval(() => {
  socket.emit('admin_get_logs', { password });
  socket.emit('admin_get_keywords', { password });
}, 3000);
