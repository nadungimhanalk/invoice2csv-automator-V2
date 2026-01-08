import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData, CustomerType, CustomerMasterEntry } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Shared Schema Definition
const INVOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    referenceNo: { type: Type.STRING },
    customerCode: { type: Type.STRING },
    customerName: { type: Type.STRING },
    date: { type: Type.STRING },
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sku: { type: Type.STRING },
          description: { type: Type.STRING },
          batchId: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unitPrice: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
        },
      },
    },
  },
};

/**
 * Shared extraction logic that calls Gemini with the provided prompt and media.
 */
const extractData = async (
  base64Data: string,
  mimeType: string,
  promptText: string,
  customerType: CustomerType = CustomerType.SLIM_HEALTHCARE,
  customerMaster: CustomerMasterEntry[] = []
): Promise<InvoiceData> => {
  if (!GEMINI_API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: INVOICE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data returned from Gemini.");
    }

    const data = JSON.parse(text) as InvoiceData;

    // Post-processing: Sanitize and Validate data
    if (data.lineItems) {
      data.lineItems = data.lineItems.map(item => {
        let sku = item.sku ? String(item.sku).trim() : '';
        let batchId = item.batchId ? String(item.batchId).trim() : '';

        // --- Custom Logic for Cliniqon Biotech ---
        if (customerType === CustomerType.CLINIQON_BIOTECH) {
          // Logic: SKU and Batch are often combined in 'STOCK' column as "SKU*BATCH"
          // Gemini is instructed to extract the full string to 'sku'
          if (sku.includes('*')) {
            const parts = sku.split('*');
            sku = parts[0].trim();
            // If there's a second part, that's the batch. 
            // If batchId was already extracted separately, we overwrite/prioritize this one?
            // Usually if they are combined, batchId col might be empty or this is the source.
            if (parts.length > 1) {
              batchId = parts[1].trim();
            }
          }
        }

        // --- Common Cleanup ---
        // Suffix Cleanup: Remove '-X' or ' - X' or ' -X' etc.
        // We use a regex to handle standard and spaced variants
        // "THC010-X", "THC010 - X"
        // --- Custom Cleanup for Slim Healthcare AND Cliniqon Biotech ---
        if (customerType === CustomerType.SLIM_HEALTHCARE || customerType === CustomerType.CLINIQON_BIOTECH) {
          // Remove any suffix pattern like "- S", "- X", " - S"
          // Pattern: Hyphen followed by optional space and a single letter at the end
          sku = sku.replace(/\s*-\s*[a-zA-Z]$/i, '');

          // Remove " - <anything>" pattern (Space Hyphen Space Anything)
          sku = sku.replace(/\s+-\s+.*$/i, '');
        }

        // --- Common Cleanup ---
        // Suffix Cleanup: Remove '-X' or ' - X' or ' -X' etc. (Legacy/General safeguard)
        sku = sku.replace(/\s*-\s*X$/i, '');
        sku = sku.replace(/\s+/g, ''); // Remove remaining internal spaces if any (Slim logic did this)

        // Sanitize Batch ID (remove internal spaces, standard behavior)
        batchId = batchId.replace(/\s+/g, '');

        // Validate Quantity
        // Logic: Quantity * Unit Price should equal Total.
        // If there's a mismatch, we assume Total and Unit Price are more likely to be correct 
        // (often Total is the boldest figure, and Unit Price is standard), 
        // while Quantity might be misread (e.g., decimal placement errors).
        let quantity = item.quantity;
        const unitPrice = item.unitPrice;
        const total = item.total;

        if (typeof quantity === 'number' && typeof unitPrice === 'number' && typeof total === 'number' && unitPrice !== 0) {
          const calculatedTotal = quantity * unitPrice;
          const difference = Math.abs(calculatedTotal - total);

          // If discrepancy is > 0.1 (accounting for rounding errors), attempt to correct quantity
          if (difference > 0.1) {
            const derivedQuantity = total / unitPrice;
            // We use the derived quantity, formatted to a reasonable precision (up to 4 decimal places to capture fractional quantities if any, but standardizing numbers)
            // We parse it back to a number to ensure it stays numeric.
            quantity = Number(derivedQuantity.toFixed(4));
          }
        }

        return {
          ...item,
          sku: sku,
          batchId: batchId,
          quantity: quantity,
        };
      });
    }

    // --- Customer Master Lookup (For Cliniqon / General) ---
    // If Customer Code is missing or we are in Cliniqon mode where lookup is preferred
    if (customerType === CustomerType.CLINIQON_BIOTECH && data.customerName) {
      // Try to find a match in the master list
      // We trim and lowercase for loose matching, or exact match?
      // Let's do Case-Insensitive Exact Match
      const match = customerMaster.find(entry =>
        entry.customerName.toLowerCase().trim() === data.customerName.toLowerCase().trim()
      );

      if (match) {
        data.customerCode = match.customerCode;
      }
    }

    return data;

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract data from the invoice. Please try again.");
  }
};

