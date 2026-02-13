import React from 'react';
import { OperationalEvent } from '@/lib/types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { MergedEventCard } from './MergedEventCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrency } from '@/lib/utils';
import { GripVertical, Eye } from 'lucide-react';
import { GripVertical, Eye, Plane, Tractor, Droplets, Sprout, Bug, Zap } from 'lucide-react';

interface EventCardProps {
    event: OperationalEvent;
    onEdit?: (event: OperationalEvent) => void;
}

export function EventCard({ event, onEdit }: EventCardProps) {
    const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
        id: event.id,
        data: { event }
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: event.id,
        data: { event }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined;

    const isMerged = event.protocols.length > 1;

    // Se já for merged, delegar para o componente especializado
    if (isMerged) {
        return <MergedEventCard event={event} />;
    }

    const protocol = event.protocols[0];
    const mainPackage = protocol.packages.find(pkg => pkg.id === protocol.selectedPackageId) || protocol.packages[0];

    // Extrair Produto Principal (SKU)
    // Lógica: Tenta pegar o primeiro produto com dose definida
    const mainProduct = mainPackage.products.find(p => p.dose && parseFloat(p.dose) > 0.1) || mainPackage.products[0];
    const doseLabel = mainProduct ? `${mainProduct.dose} ${mainProduct.unit}` : null;
    const productSku = mainProduct ? mainProduct.name : protocol.name;

    // Custo Total
    const totalCost = mainPackage.costPerHa || 0;

    // Ícone de Aplicação
    const getApplicationIcon = () => {
        switch (event.operationType) {
            case 'PULVERIZACAO_AEREA': return <Plane size={14} className="text-sky-400" />;
            case 'PULVERIZACAO_TERRESTRE': return <Tractor size={14} className="text-amber-400" />;
            case 'PLANTIO_MECANIZADO': return <Sprout size={14} className="text-agri-green-400" />;
            case 'FERTIRRIGACAO': return <Droplets size={14} className="text-blue-400" />;
            case 'COBERTURA_SOLIDA': return <Tractor size={14} className="text-amber-600" />;
            default: return <Bug size={14} className="text-slate-400" />;
        }
    };

    // Cores de Categoria
    const getCategoryStyles = (category: ProtocolCategory) => {
        switch (category) {
            case 'FUNGICIDA': return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case 'INSETICIDA': return "bg-red-500/10 text-red-400 border-red-500/20";
            case 'HERBICIDA': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case 'ADUBACAO_FOLIAR': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case 'BIOLOGICO': return "bg-lime-500/10 text-lime-400 border-lime-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    // DAE Calculation (Mock)
    const dae = (event.weekIndex * 7) - 10;
    const stageLabel = protocol.phenologicalStage || (dae < 0 ? 'Pré' : `V${Math.max(1, Math.floor(dae / 5))}`);

    return (
        <div ref={setDropRef} className="relative z-10">
            <div ref={setDragRef} style={style} {...listeners} {...attributes} className="touch-none mb-2">
                <div
                    className={cn(
                        "relative p-3 rounded-lg bg-card/90 backdrop-blur-md shadow-sm border transition-all cursor-grab active:cursor-grabbing group",
                        "hover:shadow-md hover:-translate-y-0.5 hover:border-agri-gold-500/30",
                        // Borda esquerda indicativa de status ou tipo
                        event.operationType === 'PLANTIO_MECANIZADO'
                            ? "border-l-4 border-l-agri-green-500 bg-agri-green-950/20"
                            : "border-l-4 border-l-slate-700",

                        isDragging && "opacity-40 grayscale scale-95 border-dashed border-slate-500 bg-slate-800/50 shadow-none",
                        isOver && "ring-2 ring-agri-green-500 scale-105 bg-agri-green-900/10"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) onEdit(event);
                    }}
                >
                    {/* Header: Categoria e Ícone */}
                    <div className="flex justify-between items-center mb-1.5">
                        <Badge
                            variant="outline"
                            className={cn("text-[9px] px-1.5 py-0 h-4 border font-medium tracking-wide", getCategoryStyles(protocol.category))}
                        >
                            {protocol.category}
                        </Badge>
                        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Botão de Edição Rápida */}
                            {onEdit && (
                                <button className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                    title="Editar Evento"
                                    onClick={(e) => { e.stopPropagation(); onEdit(event); }}>
                                    <Eye size={12} />
                                </button>
                            )}
                            {/* Ícone de Aplicação */}
                            <div className="bg-slate-950/50 p-1 rounded-full border border-white/5">
                                {getApplicationIcon()}
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Produto e Alvo */}
                    <div className="mb-2">
                        <h4 className="font-bold text-sm text-white leading-tight truncate" title={productSku}>
                            {productSku}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground truncate">
                            <span className="truncate max-w-[80px]" title={protocol.target}>{protocol.target}</span>
                            {doseLabel && (
                                <>
                                    <span className="text-slate-700">•</span>
                                    <span className="font-medium text-slate-400">{doseLabel}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer: DAE e Custo */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -mx-3 px-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-slate-500">ESTÁDIO</span>
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-slate-800 text-slate-300 pointer-events-none">
                                {stageLabel}
                            </Badge>
                        </div>

                        <div className="flex items-baseline gap-0.5">
                            <span className="text-[10px] text-slate-600">R$</span>
                            <span className="text-xs font-bold text-slate-300">
                                {totalCost.toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
