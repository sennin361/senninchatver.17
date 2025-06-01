const socket = io();
let nickname = '';
let room = '';

document.getElementById('joinBtn').onclick = () => {
  nickname = document.getElementById('nickname').value.trim();
  room = document.getElementById('room').value.trim();
  if (!nickname || !room) {
    alert('ニックネームとルーム名を入力してください');
    return;
  }

  socket.emit('join', { nickname, room });
  document.getElementById('joinArea').style.display = 'none';
  document.getElementById('chatArea').style.display = 'block';
};

document.getElementById('sendBtn').onclick = async () => {
  const input = document.getElementById('input');
  const mediaInput = document.getElementById('mediaInput');
  const text = input.value.trim();
  const file = mediaInput.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const data = {
        nickname,
        room,
        file: reader.result,
        fileType: file.type,
        id: Date.now()
      };
      socket.emit('media', data);
      appendMediaMessage(nickname, data.file, data.fileType, true, data.id);
    };
    reader.readAsDataURL(file);
    mediaInput.value = '';
  } else if (text) {
    const id = Date.now();
    socket.emit('message', { text, id });
    appendMessage(nickname, text, true, id);
  }

  input.value = '';
};

socket.on('message', (data) => {
  appendMessage(data.nickname, data.text, false, data.id);
  socket.emit('read', { id: data.id });
});

socket.on('media', (data) => {
  appendMediaMessage(data.nickname, data.file, data.fileType, false, data.id);
  socket.emit('read', { id: data.id });
});

socket.on('systemMessage', (msg) => {
  appendSystemMessage(msg);
});

socket.on('read', (msgId) => {
  const label = document.getElementById(`read-${msgId}`);
  if (label) label.textContent = '既読';
});

function appendMessage(sender, text, isMine = false, id = null) {
  const div = document.createElement('div');
  div.className = `bubble ${isMine ? 'my-bubble' : 'other-bubble'}`;
  div.innerHTML = `<span class="nickname">${sender}</span>${text}`;

  if (id && isMine) {
    const read = document.createElement('span');
    read.className = 'read-label';
    read.id = `read-${id}`;
    read.textContent = '未読';
    div.appendChild(read);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'message';
  wrapper.appendChild(div);

  document.getElementById('messages').appendChild(wrapper);
  scrollToBottom();
}

function appendMediaMessage(sender, dataURL, type, isMine = false, id = null) {
  const div = document.createElement('div');
  div.className = `bubble ${isMine ? 'my-bubble' : 'other-bubble'}`;
  div.innerHTML = `<span class="nickname">${sender}</span>`;

  if (type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = dataURL;
    div.appendChild(img);
  } else if (type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = dataURL;
    video.controls = true;
    div.appendChild(video);
  }

  if (id && isMine) {
    const read = document.createElement('span');
    read.className = 'read-label';
    read.id = `read-${id}`;
    read.textContent = '未読';
    div.appendChild(read);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'message';
  wrapper.appendChild(div);

  document.getElementById('messages').appendChild(wrapper);
  scrollToBottom();
}

function appendSystemMessage(msg) {
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<em>[システム] ${msg}</em>`;
  document.getElementById('messages').appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
}
