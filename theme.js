(function() {
  const root = document.documentElement;
  const status = document.getElementById("modeStatus");
  if (!status) return;

  function randomColor() {
    let color = "#000000";
    while (color === "#000000") {
      color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    }
    return color;
  }

  let colorMode = false;
  status.addEventListener("click", function() {
    if (colorMode) {
      root.style.setProperty("--bg", "#ffffff");
      status.textContent = "STATIC MODE · v2.8.8";
    } else {
      const color = randomColor();
      root.style.setProperty("--bg", color);
      status.textContent = "COLOR MODE · v2.8.8";
    }
    colorMode = !colorMode;
  });
})();