export const extractImageInvoiceData = async (
  base64Image: string,
  mimeType: string,
  customerType: CustomerType = CustomerType.SLIM_HEALTHCARE,
  customerMaster: CustomerMasterEntry[] = []
): Promise<InvoiceData> => {
  // Conditional Prompt
  let prompt = '';

  if (customerType === CustomerType.CLINIQON_BIOTECH) {
    prompt = `
        Analyze the provided invoice image (Cliniqon Biotech format). Extract:
        1. Invoice Number (map to referenceNo)
        2. Customer Name (map to customerName)
        3. Customer No / Customer Code (map to customerCode). If not visible, leave empty.
        4. Invoice Date (map to date, format as YYYY-MM-DD)
        5. Line Items Table. For each row extract:
           - Item No / SKU (map to sku). IMPORTANT: Look at the 'STOCK' column. If it contains data like "CODE*BATCH", extract the ENTIRE string including the asterisk.
           - Description (map to description)
           - Batch Number (map to batchId). If the batch is mixed in the STOCK column with *, you may extract it here too, or leave it for post-processing.
           - Quantity (map to quantity, number)
           - Unit Price (map to unitPrice, number)
           - Total (map to total)
        
        If a field is missing, return empty string/0.
        `;
  } else {
    // DEFAULT / SLIM HEALTHCARE PROMPT
    prompt = `
        Analyze the provided invoice image. Extract the following information:
        1. Invoice Number (map to referenceNo)
        2. Customer Name (map to customerName)
        3. Customer No / Customer Code (map to customerCode)
        4. Invoice Date (map to date, format as YYYY-MM-DD)
        5. Line Items Table. For each row extract:
           - Item No / SKU (map to sku)
           - Description (map to description)
           - Batch Number (map to batchId)
           - Quantity (map to quantity, ensure it is a number. Double check that Quantity * Unit Price equals Total)
           - Unit Price (map to unitPrice, ensure it is a number)
           - Total (map to total)
        
        If a field is missing, return an empty string or 0 for numbers.
        `;
  }

  return extractData(base64Image, mimeType, prompt, customerType, customerMaster);
};

export const extractPdfInvoiceData = async (
  base64Pdf: string,
  customerType: CustomerType = CustomerType.SLIM_HEALTHCARE,
  customerMaster: CustomerMasterEntry[] = []
): Promise<InvoiceData> => {
  // Conditional Prompt
  let prompt = '';

  if (customerType === CustomerType.CLINIQON_BIOTECH) {
    prompt = `
        Analyze the provided invoice PDF (Cliniqon Biotech format). Extract:
        1. Invoice Number (map to referenceNo)
        2. Customer Name (map to customerName)
        3. Customer No / Customer Code (map to customerCode). If not visible, leave empty.
        4. Invoice Date (map to date, format as YYYY-MM-DD)
        5. Line Items Table. Parse the table structure carefully. For each row extract:
           - Item No / SKU (map to sku). IMPORTANT: Look at the 'STOCK' column. If it contains data like "CODE*BATCH", extract the ENTIRE string including the asterisk.
           - Description (map to description)
           - Batch Number (map to batchId)
           - Quantity (map to quantity, number)
           - Unit Price (map to unitPrice, number)
           - Total (map to total)
        
        If a field is missing, return empty string/0.
        `;
  } else {
    // DEFAULT / SLIM HEALTHCARE PROMPT
    prompt = `
        Analyze the provided invoice PDF document. This is a structured document.
        Extract the following information:
        1. Invoice Number (map to referenceNo)
        2. Customer Name (map to customerName)
        3. Customer No / Customer Code (map to customerCode)
        4. Invoice Date (map to date, format as YYYY-MM-DD)
        5. Line Items Table. Parse the table structure carefully. For each row extract:
           - Item No / SKU (map to sku)
           - Description (map to description)
           - Batch Number (map to batchId)
           - Quantity (map to quantity, ensure it is a number. Double check that Quantity * Unit Price equals Total)
           - Unit Price (map to unitPrice, ensure it is a number)
           - Total (map to total)
        
        If a field is missing, return an empty string or 0 for numbers.
        `;
  }

  return extractData(base64Pdf, 'application/pdf', prompt, customerType, customerMaster);
};