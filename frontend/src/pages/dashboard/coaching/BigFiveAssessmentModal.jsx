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
  Activity,
  Layers,
  HeartHandshake,
} from 'lucide-react'
import {
  BIG_FIVE_ASSESSMENT_DATA,
  BIG_FIVE_SCALE,
  BIG_FIVE_STATEMENTS,
  calculateBigFiveScores,
} from '@/data/bigFiveAssessmentData'

export default function BigFiveAssessmentModal({
  isOpen,
  onClose,
  client,
  initialData = [],
  isReadOnly = false,
  onSave,
  isSaving = false,
}) {
  const [activeTab, setActiveTab] = useState('assessment') // 'assessment' | 'scoring' | 'archetypes'

  // Map of question id (1..35) -> integer score (1..5)
  const [answers, setAnswers] = useState(() => {
    const map = {}
    if (Array.isArray(initialData)) {
      initialData.forEach((item, idx) => {
        const sId = item.id || idx + 1
        const rawAns = item.answer || ''
        const parsed = parseInt(rawAns, 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
          map[sId] = parsed
        } else if (rawAns) {
          // If stored as "4 - Agree" or similar
          const match = String(rawAns).match(/^(\d)/)
          if (match) {
            map[sId] = parseInt(match[1], 10)
          }
        }
      })
    }
    return map
  })

  // Executive coaching development notes
  const [coachNotes, setCoachNotes] = useState(() => {
    const meta = Array.isArray(initialData)
      ? initialData.find((i) => i.question === '__big_five_coach_notes__')
      : null
    return meta?.answer || ''
  })

  const results = useMemo(() => calculateBigFiveScores(answers), [answers])

  if (!isOpen) return null

  const handleSelectScore = (statementId, scoreVal) => {
    if (isReadOnly) return
    setAnswers((prev) => ({
      ...prev,
      [statementId]: scoreVal,
    }))
  }

  const handleSave = () => {
    if (!onSave) return

    const formattedData = BIG_FIVE_STATEMENTS.map((stmt) => {
      const chosen = answers[stmt.id] || ''
      const scaleObj = BIG_FIVE_SCALE.find((s) => s.value === chosen)
      return {
        id: stmt.id,
        question: `${stmt.id}. ${stmt.text}`,
        answer: chosen ? `${chosen} - ${scaleObj?.label || ''}` : '',
        statement_id: stmt.id,
        score: chosen,
      }
    })

    // Store trait breakdown summary as structured meta item
    formattedData.push({
      question: '__big_five_summary__',
      answer: JSON.stringify({
        totalStatements: results.totalStatements,
        totalAnswered: results.totalAnswered,
        isFullyComplete: results.isFullyComplete,
        traits: results.traits.map((t) => ({
          key: t.key,
          name: t.name,
          acronym: t.acronym,
          rawScore: t.rawScore,
          category: t.category,
          archetype: t.archetype,
          percentage: t.percentage,
        })),
      }),
    })

    if (coachNotes.trim()) {
      formattedData.push({
        question: '__big_five_coach_notes__',
        answer: coachNotes.trim(),
      })
    }

    onSave({
      id: 6,
      title: BIG_FIVE_ASSESSMENT_DATA.title,
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
        <div className='bg-[#0f172a] text-white p-5 border-b border-[#F6B72D]/40 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F6B72D] text-black uppercase tracking-wider'>
                Assessment #6 • OCEAN Diagnostic
              </span>
              <span className='text-xs text-white/70'>
                Client: <strong className='text-white'>{client?.clientName}</strong>
              </span>
              {isReadOnly && (
                <span className='px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'>
                  Diagnostic View Mode
                </span>
              )}
            </div>
            <h2 className='text-lg sm:text-2xl font-extrabold tracking-tight text-white'>
              {BIG_FIVE_ASSESSMENT_DATA.title}
            </h2>
            <p className='text-xs sm:text-sm text-gray-300 font-exo mt-0.5'>
              {BIG_FIVE_ASSESSMENT_DATA.subtitle}
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

        {/* Live OCEAN Trait Tally Bar */}
        <div className='bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 px-6 py-3 border-b border-gray-800 text-white flex flex-wrap items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Activity className='w-4 h-4 text-[#F6B72D]' />
            <span className='text-xs font-bold uppercase tracking-wider text-gray-300'>
              Progress:
            </span>
            <span className='px-2 py-0.5 rounded-full text-xs font-bold bg-[#F6B72D] text-black'>
              {results.totalAnswered} / {results.totalStatements} Completed
            </span>
          </div>

          {/* Quick OCEAN Badges */}
          <div className='flex flex-wrap items-center gap-2 text-xs'>
            {results.traits.map((t) => (
              <div
                key={t.key}
                className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10'
              >
                <span className='w-5 h-5 rounded-full bg-[#F6B72D] text-black font-extrabold flex items-center justify-center text-[10px]'>
                  {t.acronym}
                </span>
                <span className='font-semibold text-white/90 text-[11px]'>{t.name.split(' ')[0]}:</span>
                <span className='font-bold text-[#F6B72D] text-xs'>{t.rawScore}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    t.category === 'High'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : t.category === 'Low'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {t.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className='bg-gray-100 px-6 border-b border-gray-300 flex items-center gap-2 overflow-x-auto'>
          <button
            type='button'
            onClick={() => setActiveTab('assessment')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'assessment'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-black hover:bg-gray-200/60'
            }`}
          >
            <BookOpen className='w-4 h-4 text-[#F6B72D]' />
            Part 1: Assessment (35 Questions)
          </button>

          <button
            type='button'
            onClick={() => setActiveTab('scoring')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'scoring'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-black hover:bg-gray-200/60'
            }`}
          >
            <Target className='w-4 h-4 text-[#F6B72D]' />
            Part 2: Executive OCEAN Trait Scores
          </button>

          <button
            type='button'
            onClick={() => setActiveTab('archetypes')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'archetypes'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-black hover:bg-gray-200/60'
            }`}
          >
            <Award className='w-4 h-4 text-[#F6B72D]' />
            Part 3: Leadership Archetypes & Watch-Outs
          </button>
        </div>

        {/* Tab Content Body */}
        <div className='p-6 overflow-y-auto flex-1 font-exo space-y-6'>
          {/* TAB 1: 35 Assessment Questions */}
          {activeTab === 'assessment' && (
            <div className='space-y-6'>
              {/* Foreword Banner */}
              <div className='bg-amber-50 border-l-4 border-[#F6B72D] p-4 rounded-r-xl text-xs sm:text-sm text-gray-800 space-y-2'>
                <div className='flex items-center gap-2 font-bold text-gray-900'>
                  <Sparkles className='w-4 h-4 text-[#F6B72D]' />
                  <span>A Foreword from Your Coaching Influencer:</span>
                </div>
                <p className='leading-relaxed text-gray-700 whitespace-pre-line'>
                  {BIG_FIVE_ASSESSMENT_DATA.foreword}
                </p>
                <div className='pt-2 border-t border-amber-200 text-xs font-semibold text-gray-700'>
                  Scale: 1 = Strongly Disagree • 2 = Disagree • 3 = Neutral • 4 = Agree • 5 = Strongly Agree.
                </div>
              </div>

              {/* Questions List */}
              <div className='space-y-4'>
                {BIG_FIVE_STATEMENTS.map((stmt) => {
                  const currentVal = answers[stmt.id] || 0
                  return (
                    <div
                      key={stmt.id}
                      className={`p-4 rounded-xl border transition-all ${
                        currentVal
                          ? 'bg-white border-gray-300 shadow-sm'
                          : 'bg-gray-50/70 border-gray-200'
                      }`}
                    >
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                        <div className='flex-1 pr-4'>
                          <span className='font-mono font-bold text-gray-400 text-xs mr-2'>
                            #{stmt.id.toString().padStart(2, '0')}
                          </span>
                          <span className='text-sm font-semibold text-gray-900'>
                            {stmt.text}
                          </span>
                        </div>

                        {/* 1..5 Likert Rating Buttons */}
                        <div className='flex items-center gap-1.5 shrink-0'>
                          {BIG_FIVE_SCALE.map((opt) => {
                            const isSelected = currentVal === opt.value
                            return (
                              <button
                                key={opt.value}
                                type='button'
                                disabled={isReadOnly}
                                onClick={() => handleSelectScore(stmt.id, opt.value)}
                                title={opt.label}
                                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  isSelected
                                    ? 'bg-[#F6B72D] text-black border-[#d99f1b] shadow-sm scale-105'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400 disabled:opacity-50'
                                }`}
                              >
                                {opt.value}
                                <span className='hidden sm:inline font-normal text-[10px] ml-1 opacity-70'>
                                  {opt.short}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Scoring Your Profile */}
          {activeTab === 'scoring' && (
            <div className='space-y-6'>
              <div className='text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200'>
                <p className='font-bold text-gray-800 mb-1'>Scoring System Overview:</p>
                <p>
                  Scores are computed across five core traits. Reversed items (where disagreement indicates high executive alignment) are inverted automatically (1→5, 2→4, 3→3, 4→2, 5→1).
                </p>
              </div>

              {/* Trait Cards */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {results.traits.map((t) => (
                  <div
                    key={t.key}
                    className='bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm space-y-4 hover:border-[#F6B72D] transition-colors'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='w-6 h-6 rounded-full bg-[#0f172a] text-[#F6B72D] font-extrabold flex items-center justify-center text-xs'>
                            {t.acronym}
                          </span>
                          <h4 className='text-base font-extrabold text-gray-900'>
                            {t.name}
                          </h4>
                        </div>
                        <p className='text-xs text-gray-600 mt-1'>
                          {t.archetype}
                        </p>
                      </div>

                      <div className='text-right'>
                        <span className='text-2xl font-black text-gray-900'>
                          {t.rawScore}
                        </span>
                        <span className='text-xs text-gray-500'>
                          {' '}/ {t.maxScore}
                        </span>
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase ${
                              t.category === 'High'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : t.category === 'Low'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-sky-100 text-sky-800 border border-sky-300'
                            }`}
                          >
                            {t.category} ({t.percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className='w-full bg-gray-200 rounded-full h-2.5 overflow-hidden'>
                      <div
                        className='bg-[#F6B72D] h-2.5 rounded-full transition-all duration-500'
                        style={{ width: `${t.percentage}%` }}
                      />
                    </div>

                    <p className='text-xs text-gray-700 leading-relaxed'>
                      {t.summary}
                    </p>

                    <div className='text-[11px] text-gray-500 pt-2 border-t border-gray-100 flex items-center justify-between'>
                      <span>Items Answered: {t.answeredItems} / {t.totalItems}</span>
                      <span>Norm Scale: {t.minScore} – {t.maxScore} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Archetypes & Strategic Watch-Outs */}
          {activeTab === 'archetypes' && (
            <div className='space-y-6'>
              <div className='text-xs text-gray-700 bg-amber-50 p-4 rounded-xl border border-amber-200'>
                <p className='font-bold text-gray-900 mb-1'>Part 3: Understanding Your Executive Profile</p>
                <p>
                  This section translates your OCEAN scores into actionable executive behaviors, core leadership strengths, and watch-outs for senior C-suite execution.
                </p>
              </div>

              <div className='space-y-6'>
                {results.traits.map((t) => (
                  <div
                    key={t.key}
                    className='bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm space-y-4'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200'>
                      <div className='flex items-center gap-3'>
                        <span className='w-8 h-8 rounded-xl bg-[#0f172a] text-[#F6B72D] font-extrabold flex items-center justify-center text-sm'>
                          {t.acronym}
                        </span>
                        <div>
                          <h4 className='text-lg font-bold text-gray-900'>{t.name}</h4>
                          <span className='text-xs font-semibold text-[#b8860b]'>
                            Current Archetype: {t.archetype} ({t.category} Scorer • {t.rawScore}/{t.maxScore})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-xs'>
                      {/* Strengths */}
                      <div className='bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2'>
                        <div className='flex items-center gap-2 font-bold text-emerald-900'>
                          <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                          <span>Executive Strengths:</span>
                        </div>
                        <ul className='space-y-1.5 text-emerald-950 pl-2'>
                          {t.strengths.map((str, idx) => (
                            <li key={idx} className='flex items-start gap-1.5'>
                              <span className='text-emerald-500 font-bold'>•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Potential Watch-Outs */}
                      <div className='bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2'>
                        <div className='flex items-center gap-2 font-bold text-amber-900'>
                          <TrendingUp className='w-4 h-4 text-amber-600' />
                          <span>Potential Watch-Outs & Blind Spots:</span>
                        </div>
                        <ul className='space-y-1.5 text-amber-950 pl-2'>
                          {t.watchOuts.map((wo, idx) => (
                            <li key={idx} className='flex items-start gap-1.5'>
                              <span className='text-amber-500 font-bold'>•</span>
                              <span>{wo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coach Notes */}
              <div className='bg-gray-50 border border-gray-300 rounded-xl p-5 space-y-2'>
                <label className='block text-xs font-bold text-gray-800 uppercase tracking-wider'>
                  Executive Coach Observations & Action Milestones
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  placeholder='Enter executive coaching insights, observed leadership dynamics, or strategic coaching development priorities...'
                  className='w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent font-sans disabled:bg-gray-100'
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors'
          >
            {isReadOnly ? 'Close Diagnostic' : 'Cancel'}
          </button>

          {!isReadOnly && (
            <button
              type='button'
              disabled={isSaving}
              onClick={handleSave}
              className='inline-flex items-center gap-2 px-6 py-2.5 bg-[#F6B72D] hover:bg-[#e6b82a] text-black rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50'
            >
              <Save className='w-4 h-4' />
              {isSaving ? 'Saving to Database...' : 'Save to Master Internal Database'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

