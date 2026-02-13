import { OperationalEvent, Protocol } from "./types";

/**
 * Motor de Agrupamento de Eventos (Grouping Engine)
 * Responsável por validar se dois eventos podem ser fundidos e
 * calcular as propriedades do novo evento otimizado.
 */

export const GroupingEngine = {
    /**
     * Verifica se dois eventos são compatíveis para agrupamento.
     * Regras (Mock):
     * 1. Devem ser da mesma semana (implícito pelo drag).
     * 2. Não podem ter o mesmo tipo de operação principal se for 'COLHEITA' ou 'PLANTIO' (físicamente impossível).
     * 3. Compatibilidade de calda (Simulação: Fungicida + Inseticida = OK, Herbicida + Inseticida = Alerta).
     */
    canMerge(targetEvent: OperationalEvent, sourceEvent: OperationalEvent): { allowed: boolean; reason?: string; warning?: string } {
        // Regra 1: Bloquear fusão de operações físicas distintas massivas
        const physicalOps = ['PLANTIO', 'COLHEITA', 'DISTRIBUICAO'];
        if (physicalOps.includes(targetEvent.operationType) && physicalOps.includes(sourceEvent.operationType)) {
            if (targetEvent.operationType !== sourceEvent.operationType) {
                return { allowed: false, reason: "Impossível realizar duas operações físicas pesadas simultaneamente." };
            }
        }

        // Regra 2: Compatibilidade Química (Mock simplificado)
        const targetType = targetEvent.protocols[0]?.category;
        const sourceType = sourceEvent.protocols[0]?.category;

        // Tabela de Incompatibilidade (Exemplo)
        const incompatibilityMap: Record<string, string[]> = {
            'Herbicida': ['Fertilizante Foliar'], // Exemplo: Glifosato + Manganês pode dar ruim
            'Fungicida': [],
            'Inseticida': []
        };

        if (incompatibilityMap[targetType]?.includes(sourceType) || incompatibilityMap[sourceType]?.includes(targetType)) {
            return { allowed: true, warning: "Alerta de Compatibilidade Química: Verifique a ordem de tanque!" }; // Permite, mas avisa
        }

        return { allowed: true };
    },

    /**
     * Cria um novo evento fundido a partir de dois eventos.
     */
    mergeEvents(targetEvent: OperationalEvent, sourceEvent: OperationalEvent): OperationalEvent {
        // Combina os protocolos
        const mergedProtocols = [...targetEvent.protocols, ...sourceEvent.protocols];

        // Recalcula custo total (somatório simples por enquanto)
        // No futuro, isso consideraria redução de custo operacional (menos diesel/horas)
        const newCost = 0; // O cálculo real é feito na renderização baseado nos pacotes

        return {
            ...targetEvent,
            id: `merged-${Math.random().toString(36).substr(2, 9)}`,
            protocols: mergedProtocols,
            // Mantém o tipo da operação "Alvo" (Target), ou define um novo tipo 'MISTURA' se necessário
            // Por simplicidade, mantemos o target.
            status: 'PREVISTO', // Reseta status para planejado ao alterar
        };
    }
};
