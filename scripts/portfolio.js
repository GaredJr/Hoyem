const byId = (id) => document.getElementById(id);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector(".hero");
const sculpture = document.querySelector(".sculpture");
hero.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" || reducedMotion.matches) return;
  const bounds = hero.getBoundingClientRect();
  const offset = (event.clientX - bounds.left) / bounds.width - 0.5;
  sculpture.style.setProperty("--turn", (offset * 9) + "deg");
});
hero.addEventListener("pointerleave", () => sculpture.style.removeProperty("--turn"));

const bodies = [
  ["Jelly", "49% 57% 43% 38%"], ["Pebble", "59% 47% 44% 55%"],
  ["Droplet", "68% 27% 54% 41%"], ["Pillow", "32% 36% 27% 33%"]
];
const colors = [["Lilac", 260], ["Mint", 155], ["Peach", 20], ["Lemon", 49], ["Sky", 208]];
const auras = [["Soft glow", 34], ["Halo", 62], ["Quiet", 4]];
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const blob = document.querySelector(".blob");
byId("roll").addEventListener("click", () => {
  const button = byId("roll");
  button.disabled = true;
  blob.classList.add("rolling");
  setTimeout(() => {
    const [body, radius] = pick(bodies);
    const [color, hue] = pick(colors);
    const [aura, glow] = pick(auras);
    blob.style.borderRadius = radius;
    blob.style.setProperty("--hue", hue);
    blob.style.setProperty("--glow", glow + "px");
    byId("traits").textContent = [body, color, aura].join(" · ");
  }, reducedMotion.matches ? 0 : 180);
  setTimeout(() => {
    blob.classList.remove("rolling");
    button.disabled = false;
  }, reducedMotion.matches ? 0 : 520);
});
