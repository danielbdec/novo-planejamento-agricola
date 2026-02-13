import { Protocol, OperationalEvent } from "./types";

export const MOCK_PROTOCOLS: Protocol[] = [
    {
        id: 'p1',
        name: '1º Fungicida (Proteção)',
        target: 'Ferrugem Asiática',
        category: 'FUNGICIDA',
        operationType: 'PULVERIZACAO_TERRESTRE',
        requiresMIP: true,
        phenologicalStage: 'V4',
        packages: [
            {
                id: 'pkg1_a',
                name: 'Padrão Authority',
                isDefault: true,
                costPerHa: 43.00,
                products: [
                    { sku: 'AUTH', name: 'Authority (Azox+Flutri)', dose: '0.6', unit: 'L/ha' },
                    { sku: 'ACEGOL', name: 'Acegol (Inseticida)', dose: '0.1', unit: 'L/ha' }
                ]
            }
        ],
        selectedPackageId: 'pkg1_a'
    },
    {
        id: 'p2',
        name: 'Inseticida Mosca Branca',
        target: 'Mosca Branca Adulta',
        category: 'INSETICIDA',
        operationType: 'PULVERIZACAO_TERRESTRE',
        requiresMIP: true,
        phenologicalStage: 'V6',
        packages: [
            {
                id: 'pkg2_a',
                name: 'Padrão Mosca',
                isDefault: true,
                costPerHa: 45.00,
                products: [
                    { sku: 'ACETA', name: 'Acetamiprido Nortox', dose: '0.2', unit: 'kg/ha' }
                ]
            }
        ],
        selectedPackageId: 'pkg2_a'
    }
];

export const MOCK_EVENTS: OperationalEvent[] = [
    {
        id: 'evt-001',
        weekIndex: 2, // S03
        operationType: 'PLANTIO_XINGU',
        status: 'EXECUTADO',
        area: 1200,
        protocols: [
            {
                id: 'p-plantio',
                name: 'Plantio Soja Xingu',
                target: 'Estabelecimento',
                category: 'OUTROS',
                operationType: 'PLANTIO_XINGU',
                requiresMIP: false,
                phenologicalStage: 'Seme',
                selectedPackageId: 'pkg-seed',
                packages: [
                    {
                        id: 'pkg-seed',
                        name: 'Semente Tratada',
                        isDefault: true,
                        costPerHa: 450,
                        products: []
                    }
                ]
            }
        ]
    },
    {
        id: 'evt-002',
        weekIndex: 5, // S06
        operationType: 'PULVERIZACAO_TERRESTRE',
        status: 'PREVISTO',
        area: 1200,
        protocols: [MOCK_PROTOCOLS[0]] // Apenas Fungicida por enquanto
    }
];
