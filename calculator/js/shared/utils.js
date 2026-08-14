/**
 * Utils module — XSS-safe HTML templating.
 * User data is escaped; nested html`` fragments pass through as SafeHTML.
 */

class SafeHTML {
  constructor(s) { this.value = s; }
  toString() { return this.value; }
}

export function html(strings, ...values) {
  const escapeHTML = (str) => {
    if (str === null || str === undefined) return '';
    if (str instanceof SafeHTML) return str.value;
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const result = strings.reduce((acc, string, i) => {
    let value = values[i];
    if (value === undefined) value = '';
    if (value instanceof SafeHTML) return acc + string + value.value;
    if (Array.isArray(value)) return acc + string + value.join('');
    return acc + string + escapeHTML(value);
  }, '');

  return new SafeHTML(result);
}

export const formatCurrency = (val) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
};

export const formatNumber = (val) => {
  return new Intl.NumberFormat('el-GR', { maximumFractionDigits: 1 }).format(val);
};
