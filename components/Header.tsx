import React from 'react';
import { FileSpreadsheet, Bot, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              <img src="/logo.png" alt="Invoice Automator Logo" className="w-10 h-10 object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Invoice to CSV Automator</h1>
              <div className="flex flex-col gap-0.5 items-start">
                <p className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1 border border-gray-200">
                  Tool Creator Gimhana
                </p>
                <p className="text-[10px] text-gray-400 font-light mt-0.5 max-w-md hidden sm:block">
                  Automated data extraction for your inventory system.
                </p>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium text-sm shadow-sm"
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;