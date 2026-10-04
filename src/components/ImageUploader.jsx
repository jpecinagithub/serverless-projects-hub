import { useCallback, useRef, useState } from 'react';
import { ImagePlus, X, Loader2, Check } from 'lucide-react';
import { formatBytes } from '../lib/format.js';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Drag-and-drop image picker with live preview.
 * Validates type + size client-side (the server re-validates everything).
 * The parent receives the File via onSelect; upload happens on submit.
 */
export function ImageUploader({ onSelect, disabled }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const pick = useCallback(
    (f) => {
      setError('');
      if (!f) return;
      if (!ACCEPT.includes(f.type)) {
        setError('Only JPG, PNG and WebP images are allowed.');
        return;
      }
      if (f.size > MAX_BYTES) {
        setError('The image must be smaller than 2 MB.');
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
      onSelect?.(f);
    },
    [onSelect]
  );

  const clear = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError('');
    onSelect?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-zinc-900">
        Project image <span className="font-normal text-zinc-500">(optional)</span>
      </span>

      {!preview ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={[
            'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
            dragging
              ? 'border-zinc-950 bg-zinc-100'
              : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100/60',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          ].join(' ')}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-white text-zinc-500 shadow-sm">
            <ImagePlus size={22} />
          </span>
          <span className="mt-3 text-sm font-semibold text-zinc-900">
            Drag image here <span className="font-normal text-zinc-500">or click to browse</span>
          </span>
          <span className="mt-1 text-xs text-zinc-500">JPG, PNG or WebP — max 2 MB</span>
          <span className="mt-1 text-[11px] text-zinc-400">
            It will be resized to 800×500 and converted to optimized WebP
          </span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
          <img
            src={preview}
            alt="Project image preview"
            className="aspect-[8/5] w-full object-cover"
          />
          <div className="flex items-center justify-between bg-white px-4 py-2.5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5 truncate">
              <Check size={14} className="shrink-0 text-emerald-600" />
              <span className="truncate font-medium text-zinc-700">{file.name}</span>
              <span>· {formatBytes(file.size)} original</span>
            </span>
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-medium text-zinc-600 hover:bg-zinc-100 hover:text-red-600"
            >
              <X size={14} />
              Remove
            </button>
          </div>
          {disabled && (
            <div className="absolute inset-0 grid place-items-center bg-white/60">
              <Loader2 size={28} className="animate-spin text-zinc-700" />
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Choose a project image"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
