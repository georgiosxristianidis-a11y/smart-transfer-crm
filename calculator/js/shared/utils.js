/**
 * Utils module based on Athlete Pro architecture.
 * Provides safe HTML rendering to prevent XSS.
 */

export function html(strings, ...values) {
  const escapeHTML = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  return strings.reduce((result, string, i) => {
    let value = values[i];
    if (value === undefined) value = '';
    if (Array.isArray(value)) value = value.join('');
    else if (typeof value === 'string') value = escapeHTML(value);
    
    return result + string + value;
  }, '');
}

export const formatCurrency = (val) => {
  return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
};

export const formatNumber = (val) => {
  return new Intl.NumberFormat('el-GR', { maximumFractionDigits: 1 }).format(val);
};
