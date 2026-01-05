import { MappingField } from '../types';

export const DEFAULT_MAPPING: MappingField[] = [
    { id: '1', header: 'Order no', source: 'invoice', value: 'referenceNo' },
    { id: '2', header: 'Code', source: 'item', value: 'sku' },
    { id: '3', header: 'Customer Code', source: 'invoice', value: 'customerCode' },
    { id: '4', header: 'Quantity', source: 'static', value: '0' },
    { id: '5', header: 'Export Price', source: 'static', value: '1' },
    { id: '6', header: 'Currency code', source: 'static', value: 'LKR' },
    { id: '7', header: 'Site code', source: 'static', value: '' },
    { id: '8', header: 'Location from', source: 'static', value: '' },
    { id: '9', header: 'Location to', source: 'static', value: '' },
    { id: '10', header: 'Doc.ref', source: 'static', value: '' },
    { id: '11', header: 'Lot no.', source: 'item', value: 'batchId' },
    { id: '12', header: 'Quantity2', source: 'item', value: 'quantity' },
];
