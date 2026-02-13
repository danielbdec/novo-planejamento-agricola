import React from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { OperationalEvent, OperationType } from '@/lib/types';
import { EventCard } from '@/components/protocol/EventCard';
import { cn } from '@/lib/utils';
import { Lock, Ban } from 'lucide-react';
import { isOperationCompatible } from '@/lib/validation';

interface WeekColumnProps {
    weekIndex: number;
    operationType: OperationType;
    events: OperationalEvent[];
    isOverlay?: boolean;
    onEdit: (event: OperationalEvent) => void;
    isLocked?: boolean;
}

export function WeekColumn({ weekIndex, operationType, events, isOverlay, onEdit, isLocked }: WeekColumnProps) {
    const { active } = useDndContext();

    // Verificar Validade do Drop
    const isDropValid = React.useMemo(() => {
        if (!active || !active.data.current) return false;
        const sourceEvent = active.data.current.event as OperationalEvent;
        // Pega a operação original do evento sendo arrastado
        // A lógica do user diz: "Arrastar fungicida para plantio deve dar erro"
        // Nossa função isOperationCompatible compara Source OP vs Target OP
        return isOperationCompatible(sourceEvent.operationType, operationType);
    }, [active, operationType]);

    const droppableId = `week-${weekIndex}-${operationType}`; // Unique ID for drop zone
    const { isOver, setNodeRef } = useDroppable({
        id: droppableId,
        data: { weekIndex, operationType },
        disabled: !!(isLocked || (active && !isDropValid)) // Disable dropping if locked or invalid
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[120px] p-2 border-r border-border/20 transition-colors relative",
                // Valid Drop Styling
                isOver && !isLocked && isDropValid && "bg-agri-green-500/10 border-agri-green-500/50",
                // Invalid Drop Styling (Over but Invalid)
                isOver && !isLocked && !isDropValid && "bg-red-500/10 border-red-500/50 cursor-not-allowed",
                // Locked styling
                isLocked && "bg-slate-950/40 border-slate-800/50 cursor-not-allowed",
            )}
        >
            {/* Indicador visual de Semana */}
            <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center font-bold text-2xl uppercase tracking-widest select-none">
                SEMANA {weekIndex + 1}
            </div>

            {/* Lock Indicator */}
            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none">
                    <Lock size={32} className="text-slate-500" />
                </div>
            )}

            {/* Invalid Drop Indicator */}
            {isOver && !isDropValid && !isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in fade-in zoom-in duration-200">
                    <div className="bg-red-950/80 p-2 rounded-full border border-red-500/50 text-red-500">
                        <Ban size={24} />
                    </div>
                </div>
            )}

            <div className="relative z-10 space-y-2">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} onEdit={onEdit} />
                ))}
            </div>
        </div>
    );
}
