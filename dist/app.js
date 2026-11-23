const toggle = document.querySelector("#toggle");
const nav = document.querySelector("#nav");
function menu(open) {
  nav.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Close" : "Menu";
}
toggle.addEventListener("click", () => menu(!nav.classList.contains("open")));
nav.addEventListener("click", () => menu(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    menu(false);
    toggle.focus();
  }
});
const more = document.querySelector("#more");
more.addEventListener("click", () => {
  const expanded = more.getAttribute("aria-expanded") !== "true";
  document
    .querySelectorAll("[data-extra]")
    .forEach((card) => (card.hidden = !expanded));
  more.setAttribute("aria-expanded", String(expanded));
  more.textContent = expanded
    ? "Show featured products"
    : "View all 8 products";
  if (expanded) document.querySelector("[data-extra] a").focus();
  else document.querySelector("#products").scrollIntoView();
});
document.querySelector("#year").textContent = new Date().getFullYear();
const motion = matchMedia("(prefers-reduced-motion: no-preference)");
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (motion.matches) entry.target.classList.add("appear");
        if (entry.target.matches(".journey li"))
          entry.target.classList.add("active");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);
document
  .querySelectorAll("h1, .photo, .slab h2, .journey li")
  .forEach((el) => observer.observe(el));
const progress = document.querySelector("#progress");
const header = document.querySelector("header");
let frame = 0;
function refresh() {
  frame = 0;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
  header.classList.toggle("scrolled", scrollY > 8);
}
addEventListener(
  "scroll",
  () => {
    if (!frame) frame = requestAnimationFrame(refresh);
  },
  { passive: true },
);
refresh();
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  document.querySelectorAll(".button,.navcta").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      if (!motion.matches) return;
      const rect = button.getBoundingClientRect();
      button.style.translate =
        (event.clientX - rect.left - rect.width / 2) * 0.035 +
        "px " +
        (event.clientY - rect.top - rect.height / 2) * 0.065 +
        "px";
    });
    button.addEventListener(
      "pointerleave",
      () => (button.style.translate = ""),
    );
  });
}
