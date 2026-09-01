// Cert Tracker v3 — export helpers.
(function initExports(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before exports.js');

  function icsEscape(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function buildICS() {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CertTracker v3//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];
    let count = 0;

    function addAllDayEvent({ uid, date, summary, description, alarms = [] }) {
      const start = CT.dates.icsDate(date);
      const end = CT.dates.nextDateStamp(date);
      if (!start || !end) return;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${icsEscape(uid)}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(summary)}`,
        `DESCRIPTION:${icsEscape(description)}`
      );
      alarms.forEach(alarm => lines.push(
        'BEGIN:VALARM',
        `TRIGGER:${alarm.trigger}`,
        'ACTION:DISPLAY',
        `DESCRIPTION:${icsEscape(alarm.description)}`,
        'END:VALARM'
      ));
      lines.push('END:VEVENT');
      count++;
    }

    CERTS.forEach(cert => {
      const examDate = state.exams?.[cert.id];
      if (!examDate) return;
      addAllDayEvent({
        uid: `cert-${cert.id}-exam@certtracker`,
        date: examDate,
        summary: `EXAM: ${cert.name}`,
        description: `${cert.name} exam day.`,
        alarms: [
          { trigger: '-P7D', description: `${cert.name} exam in 7 days` },
          { trigger: '-P1D', description: `${cert.name} exam tomorrow` }
        ]
      });
    });

    CERTS.forEach(cert => {
      const passDate = state.passes?.[cert.id];
      if (!passDate || !cert.validity) return;
      const expiry = CT.dates.addMonths(passDate, cert.validity);
      addAllDayEvent({
        uid: `cert-${cert.id}-expiry@certtracker`,
        date: expiry,
        summary: `EXPIRES: ${cert.name}`,
        description: `${cert.name} expires today.`,
        alarms: [
          { trigger: '-P90D', description: `${cert.name} expires in 90 days` },
          { trigger: '-P30D', description: `${cert.name} expires in 30 days` }
        ]
      });
    });

    lines.push('END:VCALENDAR');
    return { content: lines.join('\r\n'), count };
  }

  function downloadICS() {
    const result = buildICS();
    if (!result.count) {
      if (typeof showToast === 'function') showToast('No dates to export');
      return result;
    }
    const blob = new Blob([result.content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cert-tracker-calendar.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (typeof showToast === 'function') showToast(`Exported ${result.count} events`);
    return result;
  }

  exportICS = downloadICS;
  CT.exports = Object.freeze({ icsEscape, buildICS, downloadICS });
})(window);
