"use client";

import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    useSensor,
    useSensors,
    PointerSensor,
    closestCorners
} from '@dnd-kit/core';
import { cn, formatCurrency } from '@/lib/utils';
import { usePlanning } from '@/context/PlanningContext';
import { Swimlane } from './Swimlane';
import { OperationType, OperationalEvent } from '@/lib/types';
import { EventCard } from '@/components/protocol/EventCard';
import { ChevronLeft, ChevronRight, Calendar, Tractor, ChevronDown, MapPin, Sprout, Flower2, Wheat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getStageForWeek, isFirstWeekOfStage, getPhaseColors } from '@/lib/phenology';

const OPERATIONS: OperationType[] = [
    'PULVERIZACAO_TERRESTRE', // Maior volume
    'PULVERIZACAO_AEREA',     // Separado por custo/logística
    'PLANTIO_MECANIZADO',     // Logística de sementes/adubo base
    'COBERTURA_SOLIDA',       // Nutrição sólida
    'FERTIRRIGACAO',          // Controle via água
    'INTERVENCAO_MANUAL'
];

import { MergeConfirmationModal } from '@/components/modals/MergeConfirmationModal';
import { ManualEventModal } from '@/components/modals/ManualEventModal';
import { Plus } from 'lucide-react';
import { isOperationCompatible } from '@/lib/validation';

