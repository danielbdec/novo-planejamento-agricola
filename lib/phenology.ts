/**
 * Phenological Stages for Soybean (Soja)
 * Maps week indices to plant growth stages.
 * Based on real agronomic data: DAE (Dias Após Emergência)
 *
 * Vegetative: V1 → Vn (green tones)
 * Reproductive: R1 → R8 (amber/orange tones)
 */

export interface PhenologicalStage {
    label: string;
    fullLabel: string;
    weekStart: number; // First week this stage appears
    weekEnd: number;   // Last week (inclusive)
    dae: number;       // Approximate DAE at start
    phase: 'VEGETATIVA' | 'REPRODUTIVA';
}

export const PHENOLOGICAL_STAGES: PhenologicalStage[] = [
    { label: 'VE', fullLabel: 'Emergência', weekStart: 0, weekEnd: 0, dae: 0, phase: 'VEGETATIVA' },
    { label: 'V1', fullLabel: 'Primeiro Nó', weekStart: 1, weekEnd: 1, dae: 7, phase: 'VEGETATIVA' },
    { label: 'V2', fullLabel: 'Segundo Nó', weekStart: 2, weekEnd: 2, dae: 14, phase: 'VEGETATIVA' },
    { label: 'V4', fullLabel: 'Quarto Nó', weekStart: 3, weekEnd: 3, dae: 21, phase: 'VEGETATIVA' },
    { label: 'V6', fullLabel: 'Sexto Nó', weekStart: 4, weekEnd: 4, dae: 28, phase: 'VEGETATIVA' },
    { label: 'V8', fullLabel: 'Oitavo Nó', weekStart: 5, weekEnd: 5, dae: 35, phase: 'VEGETATIVA' },
    { label: 'R1', fullLabel: 'Início Floração', weekStart: 6, weekEnd: 6, dae: 42, phase: 'REPRODUTIVA' },
    { label: 'R2', fullLabel: 'Floração Plena', weekStart: 7, weekEnd: 7, dae: 49, phase: 'REPRODUTIVA' },
    { label: 'R3', fullLabel: 'Início Vagem', weekStart: 8, weekEnd: 8, dae: 56, phase: 'REPRODUTIVA' },
    { label: 'R4', fullLabel: 'Vagem Plena', weekStart: 9, weekEnd: 9, dae: 63, phase: 'REPRODUTIVA' },
    { label: 'R5.1', fullLabel: 'Enchimento Grão', weekStart: 10, weekEnd: 11, dae: 70, phase: 'REPRODUTIVA' },
    { label: 'R5.5', fullLabel: 'Enchimento Avançado', weekStart: 12, weekEnd: 13, dae: 84, phase: 'REPRODUTIVA' },
    { label: 'R7', fullLabel: 'Maturidade Fisiológica', weekStart: 14, weekEnd: 15, dae: 98, phase: 'REPRODUTIVA' },
    { label: 'R8', fullLabel: 'Maturidade Colheita', weekStart: 16, weekEnd: 20, dae: 112, phase: 'REPRODUTIVA' },
];

/** Get the stage for a given weekIndex */
export function getStageForWeek(weekIndex: number): PhenologicalStage | null {
    return PHENOLOGICAL_STAGES.find(s => weekIndex >= s.weekStart && weekIndex <= s.weekEnd) || null;
}

/** Check if this week is the FIRST week of its stage (used to show label only once) */
export function isFirstWeekOfStage(weekIndex: number): boolean {
    const stage = getStageForWeek(weekIndex);
    return stage ? stage.weekStart === weekIndex : false;
}

/** Calculate DAE for a given weekIndex */
export function getDAE(weekIndex: number): number {
    const stage = getStageForWeek(weekIndex);
    if (!stage) return weekIndex * 7;
    const weeksIntoStage = weekIndex - stage.weekStart;
    return stage.dae + (weeksIntoStage * 7);
}

/** Get phase color classes */
export function getPhaseColors(phase: 'VEGETATIVA' | 'REPRODUTIVA') {
    return phase === 'VEGETATIVA'
        ? { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30', bgLight: 'bg-green-500/5' }
        : { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', bgLight: 'bg-amber-500/5' };
}
