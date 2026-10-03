const hero = document.querySelector('.hero');
const canvas = document.getElementById('steam');
const context = canvas.getContext('2d');
const cup = document.getElementById('cup');
const heroCopy = document.getElementById('hero-copy');
const steamState = document.getElementById('steam-state');

let steamOn = !reduceMotion;
let particles = [];
const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
const pose = { angle: 0, lift: 0, targetAngle: 0, targetLift: 0 };

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function puff(x, y, spread) {
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * spread,
    vy: -0.4 - Math.random() * 0.8,
    radius: 4 + Math.random() * 8,
    life: 1,
    wave: Math.random() * Math.PI * 2
  });
  if (particles.length > 400) particles.shift();
}

function cupTop() {
  const cupRect = cup.getBoundingClientRect();
  const heroRect = canvas.getBoundingClientRect();
  return {
    x: cupRect.left - heroRect.left + cupRect.width * 0.47,
    y: cupRect.top - heroRect.top + cupRect.height * 0.3
  };
}

function drawSteam() {
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  particles.forEach((particle) => {
    particle.wave += 0.05;
    particle.x += particle.vx + Math.sin(particle.wave) * 0.3;
    particle.y += particle.vy;
    particle.radius += 0.12;
    particle.life -= 0.01;
  });
  particles = particles.filter((particle) => particle.life > 0);
  particles.forEach((particle) => {
    context.fillStyle = 'rgba(255, 244, 230, ' + particle.life * 0.25 + ')';
    context.beginPath();
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });
}

const run = animationLoop(() => {
  parallax.x = approach(parallax.x, parallax.targetX, 0.08);
  parallax.y = approach(parallax.y, parallax.targetY, 0.08);
  pose.angle = approach(pose.angle, pose.targetAngle, 0.12);
  pose.lift = approach(pose.lift, pose.targetLift, 0.12);

  cup.style.transform = 'translate(' + parallax.x * 40 + 'px, ' + (parallax.y * 30 - pose.lift) + 'px) rotate(' + pose.angle + 'deg)';
  heroCopy.style.transform = 'translate(' + parallax.x * -14 + 'px, ' + parallax.y * -10 + 'px)';

  if (steamOn && Math.random() < 0.6) {
    const top = cupTop();
    puff(top.x + (Math.random() - 0.5) * 50, top.y, 0.4);
  }
  drawSteam();

  const settled = parallax.x === parallax.targetX && parallax.y === parallax.targetY && pose.angle === pose.targetAngle && pose.lift === pose.targetLift;
  return steamOn || particles.length > 0 || !settled;
});

hero.addEventListener('mousemove', (event) => {
  const rect = hero.getBoundingClientRect();
  parallax.targetX = (event.clientX - rect.left) / rect.width - 0.5;
  parallax.targetY = (event.clientY - rect.top) / rect.height - 0.5;
  if (steamOn) puff(event.clientX - rect.left, event.clientY - rect.top, 1.2);
  run();
});

hero.addEventListener('mouseleave', () => {
  parallax.targetX = 0;
  parallax.targetY = 0;
  run();
});

hero.addEventListener('click', (event) => {
  const rect = hero.getBoundingClientRect();
  for (let i = 0; i < 25; i++) puff(event.clientX - rect.left, event.clientY - rect.top, 3);
  run();
});

document.addEventListener('keydown', (event) => {
  if (ignoreKey(event)) return;
  if (event.key === 'ArrowLeft') pose.targetAngle = Math.max(pose.targetAngle - 10, -40);
  else if (event.key === 'ArrowRight') pose.targetAngle = Math.min(pose.targetAngle + 10, 40);
  else if (event.key === 'ArrowUp') pose.targetLift = Math.min(pose.targetLift + 15, 60);
  else if (event.key === 'ArrowDown') pose.targetLift = Math.max(pose.targetLift - 15, 0);
  else if (event.key === 'Escape') {
    pose.targetAngle = 0;
    pose.targetLift = 0;
  } else if (event.key === ' ') {
    steamOn = !steamOn;
    steamState.textContent = steamOn ? 'Пар: вкл' : 'Пар: выкл';
  } else return;
  event.preventDefault();
  run();
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
steamState.textContent = steamOn ? 'Пар: вкл' : 'Пар: выкл';
run();
