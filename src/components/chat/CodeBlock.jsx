import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  
  if (inline) {
    return (
      <code
        className="bg-white/10 rounded px-1.5 py-0.5 font-mono text-sm text-cyan-300"
        {...props}
      >
        {children}
      </code>
    );
  }

  const match = (className || '').match(/language-(\w+)/);
  const language = match ? match[1] : 'code';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden bg-gray-950 border border-gray-700">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all duration-200
            bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white
            border border-gray-700 hover:border-gray-600"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <div className="overflow-x-auto">
        <pre className="px-4 py-3 font-mono text-sm text-gray-100 leading-relaxed">
          <code>{codeString}</code>
        </pre>
      </div>
    </div>
  );
}
