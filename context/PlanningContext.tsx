"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Protocol, OperationalEvent, WeekData, ProtocolPackage } from '../lib/types';
import { MOCK_EVENTS, MOCK_PROTOCOLS } from '../lib/mockData';

interface PlanningContextType {
    events: OperationalEvent[];
    protocols: Protocol[];
    selectedWeek: number;
    setSelectedWeek: (week: number) => void;
    plantingWeek: number;
    setPlantingWeek: (week: number) => void;
    moveEvent: (eventId: string, newWeekIndex: number) => void;
    mergeEvents: (targetEventId: string, sourceEventId: string) => void;
    updateProtocolPackage: (protocolId: string, packageId: string) => void;
    addProtocolToWeek: (protocol: Protocol, weekIndex: number) => void;
    updateEventProtocol: (eventId: string, updatedProtocol: Protocol) => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export function PlanningProvider({ children }: { children: React.ReactNode }) {
    const [events, setEvents] = useState<OperationalEvent[]>([]);
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [plantingWeek, setPlantingWeek] = useState(0); // Week 0 = plantio occurred

    // Load initial Data
    useEffect(() => {
        setEvents(MOCK_EVENTS);
        setProtocols(MOCK_PROTOCOLS);
    }, []);

    const moveEvent = (eventId: string, newWeekIndex: number) => {
        setEvents(prev => prev.map(evt =>
            evt.id === eventId ? { ...evt, weekIndex: newWeekIndex } : evt
        ));
    };

    const updateProtocolPackage = (protocolId: string, packageId: string) => {
        setProtocols(prev => prev.map(p => {
            if (p.id === protocolId) {
                return { ...p, selectedPackageId: packageId };
            }
            return p;
        }));
    };

    const mergeEvents = (targetEventId: string, sourceEventId: string) => {
        setEvents(prev => {
            const target = prev.find(e => e.id === targetEventId);
            const source = prev.find(e => e.id === sourceEventId);

            if (!target || !source) return prev;

            const newEvent: OperationalEvent = {
                ...target,
                id: `merged-${Math.random().toString(36).substr(2, 9)}`,
                protocols: [...target.protocols, ...source.protocols],
                status: 'PREVISTO'
            };

            return [...prev.filter(e => e.id !== targetEventId && e.id !== sourceEventId), newEvent];
        });
    };

    const addProtocolToWeek = (protocol: Protocol, weekIndex: number) => {
        // Check if event exists for this operation type in this week
        const existingEventIndex = events.findIndex(e =>
            e.weekIndex === weekIndex && e.operationType === protocol.operationType
        );

        if (existingEventIndex >= 0) {
            // Merge logic would go here
            const updatedEvents = [...events];
            updatedEvents[existingEventIndex].protocols.push(protocol);
            setEvents(updatedEvents);
        } else {
            // Create new event
            const newEvent: OperationalEvent = {
                id: `evt-${Date.now()}`,
                weekIndex,
                operationType: protocol.operationType,
                status: 'PREVISTO',
                area: 1200, // Default area for now
                protocols: [protocol]
            };
            setEvents(prev => [...prev, newEvent]);
        }
    };

    const updateEventProtocol = (eventId: string, updatedProtocol: Protocol) => {
        setEvents(prev => prev.map(evt => {
            if (evt.id === eventId) {
                // Update the protocol within the event
                const newProtocols = evt.protocols.map(p => p.id === updatedProtocol.id ? updatedProtocol : p);
                return {
                    ...evt,
                    protocols: newProtocols,
                    operationType: updatedProtocol.operationType // Allow changing operation type
                };
            }
            return evt;
        }));
    };

    return (
        <PlanningContext.Provider value={{
            events,
            protocols,
            selectedWeek,
            setSelectedWeek,
            plantingWeek,
            setPlantingWeek,
            moveEvent,
            mergeEvents,
            updateProtocolPackage,
            addProtocolToWeek,
            updateEventProtocol
        }}>
            {children}
        </PlanningContext.Provider>
    );
}

export function usePlanning() {
    const context = useContext(PlanningContext);
    if (context === undefined) {
        throw new Error('usePlanning must be used within a PlanningProvider');
    }
    return context;
}
