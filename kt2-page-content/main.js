import cats from './cats.js'; 

const container = document.getElementById('cats-container');

function createCatCard(cat) {
  const card = document.createElement('article');
  card.className = 'cat-card';

  card.innerHTML = `
    <img src="${cat.img_link}" alt="${cat.name}">
    <div class="cat-content">
      <div class="cat-header">
        <div>
          <div class="cat-name">
            ${cat.name}
            ${cat.favourite ? '<span class="cat-fav">★</span>' : ''}
          </div>
          <div class="cat-age">${cat.age} лет</div>
        </div>
        <div class="cat-rate">
          Рейтинг: <span>${'★'.repeat(cat.rate)}</span>
        </div>
      </div>
      <p class="cat-desc">${cat.description}</p>
    </div>
  `;

  return card;
}

cats.forEach((cat) => {
  const card = createCatCard(cat);
  container.appendChild(card);
});
