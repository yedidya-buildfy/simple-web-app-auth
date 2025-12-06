import { useState } from 'react'
import {
  BanknotesIcon,
  BuildingOfficeIcon,
  ShoppingCartIcon,
  TruckIcon,
  CreditCardIcon,
  HomeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  BeakerIcon,
  CakeIcon,
  CameraIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  CloudIcon,
  CogIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FilmIcon,
  GiftIcon,
  GlobeAltIcon,
  HeartIcon,
  LightBulbIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PhoneIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  WrenchScrewdriverIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'

const ICONS = [
  { name: 'BanknotesIcon', Icon: BanknotesIcon },
  { name: 'BuildingOfficeIcon', Icon: BuildingOfficeIcon },
  { name: 'ShoppingCartIcon', Icon: ShoppingCartIcon },
  { name: 'TruckIcon', Icon: TruckIcon },
  { name: 'CreditCardIcon', Icon: CreditCardIcon },
  { name: 'HomeIcon', Icon: HomeIcon },
  { name: 'BriefcaseIcon', Icon: BriefcaseIcon },
  { name: 'AcademicCapIcon', Icon: AcademicCapIcon },
  { name: 'BeakerIcon', Icon: BeakerIcon },
  { name: 'CakeIcon', Icon: CakeIcon },
  { name: 'CameraIcon', Icon: CameraIcon },
  { name: 'ChartBarIcon', Icon: ChartBarIcon },
  { name: 'ClipboardDocumentIcon', Icon: ClipboardDocumentIcon },
  { name: 'CloudIcon', Icon: CloudIcon },
  { name: 'CogIcon', Icon: CogIcon },
  { name: 'CpuChipIcon', Icon: CpuChipIcon },
  { name: 'CurrencyDollarIcon', Icon: CurrencyDollarIcon },
  { name: 'DocumentTextIcon', Icon: DocumentTextIcon },
  { name: 'FilmIcon', Icon: FilmIcon },
  { name: 'GiftIcon', Icon: GiftIcon },
  { name: 'GlobeAltIcon', Icon: GlobeAltIcon },
  { name: 'HeartIcon', Icon: HeartIcon },
  { name: 'LightBulbIcon', Icon: LightBulbIcon },
  { name: 'MusicalNoteIcon', Icon: MusicalNoteIcon },
  { name: 'PaintBrushIcon', Icon: PaintBrushIcon },
  { name: 'PaperAirplaneIcon', Icon: PaperAirplaneIcon },
  { name: 'PencilIcon', Icon: PencilIcon },
  { name: 'PhoneIcon', Icon: PhoneIcon },
  { name: 'PuzzlePieceIcon', Icon: PuzzlePieceIcon },
  { name: 'RocketLaunchIcon', Icon: RocketLaunchIcon },
  { name: 'ScaleIcon', Icon: ScaleIcon },
  { name: 'ShieldCheckIcon', Icon: ShieldCheckIcon },
  { name: 'SparklesIcon', Icon: SparklesIcon },
  { name: 'StarIcon', Icon: StarIcon },
  { name: 'WrenchScrewdriverIcon', Icon: WrenchScrewdriverIcon },
  { name: 'ArrowTrendingUpIcon', Icon: ArrowTrendingUpIcon },
  { name: 'ArrowTrendingDownIcon', Icon: ArrowTrendingDownIcon },
]

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  label?: string
}

export default function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedIcon = ICONS.find(icon => icon.name === value)
  const SelectedIconComponent = selectedIcon?.Icon || BanknotesIcon

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#0F1419]/70 border border-gray-600 rounded-xl text-white flex items-center gap-3 hover:border-[#5ED591] focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 transition-all duration-200"
      >
        <SelectedIconComponent className="w-5 h-5 text-[#5ED591]" />
        <span className="text-sm text-gray-200">{selectedIcon?.name || 'Select icon'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full max-h-80 overflow-y-auto bg-[#1a1f2e] border border-gray-700 rounded-xl shadow-2xl">
            <div className="grid grid-cols-4 gap-1 p-2">
              {ICONS.map(({ name, Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name)
                    setIsOpen(false)
                  }}
                  className={`p-3 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    value === name
                      ? 'bg-[#5ED591]/20 border border-[#5ED591]'
                      : 'hover:bg-gray-800 border border-transparent'
                  }`}
                  title={name}
                >
                  <Icon className={`w-6 h-6 ${value === name ? 'text-[#5ED591]' : 'text-gray-400'}`} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
