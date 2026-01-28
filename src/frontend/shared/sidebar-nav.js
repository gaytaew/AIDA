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
      { href: '/composer/custom-shoot-5.html', icon: '🏔️', label: 'Custom Shoot 5' },
      { href: '/composer/custom-shoot-v6.html', icon: '🎬', label: 'Custom Shoot V6', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' },
      { href: '/composer/custom-shoot-7.html', icon: '✏️', label: 'Custom Shoot V7', style: 'background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white;' },
      { href: '/composer/custom-shoot-8.html', icon: '🚀', label: 'Custom Shoot V8', style: 'background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white;' }
    ]
  },
  {
    section: 'Редакторы',
    items: [
      { href: '/editors/universe-editor.html', icon: '🌌', label: 'Вселенные' },
      { href: '/editors/location-editor.html', icon: '📍', label: 'Локации' },
      { href: '/editors/frame-editor.html', icon: '🖼️', label: 'Каталог кадров' },
      { href: '/editors/model-editor.html', icon: '👤', label: 'Модели' },
      { href: '/editors/look-editor.html', icon: '👔', label: 'Образы (Looks)' },
      { href: '/editors/food-editor.html', icon: '🍔', label: 'Food Shoot' },
      { href: '/editors/product-editor.html', icon: '📦', label: 'Предметная съёмка' },
      { href: '/editors/style-editor.html', icon: '🎬', label: 'V6 AI-Режиссёр', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;' }
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

  // Fetch and display version
  fetch('/version.json?t=' + Date.now())
    .then(r => r.json())
    .then(data => {
      const footer = document.querySelector('.sidebar-footer');
      if (footer) {
        const date = new Date(data.buildTime);
        const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        footer.innerHTML = `
          <div class="status-badge" style="flex-direction: column; align-items: flex-start; gap: 2px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="status-dot"></span>
              <span id="status-text">Онлайн</span>
            </div>
            <div style="font-size: 10px; opacity: 0.6; margin-left: 14px;">
              upd: ${timeStr}
            </div>
          </div>
        `;
      }
    })
    .catch(err => console.error('Version check failed', err));
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

