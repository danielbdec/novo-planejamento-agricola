"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { usePlanning } from '@/context/PlanningContext';
import { OperationType, Protocol, ProtocolPackage, OperationalEvent } from '@/lib/types';
import { X, Plus, Calendar, Bug, Sprout, Edit2, Plane, Droplets, Tractor } from 'lucide-react';

interface ManualEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    editEvent?: OperationalEvent | null;
}

// Opções sincronizadas com a Timeline (Dados Reais)
const OPERATION_OPTIONS: { type: OperationType; label: string; icon: any }[] = [
    { type: 'PLANTIO_MECANIZADO', label: 'Plantio Mecanizado', icon: Sprout },
    { type: 'PULVERIZACAO_TERRESTRE', label: 'Pulverização Terrestre', icon: Bug },
    { type: 'PULVERIZACAO_AEREA', label: 'Pulverização Aérea (Air Tractor)', icon: Plane },
    { type: 'COBERTURA_SOLIDA', label: 'Adubação de Cobertura (MP Agro)', icon: Tractor },
    { type: 'FERTIRRIGACAO', label: 'Fertirrigação (Pivô)', icon: Droplets },
    { type: 'INTERVENCAO_MANUAL', label: 'Manual', icon: Bug },
];

// Lista de Alvos Biológicos (Dados Reais)
const TARGET_OPTIONS = [
    "Dessecação Pré-Plantio",
    "Catação pé de galinha (Weed-it)",
    "Mofo Branco",
    "Ramulária",
    "Mosca Branca Adulta",
    "Cigarinha",
    "Ferrugem Asiática (Preventivo)",
    "Mancha Alvo"
];

// Helper para gerar pacotes reais baseados no alvo
const getRealPackage = (target: string, operation: OperationType): ProtocolPackage[] => {
    // Exemplo: Dessecação Pré-Plantio
    if (target === "Dessecação Pré-Plantio") {
        return [{
            id: `pkg-${Date.now()}`,
            name: 'Pacote Dessecação Padrão',
            isDefault: true,
            costPerHa: 119.23,
            products: [
                { sku: 'GLUFO200', name: 'Glufosinate-Ammonium 200G/L', dose: '3.0', unit: 'L/ha' },
                { sku: 'CLETODIM', name: 'Cletodim Viance', dose: '1.0', unit: 'L/ha' },
                { sku: 'SMETOL', name: 'S-Metolacloro Nortox', dose: '1.2', unit: 'L/ha' },
                { sku: 'IHAROL', name: 'Iharol Gold (Adjuvante)', dose: '0.5', unit: 'L/ha' }
            ]
        }];
    }

    // Default fallback com produtos reais de mistura
    return [{
        id: `pkg-${Date.now()}`,
        name: 'Pacote Padrão Mistura',
        isDefault: true,
        costPerHa: 156.40,
        products: [
            { sku: 'WATER', name: 'Água (Veículo)', dose: '75', unit: '%' },
            { sku: 'IHAROL', name: 'Iharol Gold', dose: '0.5', unit: 'L/ha' },
            { sku: 'MIRANT', name: '2.4 D Mirant', dose: '1.5', unit: 'L/ha' },
            { sku: 'MERTIN', name: 'Mertin 400', dose: '0.4', unit: 'L/ha' },
            { sku: 'ACETA', name: 'Acetamiprido Nortox 200 SP', dose: '0.2', unit: 'Kg/ha' }
        ]
    }];
};

