const gnav = document.getElementById("gnav");
const burger = document.getElementById("burger");
const scrim = document.getElementById("scrim");
const mobile = matchMedia("(max-width: 833px)");

function setOpen(item, open) {
  item.classList.toggle("is-open", open);
  item.querySelector(":scope > .node").setAttribute("aria-expanded", String(open));
  if (!open) item.querySelectorAll(".has-sub.is-open").forEach((child) => setOpen(child, false));
}

function closeAll() {
  document.querySelectorAll(".l1 > .has-sub.is-open").forEach((item) => setOpen(item, false));
  scrim.hidden = true;
}

function closeMobile() {
  gnav.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function toggle(node) {
  const item = node.parentElement;
  const open = !item.classList.contains("is-open");
  item.parentElement.querySelectorAll(":scope > .has-sub.is-open").forEach((sibling) => {
    if (sibling !== item) setOpen(sibling, false);
  });
  setOpen(item, open);
  if (node.dataset.level === "1" && !mobile.matches) scrim.hidden = !open;
}

function trail(link) {
  const names = [link.querySelector("span").textContent];
  let item = link.closest(".has-sub");
  while (item) {
    names.unshift(item.querySelector(":scope > .node span").textContent);
    item = item.parentElement.closest(".has-sub");
  }
  return names;
}

function follow(link) {
  const names = trail(link);
  document.getElementById("path").replaceChildren(...["Вольт", ...names.slice(0, -1)].map((name) => Object.assign(document.createElement("li"), { textContent: name })));
  document.getElementById("result-title").textContent = names.at(-1);
  document.getElementById("result-href").textContent = link.getAttribute("href");
  const siblings = [...link.closest("ul").querySelectorAll(":scope > li > .leaf")].filter((a) => a !== link);
  document.getElementById("siblings").replaceChildren(...siblings.map((a) => {
    const chip = document.createElement("a");
    chip.href = a.getAttribute("href");
    chip.textContent = a.querySelector("span").textContent;
    chip.addEventListener("click", (event) => {
      event.preventDefault();
      follow(a);
    });
    return chip;
  }));
  const result = document.getElementById("result");
  result.hidden = false;
  result.style.animation = "none";
  void result.offsetWidth;
  result.style.animation = "";
  history.replaceState(null, "", link.getAttribute("href"));
  closeAll();
  closeMobile();
  result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
}

document.getElementById("menu").addEventListener("click", (event) => {
  const node = event.target.closest(".node");
  if (node) return toggle(node);
  const link = event.target.closest(".leaf");
  if (link) {
    event.preventDefault();
    follow(link);
  }
});

document.querySelectorAll(".leaf").forEach((link) => {
  link.title = `Ссылка: ${link.getAttribute("href")}`;
});

burger.addEventListener("click", () => {
  const open = !gnav.classList.contains("is-open");
  gnav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
  if (!open) closeAll();
});

scrim.addEventListener("click", closeAll);

document.addEventListener("click", (event) => {
  if (!gnav.contains(event.target) && !mobile.matches) closeAll();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const open = [...document.querySelectorAll(".has-sub.is-open")].at(-1);
  if (open) {
    setOpen(open, false);
    open.querySelector(":scope > .node").focus();
    if (!document.querySelector(".l1 > .has-sub.is-open")) scrim.hidden = true;
  } else {
    closeMobile();
  }
});

mobile.addEventListener("change", () => {
  closeAll();
  closeMobile();
});

const initial = [...document.querySelectorAll(".leaf")].find((a) => a.getAttribute("href") === location.hash);
if (initial) follow(initial);
