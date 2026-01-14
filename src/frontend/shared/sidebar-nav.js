/**
 * Unified Sidebar Navigation Component
 * 
 * Automatically injects the same navigation menu on all pages.
 * Just include this script and add <nav id="sidebar-nav"></nav> to your page.
 */

const NAV_ITEMS = [
  {
    section: 'Главное',
    items: [
      { href: '/', icon: '🏠', label: 'Dashboard' },
      { href: '/composer/shoot-composer.html', icon: '🎬', label: 'Конструктор съёмок' },
      { href: '/composer/custom-shoot.html', icon: '✨', label: 'Custom Shoot' },

      { href: '/composer/custom-shoot-4.html', icon: '🧬', label: 'Custom Shoot 4' },
      { href: '/composer/custom-shoot-5.html', icon: '🏔️', label: 'Custom Shoot 5', style: 'background: #e0e7ff;' }
    ]
  },
  {
    section: 'Редакторы',
    items: [
      { href: '/editors/universe-editor.html', icon: '🌌', label: 'Вселенные' },
      { href: '/editors/location-editor.html', icon: '📍', label: 'Локации' },
      { href: '/editors/frame-editor.html', icon: '🖼️', label: 'Каталог кадров' },
      { href: '/editors/model-editor.html', icon: '👤', label: 'Модели' }
    ]
  }
];

function getCurrentPath() {
  return window.location.pathname;
}

function isActive(href) {
  const current = getCurrentPath();
  if (href === '/') {
    return current === '/' || current === '/index.html';
  }
  return current === href || current.endsWith(href);
}

function renderSidebarNav() {
  const container = document.getElementById('sidebar-nav');
  if (!container) {
    console.warn('[SidebarNav] No #sidebar-nav element found');
    return;
  }

  let html = '';

  for (const section of NAV_ITEMS) {
    html += `<div class="nav-section">`;
    html += `<div class="nav-section-title">${section.section}</div>`;

    for (const item of section.items) {
      const activeClass = isActive(item.href) ? ' active' : '';
      const style = item.style ? ` style="${item.style}"` : '';
      html += `
        <a href="${item.href}" class="nav-item${activeClass}"${style}>
          <span class="nav-item-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `;
    }

    html += `</div>`;
  }

  container.innerHTML = html;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderSidebarNav);
} else {
  renderSidebarNav();
}

// Export for manual use
window.SidebarNav = {
  render: renderSidebarNav,
  items: NAV_ITEMS
};

