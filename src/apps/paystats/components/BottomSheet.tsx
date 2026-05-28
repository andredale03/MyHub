interface Props {
  onClose: () => void
  children: React.ReactNode
  desktopMaxW?: string
}

/**
 * Su mobile (<640px): sheet dal basso, rounded-t-3xl, max-h 92dvh.
 * Su desktop (≥640px): dialog centrato, rounded-2xl, max-h 90vh.
 * Posizionamento via flex items-end (mobile) / items-center (desktop).
 * Animazione via CSS @keyframes "sheet-up" applicata sull'elemento radice
 * del sheet — non su classi dinamiche React che si resettano ad ogni render.
 */
export function BottomSheet({ onClose, children, desktopMaxW = 'sm:max-w-md' }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={[
          'sheet-slide-up',           // classe stabile per @keyframes (vedi index.css)
          'w-full flex flex-col',
          'bg-white dark:bg-surface-800',
          'rounded-t-3xl sm:rounded-2xl',
          'shadow-2xl',
          'max-h-[92dvh] sm:max-h-[90vh]',
          desktopMaxW,
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — solo mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-surface-200 dark:bg-surface-600" />
        </div>

        {children}
      </div>
    </div>
  )
}
