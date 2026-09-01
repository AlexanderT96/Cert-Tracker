// Cert Tracker v4.2 — curated generic default path configuration.
// Ordered around coherent learning ladders rather than badge/market-value density.
// This file contains no personalised career context.
(function initDefaultPath(global) {
  'use strict';
  global.CERT_TRACKER_DEFAULT_PATH = Object.freeze([
    // Phase 1 — foundations + physical-security depth
    'a-plus','network-plus','mcit','mcde','arcules-csp','mcie','acp','briefcam-tech','ccna','google-cyber','security-plus','az-900','sc-900','ai-901',
    // Phase 2 — enterprise networking + network security + systems
    'ccnp-enterprise','az-802','pan-apprentice','pan-practitioner','pan-netsec-pro','pan-ngfw-eng','linux-plus','cysa-plus','iec-62443-cfs','itil-4-foundation','cismp',
    // Phase 3 — cloud + identity + automation + SecOps
    'pcep','pcap','az-104','sc-300','sc-200','ccsk','secai-plus','iec-62443-cra','pan-cloudsec-pro',
    // Phase 4 — OT / convergence engineering + architecture foundations
    'pcpp1','sc-500','iec-62443-cds','iec-62443-cms','iec-62443-expert','isa-cap-associate','isa95-fund','gicsp','bcs-arch-found','bcs-arch-solution','bcs-arch-security','bcs-esa','isa-apm',
    // Phase 5 — adaptive architecture + expert branches
    'cissp','ccsp','sc-100','az-305','pan-netsec-arch','sabsa-found','cczt','crisc','ukcsc-princ','pcpp2','ccie-enterprise','asis-psp',
    // Phase 6 — professional / principal capstones
    'issap','ukcsc-chart','csyp','isa-cap'
  ]);

  // Only genuinely new learning-first records are auto-added on a data-version upgrade.
  // Existing user choices for older records are never silently re-enabled.
  global.CERT_TRACKER_DEFAULT_ADDITIONS = Object.freeze([
    'briefcam-tech','ai-901','az-802','sc-500','ccnp-enterprise','ccie-enterprise',
    'isa-cap-associate','isa-cap','isa-apm','isa95-fund','bcs-arch-found','bcs-arch-solution','bcs-arch-security'
  ]);
})(window);
