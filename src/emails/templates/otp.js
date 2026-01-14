module.exports = ({ code, minutes = 5 }) => {
  const subject = `Your Admin OTP: ${code}`;
  const text = `Your OTP code is ${code}. It expires in ${minutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#222;">Himashi Properties Admin Login</h2>
      <p>Your OTP code is:</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${code}</div>
      <p style="color:#555;">This code expires in ${minutes} minutes.</p>
    </div>
  `;
  return { subject, text, html };
};
