const menu = document.getElementById("menu");
const burger = document.getElementById("burger");
const closeButton = document.getElementById("menu-close");
const toast = document.getElementById("toast");
const toastPath = toast.querySelector(".toast__path");
const toastGo = toast.querySelector(".toast__go");
const desktop = window.matchMedia("(min-width: 901px)");
let toastTimer = 0;

menu.querySelectorAll(".menu__link").forEach((link, index) => {
  const sub = link.parentElement.querySelector(":scope > .menu__sub");
  if (sub) {
    sub.id = "submenu-" + (index + 1);
    link.classList.add("menu__link--parent");
    link.setAttribute("role", "button");
    link.setAttribute("aria-expanded", "false");
    link.setAttribute("aria-controls", sub.id);
  } else {
    link.classList.add("menu__link--leaf");
    link.setAttribute("title", "Перейти: " + link.getAttribute("href"));
  }
});

function linkOf(item) {
  return item.querySelector(":scope > .menu__link");
}

function closeItem(item) {
  [item, ...item.querySelectorAll(".menu__item.is-open")].forEach((el) => {
    el.classList.remove("is-open");
    linkOf(el).setAttribute("aria-expanded", "false");
  });
}

function openItem(item) {
  item.parentElement.querySelectorAll(":scope > .menu__item.is-open").forEach(closeItem);
  item.classList.add("is-open");
  linkOf(item).setAttribute("aria-expanded", "true");
}

function syncBackdrop() {
  const openTop = menu.querySelector('.menu__list[data-level="1"] > .menu__item.is-open');
  document.body.classList.toggle("has-dropdown", Boolean(openTop));
}

function closeAll() {
  menu.querySelectorAll(".menu__item.is-open").forEach(closeItem);
  syncBackdrop();
}

function setDrawer(open) {
  menu.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  document.body.classList.toggle("drawer-open", open);
}

function pathOf(link) {
  const names = [];
  let item = link.closest(".menu__item");
  while (item) {
    names.unshift(linkOf(item).textContent.trim());
    item = item.parentElement.closest(".menu__item");
  }
  return names.join(" → ");
}

function showToast(link) {
  toastPath.textContent = pathOf(link);
  toastGo.setAttribute("href", link.getAttribute("href"));
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4000);
}

menu.addEventListener("click", (event) => {
  const link = event.target.closest(".menu__link");
  if (!link) return;
  event.preventDefault();
  const item = link.parentElement;
  if (link.classList.contains("menu__link--parent")) {
    const expanded = link.getAttribute("aria-expanded") === "true";
    expanded ? closeItem(item) : openItem(item);
    if (item.parentElement.dataset.level === "1") syncBackdrop();
  } else {
    showToast(link);
  }
});

menu.addEventListener("keydown", (event) => {
  if (event.key === " " && event.target.classList.contains("menu__link--parent")) {
    event.preventDefault();
    event.target.click();
  }
});

menu.addEventListener("focusout", (event) => {
  const next = event.relatedTarget;
  if (desktop.matches && next && !menu.contains(next)) closeAll();
});

burger.addEventListener("click", () => {
  setDrawer(burger.getAttribute("aria-expanded") !== "true");
});

closeButton.addEventListener("click", () => {
  closeAll();
  setDrawer(false);
  burger.focus();
});

toastGo.addEventListener("click", () => {
  toast.classList.remove("is-visible");
});

document.addEventListener("click", (event) => {
  if (menu.contains(event.target) || burger.contains(event.target)) return;
  closeAll();
  setDrawer(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const drawerOpen = menu.classList.contains("is-open");
  const openTopLink = menu.querySelector('.menu__list[data-level="1"] > .menu__item.is-open > .menu__link');
  closeAll();
  setDrawer(false);
  if (drawerOpen) burger.focus();
  else if (openTopLink) openTopLink.focus();
});

desktop.addEventListener("change", () => {
  closeAll();
  setDrawer(false);
});
