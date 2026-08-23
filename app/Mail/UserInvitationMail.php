<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $inviteUrl;
    public ?User $inviter;

    public function __construct(User $user, string $inviteUrl, ?User $inviter = null)
    {
        $this->user = $user;
        $this->inviteUrl = $inviteUrl;
        $this->inviter = $inviter;
    }

    public function build()
    {
        return $this->subject(sprintf('Invitation to join %s', config('app.name')))
            ->from(config('mail.from.address'), config('mail.from.name'))
            ->html($this->renderHtml());
    }

    private function renderHtml(): string
    {
        $name = e($this->user->name);
        $role = e(ucfirst($this->user->role));
        $appName = e(config('app.name'));
        $inviteUrl = e($this->inviteUrl);
        $inviterName = $this->inviter ? e($this->inviter->name) : 'an administrator';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join {$appName}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f6fb;color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px rgba(15,23,42,.08);">
                    <tr>
                        <td style="padding:40px 40px 24px;text-align:center;background:#00713D;color:#ffffff;">
                            <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:900;">Welcome to {$appName}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 40px 24px;">
                            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:#374151;">Hi {$name},</p>
                            <p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:#374151;">
                                You have been invited by <strong>{$inviterName}</strong> to join <strong>{$appName}</strong> as a User.
                            </p>
                            <p style="margin:0 0 28px;font-size:16px;line-height:1.8;color:#374151;">
                                Click the button below to set your password and activate your account. This link will expire in 48 hours.
                            </p>
                            <p style="text-align:center;margin:0 0 30px;">
                                <a href="{$inviteUrl}" style="display:inline-block;padding:16px 28px;background:#00713D;color:#ffffff;border-radius:14px;text-decoration:none;font-weight:700;">Set Your Password</a>
                            </p>
                            <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#6b7280;">
                                If the button does not work, copy and paste the following link into your browser:
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;word-break:break-all;">
                                <a href="{$inviteUrl}" style="color:#00713D;text-decoration:none;">{$inviteUrl}</a>
                            </p>
                            <p style="margin:32px 0 0;font-size:14px;line-height:1.7;color:#6b7280;">
                                If you did not expect this invitation, please ignore this email or contact your administrator.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 40px;background:#f9fafb;color:#6b7280;font-size:13px;line-height:1.7;">
                            <p style="margin:0;">This invitation expires in 48 hours.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}
