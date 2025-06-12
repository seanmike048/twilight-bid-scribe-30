
import React from 'react';
import { Settings } from 'lucide-react';

interface ValidationModeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ValidationModeSelector: React.FC<ValidationModeSelectorProps> = ({ value, onChange }) => {
  const modes = [
    { value: 'auto', label: 'Auto-Select Request Type' },
    { value: 'ctv', label: 'Validate as CTV Ad' },
    { value: 'display', label: 'Validate as Display Ad' },
    { value: 'native', label: 'Validate as Native Ad' },
    { value: 'video', label: 'Validate as Video Ad' },
    { value: 'audio', label: 'Validate as Audio Ad' },
    { value: 'dooh', label: 'Validate as DOOH Ad' }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300 flex items-center">
        <Settings className="w-4 h-4 mr-2 text-orange-500" />
        Validation Mode
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
      >
        {modes.map((mode) => (
          <option key={mode.value} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ValidationModeSelector;
