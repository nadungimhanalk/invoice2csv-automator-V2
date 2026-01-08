export interface LineItem {
  sku: string;
  description: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  referenceNo: string;
  customerCode?: string;
  customerName: string;
  date: string;
  lineItems: LineItem[];
}

export interface CsvRow {
  "Order no": string;
  "Code": string;
  "Customer Code": string;
  "Quantity": number;
  "Export Price": number;
  "Currency code": string;
  "Site code": string;
  "Location from": string;
  "Location to": string;
  "Doc.ref": string;
  "Lot no.": string;
  "Quantity2": number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type MappingSource = 'invoice' | 'item' | 'static';

export interface MappingField {
  id: string; // Unique ID for React keys
  header: string;
  source: MappingSource;
  value: string; // "referenceNo", "sku", "0", etc.
}

export enum CustomerType {
  SLIM_HEALTHCARE = 'SLIM_HEALTHCARE',
  CLINIQON_BIOTECH = 'CLINIQON_BIOTECH',
}

export interface CustomerMasterEntry {
  customerName: string;
  customerCode: string;
}

export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface FileProcessingStatus {
  id: string;
  name: string;
  status: ProcessStatus;
  message?: string;
  result?: InvoiceData;
}