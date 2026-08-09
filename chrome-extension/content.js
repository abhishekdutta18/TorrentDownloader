// Content script: scans the page for magnet links and sends them to the popup

function findMagnetLinks() {
  const magnets = new Set();

  // Find all <a> tags with magnet href
  document.querySelectorAll('a[href^="magnet:"]').forEach(a => {
    magnets.add(a.href);
  });

  // Also scan for magnet links in text content (some sites hide them)
  const textContent = document.body?.innerHTML || '';
  const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9&=%.+-]+/g;
  let match;
  while ((match = magnetRegex.exec(textContent)) !== null) {
    // Decode HTML entities
    const decoded = match[0].replace(/&amp;/g, '&');
    magnets.add(decoded);
  }

  return Array.from(magnets);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_MAGNETS') {
    const magnets = findMagnetLinks();
    sendResponse({ magnets });
  }
  return true;
});

// Add visual indicators to magnet links on the page
function highlightMagnetLinks() {
  const magnetLinks = document.querySelectorAll('a[href^="magnet:"]');
  if (magnetLinks.length === 0) return;

  magnetLinks.forEach(link => {
    if (link.dataset.torrentproCaught) return;
    link.dataset.torrentproCaught = 'true';

    // Add a small magnet icon badge
    const badge = document.createElement('span');
    badge.textContent = '🧲';
    badge.title = 'Magnet link detected by TorrentPro';
    badge.style.cssText = `
      display: inline-block;
      margin-left: 4px;
      font-size: 14px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    badge.addEventListener('mouseover', () => { badge.style.opacity = '1'; });
    badge.addEventListener('mouseout', () => { badge.style.opacity = '0.8'; });
    
    // Click the badge to copy the magnet link
    badge.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(link.href);
        badge.textContent = '✅';
        setTimeout(() => { badge.textContent = '🧲'; }, 1500);
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = link.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        badge.textContent = '✅';
        setTimeout(() => { badge.textContent = '🧲'; }, 1500);
      }
    });

    link.parentNode.insertBefore(badge, link.nextSibling);
  });

  // Update badge count
  chrome.runtime.sendMessage({ type: 'UPDATE_COUNT', count: magnetLinks.length });
}

// Run on page load
highlightMagnetLinks();

// Also observe for dynamically added links (e.g., infinite scroll pages)
const observer = new MutationObserver(() => {
  highlightMagnetLinks();
});
observer.observe(document.body, { childList: true, subtree: true });
