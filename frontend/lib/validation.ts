import { OperationType } from '@/lib/types';

export const isOperationCompatible = (sourceOp: OperationType, targetOp: OperationType): boolean => {
    if (sourceOp === targetOp) return true;

    // Permitir troca entre Pulverizações (Aérea <-> Terrestre)
    if (
        (sourceOp === 'PULVERIZACAO_TERRESTRE' || sourceOp === 'PULVERIZACAO_AEREA') &&
        (targetOp === 'PULVERIZACAO_TERRESTRE' || targetOp === 'PULVERIZACAO_AEREA')
    ) {
        return true;
    }

    // Permitir troca entre Adubações Sólidas (Cobertura Manual ou Mecanizada)
    if (
        (sourceOp === 'COBERTURA_SOLIDA' || sourceOp === 'INTERVENCAO_MANUAL') &&
        (targetOp === 'COBERTURA_SOLIDA' || targetOp === 'INTERVENCAO_MANUAL')
    ) {
        return true;
    }

    return false;
};
