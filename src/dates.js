// Cert Tracker v3 — date/expiry domain logic.
(function initDates(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before dates.js');

  function parseLocalDate(value) {
    if (value instanceof Date) return new Date(value.getTime());
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    return new Date(value);
  }

  function localDateStamp(value = new Date()) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addMonths(value, months) {
    const d = parseLocalDate(value);
    if (Number.isNaN(d.getTime())) return new Date(NaN);
    const originalDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + Number(months || 0));
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDay, lastDay));
    d.setHours(12, 0, 0, 0);
    return d;
  }

  function daysUntil(value) {
    const target = parseLocalDate(value);
    if (Number.isNaN(target.getTime())) return NaN;
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    target.setHours(12, 0, 0, 0);
    return Math.round((target - todayLocal) / 86400000);
  }

  function formatDate(value) {
    if (!value) return '';
    const d = parseLocalDate(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function expiryInfo(cert, passDate) {
    if (!passDate) return { status: 'PENDING', days: null, expiry: null };
    if (cert?.validity === null) return { status: 'NEVER', days: null, expiry: null };
    if (!cert?.validity) return { status: 'NOEXP', days: null, expiry: null };
    const expiry = addMonths(passDate, cert.validity);
    const days = daysUntil(expiry);
    if (Number.isNaN(days)) return { status: 'INVALID', days: null, expiry: null };
    return {
      status: days < 0 ? 'EXPIRED' : days <= 60 ? 'URGENT' : days <= 180 ? 'WARN' : 'OK',
      days,
      expiry
    };
  }

  function icsDate(value) {
    const d = parseLocalDate(value);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function nextDateStamp(value) {
    const d = parseLocalDate(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 1);
    return icsDate(d);
  }

  CT.dates = Object.freeze({ parseLocalDate, localDateStamp, addMonths, daysUntil, formatDate, expiryInfo, icsDate, nextDateStamp });

  // Backwards-compatible globals consumed by the existing renderer.
  global.today = () => localDateStamp();
  global.addMonths = addMonths;
  global.daysUntil = daysUntil;
  global.fmt = formatDate;
  global.expiryInfo = expiryInfo;

  if (typeof global.statusBadgeHTML === 'function') {
    const original = global.statusBadgeHTML;
    global.statusBadgeHTML = (status, days) => status === 'INVALID'
      ? '<span class="status-badge status-warn">Invalid date</span>'
      : original(status, days);
  }
})(window);
