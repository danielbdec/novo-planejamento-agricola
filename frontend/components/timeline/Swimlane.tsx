"use client";

import React, { useState } from 'react';
import { OperationType, OperationalEvent } from '@/lib/types';
import { WeekColumn } from './WeekColumn';
import { ChevronDown, ChevronRight, Droplets, Tractor, Sprout, Combine, Eye, Hand } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SwimlaneProps {
    operationType: OperationType;
    events: OperationalEvent[];
    visibleWeeks: number[]; // Array of week indices to show
    onEdit: (event: OperationalEvent) => void;
}

export function Swimlane({ operationType, events, visibleWeeks, onEdit }: SwimlaneProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Icon Mapping
    const icons: Record<string, any> = {
        'PULVERIZACAO_TERRESTRE': Droplets,
        'PULVERIZACAO_AEREA': Droplets,
        'ADUBACAO_FOLIAR': Tractor,
        'FERTIRRIGACAO': Droplets,
        'PLANTIO_XINGU': Sprout,
        'COBERTURA_MP_AGRO': Tractor,
        'INTERVENCAO_MANUAL': Hand,
    };
    const Icon = icons[operationType] || Tractor;

    // Resumo
    const totalArea = events.reduce((acc, e) => acc + e.area, 0);
    const totalEvents = events.length;

    // Custo Total estimado dos eventos nesta swimlane
    const totalCostValue = events.reduce((acc, e) => {
        return acc + e.protocols.reduce((pAcc, p) => pAcc + (p.packages.find(pk => pk.isDefault)?.costPerHa || 0), 0)
    }, 0);

    // Custo Médio Ponderado por Hectare (Total Cost / Total Area se area > 0, senão média simples ou 0)
    // Na verdade, o usuário pediu "Custo Acumulado/HÁ". Se entendermos que cada evento acontece na mesma área, o custo se soma.
    // Ex: Fungicida 1 (100/ha) + Fungicida 2 (120/ha) = 220/ha acumulado na safra para essa operação.
    // Assumindo que a área é constante (ex: 100ha), o custo/ha é a soma dos custos unitários de cada evento.
    const aggregatedCostPerHa = events.reduce((acc, e) => {
        const protoCost = e.protocols.reduce((pAcc, p) => pAcc + (p.packages.find(pk => pk.isDefault)?.costPerHa || 0), 0);
        return acc + protoCost;
    }, 0);


    return (
        <div className="relative border border-white/10 rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md shadow-lg mb-4">
            <div className="relative group">
                {/* Background com gradiente sutil no hover */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-agri-green-900/0 via-agri-green-900/5 to-agri-green-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                />

                <div className="flex items-stretch min-h-[50px] border-b border-white/5">
                    {/* Header da Swimlane (Icon + Title) */}
                    <div
                        className="w-48 flex-shrink-0 flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors rounded-l-lg border-r border-white/5 bg-slate-950/20"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                        <div className="p-1.5 rounded-lg bg-agri-green-950/50 border border-agri-green-900/50 shadow-inner group-hover:border-agri-gold-500/30 transition-colors">
                            <Icon className="w-4 h-4 text-agri-green-500 group-hover:text-agri-gold-500 transition-colors" />
                        </div>
                        <span className="font-bold text-xs text-slate-300 tracking-tight group-hover:text-white transition-colors uppercase">
                            {operationType.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Resumo quando recolhido */}
                    {!isExpanded && (
                        <div className="flex items-center gap-6 text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2 pl-6 py-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-slate-500 font-bold">Eventos</span>
                                <span className="font-mono text-slate-300">{totalEvents}</span>
                            </div>
                            <div className="w-px h-6 bg-white/5"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-slate-500 font-bold">Acumulado/ha</span>
                                <span className="font-mono text-agri-gold-400 font-bold">{formatCurrency(aggregatedCostPerHa)}</span>
                            </div>

                            {/* Badge de Alerta se custo alto (Mock) */}
                            {aggregatedCostPerHa > 500 && (
                                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
                                    ALTO CUSTO
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Grid de Semanas */}
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-6 divide-x divide-border/20 border-t border-border/20">
                                {visibleWeeks.map((weekIndex) => {
                                    const weekEvents = events.filter(e => e.weekIndex === weekIndex);
                                    const isLocked = weekIndex < 2; // Mock Logic: First 2 weeks are locked
                                    return (
                                        <WeekColumn
                                            key={weekIndex}
                                            weekIndex={weekIndex}
                                            operationType={operationType}
                                            events={weekEvents}
                                            onEdit={onEdit}
                                            isLocked={isLocked}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
