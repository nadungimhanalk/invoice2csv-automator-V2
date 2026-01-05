import { InvoiceData, CsvRow } from "../types";
import * as XLSX from 'xlsx';

export const generateExcelBlob = (invoices: InvoiceData[], mappingConfig: import('../types').MappingField[]): Blob => {
  // Flatten invoice data into rows based on line items
  const rows: any[] = [];

  invoices.forEach((inv) => {
    inv.lineItems.forEach((item) => {
      const row: any = {};

      mappingConfig.forEach(field => {
        let value: any = '';

        if (field.source === 'invoice') {
          // @ts-ignore
          value = inv[field.value] || '';
        } else if (field.source === 'item') {
          // @ts-ignore
          value = item[field.value] || '';
        } else if (field.source === 'static') {
          value = field.value;
        }

        row[field.header] = value;
      });

      rows.push(row);
    });
  });

  // Create a new workbook and add a worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // Return as Blob
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const downloadFile = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const readCustomerMasterExcel = (file: File): Promise<import("../types").CustomerMasterEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          throw new Error("Excel file appears to be empty or missing headers.");
        }

        // Find header indices
        const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase());
        const nameIdx = headers.findIndex((h: string) => h.includes('customer name') || h.includes('name'));
        const codeIdx = headers.findIndex((h: string) => h.includes('customer code') || h.includes('code'));

        if (nameIdx === -1 || codeIdx === -1) {
          throw new Error("Could not find 'Customer Name' and 'Customer Code' columns in the Excel file.");
        }

        const entries: import("../types").CustomerMasterEntry[] = [];

        // Skip header row
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const name = row[nameIdx] ? String(row[nameIdx]).trim() : '';
          const code = row[codeIdx] ? String(row[codeIdx]).trim() : '';

          if (name && code) {
            entries.push({ customerName: name, customerCode: code });
          }
        }

        resolve(entries);

      } catch (error) {
        console.error("Error reading Customer Master Excel:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};