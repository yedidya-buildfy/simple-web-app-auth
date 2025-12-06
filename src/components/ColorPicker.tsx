interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

const COLORS = [
  '#10b981', // green
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#a855f7', // violet
]

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {COLORS.map(color => (
          <button
            key={color}
            type="button"
            className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
              value === color
                ? 'border-white ring-2 ring-[#5ED591] ring-offset-2 ring-offset-[#0F1419]'
                : 'border-gray-700 hover:border-gray-500'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  )
}