export function Timeline() {
    const { events, moveEvent, mergeEvents } = usePlanning();
    const [activeEvent, setActiveEvent] = useState<OperationalEvent | null>(null);
    const [mergeCandidate, setMergeCandidate] = useState<{ target: OperationalEvent, source: OperationalEvent } | null>(null);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<OperationalEvent | null>(null); // New state

    // Controle de Visualização de Semanas (Janela de 6 semanas)
    const [startWeek, setStartWeek] = useState(0); // 0 = W1
    const weeksToShow = 6;
    const validOperations = OPERATIONS; // Em produção filtrar as que tem uso

    // Sensores DnD
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Previne drag acidental no clique
            },
        })
    );

    const visibleWeekIndices = Array.from({ length: weeksToShow }, (_, i) => startWeek + i);

    // Handlers DnD
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const evtData = active.data.current?.event as OperationalEvent;
        setActiveEvent(evtData);
    };

    const handleConfirmMerge = () => {
        if (mergeCandidate) {
            mergeEvents(mergeCandidate.target.id, mergeCandidate.source.id);
            setMergeCandidate(null);
        }
    };

    // Handler para Editar Evento
    const handleEditEvent = (event: OperationalEvent) => {
        setEditingEvent(event);
        setIsManualModalOpen(true);
    };

    // ... (dentro do componente Timeline, antes de handleDragEnd)

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveEvent(null);

        if (!over) return;

        const overId = over.id as string;
        const draggedEventId = active.id as string;
        const sourceEvent = active.data.current?.event as OperationalEvent;

        if (!sourceEvent) return;

        // Validar Compatibilidade (Segurança Backend/Logística)
        // Se for drop em WeekColumn, over.data.current tem { operationType }

        // Caso 1: Soltou em uma Semana (Move)
        if (overId.startsWith('week-')) {
            const [_, weekStr, opType] = overId.split('-');
            const targetOpType = opType as OperationType;

            // Validação de Regra de Negócio
            if (!isOperationCompatible(sourceEvent.operationType, targetOpType)) {
                // Toast de erro ou similar seria ideal aqui
                console.warn(`Movimento inválido: ${sourceEvent.operationType} -> ${targetOpType}`);
                return; // Cancela movimento
            }

            if (weekStr) {
                const newWeekIndex = parseInt(weekStr);
                moveEvent(draggedEventId, newWeekIndex);
                // Se mudou de raia (ex: Terrestre -> Aérea), atualizar o tipo no evento?
                // O moveEvent hoje só atualiza semana. Precisa atualizar operationType também se permitido.
                // TODO: Atualizar moveEvent no Context para aceitar newOperationType opcional
            }
        }
        // Caso 2: Soltou sobre outro Evento (Merge)
        else {
            const targetEvent = events.find(e => e.id === overId);

            if (targetEvent && sourceEvent && targetEvent.id !== draggedEventId) {
                // Validar compatibilidade de fusão também
                if (!isOperationCompatible(sourceEvent.operationType, targetEvent.operationType)) {
                    return;
                }

                // Abre modal de confirmação em vez de mergear direto
                setMergeCandidate({ target: targetEvent, source: sourceEvent });
            }
        }
    };

    // Data de Início da Safra (Dinâmica: Começa no Domingo da semana atual)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const HARVEST_START_DATE = new Date(today);
    HARVEST_START_DATE.setDate(today.getDate() - dayOfWeek);
    HARVEST_START_DATE.setHours(0, 0, 0, 0);

    const getWeekLabel = (weekIdx: number) => {
        const date = new Date(HARVEST_START_DATE);
        date.setDate(HARVEST_START_DATE.getDate() + (weekIdx * 7));

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <MergeConfirmationModal
                isOpen={!!mergeCandidate}
                onClose={() => setMergeCandidate(null)}
                onConfirm={handleConfirmMerge}
                targetEvent={mergeCandidate?.target || null}
                sourceEvent={mergeCandidate?.source || null}
            />

            <ManualEventModal
                isOpen={isManualModalOpen}
                onClose={() => {
                    setIsManualModalOpen(false);
                    setEditingEvent(null);
                }}
                editEvent={editingEvent}
            />



            {/* Timeline Header Navigation */}
            <div className="flex items-center justify-between glass-panel p-4 rounded-xl sticky top-0 z-40 mb-2">
                <div className="flex items-center gap-4">
                    {/* Safra Selector */}
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5 ml-1">Safra</span>
                        <Button variant="ghost" className="h-9 px-3 bg-slate-800/50 border border-white/5 hover:bg-slate-800 text-white font-bold gap-2 group">
                            Safra 26/27
                            <Badge variant="outline" className="border-agri-green-500 text-agri-green-400 bg-agri-green-950/30 text-[9px] px-1 py-0 h-4">
                                ATIVA
                            </Badge>
                            <ChevronDown size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                        </Button>
                    </div>

                    <div className="w-px h-8 bg-white/10 mx-2"></div>

                    {/* Context Filters (Farm, Field, Crop) */}
                    <div className="flex items-center gap-3">
                        {/* Fazenda/Talhão */}
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5 ml-1">Local</span>
                            <Button variant="ghost" className="h-9 px-3 bg-slate-800/30 border border-white/5 hover:bg-slate-800 text-slate-200 hover:text-white font-medium gap-2">
                                <MapPin size={14} className="text-agri-gold-500" />
                                Fazenda Santa Fé <span className="text-slate-600">|</span> Talhão 12
                                <ChevronDown size={14} className="text-slate-600 ml-1" />
                            </Button>
                        </div>

                        {/* Cultura/GM */}
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-0.5 ml-1">Cultura</span>
                            <Button variant="ghost" className="h-9 px-3 bg-slate-800/30 border border-white/5 hover:bg-slate-800 text-slate-200 hover:text-white font-medium gap-2">
                                <Sprout size={14} className="text-green-500" />
                                Soja GM 6.4 IPRO
                                <ChevronDown size={14} className="text-slate-600 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {/* Controles de Navegação */}
                    <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-white/5">
                        <Button variant="ghost" size="icon" onClick={() => setStartWeek(Math.max(0, startWeek - 1))} className="h-8 w-8 hover:bg-white/10 hover:text-agri-gold-500">
                            <ChevronLeft size={18} />
                        </Button>
                        <div className="px-3 text-xs font-mono text-slate-400 border-x border-white/5 mx-1">
                            Semana {startWeek + 1} - {startWeek + weeksToShow}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setStartWeek(startWeek + 1)} className="h-8 w-8 hover:bg-white/10 hover:text-agri-gold-500">
                            <ChevronRight size={18} />
                        </Button>
                    </div>
                </div>

                {/* Botão de Adição Manual (Highlight) */}
                <Button
                    variant="default" // Alterado para default (mais visível) ou create custom variant
                    size="sm"
                    onClick={() => setIsManualModalOpen(true)}
                    className="gap-2 bg-agri-gold-500 hover:bg-agri-gold-600 text-slate-900 font-bold shadow-[0_0_15px_-3px_rgba(234,179,8,0.4)]"
                >
                    <Plus size={16} /> Novo Evento
                </Button>
            </div>

            {/* Week Headers Grid - Separado do Header Principal para alinhamento correto com colunas */}
            <div className="grid grid-cols-6 gap-0 text-center pl-1 pr-2 mb-1">
                {visibleWeekIndices.map((idx, i) => (
                    <div key={idx} className={cn(
                        "flex flex-col items-center justify-center border-b-2 transition-all pb-2 mx-1 rounded-t-lg",
                        i === 0 ? "border-agri-gold-500 bg-gradient-to-t from-agri-gold-500/10 to-transparent" : "border-white/5 hover:border-white/20 hover:bg-white/5"
                    )}>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mb-1",
                            i === 0 ? "text-agri-gold-400" : "text-slate-500"
                        )}>
                            Semana {idx + 1}
                        </span>
                        <span className={cn(
                            "text-lg font-black uppercase",
                            i === 0 ? "text-white" : "text-slate-300"
                        )}>
                            {getWeekLabel(idx)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Régua Fenológica — Alinhada com colunas, entre header e swimlanes */}
            <div className="grid grid-cols-6 gap-0 pl-1 pr-2 mb-1">
                {visibleWeekIndices.map((weekIdx) => {
                    const stage = getStageForWeek(weekIdx);
                    const isFirst = isFirstWeekOfStage(weekIdx);
                    const phase = stage?.phase || 'VEGETATIVA';
                    const colors = getPhaseColors(phase);

                    const StageIcon = phase === 'VEGETATIVA'
                        ? (stage?.label === 'VE' ? Sprout : Sprout)
                        : (stage?.label.startsWith('R5') || stage?.label === 'R7' || stage?.label === 'R8' ? Wheat : Flower2);

                    return (
                        <div
                            key={weekIdx}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-1.5 mx-1 rounded-md border transition-all",
                                isFirst
                                    ? `${colors.bgLight} ${colors.border} border-solid`
                                    : "border-transparent bg-transparent",
                            )}
                        >
                            {stage && (
                                <>
                                    <StageIcon size={12} className={cn(colors.text, !isFirst && "opacity-30")} />
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-wide",
                                        isFirst ? colors.text : "text-slate-600",
                                    )}>
                                        {stage.label}
                                    </span>
                                    {isFirst && stage.fullLabel && (
                                        <span className="text-[9px] text-slate-500 hidden xl:inline truncate max-w-[60px]" title={stage.fullLabel}>
                                            {stage.fullLabel}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-y-auto pb-20 pr-2 space-y-6">
                    {validOperations.map(opType => {
                        const laneEvents = events.filter(e => e.operationType === opType);
                        return (
                            <Swimlane
                                key={opType}
                                operationType={opType}
                                events={laneEvents}
                                visibleWeeks={visibleWeekIndices}
                                onEdit={handleEditEvent}
                            />
                        );
                    })}
                </div>

                <DragOverlay>
                    {activeEvent ? <div className="opacity-80 rotate-2 scale-105"><EventCard event={activeEvent} onEdit={() => { }} /></div> : null}
                </DragOverlay>
            </DndContext>

            {/* Footer Fixo: Resumo de Valor e ROI */}
            <div className="sticky bottom-0 z-50 mt-auto">
                <div className="glass-panel border-t border-white/10 bg-slate-950/80 backdrop-blur-xl p-4 flex items-center justify-between rounded-t-xl shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div>
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Investimento Total</span>
                            <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {formatCurrency(
                                    events.reduce((acc, e) => acc + e.area * e.protocols.reduce((pAcc, p) => pAcc + (p.packages.find(pk => pk.isDefault)?.costPerHa || 0), 0), 0)
                                )}
                                <span className="text-xs font-normal text-slate-400">acumulado</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div>
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Custo Médio/Ha</span>
                            <div className="text-xl font-bold text-agri-gold-400">
                                {formatCurrency(
                                    events.length > 0 ?
                                        events.reduce((acc, e) => acc + e.protocols.reduce((pAcc, p) => pAcc + (p.packages.find(pk => pk.isDefault)?.costPerHa || 0), 0), 0) / events.length // Simplificado
                                        : 0
                                )}
                                <span className="text-xs font-normal text-slate-500 ml-1">/ha</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div>
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">ROI Estimado</span>
                            <div className="text-xl font-bold text-agri-green-400 flex items-center gap-1">
                                +320%
                                <span className="text-[10px] bg-agri-green-500/20 text-agri-green-400 px-1 py-0.5 rounded border border-agri-green-500/30">Safra Recorde</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5">
                            Exportar PDF
                        </Button>
                        <Button size="sm" className="bg-agri-green-600 hover:bg-agri-green-500 text-white font-bold shadow-lg shadow-agri-green-900/50">
                            Confirmar Planejamento
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
