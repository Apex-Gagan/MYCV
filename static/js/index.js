// ===== Hamburger menu (unchanged behavior) =====
const hamMenuBtn = document.querySelector('.header__main-ham-menu-cont')
const smallMenu = document.querySelector('.header__sm-menu')
const headerHamMenuBtn = document.querySelector('.header__main-ham-menu')
const headerHamMenuCloseBtn = document.querySelector(
  '.header__main-ham-menu-close'
)
const headerSmallMenuLinks = document.querySelectorAll('.header__sm-menu-link')

if (hamMenuBtn) {
  hamMenuBtn.addEventListener('click', () => {
    if (smallMenu.classList.contains('header__sm-menu--active')) {
      smallMenu.classList.remove('header__sm-menu--active')
    } else {
      smallMenu.classList.add('header__sm-menu--active')
    }
    if (headerHamMenuBtn.classList.contains('d-none')) {
      headerHamMenuBtn.classList.remove('d-none')
      headerHamMenuCloseBtn.classList.add('d-none')
    } else {
      headerHamMenuBtn.classList.add('d-none')
      headerHamMenuCloseBtn.classList.remove('d-none')
    }
  })
}

for (let i = 0; i < headerSmallMenuLinks.length; i++) {
  headerSmallMenuLinks[i].addEventListener('click', () => {
    smallMenu.classList.remove('header__sm-menu--active')
    headerHamMenuBtn.classList.remove('d-none')
    headerHamMenuCloseBtn.classList.add('d-none')
  })
}

// ===== Logo click → home (unchanged) =====
const headerLogoConatiner = document.querySelector('.header__logo-container')
if (headerLogoConatiner) {
  headerLogoConatiner.addEventListener('click', () => {
    location.href = '/'
  })
}

// ===== Projects Slider =====
;(function initProjectsSlider() {
  const slider = document.getElementById('projectsSlider')
  const track = document.getElementById('projectsTrack')
  const prevBtn = document.getElementById('projectsPrev')
  const nextBtn = document.getElementById('projectsNext')
  const dotsWrap = document.getElementById('projectsDots')
  const counter = document.getElementById('projectsCounter')
  if (!slider || !track) return

  const slides = Array.from(track.querySelectorAll('.projects__row'))
  const total = slides.length
  if (total === 0) return

  let index = 0
  let autoTimer = null
  const AUTO_MS = 7000

  // Build dots
  if (dotsWrap) {
    dotsWrap.innerHTML = ''
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.className = 'projects__dot'
      dot.setAttribute('aria-label', `Go to project ${i + 1}`)
      dot.addEventListener('click', () => goTo(i, true))
      dotsWrap.appendChild(dot)
    }
  }

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`
    if (dotsWrap) {
      dotsWrap.querySelectorAll('.projects__dot').forEach((d, i) => {
        d.classList.toggle('projects__dot--active', i === index)
      })
    }
    if (counter) counter.textContent = `${index + 1} / ${total}`
    if (prevBtn) prevBtn.disabled = total <= 1
    if (nextBtn) nextBtn.disabled = total <= 1
  }

  function goTo(i, userAction) {
    index = (i + total) % total
    update()
    if (userAction) restartAuto()
  }
  function next(userAction) { goTo(index + 1, userAction) }
  function prev(userAction) { goTo(index - 1, userAction) }

  if (prevBtn) prevBtn.addEventListener('click', () => prev(true))
  if (nextBtn) nextBtn.addEventListener('click', () => next(true))

  // Keyboard nav when slider is in view
  document.addEventListener('keydown', (e) => {
    const rect = slider.getBoundingClientRect()
    const inView = rect.top < window.innerHeight && rect.bottom > 0
    if (!inView) return
    if (e.key === 'ArrowRight') next(true)
    if (e.key === 'ArrowLeft') prev(true)
  })

  // Touch / swipe support
  let startX = 0, deltaX = 0, dragging = false
  const SWIPE_THRESHOLD = 50

  function onStart(x) { startX = x; deltaX = 0; dragging = true; track.style.transition = 'none' }
  function onMove(x) {
    if (!dragging) return
    deltaX = x - startX
    const offset = -index * slider.clientWidth + deltaX
    track.style.transform = `translateX(${offset}px)`
  }
  function onEnd() {
    if (!dragging) return
    dragging = false
    track.style.transition = ''
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) next(true); else prev(true)
    } else {
      update()
    }
  }

  slider.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX), { passive: true })
  slider.addEventListener('touchmove',  (e) => onMove(e.touches[0].clientX),  { passive: true })
  slider.addEventListener('touchend',   onEnd)

  slider.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX) })
  window.addEventListener('mousemove', (e) => onMove(e.clientX))
  window.addEventListener('mouseup',   onEnd)

  // Pause autoplay on hover/focus
  function startAuto() {
    if (total <= 1) return
    stopAuto()
    autoTimer = setInterval(() => next(false), AUTO_MS)
  }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null } }
  function restartAuto() { stopAuto(); startAuto() }

  slider.addEventListener('mouseenter', stopAuto)
  slider.addEventListener('mouseleave', startAuto)
  slider.addEventListener('focusin', stopAuto)
  slider.addEventListener('focusout', startAuto)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto(); else startAuto()
  })

  update()
  startAuto()
})()

// ===== Reveal-on-scroll =====
;(function initReveal() {
  const candidates = document.querySelectorAll(
    '.about__content-main, .about__content-skills, .projects__content, .contact__form-container, .project-details__showcase-img-cont, .project-details__content-main'
  )
  if (!candidates.length || !('IntersectionObserver' in window)) {
    candidates.forEach(el => el.classList.add('is-visible'))
    return
  }
  candidates.forEach(el => el.classList.add('reveal'))
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  candidates.forEach(el => io.observe(el))
})()

// ===== Modal close on backdrop / Esc =====
;(function initModalDismiss() {
  const modal = document.getElementById('myModal')
  if (!modal) return
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none'
      document.body.classList.remove('modal-open')
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none'
      document.body.classList.remove('modal-open')
    }
  })
})()