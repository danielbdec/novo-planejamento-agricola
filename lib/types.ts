export type OperationType =
    | 'PULVERIZACAO_TERRESTRE'
    | 'PULVERIZACAO_AEREA'
    | 'ADUBACAO_FOLIAR'
    | 'FERTIRRIGACAO'
    | 'PLANTIO_MECANIZADO'
    | 'COBERTURA_SOLIDA'
    | 'INTERVENCAO_MANUAL';

export type ProtocolCategory =
    | 'FUNGICIDA'
    | 'INSETICIDA'
    | 'HERBICIDA'
    | 'ADUBACAO_FOLIAR'
    | 'BIOLOGICO'
    | 'OUTROS';

export interface ProtocolPackage {
    id: string;
    name: string;
    isDefault: boolean;
    costPerHa: number;
    products: {
        sku: string;
        name: string;
        dose: string;
        unit: string;
    }[];
}

export interface Protocol {
    id: string;
    name: string;
    target: string;
    category: ProtocolCategory;
    operationType: OperationType;
    requiresMIP: boolean;
    phenologicalStage: string;
    durationWeeks?: number; // Usually 1
    defaultWeek?: number; // Sugestão baseada em plantio
    packages: ProtocolPackage[];
    selectedPackageId: string;
}

export interface OperationalEvent {
    id: string;
    weekIndex: number; // 0-51
    operationType: OperationType;
    protocols: Protocol[]; // Pode ter 1 ou mais (agrupamento)
    status: 'PREVISTO' | 'CONFIRMADO' | 'LIBERADO' | 'EXECUTADO' | 'REPROGRAMADO' | 'CANCELADO';
    area: number; // Hectares
    equipment?: string;
    adjuvant?: string;
}

// Para a timeline
export interface WeekData {
    weekIndex: number;
    label: string; // "S01", "S02"
    events: OperationalEvent[];
}
