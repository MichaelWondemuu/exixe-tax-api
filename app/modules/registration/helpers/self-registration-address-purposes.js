import { ADDRESS_PURPOSES } from '../constants/self-registration.enums.js';

/** Fill missing/invalid purposes in order HQ → LEGAL → BILLING. */
export function assignDefaultAddressPurposes(addresses) {
  let slot = 0;
  for (const a of addresses) {
    if (!a.purpose || !ADDRESS_PURPOSES.includes(a.purpose)) {
      a.purpose = ADDRESS_PURPOSES[slot] ?? ADDRESS_PURPOSES[0];
      slot += 1;
    }
  }
}
