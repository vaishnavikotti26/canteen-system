export const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const imgSrc = (p) => {
  if (!p) return '';
  if (/^https?:/i.test(p)) return p;
  return (import.meta.env.VITE_FILES_URL || '') + p;
};

export const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3e9dc"/><text x="200" y="180" font-size="100" text-anchor="middle">🍽️</text></svg>'
  );
