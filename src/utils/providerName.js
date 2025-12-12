export const sanitizeProviderName = (name) => {
  if (!name) return '';
  const original = String(name).trim();
  const cleaned = original
    .replace(/\s*\((?:f\/?k\/?a|a\/?k\/?a|f\.?k\.?a\.?|a\.?k\.?a\.?|formerly known as|also known as|fka|aka)[^)]*\)/gi, '')
    .replace(/\s*(?:-|,)?\s*(?:f\/?k\/?a|a\/?k\/?a|f\.?k\.?a\.?|a\.?k\.?a\.?|formerly known as|also known as|fka|aka).*/gi, '')
    .replace(/\s*\((?:closed|temporarily closed)\)/gi, '')
    .replace(/\s*-\s*(?:Assisted Living|Skilled Nursing)\s*$/gi, '')
    .replace(/\s*-\s*Main Concierge Desk\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned || original;
};

export const isProviderClosed = (name) => {
  if (!name) return false;
  const nameStr = String(name).trim();
  const closedPattern = /\((?:closed|temporarily closed)\)/i;
  return closedPattern.test(nameStr);
};

