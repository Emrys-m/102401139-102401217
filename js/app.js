/* ============================================================
 * app.js —— 交互逻辑（还原原型交互）
 * ============================================================ */

let currentFilter = "all";
let currentType = "lost";
let selectedEmoji = "💳";
let currentDetailId = null;
let lastViewBeforeDetail = "home";

const $ = (id) => document.getElementById(id);

// ====== 路由 ======
function go(name) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  $("screen-" + name).classList.add("active");
  document
    .querySelectorAll(".tab-item")
    .forEach((t) => t.classList.remove("active"));
  const tab = document.querySelector(`.tab-item[data-tab="${name}"]`);
  if (tab) tab.classList.add("active");
  if (name === "home") renderHome();
  if (name === "mine") renderMine();
}

function backFromDetail() {
  go(lastViewBeforeDetail);
}

// ====== 卡片 HTML ======
function cardHTML(d, highlightKw) {
  const isLost = d.type === "lost";
  const statusText =
    d.status === "open" ? (isLost ? "寻物中" : "待认领") : "已解决";
  const statusCls = d.status === "open" ? "status-open" : "status-done";
  const title = highlightKw
    ? highlightText(d.title, highlightKw)
    : escapeHtml(d.title);
  const desc = highlightKw
    ? highlightText(d.desc, highlightKw)
    : escapeHtml(d.desc);
  const place = highlightKw
    ? highlightText(d.place, highlightKw)
    : escapeHtml(d.place);
  return `<div class="info-card ${d.status === "done" ? "card-resolved" : ""}" onclick="openDetail('${d.id}')">
    <div class="card-thumb ${isLost ? "thumb-lost" : "thumb-found"}">${d.emoji}</div>
    <div class="card-body">
      <span class="card-tag ${isLost ? "tag-lost" : "tag-found"}">${isLost ? "寻物" : "招领"}</span>
      <span class="status-pill ${statusCls}">${statusText}</span>
      <div class="card-title">${title}</div>
      <div class="card-desc">${desc}</div>
      <div class="card-meta"><span>📍 ${place}</span><span>${escapeHtml(d.time)}</span></div>
    </div>
  </div>`;
}

