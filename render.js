document.addEventListener('DOMContentLoaded', () => {
  renderPapers(PAPERS);
  renderTalks(TALKS);
});

function renderPapers(data) {
  const root = document.getElementById('papers');
  if (!root) return;

  const topics = data.topics;
  const allPapers = topics
    .flatMap(t => t.papers.map(p => ({ ...p, topicId: t.id })))
    .sort((a, b) => paperMonth(b) - paperMonth(a));
  const selectedPapers = allPapers.filter(p => p.selected);

  const modes = [
    { id: 'selected', label: 'Selected', list: selectedPapers },
    ...topics.map(t => ({
      id: t.id,
      label: t.label || t.title,
      list: allPapers.filter(p => p.topicId === t.id),
    })),
    { id: 'all', label: 'All', list: allPapers },
  ];

  const stickyWrap = document.createElement('div');
  stickyWrap.className = 'paper-sticky';
  stickyWrap.insertAdjacentHTML('beforeend', '<h2>Publications</h2>');

  const filterRow = document.createElement('div');
  filterRow.className = 'paper-filter';
  modes.forEach((m, i) => {
    if (i > 0) filterRow.insertAdjacentHTML('beforeend', ' <span class="sep">·</span> ');
    const a = document.createElement('a');
    a.textContent = m.label;
    a.dataset.mode = m.id;
    a.href = '#' + m.id;
    a.addEventListener('click', e => {
      e.preventDefault();
      selectMode(m.id);
      scrollToSticky();
    });
    filterRow.appendChild(a);
  });
  stickyWrap.appendChild(filterRow);
  root.appendChild(stickyWrap);

  const listDiv = document.createElement('div');
  listDiv.id = 'paper-list';
  root.appendChild(listDiv);

  const measureDiv = document.createElement('div');
  measureDiv.id = 'paper-measure';
  measureDiv.setAttribute('aria-hidden', 'true');
  measureDiv.innerHTML = allPapers.map(paperHTML).join('');
  root.appendChild(measureDiv);
  measureDiv.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', equalizeCardHeights, { once: true });
  });

  function selectMode(id) {
    const mode = modes.find(m => m.id === id);
    if (!mode) return;
    filterRow.querySelectorAll('a').forEach(a => {
      a.classList.toggle('active', a.dataset.mode === id);
    });
    listDiv.innerHTML = mode.list.map(paperHTML).join('');
    equalizeCardHeights();
  }

  selectMode('selected');
  window.addEventListener('resize', equalizeCardHeights);
  const stickyPlaceholder = setupStickyFilter(stickyWrap);

  function scrollToSticky() {
    const flowEl = stickyWrap.classList.contains('stuck') ? stickyPlaceholder : stickyWrap;
    const y = flowEl.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

// Papers are listed newest-first by arXiv posting date, falling back to the
// venue date when there is no arXiv entry. Anything we can't date (an
// unpublished preprint) is the newest thing there is, so it goes on top.
const UNDATED = Number.MAX_SAFE_INTEGER;  // finite, so undated papers compare equal
const VENUE_MONTHS = [
  [/siggraph asia/i, 12],
  [/siggraph/i, 8],
  [/eurographics/i, 5],
  [/corl/i, 9],
  [/neurips/i, 12],
  [/iccv/i, 10],
  [/eccv/i, 10],
  [/cvpr/i, 6],
  [/wacv/i, 1],
  [/3dv/i, 3],
  [/iclr/i, 4],
  [/icml/i, 7],
  [/aaai/i, 2],
  [/naacl/i, 6],
  [/eacl/i, 4],
  [/emnlp/i, 11],
  [/acl/i, 7],
  [/icra/i, 5],
  [/iros/i, 10],
  [/\brss\b/i, 7],
  [/humanoids/i, 11],
  [/science robotics/i, 6],
];

function paperMonth(p) {
  const arxiv = Object.values(p.links || {})
    .map(href => /arxiv\.org\/abs\/(\d{2})(\d{2})\./.exec(href))
    .find(Boolean);
  if (arxiv) return (2000 + +arxiv[1]) * 12 + +arxiv[2];

  const venue = p.venue || '';
  const year = /\b(19|20)\d{2}\b/.exec(venue);
  const month = VENUE_MONTHS.find(([re]) => re.test(venue));
  if (year && month) return +year[0] * 12 + month[1];

  return UNDATED;
}

function setupStickyFilter(el) {
  const placeholder = document.createElement('div');
  placeholder.style.display = 'none';
  el.parentNode.insertBefore(placeholder, el);
  let stuck = false;
  const SHADOW_PAD = 20;
  function applyGeometry() {
    const parentRect = el.parentNode.getBoundingClientRect();
    el.style.left = (parentRect.left - SHADOW_PAD) + 'px';
    el.style.width = parentRect.width + 'px';
    el.style.paddingLeft = SHADOW_PAD + 'px';
    el.style.paddingRight = SHADOW_PAD + 'px';
  }
  function update() {
    const naturalTop = stuck
      ? placeholder.getBoundingClientRect().top
      : el.getBoundingClientRect().top;
    const needStuck = naturalTop <= 0;
    if (needStuck && !stuck) {
      const cs = getComputedStyle(el);
      placeholder.style.marginTop = cs.marginTop;
      placeholder.style.height = el.offsetHeight + 'px';
      placeholder.style.display = 'block';
      applyGeometry();
      el.classList.add('stuck');
      stuck = true;
    } else if (!needStuck && stuck) {
      placeholder.style.display = 'none';
      placeholder.style.marginTop = '';
      el.style.left = '';
      el.style.width = '';
      el.style.top = '';
      el.style.paddingLeft = '';
      el.style.paddingRight = '';
      el.classList.remove('stuck');
      stuck = false;
    }
    if (stuck) {
      const paperList = document.getElementById('paper-list');
      const listBottom = paperList ? paperList.getBoundingClientRect().bottom : Infinity;
      const stickyHeight = el.offsetHeight;
      const offset = Math.min(0, listBottom - stickyHeight);
      el.style.top = offset + 'px';
    }
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    if (stuck) applyGeometry();
    update();
  });
  update();
  return placeholder;
}

