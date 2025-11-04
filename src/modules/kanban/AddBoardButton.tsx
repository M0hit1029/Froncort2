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
      <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4">
        <input
          type="text"
          placeholder="Board title"
          value={boardTitle}
          onChange={(e) => setBoardTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
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
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add Board
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
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
      className="flex-shrink-0 w-80 bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center gap-2 text-gray-600 transition-colors"
    >
      <Plus className="w-5 h-5" />
      <span className="font-medium">Add Board</span>
    </button>
  );
}
