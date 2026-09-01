// Cert Tracker v3.1 — central configuration. No build step required.
(function initConfig(global) {
  'use strict';

  const CT = global.CertTrackerV3 = global.CertTrackerV3 || {};

  CT.version = Object.freeze({
    app: '3.1.0',
    data: 59,
    storage: 4,
    backup: 3,
    sync: 1,
    market: 1
  });

  CT.config = Object.freeze({
    myPathKey: 'ct3-mypath',
    legacyMyPathKeys: ['ct2-mypath', 'undefined'],
    storageSchemaKey: 'ct3-storage-schema',
    lastChangeKey: 'ct3-last-change',
    lastBackupKey: 'ct3-last-backup-export',
    recoveryKey: 'ct3-recovery-point',
    undoKey: 'ct3-undo-point',
    goalKey: 'ct3-goal-profile',
    syncConfigKey: 'ct3-sync-config',
    onboardingKey: 'ct3-onboarded',
    freshness: Object.freeze({ freshDays: 180, reviewDays: 365 }),
    allowedTracks: Object.freeze(['CORE', 'FOUNDATION', 'CONDITIONAL', 'OPTIONAL', 'ROLE-DRIVEN', 'ARCHITECT', 'IDENTITY-SEC', 'POST-PLAN'])
  });

  CT.vendorSources = Object.freeze({
    'CompTIA': 'https://www.comptia.org/certifications',
    'Cisco': 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html',
    'Microsoft': 'https://learn.microsoft.com/credentials/',
    'Google': 'https://grow.google/certificates/cybersecurity/',
    'Axis': 'https://www.axis.com/learning/certification-program',
    'Axis Communications': 'https://www.axis.com/learning/certification-program',
    'Milestone': 'https://www.milestonesys.com/learn-and-support/learning-and-performance/',
    'Milestone Systems': 'https://www.milestonesys.com/learn-and-support/learning-and-performance/',
    'LenelS2': 'https://www.lenels2.com/en/training/',
    'Palo Alto Networks': 'https://www.paloaltonetworks.com/services/education/certification',
    'CrowdStrike': 'https://www.crowdstrike.com/crowdstrike-university/certification/',
    'AWS': 'https://aws.amazon.com/certification/',
    'Amazon Web Services': 'https://aws.amazon.com/certification/',
    'ISC2': 'https://www.isc2.org/certifications',
    '(ISC)²': 'https://www.isc2.org/certifications',
    'ISACA': 'https://www.isaca.org/credentialing/certifications',
    'GIAC': 'https://www.giac.org/certifications/',
    'Fortinet': 'https://www.fortinet.com/training-certification',
    'VMware': 'https://www.vmware.com/learning/certification.html',
    'Red Hat': 'https://www.redhat.com/en/services/certification',
    'Esri': 'https://www.esri.com/training/certification/',
    'ArcGIS': 'https://www.esri.com/training/certification/',
    'TryHackMe': 'https://tryhackme.com/paths',
    'Honeywell': 'https://buildings.honeywell.com/us/en/support/training',
    'Paxton': 'https://www.paxton-access.com/training/'
  });

  const listeners = new Map();
  CT.events = Object.freeze({
    on(name, handler) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(handler);
      return () => listeners.get(name)?.delete(handler);
    },
    emit(name, detail) {
      (listeners.get(name) || []).forEach(handler => {
        try { handler(detail); } catch (error) { console.error('[CertTracker event]', name, error); }
      });
      try { global.dispatchEvent(new CustomEvent(`certtracker:${name}`, { detail })); } catch {}
    }
  });

  CT.util = Object.freeze({
    isPlainObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); },
    clamp(value, min, max) { return Math.min(max, Math.max(min, value)); },
    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
    },
    averageHours(cert) {
      return Array.isArray(cert?.hours) && cert.hours.length === 2
        ? (Number(cert.hours[0]) + Number(cert.hours[1])) / 2
        : 0;
    },
    nowIso() { return new Date().toISOString(); }
  });
})(window);
