/**
 * Centralized enum values and blood-compatibility rules.
 *
 * IMPORTANT: These compatibility tables are a simplified reference used to
 * coordinate donors. They MUST be reviewed by qualified blood-bank / medical
 * staff before being used to fulfill actual donations. Compatibility differs by
 * component, so never assume a single table applies to every component.
 */

const ROLES = ['DONOR', 'REQUESTER'];

const BLOOD_GROUPS = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE',
];

const COMPONENTS = ['WHOLE_BLOOD', 'RED_CELLS', 'PLASMA', 'PLATELETS'];

const URGENCY = ['NORMAL', 'URGENT', 'CRITICAL'];

const REQUEST_STATUS = [
  'ACTIVE',
  'MATCHING',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'EXPIRED',
  'CANCELLED',
];

const DONOR_RESPONSE_STATUS = ['NOTIFIED', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED'];

const NOTIFICATION_TYPES = ['NEW_MATCH', 'RESPONSE_RECEIVED', 'REQUEST_VERIFIED', 'SYSTEM'];

// ---------------------------------------------------------------
// Compatibility rules (donor blood group -> compatible recipients)
// ---------------------------------------------------------------
// Keyed by the RECIPIENT's blood group; value is the list of DONOR blood groups
// that may donate that component to the recipient.

const ABO_RED_CELLS = {
  O_POSITIVE: ['O_POSITIVE', 'O_NEGATIVE'],
  O_NEGATIVE: ['O_NEGATIVE'],
  A_POSITIVE: ['A_POSITIVE', 'A_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
  A_NEGATIVE: ['A_NEGATIVE', 'O_NEGATIVE'],
  B_POSITIVE: ['B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'],
  B_NEGATIVE: ['B_NEGATIVE', 'O_NEGATIVE'],
  AB_POSITIVE: [
    'AB_POSITIVE', 'AB_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE',
    'B_POSITIVE', 'B_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE',
  ],
  AB_NEGATIVE: ['AB_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'O_NEGATIVE'],
};

// For plasma, AB is the universal DONOR (plasma lacks anti-A and anti-B antibodies).
// Keyed by recipient group -> compatible donor plasma.
const ABO_PLASMA = {
  O_POSITIVE: ['O_POSITIVE', 'A_POSITIVE', 'B_POSITIVE', 'AB_POSITIVE'],
  O_NEGATIVE: ['O_NEGATIVE', 'A_NEGATIVE', 'B_NEGATIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'A_POSITIVE', 'B_POSITIVE', 'AB_POSITIVE'],
  A_POSITIVE: ['A_POSITIVE', 'AB_POSITIVE'],
  A_NEGATIVE: ['A_NEGATIVE', 'AB_NEGATIVE', 'A_POSITIVE', 'AB_POSITIVE'],
  B_POSITIVE: ['B_POSITIVE', 'AB_POSITIVE'],
  B_NEGATIVE: ['B_NEGATIVE', 'AB_NEGATIVE', 'B_POSITIVE', 'AB_POSITIVE'],
  AB_POSITIVE: ['AB_POSITIVE'],
  AB_NEGATIVE: ['AB_NEGATIVE', 'AB_POSITIVE'],
};

// Whole blood must be ABO-identical in standard practice or compatible like red cells.
// Platelets follow red cell ABO compatibility guidance.
const COMPATIBILITY = {
  RED_CELLS: ABO_RED_CELLS,
  WHOLE_BLOOD: ABO_RED_CELLS,
  PLATELETS: ABO_RED_CELLS,
  PLASMA: ABO_PLASMA,
};

/**
 * Return the list of donor blood groups compatible with a given recipient for
 * a given component.
 */
function getCompatibleDonorGroups(component, recipientBloodGroup) {
  const table = COMPATIBILITY[component] || ABO_RED_CELLS;
  return table[recipientBloodGroup] || [];
}

// ------------------------------------------------------------------
// Request state machine: allowed transitions only.
// ------------------------------------------------------------------
const ALLOWED_TRANSITIONS = {
  ACTIVE: ['MATCHING', 'CANCELLED', 'EXPIRED'],
  MATCHING: ['PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED'],
  PARTIALLY_FULFILLED: ['FULFILLED', 'CANCELLED', 'EXPIRED'],
  FULFILLED: [],
  EXPIRED: [],
  CANCELLED: [],
};

function canTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from]) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

module.exports = {
  ROLES,
  BLOOD_GROUPS,
  COMPONENTS,
  URGENCY,
  REQUEST_STATUS,
  DONOR_RESPONSE_STATUS,
  NOTIFICATION_TYPES,
  COMPATIBILITY,
  getCompatibleDonorGroups,
  ALLOWED_TRANSITIONS,
  canTransition,
};