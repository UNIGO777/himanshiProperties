const extractEmail = (value) => {
  if (!value) return undefined;
  const s = String(value).trim();
  const match = s.match(/<([^>]+)>/);
  const email = (match ? match[1] : s).trim();
  return email.length ? email : undefined;
};

const isExampleDotCom = (email) => {
  if (!email) return false;
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  return email.slice(at + 1).toLowerCase() === 'example.com';
};

const getFromHeader = () => (process.env.SMTP_FROM || process.env.SMTP_USER || '').trim() || undefined;

const getEnvelopeFrom = (fromHeader) => {
  const fallback = (process.env.SMTP_USER || '').trim() || undefined;
  return fallback || extractEmail(fromHeader);
};

const buildMailOptions = ({ to, subject, text, html }) => {
  const from = getFromHeader();
  if (!from) throw new Error('SMTP sender not configured');

  const envelopeFrom = getEnvelopeFrom(from);
  if (isExampleDotCom(extractEmail(from)) || isExampleDotCom(envelopeFrom)) {
    throw new Error('SMTP_FROM must not use example.com. Set SMTP_FROM to your real domain email.');
  }

  const toList = Array.isArray(to) ? to : [to];
  const envelope = envelopeFrom ? { from: envelopeFrom, to: toList } : undefined;

  return { from, to, subject, text, html, envelope };
};

module.exports = { buildMailOptions };

