// static/client.js
const scrapeBtn = document.getElementById('scrape');
const urlInput = document.getElementById('url');
const statusSpan = document.getElementById('status');
const spinner = document.getElementById('spinner');
const sectionsContainer = document.getElementById('sections');
const errorsDiv = document.getElementById('errors');
const downloadBtn = document.getElementById('download');
const copyJsonBtn = document.getElementById('copy-json');

const metaCard = document.getElementById('meta-card');
const metaTitle = document.getElementById('meta-title');
const metaDesc = document.getElementById('meta-desc');
const metaExtra = document.getElementById('meta-extra');
const metaCanonical = document.getElementById('meta-canonical');

const pagesCount = document.getElementById('pages-count');
const clicksList = document.getElementById('clicks-list');
const scrollsCount = document.getElementById('scrolls-count');
const scrapedAt = document.getElementById('scraped-at');

let lastResult = null;

function showSpinner(text = 'Scraping...') {
  spinner.classList.remove('hidden');
  statusSpan.textContent = text;
}
function hideSpinner() {
  spinner.classList.add('hidden');
  statusSpan.textContent = 'Idle';
}

function validUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

scrapeBtn.onclick = doScrape;
urlInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') doScrape(); });

async function doScrape() {
  const url = urlInput.value.trim();
  errorsDiv.textContent = '';
  sectionsContainer.innerHTML = '';
  metaCard.classList.add('hidden');

  if (!url || !validUrl(url)) {
    errorsDiv.textContent = 'Please enter a valid URL (include https://).';
    return;
  }

  showSpinner('Scraping — this may take a few seconds...');
  try {
    const res = await fetch('/scrape', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      const err = await res.json().catch(()=>({detail: 'Unknown error'}));
      errorsDiv.textContent = err.detail || JSON.stringify(err);
      hideSpinner();
      return;
    }

    const data = await res.json();
    lastResult = data.result;
    renderResult(lastResult);
    hideSpinner();
  } catch (e) {
    errorsDiv.textContent = 'Network or server error: ' + e.toString();
    hideSpinner();
  }
}

function renderResult(result) {
  if (!result) return;
  // errors
  if (result.errors && result.errors.length) {
    errorsDiv.textContent = result.errors.map(x => x.message).join(' • ');
  } else {
    errorsDiv.textContent = '';
  }

  // meta
  metaTitle.textContent = result.meta.title || 'Untitled';
  metaDesc.textContent = result.meta.description || '';
  metaExtra.textContent = `Language: ${result.meta.language || '—'}`;
  metaCanonical.innerHTML = result.meta.canonical ? `<a href="${result.meta.canonical}" class="text-indigo-100 underline" target="_blank">Canonical</a>` : '';
  metaCard.classList.remove('hidden');

  // interactions
  pagesCount.textContent = (result.interactions.pages || []).length;
  clicksList.textContent = (result.interactions.clicks && result.interactions.clicks.length) ? result.interactions.clicks.join(', ') : '—';
  scrollsCount.textContent = result.interactions.scrolls || 0;
  scrapedAt.textContent = result.scrapedAt || '—';

  // sections
  sectionsContainer.innerHTML = '';
  const secs = result.sections || [];
  if (!secs.length) {
    sectionsContainer.innerHTML = `<div class="card p-4 text-slate-200">No sections found.</div>`;
    return;
  }

  secs.forEach((s, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card p-4';

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-3';

    const left = document.createElement('div');
    left.innerHTML = `<div class="text-lg font-semibold">${escapeHtml(s.label || 'Section')}</div>
                      <div class="text-xs text-slate-300">${s.type || ''} • ${s.sourceUrl ? new URL(s.sourceUrl).hostname : ''}</div>`;

    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'text-xs px-2 py-1 rounded-md bg-white/6 hover:bg-white/10';
    toggleBtn.textContent = 'Show';
    right.appendChild(toggleBtn);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'text-xs px-2 py-1 rounded-md bg-white/6 hover:bg-white/10';
    copyBtn.textContent = 'Copy text';
    right.appendChild(copyBtn);

    header.appendChild(left);
    header.appendChild(right);
    wrapper.appendChild(header);

    const contentArea = document.createElement('div');
    contentArea.className = 'mt-3 text-sm text-slate-200';
    contentArea.style.display = 'none';

    // text
    if (s.content && s.content.headings && s.content.headings.length) {
      const hh = document.createElement('div');
      hh.innerHTML = s.content.headings.map(h => `<div class="text-indigo-100 font-medium">${escapeHtml(h)}</div>`).join('');
      contentArea.appendChild(hh);
    }
    if (s.content && s.content.text) {
      const p = document.createElement('p');
      p.textContent = s.content.text;
      p.className = 'mt-2';
      contentArea.appendChild(p);
    }

    // lists
    if (s.content && s.content.lists && s.content.lists.length) {
      s.content.lists.forEach(list => {
        const ul = document.createElement('ul');
        ul.className = 'mt-2 ml-4 list-disc text-slate-300';
        list.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          ul.appendChild(li);
        });
        contentArea.appendChild(ul);
      });
    }

    // links badges
    if (s.content && s.content.links && s.content.links.length) {
      const linkWrap = document.createElement('div');
      linkWrap.className = 'mt-3 flex flex-wrap gap-2';
      s.content.links.slice(0, 12).forEach(l => {
        const a = document.createElement('a');
        a.href = l.href;
        a.target = '_blank';
        a.className = 'text-xs px-2 py-1 rounded-md bg-white/6 hover:bg-white/10';
        a.textContent = l.text || (new URL(l.href).hostname || l.href);
        linkWrap.appendChild(a);
      });
      contentArea.appendChild(linkWrap);
    }

    // raw html preview toggle
    const raw = document.createElement('pre');
    raw.className = 'mt-3 bg-slate-900 p-3 rounded text-xs text-slate-300 overflow-auto';
    raw.style.display = 'none';
    raw.textContent = s.rawHtml || '';
    contentArea.appendChild(raw);

    // event handlers
    toggleBtn.onclick = () => {
      if (contentArea.style.display === 'none') {
        contentArea.style.display = 'block';
        raw.style.display = 'block';
        toggleBtn.textContent = 'Hide';
      } else {
        contentArea.style.display = 'none';
        raw.style.display = 'none';
        toggleBtn.textContent = 'Show';
      }
    };

    copyBtn.onclick = async () => {
      const textToCopy = (s.content && s.content.text) ? s.content.text : (s.rawHtml || '');
      try {
        await navigator.clipboard.writeText(textToCopy);
        copyBtn.textContent = 'Copied';
        setTimeout(()=> copyBtn.textContent = 'Copy text', 1200);
      } catch (e) {
        copyBtn.textContent = 'Copy failed';
      }
    };

    wrapper.appendChild(contentArea);
    sectionsContainer.appendChild(wrapper);
  });
}

// simple escape to avoid accidental HTML injection when rendering labels
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"'`=\/]/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'}[s]);
  });
}

// Download / copy JSON
downloadBtn.onclick = () => {
  if (!lastResult) return;
  const blob = new Blob([JSON.stringify(lastResult, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'scrape-result.json'; a.click();
  URL.revokeObjectURL(url);
};

copyJsonBtn.onclick = async () => {
  if (!lastResult) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastResult));
    copyJsonBtn.textContent = 'Copied';
    setTimeout(()=> copyJsonBtn.textContent = 'Copy JSON', 1400);
  } catch(e) {
    copyJsonBtn.textContent = 'Copy failed';
  }
};
