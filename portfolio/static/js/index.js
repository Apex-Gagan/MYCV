/* ==========================================================================
   Gagandeep Singh — Portfolio interactions
   Vanilla JS, no dependencies.
   ========================================================================== */
;(function () {
  'use strict'

  const $ = (sel, root) => (root || document).querySelector(sel)
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ------------------------------------------------------------------
     Mobile menu — smooth open/close with scroll lock and focus return
     ------------------------------------------------------------------ */
  ;(function mobileMenu() {
    const btn = $('.header__main-ham-menu-cont')
    const menu = $('.header__sm-menu')
    if (!btn || !menu) return

    const links = $$('.header__sm-menu-link a', menu)
    let isOpen = false
    let scrollY = 0

    function open() {
      if (isOpen) return
      isOpen = true
      scrollY = window.scrollY
      menu.classList.add('header__sm-menu--active')
      btn.classList.add('is-active')
      btn.setAttribute('aria-expanded', 'true')
      menu.setAttribute('aria-hidden', 'false')
      document.body.classList.add('menu-open')
      // Preserve scroll position while the body is locked.
      document.body.style.top = `-${scrollY}px`
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    }

    function close() {
      if (!isOpen) return
      isOpen = false
      menu.classList.remove('header__sm-menu--active')
      btn.classList.remove('is-active')
      btn.setAttribute('aria-expanded', 'false')
      menu.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('menu-open')
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      // `behavior: instant` beats the html{scroll-behavior:smooth} rule, which
      // would otherwise animate the restore and look like a jump.
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      isOpen ? close() : open()
    })

    // The overlay's own X — the header button sits beneath the overlay and is
    // not tappable while the menu is open.
    $$('[data-menu-close]', menu).forEach((closeBtn) => {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        close()
        btn.focus({ preventScroll: true })
      })
    })

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || ''
        const target = href.startsWith('/#') ? $(href.slice(1)) : null

        close()

        // Let the overlay finish closing before scrolling to an in-page anchor.
        if (target) {
          e.preventDefault()
          setTimeout(() => {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' })
            history.replaceState(null, '', href)
          }, 260)
        }
      })
    })

    // Click on the backdrop (outside the menu content) closes it.
    menu.addEventListener('click', (e) => {
      if (!e.target.closest('.header__sm-menu-content')) close()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        close()
        btn.focus()
      }
    })

    // Never leave the overlay stuck open when resizing up to desktop.
    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (isOpen && window.innerWidth > 900) close()
      }, 120)
    })
  })()

  /* ------------------------------------------------------------------
     Logo → home
     ------------------------------------------------------------------ */
  ;(function logoLink() {
    const logo = $('.header__logo-container')
    if (!logo) return
    logo.addEventListener('click', () => { location.href = '/' })
    logo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.href = '/' }
    })
  })()

  /* ------------------------------------------------------------------
     Header shrink + scroll progress + back-to-top
     ------------------------------------------------------------------ */
  ;(function scrollChrome() {
    const header = $('.header')
    const bar = $('.scroll-progress')
    const toTop = $('.to-top')
    let ticking = false

    function paint() {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight

      if (header) header.classList.toggle('header--scrolled', y > 24)
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`
      if (toTop) toTop.classList.toggle('is-visible', y > 620)

      ticking = false
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(paint); ticking = true }
    }, { passive: true })

    paint()

    if (toTop) {
      toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
      })
    }
  })()

  /* ------------------------------------------------------------------
     Cursor spotlight (pointer devices only)
     ------------------------------------------------------------------ */
  ;(function cursorGlow() {
    const glow = $('.cursor-glow')
    if (!glow || prefersReduced) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let running = false

    function loop() {
      cx += (x - cx) * 0.12
      cy += (y - cy) * 0.12
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`
      if (running) requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', (e) => {
      x = e.clientX
      y = e.clientY
      if (!running) { running = true; glow.classList.add('is-on'); requestAnimationFrame(loop) }
    }, { passive: true })

    document.addEventListener('mouseleave', () => glow.classList.remove('is-on'))
    document.addEventListener('mouseenter', () => glow.classList.add('is-on'))
  })()

  /* ------------------------------------------------------------------
     Pointer-tracked sheen on cards
     ------------------------------------------------------------------ */
  ;(function cardSheen() {
    if (prefersReduced) return
    const cards = $$('.glass-card, .about__content-main, .about__content-skills, .projects__row, .contact__form-container, .code-window')
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', `${e.clientX - r.left}px`)
        card.style.setProperty('--my', `${e.clientY - r.top}px`)
      }, { passive: true })
    })
  })()

  /* ------------------------------------------------------------------
     Magnetic buttons
     ------------------------------------------------------------------ */
  ;(function magnetic() {
    if (prefersReduced) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.28
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) * strength
        const dy = (e.clientY - (r.top + r.height / 2)) * strength
        el.style.transform = `translate(${dx}px, ${dy - 3}px)`
      }, { passive: true })
      el.addEventListener('mouseleave', () => { el.style.transform = '' })
    })
  })()

  /* ------------------------------------------------------------------
     Hero: typing role line
     ------------------------------------------------------------------ */
  ;(function typeRoles() {
    const out = $('.home-hero__typed')
    if (!out) return

    let roles = []
    try { roles = JSON.parse(out.dataset.roles || '[]') } catch (_) { roles = [] }
    if (!roles.length) return

    if (prefersReduced) { out.textContent = roles[0]; return }

    let roleIdx = 0
    let charIdx = 0
    let deleting = false

    function tick() {
      const role = roles[roleIdx]
      charIdx += deleting ? -1 : 1
      out.textContent = role.slice(0, charIdx)

      let delay = deleting ? 38 : 74

      if (!deleting && charIdx === role.length) {
        delay = 1900
        deleting = true
      } else if (deleting && charIdx === 0) {
        deleting = false
        roleIdx = (roleIdx + 1) % roles.length
        delay = 380
      }
      setTimeout(tick, delay)
    }

    setTimeout(tick, 900)
  })()

  /* ------------------------------------------------------------------
     Count-up stats
     ------------------------------------------------------------------ */
  ;(function countUp() {
    const nums = $$('[data-count]')
    if (!nums.length) return

    if (prefersReduced || !('IntersectionObserver' in window)) {
      nums.forEach((n) => { n.textContent = n.dataset.count })
      return
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        io.unobserve(el)

        const target = parseFloat(el.dataset.count) || 0
        const duration = 1400
        const start = performance.now()

        function step(now) {
          const p = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          el.textContent = Math.round(target * eased)
          if (p < 1) requestAnimationFrame(step)
          else el.textContent = target
        }
        requestAnimationFrame(step)
      })
    }, { threshold: 0.4 })

    nums.forEach((n) => io.observe(n))
  })()

  /* ------------------------------------------------------------------
     Scroll-spy for the desktop nav
     ------------------------------------------------------------------ */
  ;(function scrollSpy() {
    const links = $$('.header__link[href*="#"]')
    if (!links.length || !('IntersectionObserver' in window)) return

    const map = new Map()
    links.forEach((link) => {
      const id = (link.getAttribute('href') || '').split('#')[1]
      const section = id && document.getElementById(id)
      if (section) map.set(section, link)
    })
    if (!map.size) return

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        links.forEach((l) => l.classList.remove('header__link--active'))
        const active = map.get(entry.target)
        if (active) active.classList.add('header__link--active')
      })
    }, { rootMargin: '-45% 0px -50% 0px' })

    map.forEach((_, section) => io.observe(section))
  })()

  /* ------------------------------------------------------------------
     Projects slider
     ------------------------------------------------------------------ */
  ;(function projectsSlider() {
    const slider = document.getElementById('projectsSlider')
    const track = document.getElementById('projectsTrack')
    const prevBtn = document.getElementById('projectsPrev')
    const nextBtn = document.getElementById('projectsNext')
    const dotsWrap = document.getElementById('projectsDots')
    const counter = document.getElementById('projectsCounter')
    if (!slider || !track) return

    const slides = $$('.projects__row', track)
    const total = slides.length
    if (!total) return

    let index = 0
    let autoTimer = null
    const AUTO_MS = 7000

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
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`
      if (dotsWrap) {
        $$('.projects__dot', dotsWrap).forEach((d, i) => {
          d.classList.toggle('projects__dot--active', i === index)
        })
      }
      if (counter) {
        counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
      }
      slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== index)))
      if (prevBtn) prevBtn.disabled = total <= 1
      if (nextBtn) nextBtn.disabled = total <= 1
    }

    function goTo(i, userAction) {
      index = (i + total) % total
      update()
      if (userAction) restartAuto()
    }
    const next = (u) => goTo(index + 1, u)
    const prev = (u) => goTo(index - 1, u)

    if (prevBtn) prevBtn.addEventListener('click', () => prev(true))
    if (nextBtn) nextBtn.addEventListener('click', () => next(true))

    document.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('menu-open')) return
      const r = slider.getBoundingClientRect()
      if (!(r.top < window.innerHeight && r.bottom > 0)) return
      if (e.key === 'ArrowRight') next(true)
      if (e.key === 'ArrowLeft') prev(true)
    })

    // Drag / swipe
    let startX = 0
    let startY = 0
    let deltaX = 0
    let dragging = false
    let locked = null
    const THRESHOLD = 50

    function onStart(x, y) {
      startX = x; startY = y; deltaX = 0; dragging = true; locked = null
      track.style.transition = 'none'
    }
    function onMove(x, y) {
      if (!dragging) return
      const dx = x - startX
      const dy = y - startY
      if (locked === null) {
        // Only hijack the gesture once it is clearly horizontal.
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      }
      if (locked !== 'x') return
      deltaX = dx
      track.style.transform = `translate3d(${-index * slider.clientWidth + deltaX}px, 0, 0)`
    }
    function onEnd() {
      if (!dragging) return
      dragging = false
      track.style.transition = ''
      if (locked === 'x' && Math.abs(deltaX) > THRESHOLD) {
        deltaX < 0 ? next(true) : prev(true)
      } else {
        update()
      }
      locked = null
    }

    slider.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true })
    slider.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true })
    slider.addEventListener('touchend', onEnd)
    slider.addEventListener('touchcancel', onEnd)

    slider.addEventListener('mousedown', (e) => {
      if (e.target.closest('a, button')) return
      e.preventDefault()
      onStart(e.clientX, e.clientY)
    })
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY))
    window.addEventListener('mouseup', onEnd)

    function startAuto() {
      if (total <= 1 || prefersReduced) return
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
      document.hidden ? stopAuto() : startAuto()
    })

    update()
    startAuto()
  })()

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  ;(function reveal() {
    const targets = $$('[data-reveal]')
    if (!targets.length) return

    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'))
      return
    }

    targets.forEach((el) => el.classList.add('reveal'))

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        io.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

    targets.forEach((el) => io.observe(el))
  })()

  /* ------------------------------------------------------------------
     Success modal
     ------------------------------------------------------------------ */
  const modal = (function successModal() {
    const el = document.getElementById('myModal')
    if (!el) return null

    function open() {
      el.classList.add('is-open')
      document.body.classList.add('modal-open')
      const cta = $('.btn-success', el)
      if (cta) cta.focus()
    }
    function close() {
      el.classList.remove('is-open')
      document.body.classList.remove('modal-open')
    }

    el.addEventListener('click', (e) => { if (e.target === el) close() })
    $$('[data-modal-close]', el).forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault()
      close()
    }))
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.classList.contains('is-open')) close()
    })

    return { open, close }
  })()

  /* ------------------------------------------------------------------
     Contact form — posts to Django, which emails the lead (no storage)
     ------------------------------------------------------------------ */
  ;(function contactForm() {
    const form = document.getElementById('contactForm')
    if (!form) return

    const btn = document.getElementById('cbtn')
    const btnLabel = btn ? btn.querySelector('.btn__label') : null
    const fields = ['name', 'email', 'message']

    function setLabel(text) {
      if (btnLabel) btnLabel.textContent = text
      else if (btn) btn.textContent = text
    }

    function clearErrors() {
      fields.concat('form').forEach((f) => {
        const err = document.getElementById(`${f}-error`)
        if (err) { err.classList.add('d-none'); err.textContent = '' }
        const input = document.getElementById(f)
        if (input) input.classList.remove('has-error')
      })
    }

    function showError(field, message) {
      const err = document.getElementById(`${field}-error`)
      if (err) {
        err.textContent = message
        err.classList.remove('d-none')
      }
      const input = document.getElementById(field)
      if (input) {
        input.classList.add('has-error')
        input.focus({ preventScroll: true })
        input.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' })
      }
    }

    fields.forEach((f) => {
      const input = document.getElementById(f)
      if (!input) return
      input.addEventListener('input', () => {
        input.classList.remove('has-error')
        const err = document.getElementById(`${f}-error`)
        if (err) err.classList.add('d-none')
      })
    })

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      clearErrors()

      if (btn) btn.disabled = true
      setLabel('Sending…')

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        let data = {}
        try { data = await res.json() } catch (_) { /* non-JSON response */ }

        if (res.ok) {
          form.reset()
          if (modal) modal.open()
        } else {
          const field = data.field || 'form'
          const message = data.message || 'Something went wrong. Please try again.'
          showError(fields.includes(field) ? field : 'form', message)
        }
      } catch (_) {
        showError('form', 'Network error — please check your connection and try again.')
      } finally {
        if (btn) btn.disabled = false
        setLabel('Send Message')
      }
    })
  })()

  /* ------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------ */
  ;(function footerYear() {
    const el = document.getElementById('year')
    if (el) el.textContent = new Date().getFullYear()
  })()
})()
