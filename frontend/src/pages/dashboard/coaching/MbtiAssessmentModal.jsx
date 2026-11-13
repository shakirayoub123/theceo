import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Brain,
  Compass,
  Zap,
  Target,
  Users2,
  MessageSquareQuote,
  ShieldCheck,
} from 'lucide-react'
import {
  MBTI_ASSESSMENT_DATA,
  calculateMbtiScore,
} from '@/data/mbtiAssessmentData'

export default function MbtiAssessmentModal({
  isOpen,
  onClose,
  client,
  initialData = [],
  isReadOnly = false,
  onSave,
  isSaving = false,
}) {
  const [activeTab, setActiveTab] = useState('assessment') // 'assessment' | 'scoring' | 'traits' | 'insights'

  // Parse existing answers from initialData (array of { question, answer } or key-value object)
  const [answers, setAnswers] = useState(() => {
    const map = {}
    if (Array.isArray(initialData)) {
      initialData.forEach((item, idx) => {
        // match by question number or question id
        const qId = item.id || idx + 1
        const rawAns = item.answer || ''
        if (rawAns === 'A' || rawAns.startsWith('(A)') || rawAns.startsWith('A:')) {
          map[qId] = 'A'
        } else if (rawAns === 'B' || rawAns.startsWith('(B)') || rawAns.startsWith('B:')) {
          map[qId] = 'B'
        } else {
          // Check if string matches option text
          const foundQ = MBTI_ASSESSMENT_DATA.sections
            .flatMap((s) => s.questions)
            .find((q) => q.id === qId)
          if (foundQ) {
            if (rawAns === foundQ.optionA.text || rawAns.includes(foundQ.optionA.text.substring(0, 30))) {
              map[qId] = 'A'
            } else if (rawAns === foundQ.optionB.text || rawAns.includes(foundQ.optionB.text.substring(0, 30))) {
              map[qId] = 'B'
            } else if (rawAns) {
              map[qId] = rawAns
            }
          } else if (rawAns) {
            map[qId] = rawAns
          }
        }
      })
    }
    return map
  })

  // Selected resonant behaviors in Part III
  const [selectedBehaviors, setSelectedBehaviors] = useState(() => {
    // Check if initialData has meta
    const metaItem = Array.isArray(initialData)
      ? initialData.find((i) => i.question === '__mbti_behaviors__')
      : null
    if (metaItem && metaItem.answer) {
      try {
        return JSON.parse(metaItem.answer)
      } catch (e) {
        return []
      }
    }
    return []
  })

  const scoreResult = useMemo(() => calculateMbtiScore(answers), [answers])

  if (!isOpen) return null

  const handleSelectOption = (qId, optionChoice) => {
    if (isReadOnly) return
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionChoice,
    }))
  }

  const toggleBehavior = (behavior) => {
    if (isReadOnly) return
    setSelectedBehaviors((prev) =>
      prev.includes(behavior)
        ? prev.filter((b) => b !== behavior)
        : [...prev, behavior]
    )
  }

  const handleSave = () => {
    if (!onSave) return

    // Transform into master database payload
    const formattedData = MBTI_ASSESSMENT_DATA.sections
      .flatMap((s) => s.questions)
      .map((q) => {
        const choice = answers[q.id]
        let answerText = ''
        let chosenTrait = ''
        if (choice === 'A') {
          answerText = `(A) ${q.optionA.text}`
          chosenTrait = q.optionA.trait
        } else if (choice === 'B') {
          answerText = `(B) ${q.optionB.text}`
          chosenTrait = q.optionB.trait
        } else if (choice) {
          answerText = choice
        }

        return {
          id: q.id,
          question: `${q.id}. ${q.prompt}`,
          answer: answerText,
          choice: choice || '',
          trait: chosenTrait,
        }
      })

    // Add profile summary and traits
    formattedData.push({
      question: '__mbti_summary__',
      answer: JSON.stringify({
        profile: scoreResult.profile,
        counts: scoreResult.counts,
        totalAnswered: scoreResult.totalAnswered,
      }),
    })

    if (selectedBehaviors.length > 0) {
      formattedData.push({
        question: '__mbti_behaviors__',
        answer: JSON.stringify(selectedBehaviors),
      })
    }

    onSave({
      id: 1,
      title: MBTI_ASSESSMENT_DATA.title,
      data: formattedData,
      mbtiProfile: scoreResult.profile,
    })
  }

  return (
    <div
      className='fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border-2 border-[#F6B72D] overflow-hidden text-gray-900'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='bg-[#0f172a] text-white p-5 sm:p-6 border-b border-[#F6B72D]/40 flex flex-wrap items-start justify-between gap-4'>
          <div className='flex-1 min-w-[280px]'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#F6B72D] text-black'>
                Assessment #1
              </span>
              <span className='text-xs text-white/70'>
                Client: <strong>{client?.clientName || 'Senior Executive'}</strong>
              </span>
              {scoreResult.profile && !scoreResult.profile.includes('-') && (
                <span className='px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'>
                  TYPE: {scoreResult.profile}
                </span>
              )}
            </div>
            <h2 className='text-xl sm:text-2xl font-black text-white tracking-tight uppercase'>
              {MBTI_ASSESSMENT_DATA.title}
            </h2>
            <p className='text-xs sm:text-sm text-[#F6B72D] font-medium mt-1 font-exo'>
              {MBTI_ASSESSMENT_DATA.subtitle}
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
        <div className='bg-gray-100 border-b border-gray-200 px-6 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-bold'>
          <button
            type='button'
            onClick={() => setActiveTab('assessment')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'assessment'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part I: 20 Questions ({scoreResult.totalAnswered}/20)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('scoring')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'scoring'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part II: Score & Profile {scoreResult.profile && `(${scoreResult.profile})`}
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('traits')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'traits'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part III: Trait Behaviors ({selectedBehaviors.length} marked)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('insights')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'insights'
                ? 'border-[#F6B72D] text-black bg-white shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Part IV: Executive Coaching Insights
          </button>
        </div>

        {/* Modal Body */}
        <div className='p-6 overflow-y-auto space-y-6 flex-1 font-exo bg-gray-50'>
          {/* TAB 1: 20 QUESTIONS */}
          {activeTab === 'assessment' && (
            <div className='space-y-6'>
              {/* Objective Banner */}
              <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2'>
                <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b8800f]'>
                  <Sparkles className='w-4 h-4 text-[#F6B72D]' />
                  Executive Assessment Protocol
                </div>
                <p className='text-xs sm:text-sm text-gray-700 leading-relaxed'>
                  {MBTI_ASSESSMENT_DATA.objective}
                </p>
                <p className='text-xs text-gray-500 italic'>
                  {MBTI_ASSESSMENT_DATA.instructions}
                </p>
              </div>

              {/* Sections & Questions */}
              {MBTI_ASSESSMENT_DATA.sections.map((section) => (
                <div
                  key={section.id}
                  className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4'
                >
                  <div className='border-b border-gray-100 pb-2.5 flex items-center justify-between'>
                    <h3 className='text-sm sm:text-base font-black text-gray-900 uppercase tracking-wide'>
                      {section.name}
                    </h3>
                    <span className='px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold'>
                      Dichotomy: {section.traitA} vs {section.traitB}
                    </span>
                  </div>

                  <div className='space-y-4'>
                    {section.questions.map((q) => {
                      const selected = answers[q.id]
                      return (
                        <div
                          key={q.id}
                          className='p-4 rounded-lg bg-gray-50/70 border border-gray-200/80 space-y-3'
                        >
                          <p className='text-sm font-bold text-gray-900 leading-snug'>
                            {q.id}. {q.prompt}
                          </p>
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                            {/* Option A */}
                            <button
                              type='button'
                              disabled={isReadOnly}
                              onClick={() => handleSelectOption(q.id, 'A')}
                              className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                                selected === 'A'
                                  ? 'border-[#F6B72D] bg-[#F6B72D]/15 shadow-sm ring-1 ring-[#F6B72D]'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                  selected === 'A'
                                    ? 'border-black bg-[#F6B72D] text-black'
                                    : 'border-gray-300'
                                }`}
                              >
                                {selected === 'A' && <span className='text-[10px] font-black'>A</span>}
                              </div>
                              <div className='flex-1'>
                                <p className='text-xs sm:text-sm text-gray-900 font-medium leading-relaxed'>
                                  <strong className='text-black font-black'>(A)</strong> {q.optionA.text}
                                </p>
                                <span className='inline-block mt-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600'>
                                  [{q.optionA.trait}]
                                </span>
                              </div>
                            </button>

                            {/* Option B */}
                            <button
                              type='button'
                              disabled={isReadOnly}
                              onClick={() => handleSelectOption(q.id, 'B')}
                              className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                                selected === 'B'
                                  ? 'border-[#F6B72D] bg-[#F6B72D]/15 shadow-sm ring-1 ring-[#F6B72D]'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                  selected === 'B'
                                    ? 'border-black bg-[#F6B72D] text-black'
                                    : 'border-gray-300'
                                }`}
                              >
                                {selected === 'B' && <span className='text-[10px] font-black'>B</span>}
                              </div>
                              <div className='flex-1'>
                                <p className='text-xs sm:text-sm text-gray-900 font-medium leading-relaxed'>
                                  <strong className='text-black font-black'>(B)</strong> {q.optionB.text}
                                </p>
                                <span className='inline-block mt-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600'>
                                  [{q.optionB.trait}]
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: SCORING & INTERPRETATION */}
          {activeTab === 'scoring' && (
            <div className='space-y-6'>
              {/* Profile Card Banner */}
              <div className='bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white p-6 sm:p-8 rounded-2xl border-2 border-[#F6B72D] shadow-xl'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div>
                    <span className='text-xs uppercase tracking-[0.25em] text-[#F6B72D] font-bold'>
                      Part II: Executive Leader Profile
                    </span>
                    <h2 className='text-3xl sm:text-4xl font-black tracking-tight mt-1 text-white'>
                      PROFILE: {scoreResult.profile || 'INCOMPLETE'}
                    </h2>
                    <p className='text-sm text-white/80 mt-1 max-w-xl font-exo'>
                      Based on Myers-Briggs Typology Framework scoring. {scoreResult.totalAnswered} of 20 questions completed.
                    </p>
                  </div>
                  <div className='text-center bg-[#F6B72D] text-black px-6 py-4 rounded-xl shadow-lg'>
                    <p className='text-xs font-extrabold uppercase tracking-wider'>Your Result</p>
                    <p className='text-4xl font-black tracking-widest'>{scoreResult.profile}</p>
                  </div>
                </div>
              </div>

              {/* 4 Dichotomies Score Breakdown */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Dichotomy 1: E vs I */}
                <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                      Section 1: Energy & Focus
                    </span>
                    <span className='text-xs font-black px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200'>
                      Preference: {scoreResult.counts.E >= scoreResult.counts.I ? 'E (Extraverted)' : 'I (Introverted)'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 text-sm font-semibold'>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (A) = E</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.E}</p>
                    </div>
                    <span className='text-gray-400 font-bold'>vs</span>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (B) = I</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.I}</p>
                    </div>
                  </div>
                </div>

                {/* Dichotomy 2: S vs N */}
                <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                      Section 2: Information Gathering
                    </span>
                    <span className='text-xs font-black px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200'>
                      Preference: {scoreResult.counts.S >= scoreResult.counts.N ? 'S (Sensing)' : 'N (Intuitive)'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 text-sm font-semibold'>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (A) = S</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.S}</p>
                    </div>
                    <span className='text-gray-400 font-bold'>vs</span>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (B) = N</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.N}</p>
                    </div>
                  </div>
                </div>

                {/* Dichotomy 3: T vs F */}
                <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                      Section 3: Decision Making
                    </span>
                    <span className='text-xs font-black px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200'>
                      Preference: {scoreResult.counts.T >= scoreResult.counts.F ? 'T (Thinking)' : 'F (Feeling)'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 text-sm font-semibold'>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (A) = T</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.T}</p>
                    </div>
                    <span className='text-gray-400 font-bold'>vs</span>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (B) = F</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.F}</p>
                    </div>
                  </div>
                </div>

                {/* Dichotomy 4: J vs P */}
                <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold uppercase tracking-wider text-gray-500'>
                      Section 4: Work Style & Outer World
                    </span>
                    <span className='text-xs font-black px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200'>
                      Preference: {scoreResult.counts.J >= scoreResult.counts.P ? 'J (Judging)' : 'P (Perceiving)'}
                    </span>
                  </div>
                  <div className='flex items-center gap-3 text-sm font-semibold'>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (A) = J</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.J}</p>
                    </div>
                    <span className='text-gray-400 font-bold'>vs</span>
                    <div className='flex-1 bg-gray-100 rounded-lg p-3 text-center'>
                      <p className='text-xs text-gray-500 font-bold'>Total (B) = P</p>
                      <p className='text-2xl font-black text-gray-900'>{scoreResult.counts.P}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KEY TRAIT BEHAVIORS */}
          {activeTab === 'traits' && (
            <div className='space-y-6'>
              <div className='bg-white p-4 rounded-xl border border-gray-200 shadow-sm'>
                <p className='text-xs uppercase tracking-wider text-gray-500 font-bold mb-1'>
                  Part III: Behavioral Personalization Checklist
                </p>
                <p className='text-xs sm:text-sm text-gray-700'>
                  Review the descriptions below for each trait. Check all behaviors that most strongly resonate with your executive leadership style to build a nuanced personal profile.
                </p>
              </div>

              {Object.entries(MBTI_ASSESSMENT_DATA.traitDescriptions).map(([dimKey, dimData]) => (
                <div key={dimKey} className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4'>
                  <h3 className='text-base font-black text-gray-900 uppercase tracking-wide border-b pb-2'>
                    {dimData.title}
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                    {/* Trait 1 */}
                    {Object.entries(dimData)
                      .filter(([k]) => k !== 'title')
                      .map(([traitLetter, traitContent]) => (
                        <div
                          key={traitLetter}
                          className='p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3'
                        >
                          <div className='border-b border-gray-200 pb-2'>
                            <h4 className='text-sm font-black text-gray-900'>
                              {traitContent.title}
                            </h4>
                            <p className='text-xs text-gray-600 mt-1 leading-relaxed font-exo'>
                              {traitContent.subtitle}
                            </p>
                          </div>

                          <div className='space-y-2 pt-1'>
                            {traitContent.behaviors.map((b, bIdx) => {
                              const isChecked = selectedBehaviors.includes(b)
                              return (
                                <label
                                  key={bIdx}
                                  className='flex items-start gap-2.5 text-xs text-gray-800 cursor-pointer select-none'
                                >
                                  <input
                                    type='checkbox'
                                    disabled={isReadOnly}
                                    checked={isChecked}
                                    onChange={() => toggleBehavior(b)}
                                    className='mt-0.5 rounded text-[#F6B72D] focus:ring-[#F6B72D]'
                                  />
                                  <span className={isChecked ? 'font-bold text-gray-950' : 'text-gray-700'}>
                                    {b}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: EXECUTIVE COACHING INSIGHTS */}
          {activeTab === 'insights' && (
            <div className='space-y-6'>
              <div className='bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4'>
                <h3 className='text-lg font-black text-gray-900 uppercase tracking-wide'>
                  Executive Coaching: Next Steps
                </h3>
                <p className='text-sm text-gray-700 leading-relaxed font-exo'>
                  This profile is the starting point of a powerful conversation about your leadership style and how personality plays a key role in achieving interpersonal results and overall success. Use these insights to consider:
                </p>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-3'>
                  {MBTI_ASSESSMENT_DATA.nextSteps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className='p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-1.5'
                    >
                      <h4 className='text-sm font-black text-gray-900 flex items-center gap-2'>
                        <span className='w-5 h-5 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center shrink-0'>
                          {sIdx + 1}
                        </span>
                        {step.title}
                      </h4>
                      <p className='text-xs text-gray-600 leading-relaxed font-exo'>
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className='p-4 rounded-xl bg-amber-50 border border-amber-200 mt-4'>
                  <p className='text-xs sm:text-sm text-amber-900 leading-relaxed font-exo'>
                    {MBTI_ASSESSMENT_DATA.conclusion}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className='bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
            <span>Answered: {scoreResult.totalAnswered} / 20</span>
            <span>•</span>
            <span>Profile: <strong>{scoreResult.profile}</strong></span>
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

