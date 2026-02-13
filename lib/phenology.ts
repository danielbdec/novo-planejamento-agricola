/**
 * Phenological Stages for Soybean (Soja)
 * Maps week indices to plant growth stages relative to planting week.
 * Based on real agronomic data: DAE (Dias Após Emergência)
 *
 * Vegetative: VE → V8 (green tones)
 * Reproductive: R1 → R8 (amber/orange tones)
 *
 * REACTIVE: All calculations use plantingWeek offset so stage markers
 * shift when the talhão's planting date changes.
 */

export interface PhenologicalStage {
    id: string;
    label: string;
    fullLabel: string;
    weekOffset: number;  // Weeks AFTER planting
    dae: number;         // Approximate DAE at start
    phase: 'VEGETATIVA' | 'REPRODUTIVA';
    color: string;       // Tailwind text color
}

export const PHENOLOGY_STAGES: PhenologicalStage[] = [
    { id: 'VE', label: 'VE', fullLabel: 'Emergência', weekOffset: 0, dae: 0, phase: 'VEGETATIVA', color: 'text-green-300' },
    { id: 'V1', label: 'V1', fullLabel: 'Primeiro Nó', weekOffset: 1, dae: 7, phase: 'VEGETATIVA', color: 'text-green-400' },
    { id: 'V2', label: 'V2', fullLabel: 'Segundo Nó', weekOffset: 2, dae: 14, phase: 'VEGETATIVA', color: 'text-green-400' },
    { id: 'V4', label: 'V4', fullLabel: 'Quarto Nó', weekOffset: 3, dae: 21, phase: 'VEGETATIVA', color: 'text-green-500' },
    { id: 'V6', label: 'V6', fullLabel: 'Sexto Nó', weekOffset: 4, dae: 28, phase: 'VEGETATIVA', color: 'text-green-500' },
    { id: 'V8', label: 'V8', fullLabel: 'Oitavo Nó', weekOffset: 5, dae: 35, phase: 'VEGETATIVA', color: 'text-green-600' },
    { id: 'R1', label: 'R1', fullLabel: 'Início Floração', weekOffset: 6, dae: 42, phase: 'REPRODUTIVA', color: 'text-amber-400' },
    { id: 'R2', label: 'R2', fullLabel: 'Floração Plena', weekOffset: 7, dae: 49, phase: 'REPRODUTIVA', color: 'text-amber-400' },
    { id: 'R3', label: 'R3', fullLabel: 'Início Vagem', weekOffset: 8, dae: 56, phase: 'REPRODUTIVA', color: 'text-amber-500' },
    { id: 'R4', label: 'R4', fullLabel: 'Vagem Plena', weekOffset: 9, dae: 63, phase: 'REPRODUTIVA', color: 'text-amber-500' },
    { id: 'R5', label: 'R5', fullLabel: 'Enchimento Grão', weekOffset: 10, dae: 70, phase: 'REPRODUTIVA', color: 'text-orange-400' },
    { id: 'R5.5', label: 'R5.5', fullLabel: 'Enchimento Avançado', weekOffset: 12, dae: 84, phase: 'REPRODUTIVA', color: 'text-orange-500' },
    { id: 'R7', label: 'R7', fullLabel: 'Maturidade Fisiológica', weekOffset: 14, dae: 98, phase: 'REPRODUTIVA', color: 'text-orange-600' },
    { id: 'R8', label: 'R8', fullLabel: 'Maturidade Colheita', weekOffset: 16, dae: 112, phase: 'REPRODUTIVA', color: 'text-red-400' },
];

/**
 * Get the stage for a given absolute weekIndex, considering plantingWeek offset.
 * The stage is determined by how many weeks have passed since planting.
 */
export function getStageForWeek(weekIndex: number, plantingWeek: number = 0): PhenologicalStage | null {
    const weeksSincePlanting = weekIndex - plantingWeek;
    if (weeksSincePlanting < 0) return null;

    // Find the stage whose weekOffset range contains this week
    for (let i = PHENOLOGY_STAGES.length - 1; i >= 0; i--) {
        if (weeksSincePlanting >= PHENOLOGY_STAGES[i].weekOffset) {
            return PHENOLOGY_STAGES[i];
        }
    }
    return null;
}

/**
 * Check if this absolute weekIndex is the FIRST week of a new stage.
 * Used to show the label only once (to avoid visual clutter).
 */
export function isFirstWeekOfStage(weekIndex: number, plantingWeek: number = 0): boolean {
    const weeksSincePlanting = weekIndex - plantingWeek;
    return PHENOLOGY_STAGES.some(s => s.weekOffset === weeksSincePlanting);
}

/**
 * Get the stage that starts exactly at this weekIndex (if any).
 * Returns null if no stage begins on this week.
 */
export function getStageStartingAt(weekIndex: number, plantingWeek: number = 0): PhenologicalStage | null {
    const weeksSincePlanting = weekIndex - plantingWeek;
    return PHENOLOGY_STAGES.find(s => s.weekOffset === weeksSincePlanting) || null;
}

/**
 * Calculate DAE (Dias Após Emergência) for a given weekIndex.
 * DAE starts counting from the week after planting (emergence ≈ week 0 offset).
 */
export function getDAE(weekIndex: number, plantingWeek: number = 0): number {
    const weeksSincePlanting = weekIndex - plantingWeek;
    return Math.max(0, weeksSincePlanting * 7);
}

/** Get phase color classes for Tailwind */
export function getPhaseColors(phase: 'VEGETATIVA' | 'REPRODUTIVA') {
    return phase === 'VEGETATIVA'
        ? { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30', bgLight: 'bg-green-500/5', line: 'bg-green-500/40' }
        : { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/30', bgLight: 'bg-amber-500/5', line: 'bg-amber-500/40' };
}
