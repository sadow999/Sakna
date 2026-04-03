// ==========================================
// MAIN JAVASCRIPT FOR PORTFOLIO
// ==========================================

// 1. SCROLL REVEAL ANIMATION
const observer = new IntersectionObserver((entries) => {
  entries.forEach(el => {
    if (el.isIntersecting) { 
      el.target.style.opacity='1'; 
      el.target.style.transform='translateY(0)'; 
    }
  });
}, {threshold:0.08});

document.querySelectorAll('section:not(.hero)').forEach(sec => {
  sec.style.opacity='0'; 
  sec.style.transform='translateY(20px)';
  sec.style.transition='opacity 0.7s ease, transform 0.7s ease';
  observer.observe(sec);
});

// 2. LIGHTBOX FUNCTIONALITY
function openLightbox(src, caption){
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption;
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden'; 
}

function closeLightbox(){
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = 'auto';
}

document.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeLightbox();
});

// 3. ANIMATE CHART BARS ON SCROLL
const chartObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bars = entry.target.querySelectorAll('.bar');
      bars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        bar.style.width = width;
      });
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.chart-container').forEach(chart => {
  chartObserver.observe(chart);
});