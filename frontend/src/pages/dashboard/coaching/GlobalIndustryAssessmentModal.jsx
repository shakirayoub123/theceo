import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Globe,
  Briefcase,
  Layers,
  Compass,
  Clock,
  Check,
} from 'lucide-react'
import {
  GLOBAL_INDUSTRY_DATA,
  getAllIndustryCategories,
  calculateIndustrySummary,
} from '@/data/globalIndustryAssessmentData'

export default function GlobalIndustryAssessmentModal({
  isOpen,
  onClose,
  client,
  initialData = [],
  isReadOnly = false,
  onSave,
  isSaving = false,
}) {
  const [activeTab, setActiveTab] = useState('core') // 'core' | 'specialized'

  // Parse initial experience state: Map cat.id -> { years: '5.5', subsectors: [...] }
  const [experienceState, setExperienceState] = useState(() => {
    const map = {}
    if (Array.isArray(initialData)) {
      initialData.forEach((item) => {
        if (item.catId) {
          map[item.catId] = {
            years: item.years || '',
            subsectors: Array.isArray(item.subsectors) ? item.subsectors : [],
          }
        } else if (item.question && item.question.includes('Years:')) {
          // fallback string parse
          const match = item.question.match(/^(\d+)\./)
          if (match) {
            const catId = parseInt(match[1])
            map[catId] = map[catId] || { years: '', subsectors: [] }
            map[catId].years = item.answer || ''
          }
        }
      })
    }
    return map
  })

  const summary = useMemo(() => calculateIndustrySummary(experienceState), [experienceState])

  if (!isOpen) return null

  const handleYearsChange = (catId, val) => {
    if (isReadOnly) return
    setExperienceState((prev) => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || { subsectors: [] }),
        years: val,
      },
    }))
  }

  const toggleSubsector = (catId, subsector) => {
    if (isReadOnly) return
    setExperienceState((prev) => {
      const current = prev[catId] || { years: '', subsectors: [] }
      const exists = current.subsectors.includes(subsector)
      return {
        ...prev,
        [catId]: {
          ...current,
          subsectors: exists
            ? current.subsectors.filter((s) => s !== subsector)
            : [...current.subsectors, subsector],
        },
      }
    })
  }

  const handleSave = () => {
    if (!onSave) return

    const allCats = getAllIndustryCategories()
    const formattedData = allCats.map((cat) => {
      const state = experienceState[cat.id] || { years: '', subsectors: [] }
      return {
        id: cat.id,
        catId: cat.id,
        question: `${cat.id}. ${cat.name} (Years: ${state.years || '0'})`,
        answer: `${state.years || '0'} Years — [${state.subsectors.join(', ') || 'No sub-sectors selected'}]`,
        category_name: cat.name,
        type: cat.type,
        years: state.years || '0',
        subsectors: state.subsectors,
      }
    })

    formattedData.push({
      question: '__industry_summary__',
      answer: JSON.stringify({
        totalYears: summary.totalYears,
        activeIndustriesCount: summary.activeIndustriesCount,
        totalSubsectorsSelected: summary.totalSubsectorsSelected,
      }),
    })

    onSave({
      id: 5,
      title: GLOBAL_INDUSTRY_DATA.title,
      data: formattedData,
    })
  }

  return (
    <div
      className='fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#F6B72D] overflow-hidden text-gray-900'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-[#0f172a] text-white p-5 sm:p-6 border-b border-[#F6B72D]/40 flex flex-wrap items-start justify-between gap-4'>
          <div className='flex-1 min-w-[280px]'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#F6B72D] text-black'>
                Assessment #5
              </span>
              <span className='text-xs text-white/70'>
                Client: <strong>{client?.clientName || 'Senior Executive'}</strong>
              </span>
              <span className='px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider bg-white/10 text-white/90'>
                {summary.totalYears} Total Industry Years Across {summary.activeIndustriesCount} Sectors
              </span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black text-white tracking-tight uppercase'>
              {GLOBAL_INDUSTRY_DATA.title}
            </h2>
            <p className='text-xs sm:text-sm text-[#F6B72D] font-medium mt-1 font-exo'>
              {GLOBAL_INDUSTRY_DATA.subtitle}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors'
          >
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className='bg-white border-b border-gray-200 px-6 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold'>
          <button
            type='button'
            onClick={() => setActiveTab('core')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'core'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className='w-4 h-4 text-amber-500' />
            Part 1: Core Industry Experience (13 Sectors)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('specialized')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'specialized'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className='w-4 h-4 text-sky-500' />
            Part 2: Specialized Cross-Industry (5 Functional Domains)
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className='p-6 overflow-y-auto space-y-6 flex-1 font-exo bg-gray-50'>
          {/* Instructions Card */}
          <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2'>
            <p className='text-xs font-bold uppercase tracking-wider text-[#b8800f] flex items-center gap-1.5'>
              <Sparkles className='w-4 h-4 text-[#F6B72D]' />
              Assessment Protocol & Experience Tracking
            </p>
            <p className='text-xs sm:text-sm text-gray-700 leading-relaxed font-exo'>
              {GLOBAL_INDUSTRY_DATA.instructions}
            </p>
          </div>

          {/* Categories Grid */}
          <div className='space-y-5'>
            {(activeTab === 'core'
              ? GLOBAL_INDUSTRY_DATA.part1.categories
              : GLOBAL_INDUSTRY_DATA.part2.categories
            ).map((cat) => {
              const current = experienceState[cat.id] || { years: '', subsectors: [] }
              const hasActivity = parseFloat(current.years) > 0 || current.subsectors.length > 0

              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-all space-y-4 ${
                    hasActivity ? 'border-[#F6B72D] ring-1 ring-[#F6B72D]/40' : 'border-gray-200'
                  }`}
                >
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3'>
                    <div className='flex items-center gap-2.5'>
                      <span className='w-7 h-7 rounded-full bg-[#0f172a] text-[#F6B72D] text-xs font-black flex items-center justify-center shrink-0'>
                        {cat.id}
                      </span>
                      <h3 className='text-base font-black text-gray-900'>
                        {cat.name}
                      </h3>
                    </div>

                    {/* Total Years Input */}
                    <div className='flex items-center gap-2 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200'>
                      <Clock className='w-4 h-4 text-[#b8800f] shrink-0' />
                      <label className='text-xs font-bold text-gray-700 whitespace-nowrap'>
                        Total Years in Industry:
                      </label>
                      <input
                        type='number'
                        step='0.5'
                        min='0'
                        disabled={isReadOnly}
                        value={current.years}
                        onChange={(e) => handleYearsChange(cat.id, e.target.value)}
                        placeholder='0.0'
                        className='w-16 border border-gray-300 rounded text-center text-sm font-black p-1 bg-white focus:ring-1 focus:ring-[#F6B72D]'
                      />
                      <span className='text-xs font-semibold text-gray-500'>Yrs</span>
                    </div>
                  </div>

                  {/* Sub-sectors Checkboxes / Chips */}
                  <div>
                    <p className='text-xs font-bold uppercase tracking-wider text-gray-500 mb-2'>
                      Applicable Sub-sectors & Functional Disciplines:
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {cat.subsectors.map((sub, sIdx) => {
                        const isSelected = current.subsectors.includes(sub)
                        return (
                          <button
                            key={sIdx}
                            type='button'
                            disabled={isReadOnly}
                            onClick={() => toggleSubsector(cat.id, sub)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#F6B72D] text-black border-[#d99f1b] font-bold shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                            } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                              isSelected ? 'bg-black text-white border-black' : 'border-gray-400 bg-white'
                            }`}>
                              {isSelected && <Check className='w-2.5 h-2.5' />}
                            </span>
                            {sub}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reflection & Next Steps */}
          <div className='bg-slate-900 text-white rounded-xl p-5 sm:p-6 space-y-3 font-exo'>
            <h4 className='text-sm sm:text-base font-black uppercase text-[#F6B72D] flex items-center gap-2'>
              <Compass className='w-5 h-5 text-[#F6B72D]' />
              {GLOBAL_INDUSTRY_DATA.reflection.title}
            </h4>
            <p className='text-xs sm:text-sm text-white/80 leading-relaxed'>
              {GLOBAL_INDUSTRY_DATA.reflection.description}
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1'>
              {GLOBAL_INDUSTRY_DATA.reflection.keyPoints.map((pt, pIdx) => (
                <div key={pIdx} className='flex items-start gap-2 text-xs text-white/90'>
                  <span className='w-1.5 h-1.5 rounded-full bg-[#F6B72D] mt-1.5 shrink-0' />
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className='bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
            <span>Evaluated: {summary.activeIndustriesCount} of {summary.totalCategories} Sectors</span>
            <span>•</span>
            <span>Total Cumulative Experience: <strong>{summary.totalYears} Years</strong></span>
          </div>

          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors'
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>

            {!isReadOnly && (
              <button
                type='button'
                disabled={isSaving}
                onClick={handleSave}
                className='inline-flex items-center gap-2 px-6 py-2.5 bg-[#F6B72D] hover:bg-[#e6b82a] text-black rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50'
              >
                <Save className='w-4 h-4' />
                {isSaving ? 'Saving to Master Database...' : 'Save to Master Internal Database'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

