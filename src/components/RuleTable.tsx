
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Rule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  path: string;
  when?: string;
  spec?: string;
  description: string;
}

interface RuleTableProps {
  rules: Rule[];
  columns?: string[];
}

const SeverityBadge = ({ severity }: { severity: 'error' | 'warning' | 'info' }) => {
  const variants = {
    error: 'bg-red-900 text-red-200 hover:bg-red-800',
    warning: 'bg-orange-900 text-orange-200 hover:bg-orange-800', 
    info: 'bg-blue-900 text-blue-200 hover:bg-blue-800'
  };

  return (
    <Badge 
      className={`${variants[severity]} uppercase text-xs font-semibold`}
      aria-label={severity}
    >
      {severity}
    </Badge>
  );
};

export const RuleTable: React.FC<RuleTableProps> = ({ 
  rules, 
  columns = ['ID', 'Severity', 'Path', 'When?', 'Spec / Ref', 'Description'] 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-800 border-b border-slate-700">
            {columns.map((column) => (
              <th key={column} className="text-left p-3 font-semibold text-slate-200 border border-slate-700">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule, index) => (
            <tr key={rule.id} className={index % 2 === 0 ? 'bg-slate-800/50' : ''}>
              <td className="p-3 border border-slate-700 font-mono text-xs">{rule.id}</td>
              <td className="p-3 border border-slate-700">
                <SeverityBadge severity={rule.severity} />
              </td>
              <td className="p-3 border border-slate-700">
                <code className="bg-slate-700 text-orange-300 px-2 py-1 rounded text-xs">
                  {rule.path}
                </code>
              </td>
              {columns.includes('When?') && (
                <td className="p-3 border border-slate-700 text-slate-400">
                  {rule.when || ''}
                </td>
              )}
              {columns.includes('Spec / Ref') && (
                <td className="p-3 border border-slate-700 font-mono text-xs text-slate-400">
                  {rule.spec || ''}
                </td>
              )}
              <td className="p-3 border border-slate-700">{rule.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
