document.addEventListener('DOMContentLoaded', () => {
  renderPapers(PAPERS);
  renderTalks(TALKS);
});

function renderPapers(data) {
  const root = document.getElementById('papers');
  if (!root) return;
  for (const topic of data.topics) {
    const section = document.createElement('section');
    section.id = `topic-${topic.id}`;
    section.className = 'topic';
    section.insertAdjacentHTML('beforeend', `<h2>${escapeText(topic.title)}</h2>`);
    for (const p of topic.papers) section.insertAdjacentHTML('beforeend', paperHTML(p));
    root.appendChild(section);
  }
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
