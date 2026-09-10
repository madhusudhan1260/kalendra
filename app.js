(() => {
  "use strict";

  /* ---------------- Storage ---------------- */
  const STORAGE_KEY = "kalendra_items_v1";
  const THEME_KEY = "kalendra_theme";

  const loadItems = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : seedData();
    } catch {
      return seedData();
    }
  };

  const saveItems = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* storage unavailable — app still works for the session */
    }
  };

  function seedData() {
    const today = new Date();
    const fmt = (d) => toDateStr(d);
    const inDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d;
    };
    return [
      {
        id: uid(),
        type: "event",
        title: "Team Sync",
        date: fmt(inDays(1)),
        time: "10:30",
        notes: "Weekly planning call",
        color: "#6366f1",
        repeatYearly: false,
        done: false,
      },
      {
        id: uid(),
        type: "birthday",
        title: "Aarav's Birthday",
        date: fmt(inDays(4)),
        time: "",
        notes: "",
        color: "#ec4899",
        repeatYearly: true,
        done: false,
      },
      {
        id: uid(),
        type: "task",
        title: "Renew passport",
        date: fmt(today),
        time: "",
        notes: "Check expiry date before booking travel",
        color: "#10b981",
        repeatYearly: false,
        done: false,
      },
    ];
  }

  /* ---------------- Helpers ---------------- */
  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseDateStr(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function formatFriendly(d) {
    return `${WEEKDAYS[d.getDay()]}, ${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`;
  }

  function formatTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }

  function typeIcon(type) {
    return type === "birthday" ? "🎂" : type === "task" ? "✅" : "🎯";
  }

  /* Does an item occur on the given Date object? */
  function occursOn(item, date) {
    const itemDate = parseDateStr(item.date);
    if (item.repeatYearly) {
      return itemDate.getMonth() === date.getMonth() && itemDate.getDate() === date.getDate();
    }
    return isSameDay(itemDate, date);
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function itemsOnDate(date) {
    return state.items
      .filter((it) => occursOn(it, date))
      .sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });
  }

  /* Next occurrence of an item on/after `from` (Date), within `withinDays` */
  function nextOccurrence(item, from) {
    const base = parseDateStr(item.date);
    if (!item.repeatYearly) {
      return base >= startOfDay(from) ? base : null;
    }
    let candidate = new Date(from.getFullYear(), base.getMonth(), base.getDate());
    if (candidate < startOfDay(from)) {
      candidate = new Date(from.getFullYear() + 1, base.getMonth(), base.getDate());
    }
    return candidate;
  }

  /* ---------------- State ---------------- */
  const state = {
    items: [],
    viewDate: new Date(),
    selectedDate: startOfDay(new Date()),
    view: "month",
    editingId: null,
    activeType: "event",
    activeColor: "#6366f1",
  };

  /* ---------------- DOM refs ---------------- */
  const el = (id) => document.getElementById(id);
  const monthLabel = el("monthLabel");
  const weekdayRow = el("weekdayRow");
  const monthGrid = el("monthGrid");
  const agendaView = el("agendaView");
  const agendaList = el("agendaList");
  const dayItemsEl = el("dayItems");
  const selectedDayTitle = el("selectedDayTitle");
  const upcomingList = el("upcomingList");
  const sheetBackdrop = el("sheetBackdrop");
  const daySheet = el("daySheet");
  const sheetDayTitle = el("sheetDayTitle");
  const sheetDayItems = el("sheetDayItems");
  const modalBackdrop = el("modalBackdrop");
  const itemForm = el("itemForm");
  const modalTitle = el("modalTitle");
  const toastEl = el("toast");

  /* ---------------- Rendering ---------------- */
  function renderWeekdays() {
    weekdayRow.innerHTML = WEEKDAYS.map((w) => `<span>${w}</span>`).join("");
  }

  function chipHtml(item) {
    const label = item.type === "birthday" ? `🎂 ${item.title}` : item.type === "task" ? `${item.done ? "✓ " : ""}${item.title}` : item.title;
    const doneClass = item.type === "task" && item.done ? "done" : "";
    return `<div class="chip task ${doneClass}" style="background:${item.color}" data-id="${item.id}" title="${escapeAttr(item.title)}"><span>${escapeHtml(label)}</span></div>`;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function renderMonth() {
    const year = state.viewDate.getFullYear();
    const month = state.viewDate.getMonth();
    monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    const today = startOfDay(new Date());
    let html = "";
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + i);
      const outside = cellDate.getMonth() !== month;
      const isToday = isSameDay(cellDate, today);
      const isSelected = isSameDay(cellDate, state.selectedDate);
      const items = itemsOnDate(cellDate);
      const visible = items.slice(0, 3);
      const extra = items.length - visible.length;

      html += `<div class="day-cell ${outside ? "outside" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "selected" : ""}" data-date="${toDateStr(cellDate)}">
        <span class="day-num">${cellDate.getDate()}</span>
        <div class="day-chips">
          ${visible.map(chipHtml).join("")}
          ${extra > 0 ? `<span class="more-chip">+${extra} more</span>` : ""}
        </div>
      </div>`;
    }
    monthGrid.innerHTML = html;
  }

  function itemCardHtml(item, opts = {}) {
    const occ = opts.date || parseDateStr(item.date);
    const metaParts = [];
    if (item.type === "birthday") {
      const years = occ.getFullYear() - parseDateStr(item.date).getFullYear();
      metaParts.push(years > 0 ? `Turns ${years}` : "Birthday");
    } else if (item.time) {
      metaParts.push(formatTime(item.time));
    } else {
      metaParts.push("All day");
    }
    if (opts.showDate) metaParts.unshift(formatFriendly(occ));

    const checkHtml = item.type === "task"
      ? `<div class="item-check ${item.done ? "checked" : ""}" data-check="${item.id}">${item.done ? "✓" : ""}</div>`
      : `<div class="item-check" style="border-color:transparent;display:flex;align-items:center;justify-content:center;font-size:14px;">${typeIcon(item.type)}</div>`;

    return `<div class="item-card" data-edit="${item.id}">
      <div class="item-color" style="background:${item.color}"></div>
      ${checkHtml}
      <div class="item-body">
        <div class="item-title ${item.done ? "done" : ""}">${escapeHtml(item.title)}</div>
        <div class="item-meta">${metaParts.join(" · ")}</div>
        ${item.notes ? `<div class="item-notes">${escapeHtml(item.notes)}</div>` : ""}
      </div>
    </div>`;
  }

  function renderDayPanel() {
    const isToday = isSameDay(state.selectedDate, startOfDay(new Date()));
    const title = isToday ? "Today" : formatFriendly(state.selectedDate);
    selectedDayTitle.textContent = title;
    sheetDayTitle.textContent = title;

    const items = itemsOnDate(state.selectedDate);
    const html = items.length
      ? items.map((it) => itemCardHtml(it, { date: state.selectedDate })).join("")
      : `<p class="empty-hint">No items yet. Tap "Add" to create one.</p>`;
    dayItemsEl.innerHTML = html;
    sheetDayItems.innerHTML = html;
  }

  function renderUpcoming() {
    const today = startOfDay(new Date());
    const upcoming = state.items
      .map((item) => ({ item, occ: nextOccurrence(item, today) }))
      .filter((x) => x.occ)
      .sort((a, b) => a.occ - b.occ || (a.item.time || "").localeCompare(b.item.time || ""))
      .slice(0, 8);

    upcomingList.innerHTML = upcoming.length
      ? upcoming.map(({ item, occ }) => itemCardHtml(item, { date: occ, showDate: true })).join("")
      : `<p class="empty-hint">Nothing coming up.</p>`;
  }

  function renderAgenda() {
    const today = startOfDay(new Date());
    const days = [];
    for (let i = 0; i < 45; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const items = itemsOnDate(d);
      if (items.length) days.push({ date: d, items });
    }

    agendaList.innerHTML = days.length
      ? days.map(({ date, items }) => `
        <div class="agenda-group">
          <div class="agenda-date">${isSameDay(date, today) ? "Today · " : ""}${formatFriendly(date)}</div>
          ${items.map((it) => itemCardHtml(it, { date })).join("")}
        </div>
      `).join("")
      : `<p class="agenda-empty">No upcoming items in the next 45 days.</p>`;
  }

  function renderAll() {
    renderMonth();
    renderDayPanel();
    renderUpcoming();
    renderAgenda();
  }

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2200);
  }

  /* ---------------- Modal ---------------- */
  const typeTabs = document.querySelectorAll(".type-tab");
  const timeField = el("timeField");
  const repeatField = el("repeatField");
  const itemRepeat = el("itemRepeat");
  const colorPicker = el("colorPicker");
  const deleteBtn = el("deleteBtn");

  function openModal({ editId = null, date = null } = {}) {
    state.editingId = editId;
    itemForm.reset();
    deleteBtn.hidden = true;
    modalTitle.textContent = "New item";

    let type = "event";
    let color = "#6366f1";
    const dateVal = date ? toDateStr(date) : toDateStr(state.selectedDate);
    el("itemDate").value = dateVal;

    if (editId) {
      const item = state.items.find((i) => i.id === editId);
      if (item) {
        type = item.type;
        color = item.color;
        el("itemId").value = item.id;
        el("itemTitle").value = item.title;
        el("itemDate").value = item.date;
        el("itemTime").value = item.time || "";
        el("itemNotes").value = item.notes || "";
        itemRepeat.checked = !!item.repeatYearly;
        modalTitle.textContent = "Edit item";
        deleteBtn.hidden = false;
      }
    }

    setActiveType(type);
    setActiveColor(color);
    modalBackdrop.classList.add("visible");
    setTimeout(() => el("itemTitle").focus(), 50);
  }

  function closeModal() {
    modalBackdrop.classList.remove("visible");
    state.editingId = null;
  }

  function setActiveType(type) {
    state.activeType = type;
    typeTabs.forEach((t) => t.classList.toggle("active", t.dataset.type === type));
    timeField.style.display = type === "birthday" ? "none" : "";
    repeatField.hidden = type !== "birthday";
    if (type === "birthday") itemRepeat.checked = true;
  }

  function setActiveColor(color) {
    state.activeColor = color;
    colorPicker.querySelectorAll(".swatch").forEach((s) => s.classList.toggle("active", s.dataset.color === color));
  }

  typeTabs.forEach((tab) => tab.addEventListener("click", () => setActiveType(tab.dataset.type)));
  colorPicker.querySelectorAll(".swatch").forEach((s) => s.addEventListener("click", () => setActiveColor(s.dataset.color)));

  itemForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = el("itemTitle").value.trim();
    const date = el("itemDate").value;
    if (!title || !date) return;

    const payload = {
      type: state.activeType,
      title,
      date,
      time: state.activeType === "birthday" ? "" : el("itemTime").value,
      notes: el("itemNotes").value.trim(),
      color: state.activeColor,
      repeatYearly: state.activeType === "birthday" ? itemRepeat.checked : false,
    };

    if (state.editingId) {
      const idx = state.items.findIndex((i) => i.id === state.editingId);
      if (idx > -1) state.items[idx] = { ...state.items[idx], ...payload };
      showToast("Saved changes");
    } else {
      state.items.push({ id: uid(), done: false, ...payload });
      showToast("Item added");
    }
    saveItems();
    closeModal();
    renderAll();
  });

  deleteBtn.addEventListener("click", () => {
    if (!state.editingId) return;
    state.items = state.items.filter((i) => i.id !== state.editingId);
    saveItems();
    closeModal();
    renderAll();
    showToast("Item deleted");
  });

  el("cancelBtn").addEventListener("click", closeModal);
  el("modalCloseBtn").addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });

  /* ---------------- Day sheet (mobile) ---------------- */
  function openDaySheet() {
    if (window.innerWidth > 760) return;
    sheetBackdrop.classList.add("visible");
    daySheet.classList.add("visible");
  }
  function closeDaySheet() {
    sheetBackdrop.classList.remove("visible");
    daySheet.classList.remove("visible");
  }
  el("sheetCloseBtn").addEventListener("click", closeDaySheet);
  sheetBackdrop.addEventListener("click", closeDaySheet);

  /* ---------------- Delegated clicks ---------------- */
  function handleItemAreaClick(e) {
    const checkTarget = e.target.closest("[data-check]");
    if (checkTarget) {
      const item = state.items.find((i) => i.id === checkTarget.dataset.check);
      if (item) {
        item.done = !item.done;
        saveItems();
        renderAll();
      }
      return;
    }
    const editTarget = e.target.closest("[data-edit]");
    if (editTarget) {
      openModal({ editId: editTarget.dataset.edit });
    }
  }
  dayItemsEl.addEventListener("click", handleItemAreaClick);
  sheetDayItems.addEventListener("click", handleItemAreaClick);
  upcomingList.addEventListener("click", handleItemAreaClick);
  agendaList.addEventListener("click", handleItemAreaClick);

  monthGrid.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-id]");
    if (chip) {
      openModal({ editId: chip.dataset.id });
      return;
    }
    const cell = e.target.closest(".day-cell");
    if (!cell) return;
    state.selectedDate = parseDateStr(cell.dataset.date);
    renderMonth();
    renderDayPanel();
    openDaySheet();
  });

  /* ---------------- Navigation ---------------- */
  el("prevBtn").addEventListener("click", () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
    renderMonth();
  });
  el("nextBtn").addEventListener("click", () => {
    state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
    renderMonth();
  });
  el("todayBtn").addEventListener("click", () => {
    state.viewDate = new Date();
    state.selectedDate = startOfDay(new Date());
    renderAll();
  });

  el("addBtn").addEventListener("click", () => openModal({ date: state.selectedDate }));
  el("mobileAddBtn").addEventListener("click", () => openModal({ date: state.selectedDate }));

  /* ---------------- View switching ---------------- */
  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    document.querySelectorAll(".mtab[data-view]").forEach((b) => b.classList.toggle("active", b.dataset.view === view));

    if (view === "agenda") {
      monthGrid.style.display = "none";
      weekdayRow.style.display = "none";
      agendaView.hidden = false;
      renderAgenda();
    } else {
      monthGrid.style.display = "grid";
      weekdayRow.style.display = "grid";
      agendaView.hidden = true;
    }

    if (view === "day") {
      state.selectedDate = startOfDay(new Date());
      state.viewDate = new Date();
      renderMonth();
      renderDayPanel();
      openDaySheet();
      setView("month");
    }
  }

  document.querySelectorAll(".view-btn").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  document.querySelectorAll(".mtab[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  /* ---------------- Theme ---------------- */
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function currentEffectiveTheme() {
    const explicit = document.documentElement.getAttribute("data-theme");
    if (explicit) return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  el("themeBtn").addEventListener("click", () => {
    const next = currentEffectiveTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  /* ---------------- Init ---------------- */
  function init() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) applyTheme(savedTheme);

    state.items = loadItems();
    if (!localStorage.getItem(STORAGE_KEY)) saveItems();

    renderWeekdays();
    renderAll();
  }

  init();
})();
