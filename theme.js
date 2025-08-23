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

  function desaturate(hex, amount = 0.8) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = (c) => Math.round(c + (255 - c) * amount)
      .toString(16)
      .padStart(2, "0");
    return `#${mix(r)}${mix(g)}${mix(b)}`;
  }

  let colorMode = false;
  status.addEventListener("click", function() {
    if (colorMode) {
      root.style.setProperty("--bg", "#ffffff");
      root.style.setProperty("--screen-bg", "#ffffff");
      status.textContent = "STATIC MODE · v2.8.8";
    } else {
      const color = randomColor();
      root.style.setProperty("--bg", color);
      root.style.setProperty("--screen-bg", desaturate(color));
      status.textContent = "COLOR MODE · v2.8.8";
    }
    colorMode = !colorMode;
  });
})();