function equalizeCardHeights() {
  const visibleCards = document.querySelectorAll('#paper-list .container');
  // Cards stack vertically below 768px, so a shared height only adds dead space.
  if (window.matchMedia('(max-width: 767px)').matches) {
    visibleCards.forEach(c => c.style.minHeight = '');
    return;
  }
  const measureCards = document.querySelectorAll('#paper-measure .container');
  if (!measureCards.length) return;
  const maxH = Math.max(...Array.from(measureCards, c => c.getBoundingClientRect().height));
  visibleCards.forEach(c => c.style.minHeight = maxH + 'px');
}

function paperHTML(p) {
  const urls = Object.entries(p.links);
  const titleHref = urls.length ? urls[0][1] : '#';
  const linksHTML = urls
    .map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank">${escapeText(label)}</a>`)
    .join(' / ');
  const venueHTML = `<span class="venue">${escapeText(p.venue)}${p.venue_note ? ' ' + escapeText(p.venue_note) : ''}</span>`;
  const containerClass = p.squeeze ? 'container squeezed' : 'container';
  return `
    <div class="${containerClass}">
      <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" class="image" loading="lazy">
      <p class="text">
        <a href="${escapeAttr(titleHref)}" target="_blank"><span class="papertitle">${escapeText(p.title)}</span></a>
        <br>
        <span class="authors">${p.authors}</span>
        <br>
        ${venueHTML}
        <br>
        ${linksHTML}
      </p>
    </div>`;
}

function renderTalks(list) {
  const root = document.getElementById('talks');
  if (!root) return;
  for (const t of list) {
    const li = document.createElement('li');
    const extras = t.links
      ? ' (' + Object.entries(t.links)
          .map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank">${escapeText(label)}</a>`)
          .join(', ') + ')'
      : '';
    li.innerHTML = `${escapeText(t.date)} - <em>"${escapeText(t.title)}"</em> - <b>${escapeText(t.venue)}</b>${extras}`;
    root.appendChild(li);
  }
}

function escapeText(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
