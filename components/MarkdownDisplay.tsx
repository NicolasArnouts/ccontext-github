"use client"

import React from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';

interface MarkdownDisplayProps {
  content: string;
}

const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ content }) => {
  return (
    <div className="markdown-content">
        <div className='bg-red-300 p-8'>alooooooo</div>
      <MarkdownPreview source={content} />
    </div>
  );
};

export default MarkdownDisplay;