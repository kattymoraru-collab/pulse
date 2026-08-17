const PULSE = {
  ENDPOINT: "https://script.google.com/macros/s/AKfycby_d1m7ImyO6uVnF5s4jVo7tvOoiqGprNnBnthBcWBOkC4zn3JmezFpcuhrPHsuN97fGw/exec",
  LANG_KEY: "pulse-lang",
  QUEUE_KEY: "pulse-pending",

  language: localStorage.getItem("pulse-lang") === "en" ? "en" : "nl",

  toggleLanguage() {
    this.language = this.language === "nl" ? "en" : "nl";
    localStorage.setItem(this.LANG_KEY, this.language);
    return this.language;
  },

  applyCopy(copy) {
    const strings = copy[this.language];
    document.documentElement.lang = this.language;
    document.querySelectorAll("[data-copy]").forEach((node) => {
      const value = strings[node.dataset.copy];
      if (value !== undefined) node.textContent = value;
    });
    const toggle = document.getElementById("lang");
    if (toggle) toggle.textContent = this.language === "nl" ? "EN" : "NL";
    this.renderNav();
  },

  NAV: [
    { href: "index.html", key: "home", nl: "Start", en: "Home",
      icon: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/>' },
    { href: "campus.html", key: "map", nl: "Kaart", en: "Map",
      icon: '<path d="M12 21c-4.5-4-7-7.6-7-11a7 7 0 0 1 14 0c0 3.4-2.5 7-7 11z"/><circle cx="12" cy="10" r="2.5"/>' },
    { href: "quiz.html", key: "quiz", nl: "Quiz", en: "Quiz",
      icon: '<path d="M13 3 5 14h5.5L11 21l8-11h-5.5L13 3z"/>' },
    { href: "leaderboard.html", key: "board", nl: "Scores", en: "Scores",
      icon: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5H5v2a3 3 0 0 0 3 3"/><path d="M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 13v4"/><path d="M8.5 20h7"/>' },
    { href: "survey.html", key: "survey", nl: "Vragen", en: "Survey",
      icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8.5 12 2.5 2.5 4.5-5"/>' },
  ],

  // Correctness always dominates: a correct answer is worth 100 points and the
  // speed bonus never exceeds 99, so speed only separates players with the same
  // number right. The bonus fades linearly to zero over ten minutes.
  quizPoints(score, durationSec) {
    const speed = Math.max(0, 1 - durationSec / 600);
    return score * 100 + Math.round(99 * speed);
  },

  nav(active) {
    this.activeTab = active;
    document.body.classList.add("has-tabbar");
    const bar = document.createElement("nav");
    bar.className = "tabbar";
    bar.setAttribute("aria-label", "Site");
    document.body.append(bar);
    this.renderNav();
  },

  renderNav() {
    const bar = document.querySelector(".tabbar");
    if (!bar) return;
    bar.innerHTML = this.NAV.map((item) =>
      `<a href="${item.href}"${item.key === this.activeTab ? ' aria-current="page"' : ""}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.icon}</svg>
        ${item[this.language]}</a>`
    ).join("");
  },

  async post(payload) {
    await fetch(this.ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  },

  newId() {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + "-" + Math.random().toString(16).slice(2);
  },

  readQueue() {
    try {
      return JSON.parse(localStorage.getItem(this.QUEUE_KEY)) || [];
    } catch {
      return [];
    }
  },

  writeQueue(pending) {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(pending));
  },

  // The no-cors response is opaque, so a resolved fetch is the only delivery
  // signal and a thrown one may still have reached the server. Every payload
  // therefore carries a clientId, stays queued until a fetch resolves, and the
  // backend drops clientIds it has already seen.
  async sendOrQueue(payload) {
    payload.clientId = payload.clientId || this.newId();
    this.writeQueue(this.readQueue().concat([payload]));
    await this.flushQueue();
  },

  async flushQueue() {
    const pending = this.readQueue();
    if (pending.length === 0) return;
    const remaining = [];
    for (const payload of pending) {
      try {
        await this.post(payload);
      } catch {
        remaining.push(payload);
      }
    }
    this.writeQueue(remaining);
  },
};
