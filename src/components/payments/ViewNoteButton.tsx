'use client';

import { useState } from 'react';

interface ViewNoteButtonProps {
  note: string;
  memberName: string;
}

export default function ViewNoteButton({ note, memberName }: ViewNoteButtonProps) {
  const [open, setOpen] = useState(false);

  if (!note) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-secondary hover:text-primary p-1 rounded hover:bg-surface-variant transition-colors"
        title="View note"
      >
        <span className="material-symbols-outlined text-[18px]">description</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl max-w-lg w-full p-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-md">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Payment Note</h3>
                <p className="text-body-sm text-secondary mt-0.5">{memberName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-secondary hover:text-on-surface p-1 rounded hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="bg-surface-variant/30 border border-outline-variant rounded-lg p-md">
              <p className="text-body-md text-on-surface whitespace-pre-wrap">{note}</p>
            </div>
            <div className="flex justify-end mt-md">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-md py-sm rounded-md bg-primary text-on-primary hover:bg-primary-container transition-colors text-body-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
