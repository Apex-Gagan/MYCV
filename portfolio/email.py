"""Contact-form mail delivery.

The contact form is send-only: nothing is persisted, the submission is rendered
into an HTML (+ plain-text) email and handed to the SMTP backend configured from
the environment (``EMAIL_HOST_USER`` / ``EMAIL_HOST_PASSWORD``).
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)

# Every lead lands in this inbox, regardless of who sent it.
CONTACT_RECEIVER = getattr(
    settings, "CONTACT_RECEIVER_EMAIL", "softwaredeveloper@gagandeepsingh.in"
)


def send_email(subject_field, name, message_body, sender_email):
    """Render and deliver one contact-form submission.

    Returns True when the message was handed to the SMTP server, False otherwise.
    """
    name = (name or "").strip()
    sender_email = (sender_email or "").strip()
    message_body = (message_body or "").strip()

    context = {
        "subject_field": subject_field,
        "name": name,
        "first_name": name.split()[0] if name else "them",
        "sender_email": sender_email,
        "message_body": message_body,
        "preview_snippet": message_body[:120],
        # settings.TIME_ZONE is UTC, so label it rather than leave it ambiguous
        "received_at": timezone.localtime().strftime("%d %b %Y, %I:%M %p %Z"),
    }

    text_body = render_to_string("emails/contact_lead.txt", context)
    html_body = render_to_string("emails/contact_lead.html", context)

    connection = None
    try:
        connection = get_connection()
        email = EmailMultiAlternatives(
            subject=f"Portfolio {subject_field} — {name or sender_email}",
            body=text_body,
            from_email=f"GDSP Portfolio Lead <{settings.EMAIL_HOST_USER}>",
            to=[CONTACT_RECEIVER],
            reply_to=[sender_email] if sender_email else None,
            connection=connection,
        )
        email.attach_alternative(html_body, "text/html")
        email.send(fail_silently=False)
        return True
    except Exception:
        logger.exception("Contact form email could not be delivered")
        return False
    finally:
        if connection is not None:
            try:
                connection.close()
            except Exception:
                pass
