// Popup script: queries the content script for magnet links and displays them

function extractName(magnetUri) {
  try {
    const params = new URLSearchParams(magnetUri.split('?')[1]);
    const dn = params.get('dn');
    if (dn) return decodeURIComponent(dn.replace(/\+/g, ' '));
  } catch {
    // ignore
  }
  // Fallback: extract info hash
  const hashMatch = magnetUri.match(/btih:([a-fA-F0-9]{40})/i);
  if (hashMatch) return `Torrent ${hashMatch[1].substring(0, 8)}...`;
  return 'Unknown Torrent';
}

function extractHash(magnetUri) {
  const hashMatch = magnetUri.match(/btih:([a-fA-F0-9]{40})/i);
  return hashMatch ? hashMatch[1].toLowerCase() : 'unknown';
}

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  
  const originalText = button.innerHTML;
  button.innerHTML = '✅ Copied';
  button.classList.add('copied');
  setTimeout(() => {
    button.innerHTML = originalText;
    button.classList.remove('copied');
  }, 1500);
}

async function init() {
  const contentEl = document.getElementById('content');
  const countEl = document.getElementById('count');

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.id) {
      showEmpty(contentEl, countEl, 'Cannot access this page');
      return;
    }

    // Check if we can access this tab (chrome:// and edge:// pages are restricted)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('chrome-extension://'))) {
      showEmpty(contentEl, countEl, 'Cannot scan browser internal pages');
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { type: 'GET_MAGNETS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        showEmpty(contentEl, countEl, 'Reload the page and try again');
        return;
      }

      const magnets = response.magnets || [];
      countEl.textContent = `${magnets.length} found`;

      if (magnets.length === 0) {
        showEmpty(contentEl, countEl, 'No magnet links found on this page');
        return;
      }

      renderMagnets(contentEl, magnets);
    });
  } catch (err) {
    showEmpty(contentEl, countEl, 'Error scanning page');
    console.error(err);
  }
}

function showEmpty(contentEl, countEl, message) {
  countEl.textContent = '0';
  contentEl.innerHTML = `
    <div class="empty-state">
      <div class="icon">🔍</div>
      <p>${message}</p>
    </div>
  `;
}

function renderMagnets(contentEl, magnets) {
  let html = '<div class="magnet-list">';

  magnets.forEach((magnet, index) => {
    const name = extractName(magnet);
    const hash = extractHash(magnet);

    html += `
      <div class="magnet-item">
        <div class="magnet-name">${escapeHtml(name)}</div>
        <div class="magnet-hash">${hash}</div>
        <div class="actions">
          <button class="btn btn-copy" data-index="${index}" data-action="copy">
            📋 Copy Link
          </button>
          <button class="btn btn-open" data-index="${index}" data-action="open">
            🚀 Open in App
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';

  if (magnets.length > 1) {
    html += `<button class="btn btn-copy-all" id="copyAll">📋 Copy All (${magnets.length})</button>`;
  }

  contentEl.innerHTML = html;

  // Add event listeners
  contentEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    if (btn.id === 'copyAll') {
      await copyToClipboard(magnets.join('\n'), btn);
      return;
    }

    const index = parseInt(btn.dataset.index);
    const action = btn.dataset.action;

    if (action === 'copy') {
      await copyToClipboard(magnets[index], btn);
    } else if (action === 'open') {
      // Open the magnet link — this triggers the OS protocol handler (TorrentPro)
      window.open(magnets[index]);
      btn.innerHTML = '✅ Sent';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = '🚀 Open in App';
        btn.classList.remove('copied');
      }, 1500);
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Initialize
init();
