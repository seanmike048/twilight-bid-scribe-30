
import React from 'react';
import { FileCode } from 'lucide-react';

interface ExamplesDropdownProps {
  onLoadExample: (type: string) => void;
}

const ExamplesDropdown: React.FC<ExamplesDropdownProps> = ({ onLoadExample }) => {
  const examples = [
    { value: 'valid-display', label: 'Valid Display Ad' },
    { value: 'valid-native', label: 'Valid Native Ad' },
    { value: 'valid-ctv', label: 'Valid CTV Pod' },
    { value: 'valid-video', label: 'Valid Video Ad' },
    { value: 'malformed-json', label: 'Malformed JSON' },
    { value: 'missing-required', label: 'Missing Required Fields' },
    { value: 'privacy-issues', label: 'Privacy Compliance Issues' }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300 flex items-center">
        <FileCode className="w-4 h-4 mr-2 text-orange-500" />
        Load Example
      </label>
      <select
        onChange={(e) => {
          if (e.target.value) {
            onLoadExample(e.target.value);
            e.target.value = '';
          }
        }}
        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
        defaultValue=""
      >
        <option value="">Choose an example...</option>
        {examples.map((example) => (
          <option key={example.value} value={example.value}>
            {example.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ExamplesDropdown;
