const no = document.getElementById("noBtn");
const container = document.querySelector(".center_box");
if (!no || !container) console.warn('No button or container not found:', { no, container });

// Tweak these values to change trigger distance and how far the button jumps
const THRESHOLD = 160;   // px distance that triggers the escape
const MOVE_DISTANCE = 300; // px to push the button away

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function moveAwayFromCursor(cursorX, cursorY) {
  const c = container.getBoundingClientRect();
  const b = no.getBoundingClientRect();
  const yes = document.querySelector('.button.yes');

  // candidate positions expressed as percentage of container (center points)
  const candidates = [
    {x: 0.08, y: 0.08}, // top-left
    {x: 0.92, y: 0.08}, // top-right
    {x: 0.08, y: 0.92}, // bottom-left
    {x: 0.92, y: 0.92}, // bottom-right
    {x: 0.5,  y: 0.95}, // bottom-center
    {x: 0.5,  y: 0.18}  // top-center (optional)
  ];

  const bWidth = b.width, bHeight = b.height;

  function intersects(a, byRect) {
    return !(a.right < byRect.left || a.left > byRect.right || a.bottom < byRect.top || a.top > byRect.bottom);
  }

  const yesRect = yes ? yes.getBoundingClientRect() : null;

  // Convert candidates to container-local left/top and filter out overlaps with Yes
  const options = candidates.map(cand => {
    const centerX = container.left ? (container.left + cand.x * c.width) : (c.left + cand.x * c.width);
    // centerX computed relative to viewport; but simpler to use c.left as base
    const tgtCenterX = c.left + cand.x * c.width;
    const tgtCenterY = c.top  + cand.y * c.height;
    const relLeft = tgtCenterX - c.left - bWidth / 2;
    const relTop  = tgtCenterY - c.top  - bHeight / 2;
    const maxLeft = c.width - bWidth;
    const maxTop  = c.height - bHeight;
    const finalLeft = clamp(relLeft, 0, maxLeft);
    const finalTop  = clamp(relTop,  0, maxTop);
    const rect = { left: c.left + finalLeft, top: c.top + finalTop, right: c.left + finalLeft + bWidth, bottom: c.top + finalTop + bHeight };
    const overlapsYes = yesRect ? intersects(rect, yesRect) : false;
    const centerDist = Math.hypot((rect.left + bWidth/2) - cursorX, (rect.top + bHeight/2) - cursorY);
    return { finalLeft, finalTop, overlapsYes, centerDist };
  }).filter(o => !o.overlapsYes);

  // choose the candidate farthest from cursor; fallback to random if none
  let choice = null;
  if (options.length) {
    options.sort((a,b) => b.centerDist - a.centerDist);
    choice = options[0];
  } else {
    // fallback: pick a random point inside container
    const maxLeft = c.width - b.width;
    const maxTop = c.height - b.height;
    choice = { finalLeft: Math.random() * Math.max(0, maxLeft), finalTop: Math.random() * Math.max(0, maxTop) };
  }

  no.style.left = choice.finalLeft + "px";
  no.style.top  = choice.finalTop  + "px";
}

// Move when pointer gets close (desktop & modern touch)
container.addEventListener('pointermove', e => {
  const b = no.getBoundingClientRect();
  const bx = b.left + b.width / 2;
  const by = b.top + b.height / 2;
  const dx = e.clientX - bx;
  const dy = e.clientY - by;
  const dist = Math.hypot(dx, dy);
  if (dist < THRESHOLD) moveAwayFromCursor(e.clientX, e.clientY);
});

// Touch fallback: move on touchstart if close
container.addEventListener('touchstart', e => {
  const t = e.touches[0];
  if (!t) return;
  const b = no.getBoundingClientRect();
  const bx = b.left + b.width / 2;
  const by = b.top + b.height / 2;
  const dx = t.clientX - bx;
  const dy = t.clientY - by;
  const dist = Math.hypot(dx, dy);
  if (dist < THRESHOLD) {
    e.preventDefault();
    moveAwayFromCursor(t.clientX, t.clientY);
  }
});

// Prevent clicking/tapping the No button
no.addEventListener('click', e => e.preventDefault());
