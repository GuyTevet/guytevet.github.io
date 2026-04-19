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

  root.insertAdjacentHTML('beforeend', '<h2>Publications</h2>');

  const filterRow = document.createElement('div');
  filterRow.className = 'paper-filter';
  modes.forEach((m, i) => {
    if (i > 0) filterRow.insertAdjacentHTML('beforeend', '<span class="sep">·</span>');
    const a = document.createElement('a');
    a.textContent = m.label;
    a.dataset.mode = m.id;
    a.href = '#' + m.id;
    a.addEventListener('click', e => {
      e.preventDefault();
      selectMode(m.id);
    });
    filterRow.appendChild(a);
  });
  root.appendChild(filterRow);

  const listDiv = document.createElement('div');
  listDiv.id = 'paper-list';
  root.appendChild(listDiv);

  function selectMode(id) {
    const mode = modes.find(m => m.id === id);
    if (!mode) return;
    filterRow.querySelectorAll('a').forEach(a => {
      a.classList.toggle('active', a.dataset.mode === id);
    });
    listDiv.innerHTML = mode.list.map(paperHTML).join('');
  }

  selectMode('selected');
}

function paperHTML(p) {
  const urls = Object.entries(p.links);
  const titleHref = urls.length ? urls[0][1] : '#';
  const linksHTML = urls
    .map(([label, href]) => `<a href="${escapeAttr(href)}" target="_blank">${escapeText(label)}</a>`)
    .join(' / ');
  const venueHTML = `<em>${escapeText(p.venue)}</em>${p.venue_note ? ' ' + escapeText(p.venue_note) : ''}`;
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
