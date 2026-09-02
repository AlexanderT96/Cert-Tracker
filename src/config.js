// Cert Tracker — central configuration. No build step required.
(function initConfig(global) {
  'use strict';

  const CT = global.CertTrackerV3 = global.CertTrackerV3 || {};

  CT.version = Object.freeze({
    app: '4.6.0',
    data: 62,
    storage: 7,
    backup: 6,
    sync: 2,
    market: 2,
    intelligence: 4
  });

  CT.config = Object.freeze({
    myPathKey: 'ct4-mypath',
    legacyMyPathKeys: ['ct3-mypath', 'ct2-mypath', 'undefined'],
    storageSchemaKey: 'ct4-storage-schema',
    lastChangeKey: 'ct4-last-change',
    lastBackupKey: 'ct4-last-backup-export',
    recoveryKey: 'ct4-recovery-point',
    undoKey: 'ct4-undo-point',
    goalKey: 'ct4-goal-profile',
    syncConfigKey: 'ct4-sync-config',
    onboardingKey: 'ct4-onboarded',
    plannerKey: 'ct4-planner-settings',
    objectiveKey: 'ct4-objective-progress',
    evidenceKey: 'ct4-competency-evidence',
    capabilityEvidenceKey: 'ct4-capability-evidence',
    personalizationKey: 'ct4-personalization',
    deviceKey: 'ct4-device-id',
    syncRevisionKey: 'ct4-sync-revision',
    syncCommonHashKey: 'ct4-sync-common-hash',
    syncEtagKey: 'ct4-sync-etag',
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
    'CrowdStrike': 'https://www.crowdstrike.com/en-us/crowdstrike-university/crowdstrike-falcon-certification-program/',
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
    clamp(value, min, max) { return Math.min(max, Math.max(min, value)); },
    averageHours(cert) {
      const hours = cert?.hours;
      return Array.isArray(hours) && hours.length >= 2 ? (Number(hours[0]) + Number(hours[1])) / 2 : 0;
    },
    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[char]);
    },
    normalise(value) { return String(value ?? '').trim().toLowerCase(); },
    uniq(items) { return [...new Set(items)]; }
  });
})(window);
