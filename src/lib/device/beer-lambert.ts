/**
 * Modified Beer-Lambert Law (MBLL) for fNIRS.
 *
 * Used only when a device emits raw light-intensity counts at two
 * wavelengths (e.g. 660 nm + 805 nm) instead of pre-computed
 * ΔHbO / ΔHHb values.
 *
 * Reference: Cope & Delpy (1988), Med. Biol. Eng. Comput. 26: 289–294.
 *
 * ΔOD_λ = log10(I0_λ / I_λ)
 * [ ΔHbO ]   1   [ ε_HHb_λ2  -ε_HHb_λ1 ]   [ ΔOD_λ1 / DPF_λ1 / L ]
 * [ ΔHHb ] = - · [-ε_HbO_λ2   ε_HbO_λ1 ] · [ ΔOD_λ2 / DPF_λ2 / L ]
 *           D
 * where D = ε_HbO_λ1 · ε_HHb_λ2 - ε_HbO_λ2 · ε_HHb_λ1
 */

export interface BeerLambertConfig {
  /** Source-detector distance in cm. */
  sourceDetectorCm: number;
  /** Differential path-length factor at λ1 (typically 660 nm). */
  dpf660: number;
  /** Differential path-length factor at λ2 (typically 805 nm). */
  dpf805: number;
  /** Molar extinction coefficient HbO at 660 nm (μM⁻¹·cm⁻¹). */
  epsHbO660: number;
  /** Molar extinction coefficient HHb at 660 nm. */
  epsHHb660: number;
  /** Molar extinction coefficient HbO at 805 nm. */
  epsHbO805: number;
  /** Molar extinction coefficient HHb at 805 nm. */
  epsHHb805: number;
}

/**
 * Standard prefrontal-cortex MBLL config.
 * Extinction coefficients from Wray et al. (1988); DPFs from Duncan et al. (1996).
 *
 * Mendi's actual hardware config (LED wavelengths, optode spacing) may differ
 * — confirm against the BLE-protocol capture (AUDIT-2026-MENDI-BLE-PROTOCOL.md).
 */
export const MENDI_BEER_LAMBERT: BeerLambertConfig = {
  sourceDetectorCm: 3.0, // typical Mendi optode geometry — VERIFY
  dpf660: 5.93,
  dpf805: 5.05,
  epsHbO660: 0.32,
  epsHHb660: 1.79,
  epsHbO805: 1.06,
  epsHHb805: 0.79,
};

export interface IntensityPair {
  i660: number;
  i805: number;
}

export interface HbDelta {
  deltaHbO: number; // μM
  deltaHHb: number; // μM
}

/**
 * Convert a single intensity reading (relative to a baseline) into
 * ΔHbO and ΔHHb concentrations in μM.
 */
export function beerLambertToDelta(
  current: IntensityPair,
  baseline: IntensityPair,
  cfg: BeerLambertConfig
): HbDelta {
  // Optical density change (positive when light is absorbed more = HbO/HHb increase)
  const od660 = Math.log10(baseline.i660 / Math.max(1, current.i660));
  const od805 = Math.log10(baseline.i805 / Math.max(1, current.i805));

  // Path lengths
  const L660 = cfg.sourceDetectorCm * cfg.dpf660;
  const L805 = cfg.sourceDetectorCm * cfg.dpf805;

  // Determinant of the 2-wavelength extinction matrix
  const det = cfg.epsHbO660 * cfg.epsHHb805 - cfg.epsHbO805 * cfg.epsHHb660;
  if (Math.abs(det) < 1e-9) {
    return { deltaHbO: 0, deltaHHb: 0 };
  }

  // Solve [ΔHbO; ΔHHb] = inv(E) · [ΔOD/L]
  const deltaHbO = (cfg.epsHHb805 * (od660 / L660) - cfg.epsHHb660 * (od805 / L805)) / det;
  const deltaHHb = (-cfg.epsHbO805 * (od660 / L660) + cfg.epsHbO660 * (od805 / L805)) / det;

  return { deltaHbO, deltaHHb };
}
