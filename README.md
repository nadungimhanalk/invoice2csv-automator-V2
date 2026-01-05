# Invoice to CSV Automator

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Project Banner" width="100%" />
  
  <h3>Automate Data Entry with AI-Powered Invoice Extraction</h3>
  
  <p>
    Transform PDF and Image invoices into structured Excel spreadsheets instantly using Google's Gemini AI.
  </p>
</div>

---

## 📋 Overview

**Invoice to CSV Automator** is a modern React application designed to streamline the accounts payable process. By leveraging the multimodal capabilities of **Google Gemini 1.5 Flash**, this tool automatically extracts key data points—such as reference numbers, SKUs, and quantities—from invoice documents.

It eliminates manual data entry errors and saves hours of administrative work by converting static documents into compatible `.xlsx` files ready for your inventory management system.

## ✨ Key Features

- **📄 Multi-Format Support**: Drag and drop both **PDF** documents and **Image** files (JPG, PNG, WEBP).
- **🤖 AI Extraction Engine**: Uses Google's Gemini 1.5 Flash model for high-accuracy parsing of unstructured invoice layouts.
- **⚡ Batch Processing**: Upload and process multiple invoices simultaneously.
- **📊 Interactive Preview**: Review extracted data in a clean, editable table format before downloading.
- **📥 Smart Export options**:
  - Download individual Excel files for specific invoices.
  - One-click **"Download All"** to get a structured ZIP archive of all processed files.
- **🛡️ Secure Processing**: Processing happens on the client-side via the API; no documents are stored on external servers permanently.

## 🛠️ Technology Stack

- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI Integration**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/genai)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **File Handling**: 
  - [SheetJS (xlsx)](https://sheetjs.com/) for Excel generation
  - [JSZip](https://stuk.github.io/jszip/) for batch downloading

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- A valid **Google Gemini API Key** (Get one [here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository** (if applicable) or navigate to the project folder.

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```
   Add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open the App**:
   Visit `http://localhost:5173` (or the port shown in your terminal) in your browser.

## 📖 Usage Guide

1. **Upload**: Drag and drop PDF or Image invoices into the drop zone area.
2. **Process**: The app effectively communicates with the Gemini API to analyze the documents. You'll see a loading indicator during this phase.
3. **Review**: Once processed, each invoice is displayed as a successful card.
   - Click **"View Details"** (if implemented in future expansions) or simply check the summary status.
   - The extraction verifies mappings like `Reference No`, `SKU`, and `Batch ID`.
4. **Download**:
   - Click the **Download** icon on individual invoice cards to save a single `.xlsx` file.
   - If multiple files are processed, click the **"Download All (ZIP)"** button at the top to grab everything at once.

## 📂 Project Structure

```text
invoice2csv-automator/
├── src/
│   ├── components/       # UI Components (Dropzone, Header, PreviewTable, etc.)
│   ├── services/         # API integrations (gemini.ts)
│   ├── utils/            # Helper functions (csvHelper.ts for Excel generation)
│   ├── App.tsx           # Main application logic
│   ├── main.tsx          # Entry point
│   ├── types.ts          # TypeScript interfaces/types
│   └── index.css         # Global styles & Tailwind directives
├── public/               # Static assets
├── .env.local            # Environment variables (Git-ignored)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite configuration
```

## ⚠️ Important Note

This tool relies on a generative AI model. While highly accurate, it is recommended to **review the extracted data** for critical financial or inventory records to ensure 100% precision.

---

<p align="center">
  <span style="color: #9cb4cc; font-size: 0.8em;">Private Internal Tool &copy; 2026 Invoice Automator</span>
</p>
