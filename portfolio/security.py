"""Response security-header middleware.

Django's own ``SecurityMiddleware`` already covers HSTS, ``X-Content-Type-
Options``, ``Referrer-Policy``, the Cross-Origin-Opener-Policy and the HTTPS
redirect through settings. This middleware adds the headers Django has no
setting for — a nonce-based Content-Security-Policy plus Permissions-Policy and
the smaller cross-origin / legacy hardening headers — so the parts of the
header policy that aren't plain settings live in one reviewable place.

The CSP is nonce + ``strict-dynamic``: every ``<script>`` tag written into the
page carries ``nonce="{{ request.csp_nonce }}"``, and those trusted scripts are
allowed to pull in their own dependencies (Google Tag Manager, GA4, the Vercel
analytics bundles). CSP3 browsers then ignore the ``https:`` / ``'unsafe-inline'``
fallbacks, which remain only so pre-CSP3 browsers still run the page.
"""

import secrets

# Everything in the CSP except ``default-src`` and the per-request ``script-src``
# (which needs the nonce spliced in on each response).
_CSP_DIRECTIVES = (
    # Google Fonts + Font Awesome (cdnjs) ship their CSS as cross-origin
    # stylesheets; 'unsafe-inline' also covers the handful of inline style
    # attributes in the markup (e.g. the GTM <noscript> iframe).
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    # Project images are stored as arbitrary external URLs, so https: has to be
    # allowed here; images can't execute, so this is low risk.
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
    # XHR/fetch/beacons: Vercel analytics posts to same-origin /_vercel/*;
    # GTM/GA4 beacons go to the Google endpoints below.
    "connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com "
    "https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
    # Only the GTM <noscript> iframe is framed in.
    "frame-src https://www.googletagmanager.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
)

# Lock down powerful browser features the portfolio never uses. clipboard-write
# and fullscreen stay allowed for 'self' because UI niceties may rely on them.
_PERMISSIONS_POLICY = (
    "accelerometer=(), autoplay=(), browsing-topics=(), camera=(), "
    "clipboard-read=(), clipboard-write=(self), display-capture=(), "
    "encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), "
    "interest-cohort=(), magnetometer=(), microphone=(), midi=(), payment=(), "
    "picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), "
    "usb=(), xr-spatial-tracking=()"
)


class SecurityHeadersMiddleware:
    """Attach the CSP and the remaining hardening headers to every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # A fresh nonce per request; the template reads it as request.csp_nonce.
        nonce = secrets.token_urlsafe(16)
        request.csp_nonce = nonce

        response = self.get_response(request)

        if request.path.startswith("/admin"):
            # Django admin ships un-nonced inline scripts/styles, so the strict
            # strict-dynamic policy would break its UI. The admin is first-party,
            # login-gated and excluded from robots, so a relaxed (but still
            # self-only, no-framing) policy is the right trade-off here.
            directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "font-src 'self' data:",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
            ]
        else:
            directives = [
                "default-src 'self'",
                f"script-src 'self' 'nonce-{nonce}' 'strict-dynamic' https: 'unsafe-inline'",
                *_CSP_DIRECTIVES,
            ]
        # upgrade-insecure-requests only makes sense once the request is already
        # HTTPS. On the plain-HTTP dev server it would try to upgrade the
        # same-origin static files to https and break local browsing.
        if request.is_secure():
            directives.append("upgrade-insecure-requests")

        # setdefault: never clobber a header a view set deliberately.
        response.setdefault("Content-Security-Policy", "; ".join(directives))
        response.setdefault("Permissions-Policy", _PERMISSIONS_POLICY)
        response.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        response.setdefault("Cross-Origin-Embedder-Policy", "credentialless")
        # Legacy XSS auditor is removed from modern browsers; 0 is the OWASP-
        # recommended value (an enabled auditor could itself be abused).
        response.setdefault("X-XSS-Protection", "0")
        response.setdefault("X-Permitted-Cross-Domain-Policies", "none")
        response.setdefault("X-DNS-Prefetch-Control", "off")
        response.setdefault("Origin-Agent-Cluster", "?1")
        return response
