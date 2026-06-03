import datetime
from datetime import timezone

from django.conf import settings
from django.core.mail import EmailMessage, get_connection, EmailMultiAlternatives

from django.utils.html import escape


def send_email(subject_field, name, message_body, sender_email):
    connection = get_connection()
    i = 0
    if i <= 0:
        try:

            display_from = f"GDSP Portfolio Lead <{settings.EMAIL_HOST_USER}>"

            email_subject = f"Portfolio {subject_field}"

            # Plain-text fallback (for clients that don't render HTML)
            text_body = (
                f"You have received a new message from your portfolio contact form.\n\n"
                f"Name:    {name}\n"
                f"Email:   {sender_email}\n"
                f"Subject: {subject_field}\n\n"
                f"Message:\n"
                f"{message_body}\n\n"
                f"— Sent from gagandeepsingh.in contact form"
            )

            # HTML version — styled to match portfolio (black + yellow theme)
            html_body = f"""\
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Contact Form Message</title>
            </head>
            <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#222;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f4; padding: 30px 0;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow:hidden;">

                                <!-- Header -->
                                <tr>
                                    <td style="background-color:#111111; padding: 26px 30px; text-align: left; border-bottom: 3px solid #ffc107;">
                                        <h1 style="margin:0; color:#ffc107; font-size: 20px; font-weight:600; letter-spacing:0.5px;">
                                            New Contact Form Message
                                        </h1>
                                        <p style="margin:6px 0 0 0; color:#cccccc; font-size:12px; letter-spacing:0.3px;">
                                            Gagandeep&apos;s Portfolio Website
                                        </p>
                                    </td>
                                </tr>

                                <!-- Intro -->
                                <tr>
                                    <td style="padding: 28px 30px 8px 30px;">
                                        <p style="margin:0 0 20px 0; font-size:15px; line-height:1.55; color:#444;">
                                            You&apos;ve received a new message from your portfolio contact form. Details are below.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Details card -->
                                <tr>
                                    <td style="padding: 0 30px 20px 30px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fafafa; border:1px solid #eee; border-radius:8px;">
                                            <tr>
                                                <td style="padding: 16px 20px; border-bottom:1px solid #eee;">
                                                    <div style="font-size:11px; color:#888; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px;">Name</div>
                                                    <div style="font-size:15px; color:#222; font-weight:600;">{escape(name)}</div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 20px; border-bottom:1px solid #eee;">
                                                    <div style="font-size:11px; color:#888; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px;">Email</div>
                                                    <div style="font-size:15px; color:#222;">
                                                        <a href="mailto:{escape(sender_email)}" style="color:#c69500; text-decoration:none;">{escape(sender_email)}</a>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 20px;">
                                                    <div style="font-size:11px; color:#888; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px;">Subject</div>
                                                    <div style="font-size:15px; color:#222; font-weight:500;">{escape(subject_field)}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- Message block -->
                                <tr>
                                    <td style="padding: 0 30px 20px 30px;">
                                        <div style="font-size:11px; color:#888; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px;">Message</div>
                                        <div style="background-color:#fffbea; border-left:4px solid #ffc107; border-radius:4px; padding: 16px 18px; font-size:15px; line-height:1.6; color:#333; white-space:pre-wrap;">{escape(message_body)}</div>
                                    </td>
                                </tr>

                                <!-- Quick reply button -->
                                <tr>
                                    <td align="center" style="padding: 8px 30px 30px 30px;">
                                        <a href="mailto:{escape(sender_email)}?subject=Re:%20{escape(subject_field)}"
                                           style="display:inline-block; background-color:#ffc107; color:#111111; text-decoration:none; font-weight:600; font-size:14px; padding: 12px 28px; border-radius:6px; letter-spacing:0.3px;">
                                            Reply to {escape(name.split()[0] if name else 'Sender')}
                                        </a>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style="background-color:#111111; padding: 16px 30px; text-align:center;">
                                        <p style="margin:0; font-size:12px; color:#999;">
                                            Sent automatically from your portfolio contact form on
                                            <span style="color:#ffc107;">{datetime.datetime.now().date()}</span>.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """

            email = EmailMultiAlternatives(
                subject=email_subject,
                body=text_body,
                from_email=display_from,
                to=["softwaredeveloper@gagandeepsingh.in"],
                reply_to=[sender_email],  # so clicking Reply goes to the sender
                connection=connection,
            )
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)

            i += 1
            connection.close()
        except Exception as e:
            print(e)
