"""Contact-form spam policy — the server-side gate.

The browser runs a mirror of these rules for instant feedback, but this module
is the real enforcement: every submission that reaches the view is screened
here before any email is sent. JavaScript checks can be bypassed; this cannot.

The policy has two rules:

  1. No links of any kind. Full URLs (``https://…``), bare domains
     (``example.com``), ``www.`` prefixes, markdown/BBCode links, ``mailto:``
     and common obfuscations (``example dot com``, ``example[.]com``,
     ``hxxp://``) are all rejected inside the message.
  2. No SEO / promotional outreach vocabulary — the words and phrases that
     the spam we actually receive is built from (see ``SPAM_TERMS``).

Everything the policy blocks lives in the three tables below
(``LINK_TLDS``, ``SPAM_TERMS``, ``MAX_MESSAGE_LENGTH``). To tune the filter,
edit those — the matching logic underneath rarely needs to change.

Public API:
    screen_submission(name, message) -> (field, user_message) | None
    message_rejection_reason(text)   -> str | None
    contains_link(text)              -> bool
"""

import re

# ---------------------------------------------------------------------------
# Policy tables — edit these to tune the filter.
# ---------------------------------------------------------------------------

# A message longer than this is almost always a pasted spam wall, never a real
# first-contact note. Rejected outright.
MAX_MESSAGE_LENGTH = 4000

# Top-level domains used to recognise a *bare* domain like "example.com".
# Deliberately curated (not "any dotted word") so ordinary text such as
# "React.js", "index.html" or "v2.0" is never mistaken for a link.
LINK_TLDS = {
    "com", "net", "org", "info", "biz", "edu", "gov", "io", "co", "ai", "app",
    "dev", "me", "tv", "cc", "gg", "to", "ly", "us", "uk", "in", "ca", "au",
    "de", "fr", "it", "es", "nl", "ru", "cn", "jp", "br", "sg", "ae", "eu",
    "xyz", "online", "site", "website", "shop", "store", "tech", "top", "club",
    "live", "pro", "vip", "work", "space", "fun", "icu", "buzz", "world",
    "company", "agency", "digital", "marketing", "services", "solutions",
    "media", "email", "link", "click", "expert", "guru", "finance", "life",
}

# SEO / promotional outreach vocabulary. Matched as whole words or phrases,
# case-insensitively, with flexible spacing ("link building" == "link  building").
# Multi-word phrases are preferred over broad single words to keep false
# positives low. Add new terms as fresh spam patterns show up.
SPAM_TERMS = [
    # SEO core
    "seo", "search engine optimization", "search engine optimisation",
    "seo services", "seo expert", "seo specialist", "seo agency", "seo company",
    "backlink", "backlinks", "link building", "link exchange", "do follow",
    "dofollow", "off page", "off-page", "on page", "on-page",
    "domain authority", "domain rating", "page rank", "pagerank",
    "google ranking", "rank on google", "rank your website", "rank higher",
    "ranking on google", "first page of google", "top of google",
    "number one on google", "improve your ranking", "improve your website",
    "boost your ranking", "search ranking",
    # traffic / sales pitches
    "increase traffic", "website traffic", "web traffic", "organic traffic",
    "drive traffic", "increase sales", "boost sales", "increase your sales",
    "increase your revenue", "grow your business online",
    # marketing services outreach
    "digital marketing", "social media marketing", "smm panel",
    "lead generation", "generate leads", "b2b leads", "bulk email",
    "cold email", "email marketing", "mass email", "ppc", "pay per click",
    "google ads", "meta ads", "facebook ads", "run ads for you",
    "web design services", "web development services", "website development company",
    "we noticed your website", "i visited your website", "came across your website",
    "found your website", "your website ranking",
    # money / scam
    "make money online", "earn money online", "work from home", "passive income",
    "investment opportunity", "guaranteed returns", "double your money",
    "crypto", "cryptocurrency", "bitcoin", "forex", "casino", "betting",
    "viagra", "cialis", "payday loan", "loan offer",
    # pressure phrases
    "limited time offer", "special offer", "act now", "click here",
    "affordable price", "cheapest price", "best price guaranteed",
]

