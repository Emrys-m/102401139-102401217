/* ============================================================
 * data.js —— 数据层：localStorage 读写 + 纯函数
 * ============================================================ */

const STORAGE_KEY = "lost_found_items_v2";
const OWNER_FLAG = "me";

/** 可用 emoji */
const EMOJIS = [
  "💳",
  "🔑",
  "📱",
  "🎧",
  "☂️",
  "📚",
  "💧",
  "🧢",
  "🎒",
  "🪪",
  "🔌",
  "📦",
];

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedData();
      saveItems(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function genId() {
  return "it_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

function validateItem(d) {
  if (!d.title || !d.title.trim())
    return { valid: false, msg: "请填写物品名称" };
  if (!d.place || !d.place.trim()) return { valid: false, msg: "请填写地点" };
  if (!d.time || !d.time.trim()) return { valid: false, msg: "请填写时间" };
  if (!d.contact || !d.contact.trim())
    return { valid: false, msg: "请填写联系方式" };
  return { valid: true, msg: "" };
}

function addItem(d) {
  const items = loadItems();
  const item = {
    id: genId(),
    type: d.type,
    emoji: d.emoji || "📦",
    title: d.title.trim(),
    desc: (d.desc || "").trim(),
    place: d.place.trim(),
    time: d.time.trim(),
    contact: d.contact.trim(),
    status: "open",
    owner: OWNER_FLAG,
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  saveItems(items);
  return item;
}

function updateStatus(id, status) {
  const items = loadItems();
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return false;
  items[idx].status = status;
  saveItems(items);
  return true;
}

function searchItems(items, kw) {
  if (!kw || !kw.trim()) return [];
  const k = kw.trim().toLowerCase();
  return items.filter(
    (it) =>
      it.title.toLowerCase().includes(k) ||
      (it.desc || "").toLowerCase().includes(k) ||
      it.place.toLowerCase().includes(k),
  );
}

function filterByType(items, type) {
  if (!type || type === "all") return items.slice();
  return items.filter((it) => it.type === type);
}

function getMyItems() {
  return loadItems().filter((it) => it.owner === OWNER_FLAG);
}

function seedData() {
  const now = Date.now();
  const mk = (offsetMin, o) =>
    Object.assign(
      {
        id: "seed_" + offsetMin,
        status: "open",
        owner: "",
        createdAt: new Date(now - offsetMin * 60000).toISOString(),
        desc: "",
      },
      o,
    );
  return [
    mk(30, {
      type: "lost",
      emoji: "💳",
      title: "蓝色校园卡",
      desc: "尾号8821，贴有库洛米贴纸",
      place: "第一食堂三楼",
      time: "09-27 13:50",
      contact: "微信 student_2024",
    }),
    mk(120, {
      type: "found",
      emoji: "🎧",
      title: "白色蓝牙耳机",
      desc: "AirPods Pro，左耳有磨损痕迹",
      place: "图书馆2楼",
      time: "09-27 11:20",
      contact: "QQ 123456789",
    }),
    mk(300, {
      type: "lost",
      emoji: "☂️",
      title: "黑色折叠伞",
      desc: "左伞骨有点歪，长柄黑伞",
      place: "运动场看台下",
      time: "09-26 18:30",
      contact: "微信 umbrella_09",
    }),
    mk(600, {
      type: "found",
      emoji: "🔑",
      title: "一串钥匙",
      desc: "共3把钥匙，带小熊挂件",
      place: "宿舍B区门口",
      time: "09-26 16:00",
      contact: "电话 138****2210",
      status: "done",
    }),
    mk(1440, {
      type: "lost",
      emoji: "📚",
      title: "《软件工程》教材",
      desc: "封面有笔记，扉页写了名字",
      place: "第二教学楼402",
      time: "09-25 10:15",
      contact: "微信 book_hunter",
    }),
  ];
}

/* ====== 搜索历史 ====== */
const HISTORY_KEY = "lost_found_history_v1";
const MAX_HISTORY = 10;

function getSearchHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addSearchHistory(kw) {
  if (!kw || !kw.trim()) return;
  const k = kw.trim();
  let list = getSearchHistory();
  list = list.filter((x) => x !== k); // 去重
  list.unshift(k); // 最新在前
  if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    STORAGE_KEY,
    EMOJIS,
    loadItems,
    saveItems,
    genId,
    validateItem,
    addItem,
    updateStatus,
    searchItems,
    filterByType,
    getMyItems,
    seedData,
    getSearchHistory,
    addSearchHistory,
    clearSearchHistory,
  };
}
