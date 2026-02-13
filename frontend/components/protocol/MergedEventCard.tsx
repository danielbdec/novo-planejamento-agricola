"use client";

import React from 'react';
import { OperationalEvent } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

interface MergedEventCardProps {
    event: OperationalEvent;
}

export function MergedEventCard({ event }: MergedEventCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: event.id,
        data: { event }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    const totalCost = event.protocols.reduce((acc, p) => {
        const pkg = p.packages.find(pkg => pkg.id === p.selectedPackageId);
        return acc + (pkg?.costPerHa || 0);
    }, 0);

    // Mock de verificação de compatibilidade (será movido para engine depois)
    const hasConflict = totalCost > 1000; // Regra arbitrária por enquanto

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none mb-3 relative group">

            {/* Efeito de empilhamento (Stack Effect) */}
            <div className="absolute top-[-4px] left-[4px] right-[4px] h-full bg-slate-800/40 rounded-lg border border-white/5 -z-10" />
            <div className="absolute top-[-8px] left-[8px] right-[8px] h-full bg-slate-800/20 rounded-lg border border-white/5 -z-20" />

            {/* Card Principal */}
            <div
                className={cn(
                    "relative p-3 rounded-lg backdrop-blur-md transition-all cursor-grab active:cursor-grabbing",
                    "bg-slate-900/80 border border-agri-gold-500/30",
                    "hover:border-agri-gold-500 hover:shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]",
                    isDragging && "opacity-90 scale-105 rotate-1 z-50 shadow-2xl ring-2 ring-agri-gold-500/50"
                )}
            >
                {/* Header Agrupado */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-agri-gold-500/10 text-agri-gold-500 border border-agri-gold-500/20">
                            <Layers size={14} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-100 leading-tight">Evento Otimizado</h4>
                            <span className="text-[10px] text-slate-400 font-medium">{event.protocols.length} Operações Combinadas</span>
                        </div>
                    </div>

                    {/* Status Indicador */}
                    {hasConflict ? (
                        <Badge variant="destructive" className="h-5 px-1.5 gap-1 text-[10px] bg-red-950/50 border-red-500/50 text-red-400">
                            <AlertTriangle size={10} /> Conflito
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[10px] bg-agri-green-950/30 border-agri-green-500/30 text-agri-green-400">
                            <CheckCircle2 size={10} /> Validado
                        </Badge>
                    )}
                </div>

                {/* Lista de Itens */}
                <div className="space-y-1.5 mb-3">
                    {event.protocols.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between text-xs group/item">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover/item:bg-agri-gold-500 transition-colors" />
                                <span className="text-slate-300 truncate">{p.name}</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[10px]">
                                {p.packages.find(pkg => pkg.id === p.selectedPackageId)?.costPerHa ? '0.5 L/ha' : '-'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer Totais */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 bg-slate-950/20 -mx-3 -mb-3 px-3 py-2 rounded-b-lg">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Custo Total</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-agri-gold-400">{formatCurrency(totalCost)}/ha</span>
                            {/* <span className="text-[10px] text-agri-green-500">(-12%)</span> Mock de economia */}
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        {totalCost > 0 ? (
                            <span className="text-agri-green-500 font-medium">Economia Ativa</span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
