// src/components/InlineEdit.tsx

import React, { useState, useEffect, useRef } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
}

const InlineEdit: React.FC<InlineEditProps> = ({ value, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editedValue !== value) {
      onSave(editedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedValue(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={editedValue}
        onChange={(e) => setEditedValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="border p-1 rounded w-full"
      />
    );
  }

  return (
    <span onClick={() => setIsEditing(true)} className="cursor-pointer">
      {value}
    </span>
  );
};

export default InlineEdit;