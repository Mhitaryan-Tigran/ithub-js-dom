import cats from "./cats.js";

const list = document.getElementById("cats");
const sheet = document.getElementById("sheet");
const state = { filter: "all", sort: "rate" };

function ageText(age) {
  const n10 = age % 10;
  const n100 = age % 100;
  let word = "лет";
  if (n10 === 1 && n100 !== 11) word = "год";
  else if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) word = "года";
  return `${age} ${word}`;
}

function stars(rate) {
  const value = rate / 2;
  const box = document.createElement("p");
  box.className = "stars";
  box.setAttribute("aria-label", `Рейтинг ${rate} из 10`);
  for (let i = 1; i <= 5; i++) {
    const full = value >= i;
    const half = !full && value >= i - 0.5;
    const span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    if (half) {
      span.className = "star-half";
      span.innerHTML = '<svg><use href="#star"/></svg><svg><use href="#star"/></svg>';
    } else {
      span.className = full ? "" : "off";
      span.innerHTML = '<svg><use href="#star"/></svg>';
    }
    box.append(span);
  }
  const score = document.createElement("span");
  score.className = "score";
  score.textContent = `${rate}/10`;
  box.append(score);
  return box;
}

function photo(cat, img) {
  img.src = cat.img_link;
  img.alt = cat.name;
  img.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "fallback";
    fallback.textContent = cat.name[0];
    img.replaceWith(fallback);
  });
}

function card(cat, index) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = cat.favourite ? "cat is-fav" : "cat";
  button.style.setProperty("--i", index);
  button.setAttribute("aria-label", `${cat.name}, ${ageText(cat.age)}${cat.favourite ? ", любимец приюта" : ""}`);

  const figure = document.createElement("div");
  figure.className = "photo";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.decoding = "async";
  photo(cat, img);
  figure.append(img);
  if (cat.favourite) {
    const fav = document.createElement("span");
    fav.className = "fav";
    fav.innerHTML = '<svg><use href="#heart"/></svg>Любимец';
    figure.append(fav);
  }

  const info = document.createElement("div");
  info.className = "info";
  const name = document.createElement("h2");
  name.className = "name";
  name.textContent = cat.name;
  const age = document.createElement("p");
  age.className = "age";
  age.textContent = ageText(cat.age);
  info.append(name, age, stars(cat.rate));

  button.append(figure, info);
  button.addEventListener("click", () => open(cat));
  li.append(button);
  return li;
}

function open(cat) {
  const img = document.getElementById("sheet-img");
  img.src = cat.img_link;
  img.alt = cat.name;
  document.getElementById("sheet-name").textContent = cat.name;
  document.getElementById("sheet-meta").textContent = ageText(cat.age);
  document.getElementById("sheet-badge").hidden = !cat.favourite;
  document.getElementById("sheet-stars").replaceWith(Object.assign(stars(cat.rate), { id: "sheet-stars" }));
  document.getElementById("sheet-desc").textContent = cat.description;
  sheet.showModal();
}

function render() {
  const sorters = {
    rate: (a, b) => b.rate - a.rate || a.name.localeCompare(b.name, "ru"),
    age: (a, b) => a.age - b.age || a.name.localeCompare(b.name, "ru"),
    name: (a, b) => a.name.localeCompare(b.name, "ru"),
  };
  const shown = cats.filter((c) => state.filter === "all" || c.favourite).sort(sorters[state.sort]);
  list.replaceChildren(...shown.map(card));
  document.getElementById("empty").hidden = shown.length > 0;
}

document.querySelectorAll(".segmented button").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".segmented button").forEach((b) => b.setAttribute("aria-checked", String(b === button)));
    render();
  });
});

document.getElementById("sort").addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

sheet.addEventListener("click", (event) => {
  if (event.target === sheet) sheet.close();
});

const favourites = cats.filter((c) => c.favourite).length;
document.getElementById("summary").textContent = `${cats.length} котиков ищут дом, ${favourites} из них — любимцы приюта. Каждый привит, приучен к лотку и ждёт своего человека.`;
render();
