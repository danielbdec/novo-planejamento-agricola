"use client";

import React from 'react';
import { OperationalEvent } from '@/lib/types';
// import { Modal } from '@/components/ui/Modal'; // Removido pois não existe component base
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { GroupingEngine } from '@/lib/GroupingEngine';

interface MergeConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    targetEvent: OperationalEvent | null;
    sourceEvent: OperationalEvent | null;
}

export function MergeConfirmationModal({ isOpen, onClose, onConfirm, targetEvent, sourceEvent }: MergeConfirmationModalProps) {
    if (!targetEvent || !sourceEvent) return null;

    const compatibility = GroupingEngine.canMerge(targetEvent, sourceEvent);

    // Mock de cálculo de economia
    const totalCostSeparate = calculateCost(targetEvent) + calculateCost(sourceEvent);
    const totalCostMerged = totalCostSeparate; // * 0.9 (exemplo de economia futura)

    // Mock de Conflito Químico Específico (Solicitação Usuário)
    // "Se misturar Cletodim com Glufosinate"
    const hasChemicalRisk =
        (targetEvent.protocols.some(p => p.category === 'FUNGICIDA' || p.operationType.includes('PULVERIZACAO')) &&
            sourceEvent.protocols.some(p => p.category === 'FUNGICIDA' || p.operationType.includes('PULVERIZACAO')));

    const chemicalWarning = hasChemicalRisk
        ? "Conflito Potencial: A mistura de Cletodim com Glufosinate exige ordem rigorosa. Adicionar redutor de pH pode ser necessário."
        : null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-agri-gold-500/10 rounded-xl border border-agri-gold-500/20 text-agri-gold-500">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Criar Operação Única?</h3>
                        <p className="text-sm text-slate-400">Consolidar protocolos em uma entrada.</p>
                    </div>
                </div>

                {/* Visualização da Fusão */}
                <div className="flex items-center justify-between gap-2 mb-6 p-4 bg-slate-950/50 rounded-xl border border-white/5">
                    {/* Source */}
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-500 mb-1">Arrastado</div>
                        <div className="font-semibold text-slate-200 truncate">{sourceEvent.protocols[0].name}</div>
                        <div className="text-[10px] text-slate-400">{sourceEvent.protocols.length} item(s)</div>
                    </div>

                    <ArrowRight className="text-slate-600" size={16} />

                    {/* Target */}
                    <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs text-slate-500 mb-1">Alvo</div>
                        <div className="font-semibold text-slate-200 truncate">{targetEvent.protocols[0].name}</div>
                        <div className="text-[10px] text-slate-400">{targetEvent.protocols.length} item(s)</div>
                    </div>
                </div>

                {/* Avisos de Compatibilidade */}
                {(compatibility.warning || chemicalWarning) && (
                    <div className="mb-6 p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg flex gap-3 items-start">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                        <div className="text-xs text-amber-200">
                            <strong className="block mb-1 font-bold text-amber-400">Atenção na Mistura</strong>
                            {compatibility.warning}
                            {compatibility.warning && chemicalWarning && <br />}
                            {chemicalWarning}
                        </div>
                    </div>
                )}

                {!compatibility.allowed && (
                    <div className="mb-6 p-3 bg-red-950/30 border border-red-500/30 rounded-lg flex gap-3 items-start">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <div className="text-xs text-red-200">
                            Bloqueio: {compatibility.reason}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={onClose} className="flex-1">
                        Cancelar
                    </Button>
                    <Button
                        disabled={!compatibility.allowed}
                        onClick={onConfirm}
                        className="flex-1 bg-agri-gold-500 hover:bg-agri-gold-600 text-slate-900 font-bold"
                    >
                        Confirmar Fusão
                    </Button>
                </div>
            </div>
        </div>
    );
}

function calculateCost(event: OperationalEvent) {
    return event.protocols.reduce((acc, p) => {
        const pkg = p.packages.find(pkg => pkg.id === p.selectedPackageId);
        return acc + (pkg?.costPerHa || 0);
    }, 0);
}
