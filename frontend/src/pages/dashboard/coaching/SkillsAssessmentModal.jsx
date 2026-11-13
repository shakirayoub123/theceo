import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Award,
  TrendingUp,
  Target,
  Brain,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import {
  SKILLS_ASSESSMENT_DATA,
  EXPERIENCE_TIERS,
  calculateSkillsSummary,
  getAllSkillsList,
} from '@/data/skillsAssessmentData'

export default function SkillsAssessmentModal({
  isOpen,
  onClose,
  client,
  initialData = [],
  isReadOnly = false,
  onSave,
  isSaving = false,
}) {
  const [activeTab, setActiveTab] = useState('soft_skills') // 'soft_skills' | 'hard_skills' | 'action_plan'

  // Parse existing answers: Map from skill.id -> tier label (e.g. '8-12 Yrs')
  const [answers, setAnswers] = useState(() => {
    const map = {}
    if (Array.isArray(initialData)) {
      initialData.forEach((item, idx) => {
        const sId = item.id || idx + 1
        const rawAns = item.answer || ''
        if (rawAns) {
          // Normalize tier labels
          if (rawAns.includes('13+')) map[sId] = '13+ Yrs'
          else if (rawAns.includes('8-12')) map[sId] = '8-12 Yrs'
          else if (rawAns.includes('4-7')) map[sId] = '4-7 Yrs'
          else if (rawAns.includes('1-3')) map[sId] = '1-3 Yrs'
          else if (rawAns.includes('0')) map[sId] = '0 Yrs'
          else map[sId] = rawAns
        }
      })
    }
    return map
  })

  // Next 12 months priorities
  const [priorities, setPriorities] = useState(() => {
    const metaItem = Array.isArray(initialData)
      ? initialData.find((i) => i.question === '__skills_priorities__')
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

  const summary = useMemo(() => calculateSkillsSummary(answers), [answers])

  if (!isOpen) return null

  const handleSelectTier = (skillId, tierLabel) => {
    if (isReadOnly) return
    setAnswers((prev) => ({
      ...prev,
      [skillId]: tierLabel,
    }))
  }

  const handlePriorityChange = (idx, value) => {
    if (isReadOnly) return
    setPriorities((prev) => {
      const updated = [...prev]
      updated[idx] = value
      return updated
    })
  }

  const handleSave = () => {
    if (!onSave) return

    const allSkills = getAllSkillsList()
    const formattedData = allSkills.map((skill) => {
      const chosenTier = answers[skill.id] || ''
      return {
        id: skill.id,
        question: `[${skill.competency}] ${skill.text}`,
        answer: chosenTier,
        skill_text: skill.text,
        competency: skill.competency,
        type: skill.type,
      }
    })

    // Add summary metadata
    formattedData.push({
      question: '__skills_summary__',
      answer: JSON.stringify({
        total: summary.total,
        answeredCount: summary.answeredCount,
        signatureStrengthsCount: summary.signatureStrengths.length,
        coreProficienciesCount: summary.coreProficiencies.length,
        developmentOpportunitiesCount: summary.developmentOpportunities.length,
      }),
    })

    // Add 12-month development priorities
    formattedData.push({
      question: '__skills_priorities__',
      answer: JSON.stringify(priorities),
    })

    onSave({
      id: 2,
      title: SKILLS_ASSESSMENT_DATA.title,
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
                Assessment #2
              </span>
              <span className='text-xs text-white/70'>
                Client: <strong>{client?.clientName || 'Senior Executive'}</strong>
              </span>
              <span className='px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider bg-white/10 text-white/90'>
                Progress: {summary.answeredCount} / {summary.total} Skills
              </span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black text-white tracking-tight uppercase'>
              {SKILLS_ASSESSMENT_DATA.title}
            </h2>
            <p className='text-xs sm:text-sm text-[#F6B72D] font-medium mt-1 font-exo'>
              {SKILLS_ASSESSMENT_DATA.subtitle}
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

        {/* Experience Tiers Legend Bar */}
        <div className='bg-gray-100 border-b border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-gray-700'>
          <span className='font-bold uppercase tracking-wider text-gray-900'>Experience Levels:</span>
          {EXPERIENCE_TIERS.map((tier) => (
            <span key={tier.key} className='inline-flex items-center gap-1.5'>
              <span className='w-2 h-2 rounded-full bg-[#F6B72D]' />
              <strong>{tier.label}:</strong> {tier.title}
            </span>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className='bg-white border-b border-gray-200 px-6 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold'>
          <button
            type='button'
            onClick={() => setActiveTab('soft_skills')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'soft_skills'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part I: Soft Skills (21 Areas)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('hard_skills')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'hard_skills'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part II: Hard Skills (25 Areas)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('action_plan')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'action_plan'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part III: Review & Action Plan ({summary.signatureStrengths.length} Strengths, {summary.developmentOpportunities.length} Growth Areas)
          </button>
        </div>

        {/* Modal Body */}
        <div className='p-6 overflow-y-auto space-y-6 flex-1 font-exo bg-gray-50'>
          {/* TAB 1: SOFT SKILLS */}
          {activeTab === 'soft_skills' && (
            <div className='space-y-6'>
              <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
                <p className='text-xs font-bold uppercase tracking-wider text-[#b8800f] mb-1'>
                  {SKILLS_ASSESSMENT_DATA.part1.title}
                </p>
                <p className='text-xs sm:text-sm text-gray-700 leading-relaxed'>
                  {SKILLS_ASSESSMENT_DATA.part1.description}
                </p>
              </div>

              {SKILLS_ASSESSMENT_DATA.part1.competencies.map((comp) => (
                <div key={comp.id} className='bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm'>
                  <div className='bg-slate-900 text-white px-5 py-3 flex items-center justify-between'>
                    <h3 className='text-sm sm:text-base font-black uppercase tracking-wide text-white'>
                      {comp.title}
                    </h3>
                    <span className='text-xs text-white/70'>
                      {comp.skills.filter((s) => answers[s.id]).length} / {comp.skills.length} Evaluated
                    </span>
                  </div>

                  <div className='divide-y divide-gray-100'>
                    {comp.skills.map((skill) => {
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

                          {/* Experience Tier Radio Selector */}
                          <div className='grid grid-cols-5 gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto'>
                            {EXPERIENCE_TIERS.map((tier) => {
                              const isChecked = selected === tier.label
                              return (
                                <button
                                  key={tier.key}
                                  type='button'
                                  disabled={isReadOnly}
                                  onClick={() => handleSelectTier(skill.id, tier.label)}
                                  className={`px-2.5 py-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-w-[55px] sm:min-w-[65px] ${
                                    isChecked
                                      ? tier.level >= 3
                                        ? 'bg-[#F6B72D] border-[#d99f1b] text-black shadow-sm font-black ring-2 ring-[#F6B72D]/50'
                                        : tier.level === 2
                                        ? 'bg-amber-100 border-amber-300 text-amber-950 font-black'
                                        : 'bg-gray-200 border-gray-300 text-gray-900 font-bold'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <span className='text-[10px] font-black uppercase leading-tight'>
                                    {tier.label}
                                  </span>
                                  <span className='text-[9px] opacity-75 mt-0.5 leading-none hidden sm:inline'>
                                    {tier.title.split(' ')[0]}
                                  </span>
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

          {/* TAB 2: HARD SKILLS */}
          {activeTab === 'hard_skills' && (
            <div className='space-y-6'>
              <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
                <p className='text-xs font-bold uppercase tracking-wider text-[#b8800f] mb-1'>
                  {SKILLS_ASSESSMENT_DATA.part2.title}
                </p>
                <p className='text-xs sm:text-sm text-gray-700 leading-relaxed'>
                  {SKILLS_ASSESSMENT_DATA.part2.description}
                </p>
              </div>

              {SKILLS_ASSESSMENT_DATA.part2.competencies.map((comp) => (
                <div key={comp.id} className='bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm'>
                  <div className='bg-slate-900 text-white px-5 py-3 flex items-center justify-between'>
                    <h3 className='text-sm sm:text-base font-black uppercase tracking-wide text-white'>
                      {comp.title}
                    </h3>
                    <span className='text-xs text-white/70'>
                      {comp.skills.filter((s) => answers[s.id]).length} / {comp.skills.length} Evaluated
                    </span>
                  </div>

                  <div className='divide-y divide-gray-100'>
                    {comp.skills.map((skill) => {
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

                          {/* Experience Tier Radio Selector */}
                          <div className='grid grid-cols-5 gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto'>
                            {EXPERIENCE_TIERS.map((tier) => {
                              const isChecked = selected === tier.label
                              return (
                                <button
                                  key={tier.key}
                                  type='button'
                                  disabled={isReadOnly}
                                  onClick={() => handleSelectTier(skill.id, tier.label)}
                                  className={`px-2.5 py-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-w-[55px] sm:min-w-[65px] ${
                                    isChecked
                                      ? tier.level >= 3
                                        ? 'bg-[#F6B72D] border-[#d99f1b] text-black shadow-sm font-black ring-2 ring-[#F6B72D]/50'
                                        : tier.level === 2
                                        ? 'bg-amber-100 border-amber-300 text-amber-950 font-black'
                                        : 'bg-gray-200 border-gray-300 text-gray-900 font-bold'
                                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                  } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <span className='text-[10px] font-black uppercase leading-tight'>
                                    {tier.label}
                                  </span>
                                  <span className='text-[9px] opacity-75 mt-0.5 leading-none hidden sm:inline'>
                                    {tier.title.split(' ')[0]}
                                  </span>
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

          {/* TAB 3: REVIEW & ACTION PLAN */}
          {activeTab === 'action_plan' && (
            <div className='space-y-6'>
              {/* Review Overview Banner */}
              <div className='bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-6 sm:p-7 rounded-2xl border-2 border-[#F6B72D] shadow-xl'>
                <span className='text-xs uppercase tracking-[0.25em] text-[#F6B72D] font-bold'>
                  Executive Competency Synthesis
                </span>
                <h3 className='text-2xl sm:text-3xl font-black mt-1 text-white'>
                  {SKILLS_ASSESSMENT_DATA.reviewSection.title}
                </h3>
                <p className='text-sm text-white/80 mt-1 max-w-2xl font-exo'>
                  {SKILLS_ASSESSMENT_DATA.reviewSection.intro}
                </p>

                {/* Score Summary Metrics */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6'>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15'>
                    <p className='text-xs text-[#F6B72D] font-bold uppercase'>Signature Strengths</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.signatureStrengths.length}</p>
                    <p className='text-xs text-white/60 mt-1'>8-12 Yrs & 13+ Yrs</p>
                  </div>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15'>
                    <p className='text-xs text-amber-300 font-bold uppercase'>Core Proficiencies</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.coreProficiencies.length}</p>
                    <p className='text-xs text-white/60 mt-1'>4-7 Yrs Independent Mastery</p>
                  </div>
                  <div className='bg-white/10 rounded-xl p-4 border border-white/15'>
                    <p className='text-xs text-sky-300 font-bold uppercase'>Growth Opportunities</p>
                    <p className='text-3xl font-black mt-1 text-white'>{summary.developmentOpportunities.length}</p>
                    <p className='text-xs text-white/60 mt-1'>0 Yrs & 1-3 Yrs Focus</p>
                  </div>
                </div>
              </div>

              {/* 3 Categories Breakdown */}
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
                {/* 1. Signature Strengths */}
                <div className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 flex flex-col'>
                  <div className='border-b border-gray-100 pb-3'>
                    <div className='flex items-center gap-2'>
                      <Award className='w-5 h-5 text-[#b8800f]' />
                      <h4 className='text-sm font-black text-gray-900 uppercase'>
                        Signature Strengths
                      </h4>
                    </div>
                    <p className='text-xs text-gray-500 mt-1 font-exo'>
                      Pillars of leadership effectiveness (8-12 & 13+ Yrs).
                    </p>
                  </div>
                  <div className='space-y-2 flex-1 overflow-y-auto max-h-[300px]'>
                    {summary.signatureStrengths.length > 0 ? (
                      summary.signatureStrengths.map((s, idx) => (
                        <div key={idx} className='p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs'>
                          <p className='font-bold text-gray-900 leading-snug'>{s.text}</p>
                          <span className='inline-block mt-1 text-[10px] font-black text-black bg-[#F6B72D] px-1.5 py-0.5 rounded'>
                            {s.selection} • {s.type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className='text-xs text-gray-400 italic py-4 text-center'>
                        No skills rated 8+ years yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Core Proficiencies */}
                <div className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 flex flex-col'>
                  <div className='border-b border-gray-100 pb-3'>
                    <div className='flex items-center gap-2'>
                      <TrendingUp className='w-5 h-5 text-emerald-600' />
                      <h4 className='text-sm font-black text-gray-900 uppercase'>
                        Core Proficiencies
                      </h4>
                    </div>
                    <p className='text-xs text-gray-500 mt-1 font-exo'>
                      Solid, independent execution (4-7 Yrs).
                    </p>
                  </div>
                  <div className='space-y-2 flex-1 overflow-y-auto max-h-[300px]'>
                    {summary.coreProficiencies.length > 0 ? (
                      summary.coreProficiencies.map((s, idx) => (
                        <div key={idx} className='p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs'>
                          <p className='font-bold text-gray-900 leading-snug'>{s.text}</p>
                          <span className='inline-block mt-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded'>
                            {s.selection} • {s.type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className='text-xs text-gray-400 italic py-4 text-center'>
                        No skills rated 4-7 years yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Development Opportunities */}
                <div className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 flex flex-col'>
                  <div className='border-b border-gray-100 pb-3'>
                    <div className='flex items-center gap-2'>
                      <Target className='w-5 h-5 text-sky-600' />
                      <h4 className='text-sm font-black text-gray-900 uppercase'>
                        Development Opportunities
                      </h4>
                    </div>
                    <p className='text-xs text-gray-500 mt-1 font-exo'>
                      Primary growth areas to maximize leadership (0-3 Yrs).
                    </p>
                  </div>
                  <div className='space-y-2 flex-1 overflow-y-auto max-h-[300px]'>
                    {summary.developmentOpportunities.length > 0 ? (
                      summary.developmentOpportunities.map((s, idx) => (
                        <div key={idx} className='p-2.5 rounded-lg bg-sky-50/60 border border-sky-200 text-xs'>
                          <p className='font-bold text-gray-900 leading-snug'>{s.text}</p>
                          <span className='inline-block mt-1 text-[10px] font-black text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded'>
                            {s.selection} • {s.type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className='text-xs text-gray-400 italic py-4 text-center'>
                        No skills rated 0-3 years yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Next 12 Months Development Focus */}
              <div className='bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4'>
                <div className='border-b border-gray-200 pb-3'>
                  <h4 className='text-base font-black text-gray-900 uppercase tracking-wide flex items-center gap-2'>
                    <Sparkles className='w-5 h-5 text-[#F6B72D]' />
                    {SKILLS_ASSESSMENT_DATA.reviewSection.next12MonthsTitle}
                  </h4>
                  <p className='text-xs sm:text-sm text-gray-600 mt-1 font-exo'>
                    {SKILLS_ASSESSMENT_DATA.reviewSection.next12MonthsDescription}
                  </p>
                </div>

                <div className='space-y-3.5 pt-2'>
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className='space-y-1.5'>
                      <label className='block text-xs font-bold text-gray-800 uppercase tracking-wide'>
                        Priority #{idx + 1} Development Focus:
                      </label>
                      <input
                        type='text'
                        disabled={isReadOnly}
                        value={priorities[idx] || ''}
                        onChange={(e) => handlePriorityChange(idx, e.target.value)}
                        placeholder={`Enter key skill priority #${idx + 1} for the next 12 months...`}
                        className='w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent font-sans'
                      />
                    </div>
                  ))}
                </div>

                <div className='p-4 rounded-xl bg-amber-50 border border-amber-200 mt-4'>
                  <p className='text-xs sm:text-sm text-amber-900 leading-relaxed font-exo'>
                    {SKILLS_ASSESSMENT_DATA.reviewSection.closing}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className='bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
            <span>Evaluated: {summary.answeredCount} / {summary.total} Skills</span>
            <span>•</span>
            <span className='text-amber-800 font-bold'>
              {summary.signatureStrengths.length} Signature Strengths
            </span>
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

