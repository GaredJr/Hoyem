const byId = (id) => document.getElementById(id);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector(".hero");
const sculpture = document.querySelector(".sculpture");
// Project the same folded band as the static illustration. Scroll twists the
// band and pointer movement turns it slightly around its vertical axis.
const canvas = sculpture.querySelector("canvas");
const ink = canvas.getContext("2d");
const samples = Array.from({length: 121}, (_, i) => {
  const t = i * Math.PI / 60;
  return {x: Math.cos(t), y: Math.sin(t), c: Math.cos(t + .35),
    s: Math.sin(t + .35), wave: .55 * Math.sin(2 * t + .6)};
});
let pointer = 0;
let twist = -.8;
let yaw = -.3;
let frame = 0;
function drawFold() {
  frame = 0;
  if (reducedMotion.matches || !ink || document.hidden) {
    sculpture.classList.remove("is-live");
    return;
  }
  const bounds = hero.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
  const target = Math.max(0, -bounds.top / bounds.height) * 1.8;
  twist += (target - twist) * .085;
  yaw += (pointer - yaw) * .085;
  const width = Math.max(1, Math.round(sculpture.clientWidth * Math.min(devicePixelRatio, 2)));
  if (canvas.width !== width) {
    canvas.width = width;
    canvas.height = Math.round(width * 400 / 560);
  }
  ink.setTransform(width / 560, 0, 0, canvas.height / 400, 0, 0);
  ink.clearRect(0, 0, 560, 400);
  ink.beginPath();
  const ct = Math.cos(twist), st = Math.sin(twist);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  for (let line = 0; line < 104; line++) {
    const v = (line / 103 - .5) * 1.4;
    for (let i = 0; i < samples.length; i++) {
      const pt = samples[i];
      const radius = 1.42 + v * (pt.c * ct - pt.s * st);
      const x = radius * pt.x, y = radius * pt.y;
      const z = v * (pt.s * ct + pt.c * st) + pt.wave;
      const px = 280 + 112 * (x * cy + z * sy + .16 * y);
      const py = 201 + 96 * (.42 * y - z * cy + x * sy - .36 * x);
      if (i === 0) ink.moveTo(px, py);
      else ink.lineTo(px, py);
    }
    ink.closePath();
  }
  ink.strokeStyle = "#252623";
  ink.lineWidth = .94;
  ink.stroke();
  sculpture.classList.add("is-live");
  if (Math.abs(target - twist) + Math.abs(pointer - yaw) > .001) scheduleFold();
}
function scheduleFold() {
  if (!frame) frame = requestAnimationFrame(drawFold);
}
hero.addEventListener("pointermove", event => {
  if (event.pointerType !== "mouse" || reducedMotion.matches) return;
  const bounds = hero.getBoundingClientRect();
  pointer = ((event.clientX - bounds.left) / bounds.width - .5) * .65;
  scheduleFold();
});
hero.addEventListener("pointerleave", () => { pointer = 0; scheduleFold(); });
addEventListener("scroll", scheduleFold, {passive: true});
addEventListener("resize", scheduleFold);
document.addEventListener("visibilitychange", scheduleFold);
reducedMotion.addEventListener("change", scheduleFold);
scheduleFold();

if ("IntersectionObserver" in window) {
  const entrances = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in-view");
      entrances.unobserve(entry.target);
    }
  }, {threshold: .1});
  document.querySelectorAll(".section-line, .feature, .about").forEach(section => entrances.observe(section));
}

const stackLayout = matchMedia("(min-width: 780px) and (min-height: 660px) and (prefers-reduced-motion: no-preference)");
const firstProject = document.querySelector(".managetic");
const nextProject = document.querySelector(".blobdle");
let stackFrame = 0;
function updateStack() {
  stackFrame = 0;
  if (!stackLayout.matches) return;
  // Measure the incoming sheet, independent of the outgoing sheet's scale.
  const height = firstProject.offsetHeight;
  const distance = nextProject.getBoundingClientRect().top - 24;
  const overlap = Math.max(0, Math.min(1, 1 - distance / height));
  firstProject.style.setProperty("--overlap", overlap.toFixed(4));
}
function scheduleStack() {
  if (!stackFrame && stackLayout.matches) stackFrame = requestAnimationFrame(updateStack);
}
addEventListener("scroll", scheduleStack, {passive: true});
addEventListener("resize", scheduleStack);
stackLayout.addEventListener("change", scheduleStack);
scheduleStack();

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
