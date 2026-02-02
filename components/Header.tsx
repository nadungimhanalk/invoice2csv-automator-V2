import React from 'react';
import { Settings, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="glass-header sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
              <div className="relative bg-white/80 p-2.5 rounded-2xl border border-white/50 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600" strokeWidth={1.5} />
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 tracking-tight flex items-center gap-2">
                Invoice Automator
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100 uppercase tracking-wider">
                  Data Engine
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                Powered by Gemini AI Developer Gimhana
              </p>
            </div>
          </div>

          <div>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white text-gray-700 rounded-full border border-gray-200/50 hover:border-gray-300 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md backdrop-blur-sm active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;