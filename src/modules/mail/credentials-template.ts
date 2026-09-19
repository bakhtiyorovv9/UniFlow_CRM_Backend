export type CredentialsMail = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'teacher' | 'student';
  kind: 'created' | 'password_changed';
};

const ROLE_LABEL = { teacher: "o'qituvchi", student: 'talaba' } as const;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
}

export function credentialsSubject(input: CredentialsMail) {
  return input.kind === 'created'
    ? 'UniFlow: platformaga kirish maʼlumotlaringiz'
    : 'UniFlow: parolingiz yangilandi';
}

export function credentialsText(input: CredentialsMail, appUrl?: string) {
  const lines = [
    `Assalomu alaykum, ${input.name}!`,
    '',
    input.kind === 'created'
      ? `Siz UniFlow platformasiga ${ROLE_LABEL[input.role]} sifatida qo'shildingiz.`
      : 'UniFlow platformasidagi parolingiz yangilandi.',
    '',
    `Login (email): ${input.email}`,
    `Login (telefon): ${input.phone}`,
    `Parol: ${input.password}`,
    '',
    ...(appUrl ? [`Kirish: ${appUrl.replace(/\/$/, '')}/login`, ''] : []),
    'Xavfsizlik uchun parolni hech kimga bermang.',
    '',
    'Hurmat bilan, UniFlow jamoasi',
  ];
  return lines.join('\n');
}

export function credentialsHtml(input: CredentialsMail, appUrl?: string) {
  const base = appUrl?.replace(/\/$/, '');
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const phone = escapeHtml(input.phone);
  const password = escapeHtml(input.password);
  const title =
    input.kind === 'created'
      ? 'Platformaga xush kelibsiz!'
      : 'Parolingiz yangilandi';
  const intro =
    input.kind === 'created'
      ? `Siz <b>UniFlow</b> platformasiga <b>${ROLE_LABEL[input.role]}</b> sifatida qo'shildingiz. Quyidagi maʼlumotlar bilan tizimga kirishingiz mumkin.`
      : `<b>UniFlow</b> platformasidagi akkauntingiz paroli yangilandi. Yangi kirish maʼlumotlaringiz:`;
  const logo = base
    ? `<img src="${escapeHtml(base)}/logo-mark.png" width="44" height="44" alt="UniFlow" style="display:block;border:0;background:#ffffff;border-radius:12px;padding:4px;" />`
    : `<div style="width:44px;height:44px;border-radius:12px;background:#ffffff;color:#177c86;font:800 22px/44px Arial,sans-serif;text-align:center;">U</div>`;
  const row = (label: string, value: string, mono = false) => `
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #e6eef0;font:13px Arial,sans-serif;color:#64748b;width:38%;">${label}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #e6eef0;font:${mono ? '700 15px' : '600 14px'} ${mono ? "'Courier New',monospace" : 'Arial,sans-serif'};color:#0f172a;word-break:break-all;">${value}</td>
              </tr>`;
  const button = base
    ? `
          <tr>
            <td align="center" style="padding:8px 32px 28px;">
              <a href="${escapeHtml(base)}/login" style="display:inline-block;background:#177c86;color:#ffffff;text-decoration:none;font:700 15px Arial,sans-serif;padding:14px 32px;border-radius:12px;">Platformaga kirish</a>
            </td>
          </tr>`
    : '';

  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(credentialsSubject(input))}</title>
</head>
<body style="margin:0;padding:0;background:#eef4f5;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">Login va parolingiz ichida</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f5;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:#177c86;background-image:linear-gradient(135deg,#177c86 0%,#1b8f8a 55%,#22c55e 100%);padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">${logo}</td>
                  <td style="vertical-align:middle;padding-left:12px;">
                    <div style="font:800 20px Arial,sans-serif;color:#ffffff;">UniFlow</div>
                    <div style="font:12px Arial,sans-serif;color:rgba(255,255,255,0.85);">O'quv markazi platformasi</div>
                  </td>
                </tr>
              </table>
              <div style="font:800 24px/1.3 Arial,sans-serif;color:#ffffff;margin-top:24px;">${title}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 12px;font:600 16px Arial,sans-serif;color:#0f172a;">Assalomu alaykum, ${name}!</p>
              <p style="margin:0;font:14px/1.6 Arial,sans-serif;color:#475569;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6eef0;border-radius:14px;overflow:hidden;background:#f8fbfb;">${row('Login (email)', email)}${row('Login (telefon)', phone)}
              <tr>
                <td style="padding:12px 16px;font:13px Arial,sans-serif;color:#64748b;">Parol</td>
                <td style="padding:12px 16px;"><span style="display:inline-block;background:#e7f5f3;border:1px dashed #177c86;border-radius:8px;padding:6px 12px;font:700 16px 'Courier New',monospace;color:#0f5f66;letter-spacing:1px;">${password}</span></td>
              </tr>
              </table>
            </td>
          </tr>${button}
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font:13px/1.5 Arial,sans-serif;color:#9a3412;">
                🔒 Xavfsizlik uchun parolni hech kimga bermang. Tizimga email yoki telefon raqamingiz bilan kirishingiz mumkin.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #eef2f7;padding:18px 32px;font:12px/1.5 Arial,sans-serif;color:#94a3b8;text-align:center;">
              Bu xat avtomatik yuborildi, unga javob qaytarmang.<br />© ${new Date().getFullYear()} UniFlow
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
