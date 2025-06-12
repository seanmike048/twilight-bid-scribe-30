
import React, { useRef, useEffect } from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const formatContent = (content: string): string => {
    if (!content.trim()) return content;

    // Simple syntax highlighting patterns
    return content
      .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1"</span>:')
      .replace(/:\s*"([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>')
      .replace(/([{}[\]])/g, '<span class="text-slate-300">$1</span>');
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="json-editor w-full h-96 resize-none outline-none bg-transparent text-transparent caret-white relative z-10"
        spellCheck={false}
        autoComplete="off"
        style={{
          fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          letterSpacing: '0.025em'
        }}
      />
      
      {/* Syntax highlighted background */}
      <div
        className="absolute inset-0 p-4 pointer-events-none overflow-hidden whitespace-pre-wrap break-words"
        style={{
          fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          letterSpacing: '0.025em'
        }}
        dangerouslySetInnerHTML={{ 
          __html: value ? formatContent(value) : `<span class="text-slate-500">${placeholder}</span>`
        }}
      />
      
      {/* Line numbers */}
      <div className="absolute left-0 top-0 p-4 pr-2 text-slate-500 text-sm select-none pointer-events-none">
        {value.split('\n').map((_, i) => (
          <div key={i} style={{ lineHeight: '1.5' }}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JsonEditor;
