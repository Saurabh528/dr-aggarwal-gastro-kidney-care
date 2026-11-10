(() => {
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Intro: wait for both portraits, then open the curtain ---------- */
  const heroImgs = [...document.querySelectorAll('.portrait img')];
  const loaded = heroImgs.map(img =>
    img.complete ? Promise.resolve() : new Promise(res => { img.onload = img.onerror = res; })
  );
  const start = () => {
    if (body.classList.contains('is-ready')) return;
    body.classList.remove('is-loading');
    // Next frame so the initial state is painted before transitioning
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('is-ready')));
    setTimeout(() => body.classList.add('intro-done'), reduceMotion ? 50 : 1400);
  };
  Promise.all(loaded).then(() => setTimeout(start, reduceMotion ? 0 : 350));
  setTimeout(start, 3500); // safety net on slow networks

  /* ---------- Nav ---------- */
  const nav = document.querySelector('.nav');
  const toggle = document.getElementById('navToggle');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  document.querySelectorAll('#navLinks a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const hero = document.querySelector('.hero');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    body.classList.toggle('show-bar', y > hero.offsetHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Gentle mouse parallax on hero portraits (desktop only) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (min-width: 921px)').matches) {
    const portraits = [...document.querySelectorAll('.portrait')];
    let raf = null;
    hero.addEventListener('mousemove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        portraits.forEach(p => {
          const dir = Number(p.dataset.parallax);
          p.style.transform = `translate3d(${x * 10 * dir}px, ${y * 8}px, 0)`;
        });
        raf = null;
      });
    });
    hero.addEventListener('mouseleave', () => portraits.forEach(p => (p.style.transform = '')));
    portraits.forEach(p => (p.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)'));
  }

  /* ---------- Services tabs ---------- */
  const tabs = document.querySelector('.tabs');
  const tabBtns = [...tabs.querySelectorAll('.tabs__btn')];
  const panels = tabBtns.map(b => document.getElementById(b.getAttribute('aria-controls')));
  panels.forEach(p => p.querySelectorAll('.card').forEach((c, i) => c.style.setProperty('--i', i)));

  const selectTab = idx => {
    tabBtns.forEach((b, i) => {
      const on = i === idx;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      panels[i].classList.toggle('is-active', on);
      if (on) {
        // restart card entrance animation
        panels[i].querySelectorAll('.card').forEach(c => {
          c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
        });
      }
    });
    tabs.dataset.active = idx;
  };
  tabBtns.forEach((b, i) => {
    b.addEventListener('click', () => selectTab(i));
    b.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabBtns.length) % tabBtns.length;
        selectTab(next);
        tabBtns[next].focus();
      }
    });
  });

  /* ---------- Symptom finder ---------- */
  const DOCS = {
    arnav: {
      name: 'Dr. Arnav Aggarwal',
      role: 'Gastroenterologist & Hepatologist',
      img: 'assets/dr-arnav.jpg',
      why: 'These symptoms relate to the stomach, intestines or liver, which is Dr. Arnav’s speciality.'
    },
    taruna: {
      name: 'Dr. Taruna Pahuja',
      role: 'Nephrologist & Transplant Physician',
      img: 'assets/dr-taruna.jpg',
      why: 'These symptoms point to the kidneys or blood pressure, which is Dr. Taruna’s speciality.'
    }
  };
  const chips = [...document.querySelectorAll('.chip')];
  const empty = document.querySelector('.finder__empty');
  const match = document.querySelector('.finder__match');
  const mImg = match.querySelector('.finder__img');
  const mName = match.querySelector('.finder__name');
  const mWhy = match.querySelector('.finder__why');

  chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
  const updateFinder = () => {
    const on = chips.filter(c => c.classList.contains('is-on'));
    if (!on.length) { empty.hidden = false; match.hidden = true; return; }
    const set = new Set(on.map(c => c.dataset.doc));
    empty.hidden = true; match.hidden = false;
    match.style.animation = 'none'; void match.offsetWidth; match.style.animation = '';

    if (set.size === 2) {
      mImg.src = DOCS.arnav.img;
      mName.textContent = 'Both specialists';
      mWhy.textContent = 'Your symptoms involve both the digestive system and the kidneys. Ask to see Dr. Arnav and Dr. Taruna, and they can plan your care together.';
    } else {
      const d = DOCS[[...set][0]];
      mImg.src = d.img;
      mName.textContent = d.name;
      mWhy.textContent = d.why;
    }
  };
  chips.forEach(c => c.addEventListener('click', () => {
    const on = c.classList.toggle('is-on');
    c.setAttribute('aria-pressed', String(on));
    updateFinder();
  }));

  /* ---------- FAQ: only one open at a time ---------- */
  const details = [...document.querySelectorAll('.faq details')];
  details.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) details.forEach(o => { if (o !== d) o.open = false; });
  }));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