# User-facing messages (kept generic so spammers can't tune against them).
LINK_MESSAGE = (
    "Please remove any website links or URLs from your message. "
    "You can share links after we connect."
)
SPAM_MESSAGE = (
    "Your message looks like marketing or SEO outreach, which this form "
    "doesn't accept. Please write a genuine enquiry."
)
TOO_LONG_MESSAGE = "Your message is too long. Please keep it under 4000 characters."
NAME_LINK_MESSAGE = "Please enter a real name without any links or URLs."


# ---------------------------------------------------------------------------
# Matching logic — normally left alone; edit the tables above instead.
# ---------------------------------------------------------------------------

# Explicit link syntaxes: real schemes plus obfuscated "hxxp://" variants.
_SCHEME_RE = re.compile(r"\b(?:h[a-z]{2,3}|ftp|ftps|sftp|mailto|tel)\s*:\s*/*", re.I)
# "www." / "www2." prefixes.
_WWW_RE = re.compile(r"\bwww\d{0,3}\s*\.", re.I)
# Markdown "[text](...)" and BBCode "[url=...]" / "[link=...]" link syntax.
_MARKUP_LINK_RE = re.compile(r"\]\s*\(\s*\S+\s*\)|\[\s*(?:url|link)\b", re.I)
# Email addresses — pulled out before the bare-domain scan so a real address
# someone types in the body doesn't get mislabelled as a "link".
_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+", re.I)
# Bare domain: one or more "label." groups followed by a TLD we recognise.
_DOMAIN_RE = re.compile(
    r"\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,24})\b", re.I
)

# Normalise common dot-obfuscations ("example dot com", "example[.]com",
# "example (dot) com") back to a real dot so the domain scan can see them.
_DOT_OBFUSCATION_RE = re.compile(
    r"\s*(?:\[\s*\.?\s*\]|\(\s*(?:dot|\.)\s*\)|\{\s*dot\s*\}|\bd0t\b|\bdot\b)\s*",
    re.I,
)


def _build_spam_regex(terms):
    """Compile the spam vocabulary into one word-boundary-aware pattern."""
    parts = []
    for term in terms:
        escaped = r"\s+".join(re.escape(word) for word in term.split())
        parts.append(escaped)
    # (?<!\w) / (?!\w) act as boundaries that also work for terms like "#1"
    # or "seo-services" where plain \b would misbehave.
    return re.compile(r"(?<!\w)(?:" + "|".join(parts) + r")(?!\w)", re.I)


_SPAM_RE = _build_spam_regex(SPAM_TERMS)


def _normalise(text):
    """Collapse obfuscated dots so "example dot com" reads as "example.com"."""
    return _DOT_OBFUSCATION_RE.sub(".", text or "")


def contains_link(text):
    """True when *text* holds a URL, bare domain, or obfuscated link."""
    if not text:
        return False

    if _SCHEME_RE.search(text) or _WWW_RE.search(text) or _MARKUP_LINK_RE.search(text):
        return True

    # Strip emails first, then de-obfuscate, then look for a bare domain.
    scrubbed = _EMAIL_RE.sub(" ", text)
    scrubbed = _normalise(scrubbed)
    for match in _DOMAIN_RE.finditer(scrubbed):
        if match.group(1).lower() in LINK_TLDS:
            return True
    return False


def contains_spam_terms(text):
    """True when *text* contains any banned SEO / promotional term."""
    return bool(text) and bool(_SPAM_RE.search(text))


def message_rejection_reason(text):
    """Return a user-facing reason to reject *text*, or None if it's clean."""
    text = (text or "").strip()
    if len(text) > MAX_MESSAGE_LENGTH:
        return TOO_LONG_MESSAGE
    if contains_link(text):
        return LINK_MESSAGE
    if contains_spam_terms(text):
        return SPAM_MESSAGE
    return None


def screen_submission(name, message):
    """Screen a contact submission.

    Returns ``(field, user_message)`` for the first rule a submission breaks,
    or ``None`` when it passes. ``field`` matches the form input name so the
    view can surface the error against the right box.
    """
    if contains_link(name):
        return "name", NAME_LINK_MESSAGE

    reason = message_rejection_reason(message)
    if reason:
        return "message", reason

    return None
