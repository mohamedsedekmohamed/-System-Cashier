import React, { useState, useCallback } from 'react';
import { MdContentCopy, MdCheck } from 'react-icons/md';

interface CopyButtonProps {
  text: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    try { 
      await navigator.clipboard.writeText(text); 
    } catch { 
      const t = document.createElement('textarea'); 
      t.value = text; 
      document.body.appendChild(t); 
      t.select(); 
      document.execCommand('copy'); 
      document.body.removeChild(t); 
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button onClick={handleCopy} title={copied ? 'تم النسخ!' : 'نسخ'}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200
        ${copied ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                 : 'bg-slate-100 text-slate-400 hover:bg-primary/10 hover:text-primary dark:bg-slate-700 dark:hover:bg-primary/20'}`}>
      {copied ? <MdCheck size={14} /> : <MdContentCopy size={14} />}
    </button>
  );
};
