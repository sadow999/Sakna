// ===== PAGE ROUTING =====
function showPage(id) {
  if (!document.getElementById('page-' + id)) id = 'home';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Shareable link per page (e.g. #field)
  history.replaceState(null, '', id === 'home' ? location.pathname : '#' + id);

  // Update nav active state
  document.querySelectorAll('.nav-links button[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });
  document.querySelectorAll('.nav-group').forEach(g => {
    g.classList.remove('open');
    g.querySelector('.nav-group-btn').setAttribute('aria-expanded', 'false');
    g.querySelector('.nav-group-btn').classList.toggle('active', !!g.querySelector('button[data-page="' + id + '"]'));
  });
  if (document.activeElement) document.activeElement.blur();

  // Close mobile menu
  document.getElementById('main-nav').classList.remove('menu-open');

  // Trigger bar animation if research page
  if (id === 'research') {
    setTimeout(animateBars, 400);
  }

  // Build the field-notes map and figures the first time the page is shown
  if (id === 'field' && window.initField) {
    setTimeout(window.initField, 50);
  }

  // Trigger fade-ins
  setTimeout(triggerFadeIns, 100);
}

// ===== MOBILE MENU =====
function toggleMenu() {
  document.getElementById('main-nav').classList.toggle('menu-open');
}

// ===== NAV DROPDOWN =====
function toggleGroup(btn) {
  const open = btn.parentElement.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-group')) {
    document.querySelectorAll('.nav-group.open').forEach(g => g.classList.remove('open'));
  }
});

// ===== CONTACT (lives on the home page) =====
function goContact() {
  showPage('home');
  setTimeout(function() {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  }, 350);
}

// ===== LIGHTBOX =====
function openLb(src, cap) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb-cap').textContent = cap;
  document.getElementById('lb').classList.add('open');
}
function closeLb() {
  document.getElementById('lb').classList.remove('open');
  document.getElementById('lb-img').src = '';
}
document.getElementById('lb').addEventListener('click', function(e) {
  if (e.target === this) closeLb();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLb();
});

// ===== BAR CHART ANIMATION =====
function animateBars() {
  document.querySelectorAll('.bar-fill[data-w]').forEach(function(bar) {
    bar.style.width = bar.getAttribute('data-w');
  });
}

// ===== FADE IN OBSERVER =====
function triggerFadeIns() {
  const fadeEls = document.querySelectorAll('#page-' + getCurrentPage() + ' .fade-in');
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function() {
          entry.target.classList.add('visible');
        }, i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
  fadeEls.forEach(el => observer.observe(el));
}

function getCurrentPage() {
  const active = document.querySelector('.page.active');
  return active ? active.id.replace('page-', '') : 'home';
}

// ===== RESPONSIVE PROJECTS GRID =====
function fixProjectsGrid() {
  const grid = document.querySelector('.projects-grid-resp');
  if (grid) {
    if (window.innerWidth < 900) {
      grid.style.gridTemplateColumns = '1fr';
    } else {
      grid.style.gridTemplateColumns = '1fr 1fr';
    }
  }
}
window.addEventListener('resize', fixProjectsGrid);

// ===== INIT =====
window.addEventListener('load', function() {
  if (location.hash.length > 1) showPage(location.hash.slice(1));
  triggerFadeIns();
  fixProjectsGrid();

  // Staggered hero animations
  const heroContent = document.querySelector('#page-home .hero-content');
  if (heroContent) {
    heroContent.style.opacity = '0';
    heroContent.style.transform = 'translateY(24px)';
    heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    setTimeout(function() {
      heroContent.style.opacity = '1';
      heroContent.style.transform = 'translateY(0)';
    }, 200);
  }

  // Scroll-triggered fade-ins for active page
  document.addEventListener('scroll', function() {
    const fadeEls = document.querySelectorAll('.page.active .fade-in:not(.visible)');
    fadeEls.forEach(function(el) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50) {
        el.classList.add('visible');
      }
    });
  }, { passive: true });
});
