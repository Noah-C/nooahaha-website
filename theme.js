(function() {
  const key = "theme";
  const root = document.documentElement;
  const link = document.getElementById("modeToggle");
  if (!link) return;

  const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const saved = localStorage.getItem(key);
  const current = saved || system;
  root.setAttribute("data-theme", current);
  link.textContent = current === "dark" ? "Color Mode" : "Static Mode";
  link.setAttribute("aria-label", current === "dark" ? "Activate static mode" : "Activate color mode");

  link.addEventListener("click", function(e) {
    e.preventDefault();
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem(key, next);
    link.textContent = next === "dark" ? "Color Mode" : "Static Mode";
    link.setAttribute("aria-label", next === "dark" ? "Activate static mode" : "Activate color mode");
  });
})();

