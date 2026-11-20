// A round profile picture, or a coloured circle with the first letter of the name.
const COLORS = ['#5561e8', '#0d9488', '#7c3aed', '#ea580c', '#e11d48', '#0891b2', '#16a34a', '#c026d3'];

export default function Avatar({ name = '?', url, size = 40, className = '' }) {
  const letter = (name.trim()[0] || '?').toUpperCase();
  const color = COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.42, background: url ? undefined : color }}>
      {url ? <img src={url} alt="" referrerPolicy="no-referrer" /> : letter}
    </span>
  );
}
