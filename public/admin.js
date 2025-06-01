async function login() {
  const password = document.getElementById("adminPassword").value;
  const res = await fetch("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (data.success) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadUserCount();
  } else {
    document.getElementById("loginStatus").textContent = "パスワードが間違っています。";
  }
}

async function loadUserCount() {
  const res = await fetch("/admin/users");
  const data = await res.json();
  document.getElementById("userCount").textContent = data.count + " 人接続中";
}

async function broadcast() {
  const text = document.getElementById("broadcastText").value;
  await fetch("/admin/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  alert("一斉送信しました");
  document.getElementById("broadcastText").value = "";
}

async function banUser() {
  const name = document.getElementById("banName").value;
  const res = await fetch("/admin/ban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.ok) {
    alert(`${name} をBANしました`);
    document.getElementById("banName").value = "";
  } else {
    alert("BANできませんでした");
  }
}

async function toggleMaintenance(status) {
  await fetch("/admin/maintenance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  alert("メンテナンスモードを " + (status ? "開始" : "解除") + " しました");
}

async function resetServer() {
  if (confirm("本当にサーバーをリセットしますか？全てのチャット履歴が削除されます。")) {
    await fetch("/admin/reset", { method: "POST" });
    alert("サーバーをリセットしました");
  }
}

async function loadLogs() {
  const res = await fetch("/admin/logs");
  const data = await res.json();
  const output = Object.entries(data.logs)
    .map(([room, messages]) => `【${room}】\n` + messages.map(m => `(${m.user}) ${m.msg}`).join("\n"))
    .join("\n\n");
  document.getElementById("logOutput").value = output;
}
