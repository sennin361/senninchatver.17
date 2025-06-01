const socket = io();
let myName = "";
let myRoom = "";

function joinChat() {
  myName = document.getElementById("nameInput").value.trim();
  myRoom = document.getElementById("roomInput").value.trim();
  if (!myName || !myRoom) return alert("名前とあいことばを入力してください");

  socket.emit("join", { name: myName, room: myRoom });

  document.getElementById("login").classList.add("hidden");
  document.getElementById("chat").classList.remove("hidden");
  document.getElementById("roomName").textContent = `ルーム: ${myRoom}`;
}

function leaveChat() {
  location.reload();
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  const file = document.getElementById("mediaInput").files[0];

  if (text) {
    socket.emit("message", { type: "text", text }, myRoom);
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      const type = file.type.startsWith("video") ? "video" : "image";
      socket.emit("message", { type, data: base64 }, myRoom);
    };
    reader.readAsDataURL(file);
  }

  input.value = "";
  document.getElementById("mediaInput").value = "";
}

socket.on("message", ({ user, msg, type, data }) => {
  const div = document.createElement("div");
  div.className = "message" + (user === myName ? " you" : "");
  div.innerHTML = `<strong>${user}</strong><br/>`;

  if (type === "text") {
    div.innerHTML += msg;
  } else if (type === "image") {
    div.innerHTML += `<img src="${data}" />`;
  } else if (type === "video") {
    div.innerHTML += `<video src="${data}" controls></video>`;
  }

  document.getElementById("messages").appendChild(div);
  document.getElementById("messages").scrollTop = messages.scrollHeight;
});

socket.on("system", (msg) => {
  const div = document.createElement("div");
  div.className = "message system";
  div.textContent = msg;
  document.getElementById("messages").appendChild(div);
  document.getElementById("messages").scrollTop = messages.scrollHeight;
});

socket.on("banned", () => {
  alert("あなたは管理者によりBANされました。");
  location.reload();
});

socket.on("maintenance", (status) => {
  if (status) {
    alert("現在メンテナンス中です。後でもう一度お試しください。");
    location.reload();
  }
});
