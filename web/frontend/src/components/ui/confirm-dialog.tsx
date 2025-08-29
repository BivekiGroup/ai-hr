// Simple confirm modal styled like shadcn

type Props = {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title = 'Подтверждение', description, confirmText = 'Подтвердить', cancelText = 'Отмена', destructive, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border bg-white p-4 shadow-xl">
        <div className="mb-2 text-lg font-semibold">{title}</div>
        {description && <div className="mb-4 text-sm text-muted-foreground">{description}</div>}
        <div className="flex justify-end gap-2">
          <button className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm" onClick={onCancel}>{cancelText}</button>
          <button className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