function highlightText(text, kw) {
  const safe = escapeHtml(text);
  if (!kw) return safe;
  const regex = new RegExp(
    `(${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  return safe.replace(regex, "<mark>$1</mark>");
}
function escapeHtml(s) {
  return String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

// ====== 首页 ======
function renderHome() {
  const items = filterByType(loadItems(), currentFilter);
  $("home-list").innerHTML = items.length
    ? items.map((d) => cardHTML(d)).join("")
    : '<div style="text-align:center;color:#9CA3AF;padding:40px 0;font-size:14px;">暂无信息</div>';
}

// ====== 筛选 tab ======
document.querySelectorAll(".filter-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    renderHome();
  });
});

// ====== 我的发布 ======
function renderMine() {
  const items = getMyItems();
  $("my-list").innerHTML = items.length
    ? items.map((d) => cardHTML(d)).join("")
    : '<div style="text-align:center;color:#9CA3AF;padding:30px 0;font-size:13px;">你还没有发布过信息</div>';
  $("stat-published").textContent = items.length;
  $("stat-processing").textContent = items.filter(
    (i) => i.status === "open",
  ).length;
  $("stat-done").textContent = items.filter((i) => i.status === "done").length;
}

// ====== 发布：类型切换 ======
function switchType(t) {
  currentType = t;
  $("type-lost").className = "type-btn" + (t === "lost" ? " active-lost" : "");
  $("type-found").className =
    "type-btn" + (t === "found" ? " active-found" : "");
  $("f-place-label").textContent = t === "lost" ? "丢失地点" : "捡到地点";
  $("f-time-label").textContent = t === "lost" ? "丢失时间" : "捡到时间";
}

// ====== emoji 选择器 ======
function renderEmojiPicker() {
  $("emojiPicker").innerHTML = EMOJIS.map(
    (e) =>
      `<div class="emoji-opt ${e === selectedEmoji ? "selected" : ""}" data-e="${e}" onclick="pickEmoji('${e}')">${e}</div>`,
  ).join("");
}
function pickEmoji(e) {
  selectedEmoji = e;
  document.querySelectorAll(".emoji-opt").forEach((el) => {
    el.classList.toggle("selected", el.dataset.e === e);
  });
}

// ====== 发布提交 ======
function doPublish() {
  const data = {
    type: currentType,
    emoji: selectedEmoji,
    title: $("f-name").value,
    desc: $("f-desc").value,
    place: $("f-place").value,
    time: $("f-time").value,
    contact: $("f-contact").value,
  };
  const { valid, msg } = validateItem(data);
  if (!valid) {
    showToast(msg);
    return;
  }
  addItem(data);
  // 清空表单
  $("f-name").value = "";
  $("f-desc").value = "";
  $("f-place").value = "";
  $("f-time").value = "";
  $("f-contact").value = "";
  go("success");
}

// ====== 搜索 ======
function doSearch() {
  const kw = $("search-input").value.trim();
  if (!kw) {
    showToast("请输入关键词");
    return;
  }
  const results = searchItems(loadItems(), kw);
  $("search-history").style.display = "none";
  $("search-result").style.display = "block";
  $("result-count").textContent =
    `共找到 ${results.length} 条与"${kw}"相关的信息`;
  $("search-list").innerHTML = results.length
    ? results.map((d) => cardHTML(d, kw)).join("")
    : `<div style="text-align:center;color:#9CA3AF;padding:40px 0;font-size:14px;">
        未找到相关物品<br>换个关键词试试吧<br>
        <button onclick="go('publish')" style="margin-top:12px;padding:8px 24px;background:#3B82F6;color:#fff;border:none;border-radius:18px;font-size:14px;cursor:pointer;">去发布</button>
      </div>`;
}
function quickSearch(kw) {
  $("search-input").value = kw;
  doSearch();
}

// ====== 详情 ======
function openDetail(id) {
  const d = loadItems().find((x) => x.id === id);
  if (!d) return;
  currentDetailId = id;
  lastViewBeforeDetail = document
    .querySelector(".screen.active")
    .id.replace("screen-", "");

  const isLost = d.type === "lost";
  const img = $("detail-image");
  img.style.background = isLost
    ? "linear-gradient(135deg,#FCA5A5,#EF4444)"
    : "linear-gradient(135deg,#6EE7B7,#10B981)";
  img.textContent = d.emoji;
  $("detail-tag").className = "card-tag " + (isLost ? "tag-lost" : "tag-found");
  $("detail-tag").textContent = isLost ? "寻物启事" : "招领信息";
  $("detail-status").className =
    "status-pill " + (d.status === "open" ? "status-open" : "status-done");
  $("detail-status").textContent =
    d.status === "open" ? (isLost ? "寻物中" : "待认领") : "已解决";
  $("detail-title").textContent = d.title;
  $("detail-desc").textContent = d.desc || "（无描述）";
  $("detail-place-label").textContent = isLost ? "丢失地点" : "捡到地点";
  $("detail-place").textContent = d.place;
  $("detail-time").textContent = d.time;
  $("detail-contact").textContent = d.contact;

  // 底部按钮：我的发布且未完成 → 显示"标记完成"
  const bottom = $("detail-bottom");
  bottom.innerHTML = "";
  if (d.owner === "me" && d.status === "open") {
    const btn = document.createElement("button");
    btn.className = "bottom-btn btn-success";
    btn.textContent = isLost ? "标记为已找到" : "标记为已归还";
    btn.onclick = () => {
      updateStatus(id, "done");
      showToast("状态已更新为已解决");
      backFromDetail();
    };
    bottom.appendChild(btn);
  } else if (d.owner === "me" && d.status === "done") {
    const btn = document.createElement("button");
    btn.className = "bottom-btn btn-outline";
    btn.textContent = "重新打开";
    btn.onclick = () => {
      updateStatus(id, "open");
      showToast("已恢复为进行中");
      backFromDetail();
    };
    bottom.appendChild(btn);
  } else {
    const btn = document.createElement("button");
    btn.className = "bottom-btn btn-primary";
    btn.textContent = "联系发布者";
    btn.onclick = () => {
      copyContact();
    };
    bottom.appendChild(btn);
  }
  go("detail");
}

function copyContact() {
  const d = loadItems().find((x) => x.id === currentDetailId);
  if (!d) return;
  const text = d.contact;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => showToast("已复制联系方式"),
      () => fallbackCopy(text),
    );
  } else fallbackCopy(text);
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    showToast("已复制");
  } catch (e) {
    showToast("复制失败");
  }
  document.body.removeChild(ta);
}

// ====== toast ======
let toastTimer;
function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// ====== 启动 ======
renderEmojiPicker();
renderHome();
