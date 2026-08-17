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
