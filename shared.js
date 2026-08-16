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

  queue(payload) {
    const pending = JSON.parse(localStorage.getItem(this.QUEUE_KEY) || "[]");
    pending.push(payload);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(pending));
  },

  async sendOrQueue(payload) {
    try {
      await this.post(payload);
    } catch {
      this.queue(payload);
    }
  },

  async flushQueue() {
    const pending = JSON.parse(localStorage.getItem(this.QUEUE_KEY) || "[]");
    if (pending.length === 0) return;
    localStorage.removeItem(this.QUEUE_KEY);
    for (const payload of pending) {
      await this.sendOrQueue(payload);
    }
  },
};
