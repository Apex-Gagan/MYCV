/* ==========================================================================
   Gagandeep Singh / Portfolio interactions
   Vanilla JS, no dependencies. Scroll state comes from IntersectionObserver,
   never from a scroll listener.
   ========================================================================== */
;(function () {
  'use strict'

  const $ = (sel, root) => (root || document).querySelector(sel)
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel))
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const hasIO = 'IntersectionObserver' in window

  /* ------------------------------------------------------------------
     Nav: shadow once the page has scrolled (sentinel at the very top)
     ------------------------------------------------------------------ */
  ;(function navState() {
    const nav = $('#siteNav')
    const sentinel = $('#top-sentinel')
    if (!nav || !sentinel || !hasIO) return
    const io = new IntersectionObserver(([entry]) => {
      nav.classList.toggle('nav--scrolled', !entry.isIntersecting)
    })
    io.observe(sentinel)
  })()

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  ;(function mobileMenu() {
    const btn = $('.nav__toggle')
    const menu = $('#menu')
    if (!btn || !menu) return

    let isOpen = false

    function open() {
      if (isOpen) return
      isOpen = true
      menu.classList.add('is-open')
      menu.setAttribute('aria-hidden', 'false')
      btn.setAttribute('aria-expanded', 'true')
      document.body.classList.add('menu-open')
      const first = $('a, button', menu)
      if (first) first.focus({ preventScroll: true })
    }

    function close(returnFocus) {
      if (!isOpen) return
      isOpen = false
      menu.classList.remove('is-open')
      menu.setAttribute('aria-hidden', 'true')
      btn.setAttribute('aria-expanded', 'false')
      document.body.classList.remove('menu-open')
      if (returnFocus) btn.focus({ preventScroll: true })
    }

    btn.addEventListener('click', () => (isOpen ? close(true) : open()))
    $$('[data-menu-close]', menu).forEach((el) => el.addEventListener('click', () => close(true)))

    $$('a[href]', menu).forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || ''
        const hash = href.indexOf('#') > -1 ? href.slice(href.indexOf('#')) : ''
        const samePage = href.startsWith('#') || href.startsWith('/#') && location.pathname === '/'
        const target = samePage && hash.length > 1 ? document.getElementById(hash.slice(1)) : null
        close(false)
        if (target) {
          e.preventDefault()
          // Let the overlay fade before the page moves underneath it.
          setTimeout(() => {
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' })
            history.replaceState(null, '', hash)
          }, 220)
        }
      })
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close(true)
    })

    window.matchMedia('(min-width: 961px)').addEventListener('change', (mq) => {
      if (mq.matches) close(false)
    })
  })()

  /* ------------------------------------------------------------------
     Scroll-spy for the desktop nav
     ------------------------------------------------------------------ */
  ;(function scrollSpy() {
    const links = $$('.nav__link[href*="#"]')
    if (!links.length || !hasIO) return

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
        links.forEach((l) => l.classList.remove('is-active'))
        const active = map.get(entry.target)
        if (active) active.classList.add('is-active')
      })
    }, { rootMargin: '-40% 0px -55% 0px' })

    map.forEach((_, section) => io.observe(section))
  })()

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  ;(function reveal() {
    const targets = $$('[data-reveal]')
    if (!targets.length) return

    if (prefersReduced || !hasIO) {
      targets.forEach((el) => el.classList.add('is-in'))
      return
    }

    targets.forEach((el) => {
      el.classList.add('reveal')
      if (el.dataset.delay) el.style.setProperty('--delay', el.dataset.delay)
    })

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })

    targets.forEach((el) => io.observe(el))
  })()

  /* ------------------------------------------------------------------
     Back to top
     ------------------------------------------------------------------ */
  $$('[data-to-top]').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
    })
  })

  /* ------------------------------------------------------------------
     Success modal
     ------------------------------------------------------------------ */
  const modal = (function successModal() {
    const el = document.getElementById('myModal')
    if (!el) return null

    function open() {
      el.classList.add('is-open')
      el.setAttribute('aria-hidden', 'false')
      document.body.classList.add('modal-open')
      const cta = $('[data-modal-close]', el)
      if (cta) cta.focus()
    }
    function close() {
      el.classList.remove('is-open')
      el.setAttribute('aria-hidden', 'true')
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
     Contact form: posts to Django, which emails the lead (no storage)
     ------------------------------------------------------------------ */
  ;(function contactForm() {
    const form = document.getElementById('contactForm')
    if (!form) return

    const btn = document.getElementById('cbtn')
    const btnLabel = btn ? btn.querySelector('.btn__label') : null
    const fields = ['name', 'email', 'message']

    /* ----------------------------------------------------------------
       Spam policy: a mirror of portfolio/spam_filter.py for instant
       feedback. The server re-checks everything, so this list only has
       to be good enough to catch honest mistakes; keep it roughly in
       sync with the Python tables, which are the source of truth.
       ---------------------------------------------------------------- */
    const spamPolicy = (function () {
      const MAX_MESSAGE_LENGTH = 4000

      const LINK_TLDS = new Set([
        'com', 'net', 'org', 'info', 'biz', 'edu', 'gov', 'io', 'co', 'ai',
        'app', 'dev', 'me', 'tv', 'cc', 'gg', 'to', 'ly', 'us', 'uk', 'in',
        'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'ru', 'cn', 'jp', 'br',
        'sg', 'ae', 'eu', 'xyz', 'online', 'site', 'website', 'shop', 'store',
        'tech', 'top', 'club', 'live', 'pro', 'vip', 'work', 'space', 'fun',
        'icu', 'buzz', 'world', 'company', 'agency', 'digital', 'marketing',
        'services', 'solutions', 'media', 'email', 'link', 'click', 'expert',
        'guru', 'finance', 'life',
      ])

      const SPAM_TERMS = [
        'seo', 'search engine optimization', 'search engine optimisation',
        'seo services', 'seo expert', 'seo specialist', 'seo agency',
        'seo company', 'backlink', 'backlinks', 'link building', 'link exchange',
        'do follow', 'dofollow', 'off page', 'off-page', 'on page', 'on-page',
        'domain authority', 'domain rating', 'page rank', 'pagerank',
        'google ranking', 'rank on google', 'rank your website', 'rank higher',
        'ranking on google', 'first page of google', 'top of google',
        'number one on google', 'improve your ranking', 'improve your website',
        'boost your ranking', 'search ranking', 'increase traffic',
        'website traffic', 'web traffic', 'organic traffic', 'drive traffic',
        'increase sales', 'boost sales', 'increase your sales',
        'increase your revenue', 'grow your business online', 'digital marketing',
        'social media marketing', 'smm panel', 'lead generation',
        'generate leads', 'b2b leads', 'bulk email', 'cold email',
        'email marketing', 'mass email', 'ppc', 'pay per click', 'google ads',
        'meta ads', 'facebook ads', 'run ads for you', 'web design services',
        'web development services', 'website development company',
        'we noticed your website', 'i visited your website',
        'came across your website', 'found your website', 'your website ranking',
        'make money online', 'earn money online', 'work from home',
        'passive income', 'investment opportunity', 'guaranteed returns',
        'double your money', 'crypto', 'cryptocurrency', 'bitcoin', 'forex',
        'casino', 'betting', 'viagra', 'cialis', 'payday loan', 'loan offer',
        'limited time offer', 'special offer', 'act now', 'click here',
        'affordable price', 'cheapest price', 'best price guaranteed',
      ]

      // Canned contact-form spam sentences (matched as whole phrases, tolerant
      // of punctuation/spacing). Mirrors SPAM_PHRASES in spam_filter.py.
      const SPAM_PHRASES = [
        'i would like more information',
        'i would like to get more information',
        'i would like to know more',
        'contact me by email',
        'contact me by e mail',
        'contact me via email',
        'please get back to me by email',
        'reply to me by email',
        'get back to me as soon as possible',
      ]

      const LINK_MESSAGE =
        'Please remove any website links or URLs from your message. ' +
        'You can share links after we connect.'
      const SPAM_MESSAGE =
        "Your message looks like automated or promotional spam, which this " +
        "form doesn't accept. Please write a genuine enquiry in your own words."
      const TOO_LONG_MESSAGE =
        'Your message is too long. Please keep it under 4000 characters.'
      const NAME_LINK_MESSAGE =
        'Please enter a real name without any links or URLs.'

      const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const spamRe = new RegExp(
        '\\b(?:' +
          SPAM_TERMS.map((t) => t.split(' ').map(escapeRe).join('\\s+')).join('|') +
          ')\\b',
        'i'
      )
      // Phrases: reduce each to alphanumeric words joined by "any non-word run"
      // so "e-mail", "e mail" and "email" all match. \b (not lookbehind) keeps
      // this valid on older browsers; phrases start/end with word chars anyway.
      const phraseRe = new RegExp(
        '\\b(?:' +
          SPAM_PHRASES.map((p) =>
            (p.toLowerCase().match(/[a-z0-9]+/g) || []).join('[\\W_]+')
          ).join('|') +
          ')\\b',
        'i'
      )

      const schemeRe = /\b(?:h[a-z]{2,3}|ftp|ftps|sftp|mailto|tel)\s*:\s*\/*/i
      const wwwRe = /\bwww\d{0,3}\s*\./i
      const markupLinkRe = /\]\s*\(\s*\S+\s*\)|\[\s*(?:url|link)\b/i
      const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/gi
      const domainRe = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,24})\b/gi
      const dotObfRe =
        /\s*(?:\[\s*\.?\s*\]|\(\s*(?:dot|\.)\s*\)|\{\s*dot\s*\}|\bd0t\b|\bdot\b)\s*/gi

      function containsLink(text) {
        if (!text) return false
        if (schemeRe.test(text) || wwwRe.test(text) || markupLinkRe.test(text)) {
          return true
        }
        const scrubbed = text.replace(emailRe, ' ').replace(dotObfRe, '.')
        domainRe.lastIndex = 0
        let m
        while ((m = domainRe.exec(scrubbed)) !== null) {
          if (LINK_TLDS.has(m[1].toLowerCase())) return true
        }
        return false
      }

      function containsSpamTerms(text) {
        return !!text && spamRe.test(text)
      }

      function containsSpamPhrase(text) {
        return !!text && phraseRe.test(text)
      }

      // Returns { field, message } for the first broken rule, or null.
      function screen(name, message) {
        if (containsLink(name)) return { field: 'name', message: NAME_LINK_MESSAGE }
        const msg = (message || '').trim()
        if (msg.length > MAX_MESSAGE_LENGTH) return { field: 'message', message: TOO_LONG_MESSAGE }
        if (containsLink(msg)) return { field: 'message', message: LINK_MESSAGE }
        if (containsSpamTerms(msg) || containsSpamPhrase(msg)) {
          return { field: 'message', message: SPAM_MESSAGE }
        }
        return null
      }

      return { screen }
    })()

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

      // Spam policy (mirrors the server). Blocks links/URLs and SEO/marketing
      // outreach before a request is ever sent.
      const nameVal = (document.getElementById('name') || {}).value || ''
      const messageVal = (document.getElementById('message') || {}).value || ''
      const violation = spamPolicy.screen(nameVal, messageVal)
      if (violation) {
        showError(violation.field, violation.message)
        return
      }

      if (btn) btn.disabled = true
      setLabel('Sending')

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
        showError('form', 'Network error. Please check your connection and try again.')
      } finally {
        if (btn) btn.disabled = false
        setLabel('Send message')
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
