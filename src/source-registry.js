// Cert Tracker v3.1 — audited official-source registry for the critical pathway.
// This layer is intentionally separate from certs.js so provenance can be reviewed
// and refreshed without rewriting the career catalogue itself.
(function initSourceRegistry(global) {
  'use strict';
  const CT = global.CertTrackerV3;
  if (!CT) throw new Error('config.js must load before source-registry.js');

  const VERIFIED = '2026-09-01';
  const registry = {
    'a-plus': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/a/core-1-and-2-v15/', note: 'Official CompTIA A+ V15 certification page; exam codes 220-1201 and 220-1202.' },
    'network-plus': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/network/', note: 'Official CompTIA Network+ certification page for N10-009.' },
    'security-plus': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/security/', note: 'Official CompTIA Security+ certification page for SY0-701.' },
    // CompTIA's current public site did not expose a stable cert-specific SecAI+ page
    // to the audit crawler on 2026-09-01. Keep this explicit source debt rather than
    // inventing a URL and falsely labelling it cert-level evidence.
    'secai-plus': { level: 'VENDOR', verifiedAt: VERIFIED, url: 'https://www.comptia.org/en-us/certifications/', note: 'Official CompTIA certification catalogue; cert-specific SecAI+ URL remains a tracked provenance gap.' },
    'az-900': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/', note: 'Official Microsoft Azure Fundamentals certification page.' },
    'az-104': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/', note: 'Official Microsoft Azure Administrator Associate certification page.' },
    'terraform': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://developer.hashicorp.com/certifications/infrastructure-automation', note: 'Official HashiCorp certification page for Terraform Associate (004).' },
    'az-400': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/az-400/', note: 'Official Microsoft AZ-400 exam page.' },
    'sc-300': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/', note: 'Official Microsoft Identity and Access Administrator Associate certification page.' },
    'sc-500': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/', note: 'Official Microsoft Cloud and AI Security Engineer Associate certification page.' },
    'cka': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.cncf.io/training/certification/cka/', note: 'Official CNCF Certified Kubernetes Administrator page.' },
    'az-305': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/az-305/', note: 'Official Microsoft AZ-305 exam page.' },
    'cissp': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isc2.org/certifications/cissp', note: 'Official ISC2 CISSP certification page.' },
    'iec-62443-expert': { level: 'CERT', verifiedAt: VERIFIED, url: 'https://www.isa.org/certification/certificate-programs/isa-iec-62443-cybersecurity-certificate-program', note: 'Official ISA/IEC 62443 Cybersecurity Certificate Program page; confirms automatic Expert designation after all four specialist certificates.' }
  };

  CT.sourceRegistry = Object.freeze(Object.fromEntries(
    Object.entries(registry).map(([id, value]) => [id, Object.freeze({ ...value })])
  ));
})(window);
