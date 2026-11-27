const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const desktopStack = matchMedia("(min-width: 780px) and (min-height: 660px)");
const hero = document.querySelector(".hero");
const artwork = document.querySelector(".word-art");
const product = document.querySelector(".managetic");
const game = document.querySelector(".blobdle");
const hardware = document.querySelector(".hardware");
let pointerAngle = 0;
let currentAngle = 0;
let frame = 0;

function paintPosters() {
  frame = 0;
  if (reducedMotion.matches) {
    product.style.removeProperty("--sheet-scale");
    product.style.removeProperty("--phone-y");
    return;
  }
  const hardwareTop = hardware.getBoundingClientRect().top;
  const approach = Math.max(0, Math.min(1, hardwareTop / innerHeight));
  hardware.style.setProperty("--device-zoom", 1 + approach * approach * 2.8);
  const bounds = hero.getBoundingClientRect();
  if (bounds.bottom > 0 && bounds.top < innerHeight) {
    const pull = Math.max(0, Math.min(1, -bounds.top / bounds.height));
    currentAngle += (pointerAngle - currentAngle) * .16;
    artwork.style.setProperty("--tilt", currentAngle + "deg");
    artwork.style.setProperty("--pull-x", 112 * pull + "px");
    artwork.style.setProperty("--pull-y", -100 * pull + "px");
    artwork.style.setProperty("--stretch", 1 + pull * .22);
    if (Math.abs(pointerAngle - currentAngle) > .015) schedulePaint();
  }
  const overlap = desktopStack.matches
    ? Math.max(0, Math.min(1, 1 - game.getBoundingClientRect().top / product.offsetHeight))
    : 0;
  product.style.setProperty("--sheet-scale", 1 - overlap * .045);
  product.style.setProperty("--phone-y", -overlap * 34 + "px");
}
function schedulePaint() {
  if (!frame) frame = requestAnimationFrame(paintPosters);
}
hero.addEventListener("pointermove", event => {
  if (event.pointerType !== "mouse" || reducedMotion.matches) return;
  const bounds = hero.getBoundingClientRect();
  pointerAngle = ((event.clientX - bounds.left) / bounds.width - .5) * 6;
  schedulePaint();
});
hero.addEventListener("pointerleave", () => {
  pointerAngle = 0;
  schedulePaint();
});
addEventListener("scroll", schedulePaint, {passive: true});
addEventListener("resize", schedulePaint);
reducedMotion.addEventListener("change", schedulePaint);
schedulePaint();

const bodies = [
  ["Jelly", "49% 57% 43% 38%"], ["Pebble", "59% 47% 44% 55%"],
  ["Droplet", "68% 27% 54% 41%"], ["Pillow", "32% 36% 27% 33%"]
];
const colors = [["Lilac", 260], ["Mint", 155], ["Peach", 20], ["Lemon", 49], ["Sky", 208]];
const auras = [["Soft glow", 34], ["Halo", 62], ["Quiet", 4]];
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const blob = game.querySelector(".blob");
const roll = document.getElementById("roll");
const traits = document.getElementById("traits");

function revealResult() {
  const [body, radius] = pick(bodies);
  const [color, hue] = pick(colors);
  const [aura, glow] = pick(auras);
  blob.style.borderRadius = radius;
  blob.style.setProperty("--glow", glow + "px");
  game.style.setProperty("--hue", hue);
  game.style.setProperty("--light-radius", (38 + glow) + "%");
  traits.replaceChildren();
  for (const trait of [body, color, aura]) {
    if (traits.childNodes.length) traits.append(" · ");
    const word = document.createElement("span");
    word.textContent = trait;
    traits.append(word);
  }
  game.classList.add("has-landed");
}
roll.addEventListener("click", () => {
  if (roll.getAttribute("aria-disabled") === "true") return;
  game.classList.remove("has-landed");
  if (reducedMotion.matches) {
    revealResult();
    return;
  }
  roll.setAttribute("aria-disabled", "true");
  game.classList.add("is-rolling");
  setTimeout(revealResult, 465);
  setTimeout(() => {
    game.classList.remove("is-rolling");
    roll.removeAttribute("aria-disabled");
  }, 700);
});

roll.hidden = false;
const runExample = document.getElementById("run-vx");
const exampleOutput = document.getElementById("vx-result");
// Replay the two log statements from the tested Vortex example.
runExample.addEventListener("click", () => {
  exampleOutput.textContent = "70\nVortex";
  if (!reducedMotion.matches) {
    exampleOutput.animate([{opacity: 0}, {opacity: 1}], {duration: 240});
  }
});
runExample.hidden = false;
