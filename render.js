document.addEventListener('DOMContentLoaded', () => {
  renderPapers(PAPERS);
  renderTalks(TALKS);
});

function renderPapers(data) {
  const root = document.getElementById('papers');
  if (!root) return;

  const topics = data.topics;
  const allPapers = topics.flatMap(t => t.papers.map(p => ({ ...p, topicId: t.id })));
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

function setupStickyFilter(el) {
  const placeholder = document.createElement('div');
  placeholder.style.display = 'none';
  el.parentNode.insertBefore(placeholder, el);
  let stuck = false;
  function applyGeometry() {
    const parentRect = el.parentNode.getBoundingClientRect();
    el.style.left = parentRect.left + 'px';
    el.style.width = parentRect.width + 'px';
  }
  function update() {
    const naturalTop = stuck
      ? placeholder.getBoundingClientRect().top
      : el.getBoundingClientRect().top;
    const needStuck = naturalTop <= 0;
    if (needStuck && !stuck) {
      placeholder.style.height = el.offsetHeight + 'px';
      placeholder.style.display = 'block';
      applyGeometry();
      el.classList.add('stuck');
      stuck = true;
    } else if (!needStuck && stuck) {
      placeholder.style.display = 'none';
      el.style.left = '';
      el.style.width = '';
      el.style.top = '';
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
  const measureCards = document.querySelectorAll('#paper-measure .container');
  if (!measureCards.length) return;
  const maxH = Math.max(...Array.from(measureCards, c => c.getBoundingClientRect().height));
  const visibleCards = document.querySelectorAll('#paper-list .container');
  visibleCards.forEach(c => c.style.minHeight = maxH + 'px');
}

function paperHTML(p) {
  const urls = Object.entries(p.links);
  const titleHref = urls.length ? urls[0][1] : '#';
  const linksHTML = urls
    .map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank">${escapeText(label)}</a>`)
    .join(' / ');
  const venueHTML = `<span class="venue">${escapeText(p.venue)}${p.venue_note ? ' ' + escapeText(p.venue_note) : ''}</span>`;
  return `
    <div class="container">
      <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" class="image" loading="lazy">
      <p class="text">
        <a href="${escapeAttr(titleHref)}" target="_blank"><span class="papertitle">${escapeText(p.title)}</span></a>
        <br>
        ${p.authors}
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
