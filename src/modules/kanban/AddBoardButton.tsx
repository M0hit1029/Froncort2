'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddBoardButtonProps {
  onAddBoard: (title: string) => void;
}

export function AddBoardButton({ onAddBoard }: AddBoardButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  
  const handleAdd = () => {
    if (boardTitle.trim()) {
      onAddBoard(boardTitle.trim());
      setBoardTitle('');
      setIsAdding(false);
    }
  };
  
  const handleCancel = () => {
    setBoardTitle('');
    setIsAdding(false);
  };
  
  if (isAdding) {
    return (
      <div className="flex-shrink-0 w-80 bg-black border border-[#00ff00]/30 rounded-lg p-4">
        <input
          type="text"
          placeholder="Board title"
          value={boardTitle}
          onChange={(e) => setBoardTitle(e.target.value)}
          className="w-full px-3 py-2 bg-black border border-[#00ff00]/30 text-[#00ff00] rounded focus:outline-none focus:ring-2 focus:ring-[#00ff00] mb-2 placeholder-[#00ff00]/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAdd();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-3 py-1 bg-[#004000] text-[#00ff00] border border-[#00ff00]/50 rounded hover:bg-[#006000] text-sm"
          >
            Add Board
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-black text-[#00ff00]/70 border border-[#00ff00]/30 rounded hover:bg-[#002000] text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => setIsAdding(true)}
      className="flex-shrink-0 w-80 bg-black hover:bg-[#002000] border-2 border-dashed border-[#00ff00]/30 rounded-lg p-4 flex items-center justify-center gap-2 text-[#00ff00]/70 transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">Add Board</span>
    </button>
  );
}