export function ManualEventModal({ isOpen, onClose, editEvent }: ManualEventModalProps) {
    const { addProtocolToWeek, updateEventProtocol } = usePlanning();

    // Form State
    const [weekIndex, setWeekIndex] = useState(0);
    const [operationType, setOperationType] = useState<OperationType>('PULVERIZACAO_TERRESTRE');
    const [protocolName, setProtocolName] = useState('Novo Protocolo');
    const [targetName, setTargetName] = useState(TARGET_OPTIONS[0]);

    // Populate form on open
    useEffect(() => {
        if (isOpen) {
            if (editEvent) {
                // Edit Mode
                const protocol = editEvent.protocols[0]; // Assume primary protocol
                setWeekIndex(editEvent.weekIndex);
                setOperationType(protocol.operationType);
                setProtocolName(protocol.name);
                setTargetName(protocol.target);
            } else {
                // Create Mode - Reset defaults
                setProtocolName('Novo Protocolo');
                setOperationType('PLANTIO_MECANIZADO');
                setTargetName(TARGET_OPTIONS[0]);
                setWeekIndex(0); // Reset week index for new event
            }
        }
    }, [isOpen, editEvent]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const realPackages = getRealPackage(targetName, operationType);

        if (editEvent) {
            // UPDATE LOGIC
            const updatedProtocol: Protocol = {
                ...editEvent.protocols[0], // Keep ID and other props
                name: protocolName,
                target: targetName,
                operationType: operationType,
                category: operationType.includes('PULVERIZACAO') ? 'FUNGICIDA' : 'OUTROS',
                // We might want to update packages too if target changed? 
                // For now, let's regenerate packages based on new target
                packages: realPackages,
                selectedPackageId: realPackages[0].id
            };

            updateEventProtocol(editEvent.id, updatedProtocol);

        } else {
            // CREATE LOGIC
            const newProtocol: Protocol = {
                id: `proto-${Date.now()}`,
                name: protocolName,
                category: operationType.includes('PULVERIZACAO') ? 'FUNGICIDA' : 'OUTROS',
                target: targetName,
                operationType: operationType,
                requiresMIP: false,
                phenologicalStage: 'V4',
                packages: realPackages,
                selectedPackageId: realPackages[0].id
            };
            addProtocolToWeek(newProtocol, weekIndex);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {editEvent ? <Edit2 className="text-agri-gold-500" /> : <Plus className="text-agri-gold-500" />}
                        {editEvent ? 'Editar Evento Real' : 'Adicionar Evento Real'}
                    </h3>
                    <Button variant="ghost" type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2 h-auto">
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Seleção de Semana */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semana</label>
                        <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-lg border border-white/5">
                            <Calendar size={16} className="text-agri-gold-500" />
                            <select
                                title="Selecione a semana"
                                value={weekIndex}
                                onChange={(e) => setWeekIndex(Number(e.target.value))}
                                className="bg-transparent text-white text-sm w-full outline-none focus:ring-0 cursor-pointer"
                                disabled={!!editEvent} // Disable week change on edit for simplicity or allow move? Context moveEvent handles move. Let's disable for now to focus on content edit.
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(w => (
                                    <option key={w} value={w} className="bg-slate-900">Semana {w + 1}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tipo de Operação */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operação Real</label>
                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                            {OPERATION_OPTIONS.map(op => (
                                <button
                                    key={op.type}
                                    type="button"
                                    onClick={() => setOperationType(op.type)}
                                    className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all text-left
                                        ${operationType === op.type
                                            ? 'bg-agri-gold-500/10 border-agri-gold-500 text-agri-gold-500'
                                            : 'bg-slate-950/30 border-white/5 text-slate-400 hover:bg-white/5'}
                                    `}
                                >
                                    <op.icon size={14} className="min-w-[14px]" />
                                    {op.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detalhes do Texto */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="targetName">Alvo Biológico / Intenção</label>
                            <div className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-lg border border-white/5">
                                <Bug size={16} className="text-slate-500" />
                                <select
                                    id="targetName"
                                    title="Selecione o alvo"
                                    value={targetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    className="bg-transparent text-white text-sm w-full outline-none focus:ring-0 cursor-pointer"
                                >
                                    {TARGET_OPTIONS.map(opt => (
                                        <option key={opt} value={opt} className="bg-slate-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="protocolName">Nome do Protocolo</label>
                            <input
                                id="protocolName"
                                type="text"
                                value={protocolName}
                                onChange={(e) => setProtocolName(e.target.value)}
                                className="w-full bg-slate-950/50 border border-white/5 rounded-lg p-2 text-white text-sm focus:border-agri-gold-500/50 outline-none transition-colors"
                                placeholder="Ex: Protocolo Padrão"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <Button type="submit" className="w-full bg-agri-gold-500 hover:bg-agri-gold-600 text-slate-900 font-bold">
                            {editEvent ? 'Salvar Alterações' : 'Criar Card Real'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
