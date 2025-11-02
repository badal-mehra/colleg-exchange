import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-muted rounded-2xl rounded-bl-sm max-w-[100px]">
      <div className="flex gap-1">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }} />
        <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
