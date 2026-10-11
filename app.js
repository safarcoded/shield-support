(() => {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    }));
  }

  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav] a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === page) link.setAttribute("aria-current", "page");
  });
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  const demoForm = document.querySelector("[data-demo-form]");
  if (demoForm) {
    demoForm.addEventListener("submit", event => {
      event.preventDefault();
      const status = document.querySelector("[data-form-status]");
      if (status) {
        status.classList.add("show");
        status.setAttribute("role", "status");
        status.textContent = "This demonstration form does not send or save information. Please do not enter real personal or case details. A secure contact process must be established before applications open.";
      }
      demoForm.reset();
    });
  }
})();
