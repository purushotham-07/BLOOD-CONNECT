/**
 * BloodConnect — centralized blood compatibility rules.
 *
 * The authoritative compatibility tables are defined in ../../constants/enums.js
 * (ABO_RED_CELLS, ABO_PLASMA, etc.). This service is the ONLY place the matching
 * engine should call for compatibility, so the rules can be updated in one spot
 * and are never duplicated across modules.
 *
 * IMPORTANT: These are simplified coordination rules used to shortlist donors.
 * They are NOT a medical determination and MUST be reviewed by qualified
 * blood-bank / medical staff before fulfilling actual donations. Compatibility
 * differs by blood component, so never assume a single table applies to every
 * component.
 */

const {
  COMPATIBILITY,
  getCompatibleDonorGroups,
} = require('../../constants/enums');

/**
 * Whether a donor with the given blood group can donate `component` to a
 * recipient with `recipientBloodGroup`.
 */
function isCompatible(donorBloodGroup, recipientBloodGroup, component = 'RED_CELLS') {
  const table = COMPATIBILITY[component] || COMPATIBILITY.RED_CELLS;
  if (!table) return false;
  return (table[recipientBloodGroup] || []).includes(donorBloodGroup);
}

module.exports = {
  getCompatibleDonorGroups,
  isCompatible,
  COMPATIBILITY,
};
