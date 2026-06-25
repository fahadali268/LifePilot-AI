import React from 'react';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  if (!content) return null;
  const lines = content.split('\n');
  
  return (
    <div className="space-y-2 text-zinc-200">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        
        // Headers
        if (trimmed.startsWith('### ')) {
          return <h3 key={lineIdx} className="text-xs font-bold text-white mt-3 mb-1 font-display">{parseInlineStyles(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={lineIdx} className="text-sm font-bold text-white mt-4 mb-2 font-display">{parseInlineStyles(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={lineIdx} className="text-base font-bold text-white mt-4 mb-2 font-display">{parseInlineStyles(trimmed.slice(2))}</h1>;
        }
        
        // Bullet Lists
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={lineIdx} className="flex items-start pl-3 space-x-2 mt-1">
              <span className="text-purple-400 mt-1 shrink-0">•</span>
              <span className="flex-1">{parseInlineStyles(trimmed.slice(2))}</span>
            </div>
          );
        }
        
        // Numbered Lists
        const matchNumbered = trimmed.match(/^(\d+)\.\s(.*)/);
        if (matchNumbered) {
          const num = matchNumbered[1];
          const text = matchNumbered[2];
          return (
            <div key={lineIdx} className="flex items-start pl-3 space-x-2 mt-1">
              <span className="text-purple-400 font-mono font-bold text-[10px] mt-0.5 shrink-0">{num}.</span>
              <span className="flex-1">{parseInlineStyles(text)}</span>
            </div>
          );
        }

        // Empty line or code block boundary
        if (trimmed === '```' || trimmed.startsWith('```')) {
          return null; 
        }
        
        if (trimmed === '') {
          return <div key={lineIdx} className="h-1" />;
        }
        
        return <p key={lineIdx} className="leading-relaxed text-xs">{parseInlineStyles(line)}</p>;
      })}
    </div>
  );
}

function parseInlineStyles(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Tokenize by bold (**bold**) and inline code (`code`) patterns
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const matches = text.split(regex);
  
  return matches.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="font-mono bg-zinc-950/80 px-1.5 py-0.5 rounded text-[10px] text-purple-300 border border-zinc-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
