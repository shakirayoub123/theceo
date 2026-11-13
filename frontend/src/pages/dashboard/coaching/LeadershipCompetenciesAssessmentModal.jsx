import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Brain,
  Compass,
  Target,
  Award,
  BookOpen,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import {
  LEADERSHIP_COMPETENCIES_DATA,
  COMPETENCY_PROFICIENCY_TIERS,
  calculateCompetencySummary,
  getAllCompetencySkills,
} from '@/data/leadershipCompetenciesAssessmentData'

export default function LeadershipCompetenciesAssessmentModal({
  isOpen,
  onClose,
  client,
  initialData = [],
  isReadOnly = false,
  onSave,
  isSaving = false,
}) {
  const [activeTab, setActiveTab] = useState('assessment') // 'assessment' | 'interpretation' | 'recommendations'

  // Parse existing answers: Map from skill.id -> tier label (e.g., 'Expert')
  const [answers, setAnswers] = useState(() => {
    const map = {}
    if (Array.isArray(initialData)) {
      initialData.forEach((item, idx) => {
        const sId = item.id || idx + 1
        const rawAns = item.answer || ''
        if (rawAns) {
          map[sId] = rawAns
        }
      })
    }
    return map
  })

  // Smart development goals
  const [smartGoals, setSmartGoals] = useState(() => {
    const metaItem = Array.isArray(initialData)
      ? initialData.find((i) => i.question === '__competency_smart_goals__')
      : null
    if (metaItem && metaItem.answer) {
      try {
        return JSON.parse(metaItem.answer)
      } catch (e) {
        return ['', '', '']
      }
    }
    return ['', '', '']
  })

  const summary = useMemo(() => calculateCompetencySummary(answers), [answers])

  if (!isOpen) return null

  const handleSelectTier = (skillId, tierLabel) => {
    if (isReadOnly) return
    setAnswers((prev) => ({
      ...prev,
      [skillId]: tierLabel,
    }))
  }

  const handleGoalChange = (idx, value) => {
    if (isReadOnly) return
    setSmartGoals((prev) => {
      const updated = [...prev]
      updated[idx] = value
      return updated
    })
  }

  const handleSave = () => {
    if (!onSave) return

    const allSkills = getAllCompetencySkills()
    const formattedData = allSkills.map((skill) => {
      const chosen = answers[skill.id] || ''
      return {
        id: skill.id,
        question: `[${skill.domainTitle}] ${skill.text}`,
        answer: chosen,
        skill_text: skill.text,
        domain: skill.domainTitle,
      }
    })

    formattedData.push({
      question: '__competency_summary__',
      answer: JSON.stringify({
        total: summary.total,
        answeredCount: summary.answeredCount,
        expertCount: summary.expertCount,
        proficientCount: summary.proficientCount,
        developingCount: summary.developingCount,
        foundationalCount: summary.foundationalCount,
      }),
    })

    formattedData.push({
      question: '__competency_smart_goals__',
      answer: JSON.stringify(smartGoals),
    })

    onSave({
      id: 4,
      title: LEADERSHIP_COMPETENCIES_DATA.title,
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
                Assessment #4
              </span>
              <span className='text-xs text-white/70'>
                Client: <strong>{client?.clientName || 'Senior Executive'}</strong>
              </span>
              <span className='px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider bg-white/10 text-white/90'>
                Progress: {summary.answeredCount} / {summary.total} Evaluated
              </span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black text-white tracking-tight uppercase'>
              {LEADERSHIP_COMPETENCIES_DATA.title}
            </h2>
            <p className='text-xs sm:text-sm text-[#F6B72D] font-medium mt-1 font-exo'>
              {LEADERSHIP_COMPETENCIES_DATA.subtitle}
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
            onClick={() => setActiveTab('assessment')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'assessment'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Competency Self-Assessment (38 Statements across 6 Domains)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('interpretation')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'interpretation'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Results & Interpretation Guide ({summary.expertCount} Expert, {summary.proficientCount} Proficient)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('recommendations')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            SMART Development Roadmap
          </button>
        </div>

        {/* Modal Body */}
        <div className='p-6 overflow-y-auto space-y-6 flex-1 font-exo bg-gray-50'>
          {/* TAB 1: 38 STATEMENTS ACROSS 6 DOMAINS */}
          {activeTab === 'assessment' && (
            <div className='space-y-6'>
              {/* Instructions Bar */}
              <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2'>
                <p className='text-xs font-bold uppercase tracking-wider text-[#b8800f]'>
                  Diagnostic Instructions
                </p>
                <p className='text-xs sm:text-sm text-gray-700 leading-relaxed font-exo'>
                  {LEADERSHIP_COMPETENCIES_DATA.introduction}
                </p>
                <div className='flex flex-wrap gap-2 pt-1 text-[11px] font-bold'>
                  {COMPETENCY_PROFICIENCY_TIERS.map((tier) => (
                    <span key={tier.key} className='px-2.5 py-1 rounded bg-gray-100 border border-gray-200 text-gray-800'>
                      <strong>{tier.label}:</strong> {tier.desc.split(';')[0]}
                    </span>
                  ))}
                </div>
              </div>

              {LEADERSHIP_COMPETENCIES_DATA.domains.map((domain) => (
                <div key={domain.id} className='bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm'>
                  <div className='bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between'>
                    <div>
                      <h3 className='text-sm sm:text-base font-black uppercase text-white'>
                        {domain.title}
                      </h3>
                      <p className='text-xs text-white/70 mt-0.5 font-exo max-w-3xl'>
                        {domain.description}
                      </p>
                    </div>
                    <span className='text-xs font-bold px-2.5 py-1 rounded bg-white/10 text-white shrink-0 ml-3'>
                      {domain.skills.filter((s) => answers[s.id]).length} / {domain.skills.length} Evaluated
                    </span>
                  </div>

                  <div className='divide-y divide-gray-100'>
                    {domain.skills.map((skill) => {
                      const selected = answers[skill.id]
                      return (
                        <div
                          key={skill.id}
                          className='p-4 hover:bg-gray-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4'
                        >
                          <div className='flex-1 pr-4'>
                            <p className='text-sm font-bold text-gray-900 leading-snug'>
                              {skill.id}. {skill.text}
                            </p>
                          </div>

                          {/* Proficiency Radio Buttons */}
                          <div className='flex flex-wrap items-center gap-1.5 shrink-0'>
                            {COMPETENCY_PROFICIENCY_TIERS.map((tier) => {
                              const isChecked = selected === tier.label
                              return (
                                <button
                                  key={tier.key}
                                  type='button'
                                  disabled={isReadOnly}
                                  onClick={() => handleSelectTier(skill.id, tier.label)}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                    isChecked
                                      ? tier.badgeClass + ' font-black shadow-sm ring-1 ring-[#F6B72D]'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  {tier.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: INTERPRETATION GUIDE & RESULTS BREAKDOWN */}
          {activeTab === 'interpretation' && (
            <div className='space-y-6'>
              {/* Scorecard Banner */}
              <div className='bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-6 sm:p-7 rounded-2xl border-2 border-[#F6B72D] shadow-xl'>
                <span className='text-xs uppercase tracking-[0.25em] text-[#F6B72D] font-bold'>
                  Competency Scorecard
                </span>
                <h3 className='text-2xl sm:text-3xl font-black mt-1 text-white'>
                  Leadership Capability Profile
                </h3>

                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6'>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15 text-center'>
                    <p className='text-xs text-[#F6B72D] font-bold uppercase'>Expert Level</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.expertCount}</p>
                    <p className='text-[10px] text-white/60 mt-0.5'>Exemplary Strengths</p>
                  </div>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15 text-center'>
                    <p className='text-xs text-emerald-300 font-bold uppercase'>Proficient</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.proficientCount}</p>
                    <p className='text-[10px] text-white/60 mt-0.5'>Consistent Independence</p>
                  </div>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15 text-center'>
                    <p className='text-xs text-amber-300 font-bold uppercase'>Developing</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.developingCount}</p>
                    <p className='text-[10px] text-white/60 mt-0.5'>Room for Growth</p>
                  </div>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15 text-center'>
                    <p className='text-xs text-sky-300 font-bold uppercase'>Foundational</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.foundationalCount}</p>
                    <p className='text-[10px] text-white/60 mt-0.5'>Target Priority</p>
                  </div>
                </div>
              </div>

              {/* Interpretation Guide Table */}
              <div className='bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm'>
                <div className='bg-slate-900 text-white px-5 py-3'>
                  <h4 className='text-sm font-black uppercase'>
                    Results Interpretation Guide — From Self-Rating to Action
                  </h4>
                </div>
                <div className='divide-y divide-gray-100'>
                  {LEADERSHIP_COMPETENCIES_DATA.interpretationGuide.map((row) => (
                    <div key={row.rating} className='p-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs'>
                      <div className='font-black text-gray-900 text-sm'>
                        <span className='px-2.5 py-1 rounded bg-[#F6B72D]/20 border border-[#F6B72D] text-black'>
                          {row.rating}
                        </span>
                      </div>
                      <div className='text-gray-700 font-medium'>
                        <strong className='block text-gray-900 mb-0.5'>Interpretation:</strong>
                        {row.interpretation}
                      </div>
                      <div className='text-gray-700 font-medium'>
                        <strong className='block text-gray-900 mb-0.5'>Development Implication:</strong>
                        {row.implication}
                      </div>
                      <div className='text-gray-700 font-medium'>
                        <strong className='block text-gray-900 mb-0.5'>Example Action:</strong>
                        {row.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECOMMENDATIONS & SMART GOALS */}
          {activeTab === 'recommendations' && (
            <div className='space-y-6'>
              <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4'>
                <h3 className='text-base sm:text-lg font-black uppercase text-gray-900 border-b pb-3 flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-[#F6B72D]' />
                  SMART Executive Development Goals
                </h3>
                <p className='text-xs sm:text-sm text-gray-600 font-exo leading-relaxed'>
                  Prioritization is key: focusing on 1-3 key development areas at a time ensures concentrated effort and measurable progress. Structure each goal with Specific, Measurable, Achievable, Relevant, and Time-bound milestones.
                </p>

                <div className='space-y-4 pt-2'>
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className='p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5'>
                      <label className='block text-xs font-black uppercase text-gray-900'>
                        SMART Development Goal #{idx + 1}:
                      </label>
                      <textarea
                        rows={2}
                        disabled={isReadOnly}
                        value={smartGoals[idx] || ''}
                        onChange={(e) => handleGoalChange(idx, e.target.value)}
                        placeholder={`e.g., Complete an executive change management certification and lead an organizational transition over the next 6 months with measurable 80% adoption...`}
                        className='w-full border border-gray-300 rounded-lg p-2.5 text-xs font-sans bg-white'
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className='bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
            <span>Evaluated: {summary.answeredCount} / {summary.total} Core Competencies</span>
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

