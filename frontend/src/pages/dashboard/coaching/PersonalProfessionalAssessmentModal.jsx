import React, { useState, useMemo } from 'react'
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Heart,
  Briefcase,
  Users2,
  Award,
  Plus,
  Trash2,
  Compass,
  FileCheck,
} from 'lucide-react'
import {
  PERSONAL_PROFESSIONAL_ASSESSMENT_DATA,
  LIKERT_5_SATISFACTION,
  LIKERT_5_IMPORTANCE,
  LIKERT_5_EFFECTIVENESS,
  LIKERT_5_COMFORT,
  LIKERT_5_HAPPINESS,
  LIKERT_5_COMMUNICATION,
  PERSONAL_CORE_VALUES_OPTIONS,
  PROFESSIONAL_CORE_VALUES_OPTIONS,
  LEADERSHIP_STYLE_ARCHETYPES,
} from '@/data/personalProfessionalAssessmentData'

export default function PersonalProfessionalAssessmentModal({
  isOpen,
  onClose,
  client,
  initialData = [],
  isReadOnly = false,
  onSave,
  isSaving = false,
}) {
  const [activeTab, setActiveTab] = useState('personal') // 'personal' | 'professional' | 'alignment'

  // Form State initialized from initialData
  const [formData, setFormData] = useState(() => {
    const rawMap = {}
    if (Array.isArray(initialData)) {
      initialData.forEach((item) => {
        if (item.question && item.answer !== undefined) {
          rawMap[item.question] = item.answer
        }
      })
    }

    // Parse JSON arrays if present
    const parseJson = (key, fallback) => {
      if (rawMap[key]) {
        try {
          return JSON.parse(rawMap[key])
        } catch (e) {
          return fallback
        }
      }
      return fallback
    }

    return {
      // 1.1 Personal & Family Details
      fullName: rawMap['1.1 Full Name'] || client?.clientName || '',
      dob: rawMap['1.1 Date of Birth'] || '',
      maritalStatus: rawMap['1.1 Marital Status'] || 'Married',
      otherMaritalStatus: rawMap['1.1 Other Marital Status'] || '',
      numberOfChildren: rawMap['1.1 Number of Children & Ages'] || '',
      primaryResidence: rawMap['1.1 Primary Residence'] || '',
      emergencyContactName: rawMap['1.1 Emergency Contact Name & Relationship'] || '',
      emergencyContactPhone: rawMap['1.1 Emergency Contact Phone'] || '',

      // 1.2 Family & Friend Relationships
      satMarriage: rawMap['1.2 Satisfaction Marriage/Partnership'] || 'Satisfied',
      satChildren: rawMap['1.2 Satisfaction Children Relationship'] || 'Satisfied',
      satExtendedFamily: rawMap['1.2 Satisfaction Extended Family'] || 'Satisfied',
      satFriendships: rawMap['1.2 Satisfaction Friendships'] || 'Satisfied',
      relComments: rawMap['1.2 Relationship Comments'] || '',

      // 1.3 Personal Beliefs & Values
      hasDefinedPersonalValues: rawMap['1.3 Has Defined Personal Values'] || 'Yes',
      hasDefinedPersonalBeliefs: rawMap['1.3 Has Defined Personal Beliefs'] || 'Yes',
      personalValuesSelected: parseJson('1.3 Personal Core Values Selected', ['Integrity', 'Family', 'Growth']),
      personalValuesOther: rawMap['1.3 Personal Values Other'] || '',
      personalValuesTop3: parseJson('1.3 Personal Values Top 3', ['Integrity', 'Family', 'Leadership']),
      personalValuesImportance: rawMap['1.3 Personal Values Importance in Daily Life'] || 'Very important',
      personalValuesInfluence: rawMap['1.3 Personal Values Influence in Decision Making'] || 'Very important',
      personalValuesComments: rawMap['1.3 Personal Values Comments'] || '',

      // 1.4 Professional Beliefs & Values
      hasDefinedProfValues: rawMap['1.4 Has Defined Professional Values'] || 'Yes',
      hasDefinedProfBeliefs: rawMap['1.4 Has Defined Professional Beliefs'] || 'Yes',
      profValuesSelected: parseJson('1.4 Professional Core Values Selected', ['Integrity', 'Discipline', 'Innovation']),
      profValuesOther: rawMap['1.4 Professional Values Other'] || '',
      profValuesTop3: parseJson('1.4 Professional Values Top 3', ['Integrity', 'Drive', 'Leadership']),
      profValuesImportance: rawMap['1.4 Professional Values Importance in Daily Decisions'] || 'Very important',
      profValuesInfluence: rawMap['1.4 Professional Beliefs Influence Level'] || 'My beliefs have a strong influence',
      profValuesComments: rawMap['1.4 Professional Values Comments'] || '',

      // 1.5 Likes & Dislikes
      personalLikes: rawMap['1.5 Personal Likes'] || '',
      personalDislikes: rawMap['1.5 Personal Dislikes'] || '',

      // 1.6 Hobbies & Interests
      hobby1: rawMap['1.6 Top Hobby 1'] || '',
      hobby2: rawMap['1.6 Top Hobby 2'] || '',
      hobby3: rawMap['1.6 Top Hobby 3'] || '',
      activelyMakesTimeHobbies: rawMap['1.6 Actively Makes Time for Hobbies'] || 'Yes',
      happyWithTimeHobbies: rawMap['1.6 Happy with Time Spent on Hobbies'] || 'Yes',

      // 1.7 Work-Life Balance (%)
      timeWork: rawMap['1.7 Weekly Time Work %'] || '50',
      timeFamily: rawMap['1.7 Weekly Time Family %'] || '20',
      timeFriends: rawMap['1.7 Weekly Time Friends %'] || '10',
      timePersonalDev: rawMap['1.7 Weekly Time Personal Dev %'] || '10',
      timeLeisure: rawMap['1.7 Weekly Time Leisure %'] || '5',
      timeCommunity: rawMap['1.7 Weekly Time Community %'] || '5',
      satWorkLifeBalance: rawMap['1.7 Satisfaction Current Work-Life Balance'] || 'Neutral',

      // 1.8 Personal Happiness Assessment
      happyFamily: rawMap['1.8 Happiness Family Life'] || 'Happy',
      happyHealth: rawMap['1.8 Happiness Health & Well-being'] || 'Happy',
      happySocial: rawMap['1.8 Happiness Social Connections'] || 'Happy',
      happyFinancial: rawMap['1.8 Happiness Financial Security'] || 'Happy',

      // 1.9 Interpersonal & Community Networking (Personal)
      netPersonalComfort: rawMap['1.9 Personal Networking Comfort'] || 'Comfortable',
      netPersonalImportance: rawMap['1.9 Personal Networking Importance'] || 'Very important',
      netPersonalEffectiveness: rawMap['1.9 Personal Networking Effectiveness'] || 'Very Effective',
      netPersonalComments: rawMap['1.9 Personal Networking Comments'] || '',

      // 2.1 Current Professional Role
      currentJobTitle: rawMap['2.1 Current Job Title'] || '',
      companyName: rawMap['2.1 Company Name'] || '',
      companyOverview: rawMap['2.1 Company Overview'] || '',
      workContact: rawMap['2.1 Work Contact Information'] || '',
      keyResponsibilities: rawMap['2.1 Key Responsibilities'] || '',
      roleLikesTop3: parseJson('2.1 Role Likes Top 3', ['', '', '']),
      roleDislikesTop3: parseJson('2.1 Role Dislikes Top 3', ['', '', '']),
      rolePurposeAlignment: rawMap['2.1 Role Purpose Alignment'] || 'Yes',
      satCurrentRole: rawMap['2.1 Satisfaction Current Role'] || 'Satisfied',
      satCareerTrajectory: rawMap['2.1 Satisfaction Career Trajectory'] || 'Satisfied',
      commStyle: rawMap['2.1 Communication Style Rating'] || 'Good',
      confBoard: rawMap['2.1 Confidence Board of Directors'] || 'Good',
      confExecTeam: rawMap['2.1 Confidence Senior Leadership Team'] || 'Very Good',
      confStakeholders: rawMap['2.1 Confidence External Stakeholders'] || 'Good',
      confMedia: rawMap['2.1 Confidence Media'] || 'Neutral',
      strongestLeadershipAreas: parseJson('2.1 Strongest Leadership Areas', ['Vision', 'Strategic Thinking']),
      coachingGoals: parseJson('2.1 Coaching Primary Goals', ['Leadership Style Evolution', 'Strategic Clarity']),
      specificIssuesToAddress: rawMap['2.1 Specific Issues to Address'] || '',
      roleComments: rawMap['2.1 Role Comments'] || '',

      // 2.2 Multi-Industry Experience
      workExperienceList: parseJson('2.2 Multi-Industry Experience List', [
        { position: '', company: '', industry: '', years: '' },
      ]),

      // 2.3 Associations & Alliances
      isMemberAssociations: rawMap['2.3 Is Member Professional Associations'] || 'Yes',
      associationsList: parseJson('2.3 Associations List', ['', '', '']),
      hasStrategicAlliances: rawMap['2.3 Has Strategic Partnerships & Alliances'] || 'Yes',
      alliancesList: parseJson('2.3 Alliances List', ['', '', '']),

      // 2.4 Professional Happiness & Job Satisfaction
      happyProfessionalLife: rawMap['2.4 Happy Overall Professional Life'] || 'Happy',
      contributionsValued: rawMap['2.4 Contributions Valued at Work'] || 'Yes',
      jobSatisfactionFactors: parseJson('2.4 Job Satisfaction Factors', [
        'Organizational Culture',
        'Leadership Opportunities',
        'Career Recognition & Appreciation',
      ]),
      jobSatisfactionOther: rawMap['2.4 Job Satisfaction Other'] || '',

      // 2.5 Professional Networking
      netProfComfort: rawMap['2.5 Professional Networking Comfort'] || 'Comfortable',
      netProfCareerImportance: rawMap['2.5 Professional Networking Career Importance'] || 'Very important',
      netProfOrgImportance: rawMap['2.5 Professional Networking Org Importance'] || 'Very important',
      netProfEffectiveness: rawMap['2.5 Professional Networking Effectiveness'] || 'Very Effective',
      netProfComments: rawMap['2.5 Professional Networking Comments'] || '',

      // 2.6 Leadership Style & Effectiveness
      leadershipStylePrimary: rawMap['2.6 Leadership Style Primary'] || 'Transformational',
      leadershipStyleOther: rawMap['2.6 Leadership Style Other'] || '',
      leadershipEffectiveness: rawMap['2.6 Leadership Effectiveness Rating'] || 'Good',
      goodLeaderTraits: parseJson('2.6 Good Leader Top 3 Traits', ['', '', '']),
      badLeaderTraits: parseJson('2.6 Bad Leader Top 3 Traits', ['', '', '']),
      leadershipComments: rawMap['2.6 Leadership Comments'] || '',

      // 2.7 Stakeholder & Board Relationships
      satStakeholderRelations: rawMap['2.7 Stakeholder Relationships Rating'] || 'Good',
      satBoardStrength: rawMap['2.7 Board Member Strength Rating'] || 'Good',
      conducts360BoardAssessments: rawMap['2.7 Conducts 360 Board Assessments'] || 'Yes',
      boardComments: rawMap['2.7 Board Comments'] || '',

      // 2.8 Final Reflection & Certification
      personalProfAligned: rawMap['2.8 Personal & Professional Aligned'] || 'Yes',
      satPersonalProfAlignment: rawMap['2.8 Satisfaction Alignment'] || 'Satisfied',
      oneThingToChange: rawMap['2.8 One Thing to Change or Improve'] || '',
      certifiedAccurate: rawMap['2.8 Certified Accurate'] === 'Yes' || true,
      signatureName: rawMap['2.8 Signature Name'] || client?.clientName || '',
      signatureDate: rawMap['2.8 Signature Date'] || new Date().toLocaleDateString(),
    }
  })

  if (!isOpen) return null

  const handleFieldChange = (field, value) => {
    if (isReadOnly) return
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field, item) => {
    if (isReadOnly) return
    setFormData((prev) => {
      const current = prev[field] || []
      return {
        ...prev,
        [field]: current.includes(item)
          ? current.filter((x) => x !== item)
          : [...current, item],
      }
    })
  }

  const handleArrayIdxChange = (field, idx, value) => {
    if (isReadOnly) return
    setFormData((prev) => {
      const list = [...(prev[field] || [])]
      list[idx] = value
      return { ...prev, [field]: list }
    })
  }

  const addExperienceRow = () => {
    if (isReadOnly) return
    setFormData((prev) => ({
      ...prev,
      workExperienceList: [
        ...(prev.workExperienceList || []),
        { position: '', company: '', industry: '', years: '' },
      ],
    }))
  }

  const removeExperienceRow = (idx) => {
    if (isReadOnly) return
    setFormData((prev) => ({
      ...prev,
      workExperienceList: prev.workExperienceList.filter((_, i) => i !== idx),
    }))
  }

  const handleExperienceRowChange = (idx, field, val) => {
    if (isReadOnly) return
    setFormData((prev) => {
      const updated = [...prev.workExperienceList]
      updated[idx] = { ...updated[idx], [field]: val }
      return { ...prev, workExperienceList: updated }
    })
  }

  const calculatedTotalPercent = useMemo(() => {
    const w = parseFloat(formData.timeWork) || 0
    const f = parseFloat(formData.timeFamily) || 0
    const fr = parseFloat(formData.timeFriends) || 0
    const p = parseFloat(formData.timePersonalDev) || 0
    const l = parseFloat(formData.timeLeisure) || 0
    const c = parseFloat(formData.timeCommunity) || 0
    return w + f + fr + p + l + c
  }, [
    formData.timeWork,
    formData.timeFamily,
    formData.timeFriends,
    formData.timePersonalDev,
    formData.timeLeisure,
    formData.timeCommunity,
  ])

  const handleSave = () => {
    if (!onSave) return

    // Convert formData into key-value list for Master Database
    const dataPayload = [
      { question: '1.1 Full Name', answer: formData.fullName },
      { question: '1.1 Date of Birth', answer: formData.dob },
      { question: '1.1 Marital Status', answer: formData.maritalStatus },
      { question: '1.1 Other Marital Status', answer: formData.otherMaritalStatus },
      { question: '1.1 Number of Children & Ages', answer: formData.numberOfChildren },
      { question: '1.1 Primary Residence', answer: formData.primaryResidence },
      { question: '1.1 Emergency Contact Name & Relationship', answer: formData.emergencyContactName },
      { question: '1.1 Emergency Contact Phone', answer: formData.emergencyContactPhone },

      { question: '1.2 Satisfaction Marriage/Partnership', answer: formData.satMarriage },
      { question: '1.2 Satisfaction Children Relationship', answer: formData.satChildren },
      { question: '1.2 Satisfaction Extended Family', answer: formData.satExtendedFamily },
      { question: '1.2 Satisfaction Friendships', answer: formData.satFriendships },
      { question: '1.2 Relationship Comments', answer: formData.relComments },

      { question: '1.3 Has Defined Personal Values', answer: formData.hasDefinedPersonalValues },
      { question: '1.3 Has Defined Personal Beliefs', answer: formData.hasDefinedPersonalBeliefs },
      { question: '1.3 Personal Core Values Selected', answer: JSON.stringify(formData.personalValuesSelected) },
      { question: '1.3 Personal Values Other', answer: formData.personalValuesOther },
      { question: '1.3 Personal Values Top 3', answer: JSON.stringify(formData.personalValuesTop3) },
      { question: '1.3 Personal Values Importance in Daily Life', answer: formData.personalValuesImportance },
      { question: '1.3 Personal Values Influence in Decision Making', answer: formData.personalValuesInfluence },
      { question: '1.3 Personal Values Comments', answer: formData.personalValuesComments },

      { question: '1.4 Has Defined Professional Values', answer: formData.hasDefinedProfValues },
      { question: '1.4 Has Defined Professional Beliefs', answer: formData.hasDefinedProfBeliefs },
      { question: '1.4 Professional Core Values Selected', answer: JSON.stringify(formData.profValuesSelected) },
      { question: '1.4 Professional Values Other', answer: formData.profValuesOther },
      { question: '1.4 Professional Values Top 3', answer: JSON.stringify(formData.profValuesTop3) },
      { question: '1.4 Professional Values Importance in Daily Decisions', answer: formData.profValuesImportance },
      { question: '1.4 Professional Beliefs Influence Level', answer: formData.profValuesInfluence },
      { question: '1.4 Professional Values Comments', answer: formData.profValuesComments },

      { question: '1.5 Personal Likes', answer: formData.personalLikes },
      { question: '1.5 Personal Dislikes', answer: formData.personalDislikes },

      { question: '1.6 Top Hobby 1', answer: formData.hobby1 },
      { question: '1.6 Top Hobby 2', answer: formData.hobby2 },
      { question: '1.6 Top Hobby 3', answer: formData.hobby3 },
      { question: '1.6 Actively Makes Time for Hobbies', answer: formData.activelyMakesTimeHobbies },
      { question: '1.6 Happy with Time Spent on Hobbies', answer: formData.happyWithTimeHobbies },

      { question: '1.7 Weekly Time Work %', answer: formData.timeWork },
      { question: '1.7 Weekly Time Family %', answer: formData.timeFamily },
      { question: '1.7 Weekly Time Friends %', answer: formData.timeFriends },
      { question: '1.7 Weekly Time Personal Dev %', answer: formData.timePersonalDev },
      { question: '1.7 Weekly Time Leisure %', answer: formData.timeLeisure },
      { question: '1.7 Weekly Time Community %', answer: formData.timeCommunity },
      { question: '1.7 Satisfaction Current Work-Life Balance', answer: formData.satWorkLifeBalance },

      { question: '1.8 Happiness Family Life', answer: formData.happyFamily },
      { question: '1.8 Happiness Health & Well-being', answer: formData.happyHealth },
      { question: '1.8 Happiness Social Connections', answer: formData.happySocial },
      { question: '1.8 Happiness Financial Security', answer: formData.happyFinancial },

      { question: '1.9 Personal Networking Comfort', answer: formData.netPersonalComfort },
      { question: '1.9 Personal Networking Importance', answer: formData.netPersonalImportance },
      { question: '1.9 Personal Networking Effectiveness', answer: formData.netPersonalEffectiveness },
      { question: '1.9 Personal Networking Comments', answer: formData.netPersonalComments },

      { question: '2.1 Current Job Title', answer: formData.currentJobTitle },
      { question: '2.1 Company Name', answer: formData.companyName },
      { question: '2.1 Company Overview', answer: formData.companyOverview },
      { question: '2.1 Work Contact Information', answer: formData.workContact },
      { question: '2.1 Key Responsibilities', answer: formData.keyResponsibilities },
      { question: '2.1 Role Likes Top 3', answer: JSON.stringify(formData.roleLikesTop3) },
      { question: '2.1 Role Dislikes Top 3', answer: JSON.stringify(formData.roleDislikesTop3) },
      { question: '2.1 Role Purpose Alignment', answer: formData.rolePurposeAlignment },
      { question: '2.1 Satisfaction Current Role', answer: formData.satCurrentRole },
      { question: '2.1 Satisfaction Career Trajectory', answer: formData.satCareerTrajectory },
      { question: '2.1 Communication Style Rating', answer: formData.commStyle },
      { question: '2.1 Confidence Board of Directors', answer: formData.confBoard },
      { question: '2.1 Confidence Senior Leadership Team', answer: formData.confExecTeam },
      { question: '2.1 Confidence External Stakeholders', answer: formData.confStakeholders },
      { question: '2.1 Confidence Media', answer: formData.confMedia },
      { question: '2.1 Strongest Leadership Areas', answer: JSON.stringify(formData.strongestLeadershipAreas) },
      { question: '2.1 Coaching Primary Goals', answer: JSON.stringify(formData.coachingGoals) },
      { question: '2.1 Specific Issues to Address', answer: formData.specificIssuesToAddress },
      { question: '2.1 Role Comments', answer: formData.roleComments },

      { question: '2.2 Multi-Industry Experience List', answer: JSON.stringify(formData.workExperienceList) },

      { question: '2.3 Is Member Professional Associations', answer: formData.isMemberAssociations },
      { question: '2.3 Associations List', answer: JSON.stringify(formData.associationsList) },
      { question: '2.3 Has Strategic Partnerships & Alliances', answer: formData.hasStrategicAlliances },
      { question: '2.3 Alliances List', answer: JSON.stringify(formData.alliancesList) },

      { question: '2.4 Happy Overall Professional Life', answer: formData.happyProfessionalLife },
      { question: '2.4 Contributions Valued at Work', answer: formData.contributionsValued },
      { question: '2.4 Job Satisfaction Factors', answer: JSON.stringify(formData.jobSatisfactionFactors) },
      { question: '2.4 Job Satisfaction Other', answer: formData.jobSatisfactionOther },

      { question: '2.5 Professional Networking Comfort', answer: formData.netProfComfort },
      { question: '2.5 Professional Networking Career Importance', answer: formData.netProfCareerImportance },
      { question: '2.5 Professional Networking Org Importance', answer: formData.netProfOrgImportance },
      { question: '2.5 Professional Networking Effectiveness', answer: formData.netProfEffectiveness },
      { question: '2.5 Professional Networking Comments', answer: formData.netProfComments },

      { question: '2.6 Leadership Style Primary', answer: formData.leadershipStylePrimary },
      { question: '2.6 Leadership Style Other', answer: formData.leadershipStyleOther },
      { question: '2.6 Leadership Effectiveness Rating', answer: formData.leadershipEffectiveness },
      { question: '2.6 Good Leader Top 3 Traits', answer: JSON.stringify(formData.goodLeaderTraits) },
      { question: '2.6 Bad Leader Top 3 Traits', answer: JSON.stringify(formData.badLeaderTraits) },
      { question: '2.6 Leadership Comments', answer: formData.leadershipComments },

      { question: '2.7 Stakeholder Relationships Rating', answer: formData.satStakeholderRelations },
      { question: '2.7 Board Member Strength Rating', answer: formData.satBoardStrength },
      { question: '2.7 Conducts 360 Board Assessments', answer: formData.conducts360BoardAssessments },
      { question: '2.7 Board Comments', answer: formData.boardComments },

      { question: '2.8 Personal & Professional Aligned', answer: formData.personalProfAligned },
      { question: '2.8 Satisfaction Alignment', answer: formData.satPersonalProfAlignment },
      { question: '2.8 One Thing to Change or Improve', answer: formData.oneThingToChange },
      { question: '2.8 Certified Accurate', answer: formData.certifiedAccurate ? 'Yes' : 'No' },
      { question: '2.8 Signature Name', answer: formData.signatureName },
      { question: '2.8 Signature Date', answer: formData.signatureDate },
    ]

    onSave({
      id: 3,
      title: PERSONAL_PROFESSIONAL_ASSESSMENT_DATA.title,
      data: dataPayload,
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
                Assessment #3
              </span>
              <span className='text-xs text-white/70'>
                Client: <strong>{client?.clientName || 'Senior Executive'}</strong>
              </span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black text-white tracking-tight uppercase'>
              {PERSONAL_PROFESSIONAL_ASSESSMENT_DATA.title}
            </h2>
            <p className='text-xs sm:text-sm text-[#F6B72D] font-medium mt-1 font-exo'>
              {PERSONAL_PROFESSIONAL_ASSESSMENT_DATA.subtitle}
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
            onClick={() => setActiveTab('personal')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'personal'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className='w-4 h-4 text-rose-500' />
            Section 1: Personal Information (1.1 - 1.9)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('professional')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'professional'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className='w-4 h-4 text-sky-500' />
            Section 2: Professional Profile (2.1 - 2.7)
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('alignment')}
            className={`py-3 px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'alignment'
                ? 'border-[#F6B72D] text-black bg-gray-50 shadow-sm'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCheck className='w-4 h-4 text-emerald-500' />
            2.8 Final Reflection & Certification
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className='p-6 overflow-y-auto space-y-6 flex-1 font-exo bg-gray-50 text-gray-900'>
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className='space-y-6'>
              {/* Introduction Banner */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2'>
                <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b8800f]'>
                  <Sparkles className='w-4 h-4 text-[#F6B72D]' />
                  Executive Baseline & Confidentiality Commitment
                </div>
                <p className='text-xs sm:text-sm text-gray-700 leading-relaxed font-exo'>
                  {PERSONAL_PROFESSIONAL_ASSESSMENT_DATA.introduction}
                </p>
                <div className='p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900'>
                  <strong>Confidentiality Safeguard:</strong> {PERSONAL_PROFESSIONAL_ASSESSMENT_DATA.confidentialityNotice}
                </div>
              </div>

              {/* 1.1 Personal & Family Details */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    1.1
                  </span>
                  Personal & Family Details
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Full Name</label>
                    <input
                      type='text'
                      disabled={isReadOnly}
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Date of Birth</label>
                    <input
                      type='text'
                      placeholder='MM/DD/YYYY'
                      disabled={isReadOnly}
                      value={formData.dob}
                      onChange={(e) => handleFieldChange('dob', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Marital Status</label>
                    <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                      {['Single', 'Married', 'Divorced', 'Widowed', 'Other'].map((status) => (
                        <button
                          key={status}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('maritalStatus', status)}
                          className={`px-3 py-1.5 rounded-lg border font-semibold ${
                            formData.maritalStatus === status
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Number of Children & Ages</label>
                    <input
                      type='text'
                      placeholder='e.g., 2 children (Ages 12, 15)'
                      disabled={isReadOnly}
                      value={formData.numberOfChildren}
                      onChange={(e) => handleFieldChange('numberOfChildren', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Primary Residence</label>
                    <input
                      type='text'
                      placeholder='City, State, Country'
                      disabled={isReadOnly}
                      value={formData.primaryResidence}
                      onChange={(e) => handleFieldChange('primaryResidence', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Emergency Contact Name & Relationship</label>
                    <input
                      type='text'
                      placeholder='Name (Relationship)'
                      disabled={isReadOnly}
                      value={formData.emergencyContactName}
                      onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                </div>
              </div>

              {/* 1.2 Family & Friend Relationships */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    1.2
                  </span>
                  Family & Friend Relationships
                </h3>

                <div className='space-y-3.5'>
                  {[
                    { label: 'Quality of your marriage / partnership', field: 'satMarriage' },
                    { label: 'Quality of relationship with your children', field: 'satChildren' },
                    { label: 'Quality of extended family relationships', field: 'satExtendedFamily' },
                    { label: 'Quality of your friendships', field: 'satFriendships' },
                  ].map((item) => (
                    <div key={item.field} className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg'>
                      <span className='text-xs sm:text-sm font-bold text-gray-800'>{item.label}</span>
                      <div className='flex flex-wrap gap-1.5'>
                        {LIKERT_5_SATISFACTION.map((opt) => (
                          <button
                            key={opt}
                            type='button'
                            disabled={isReadOnly}
                            onClick={() => handleFieldChange(item.field, opt)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                              formData[item.field] === opt
                                ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1.3 Personal Beliefs & Values */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    1.3
                  </span>
                  Personal Beliefs & Values
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pb-2'>
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <p className='text-xs font-bold text-gray-800 mb-2'>
                      Do you have clearly defined personal core values that guide your life?
                    </p>
                    <div className='flex gap-2 text-xs'>
                      {['Yes', 'No', 'Do Not Know'].map((ans) => (
                        <button
                          key={ans}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('hasDefinedPersonalValues', ans)}
                          className={`px-3 py-1 rounded border font-bold ${
                            formData.hasDefinedPersonalValues === ans
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className='p-3 bg-gray-50 rounded-lg'>
                    <p className='text-xs font-bold text-gray-800 mb-2'>
                      Do you have clearly defined personal beliefs that guide your life?
                    </p>
                    <div className='flex gap-2 text-xs'>
                      {['Yes', 'No', 'Do Not Know'].map((ans) => (
                        <button
                          key={ans}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('hasDefinedPersonalBeliefs', ans)}
                          className={`px-3 py-1 rounded border font-bold ${
                            formData.hasDefinedPersonalBeliefs === ans
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className='text-xs font-bold text-gray-800 uppercase mb-2'>
                    Select your personal core values & beliefs (Select all that apply):
                  </p>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
                    {PERSONAL_CORE_VALUES_OPTIONS.map((val) => {
                      const isChecked = (formData.personalValuesSelected || []).includes(val.label)
                      return (
                        <button
                          key={val.label}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => toggleArrayItem('personalValuesSelected', val.label)}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                            isChecked
                              ? 'bg-[#F6B72D]/15 border-[#F6B72D] text-black'
                              : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={isChecked}
                            readOnly
                            className='mt-0.5 rounded text-[#F6B72D]'
                          />
                          <div>
                            <p className='text-xs font-bold text-gray-900'>{val.label}</p>
                            <p className='text-[10px] text-gray-500 leading-snug'>{val.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className='p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2'>
                  <p className='text-xs font-black text-amber-950 uppercase'>
                    Top 3 Personal Choices in Order of Importance:
                  </p>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type='text'
                        disabled={isReadOnly}
                        value={(formData.personalValuesTop3 || [])[idx] || ''}
                        onChange={(e) => handleArrayIdxChange('personalValuesTop3', idx, e.target.value)}
                        placeholder={`#${idx + 1} Priority Core Value...`}
                        className='w-full border border-gray-300 rounded-lg p-2 text-xs font-sans bg-white'
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 1.4 Professional Beliefs & Values */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    1.4
                  </span>
                  Professional Beliefs & Values
                </h3>

                <div>
                  <p className='text-xs font-bold text-gray-800 uppercase mb-2'>
                    Select your professional core values & beliefs (Select all that apply):
                  </p>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
                    {PROFESSIONAL_CORE_VALUES_OPTIONS.map((val) => {
                      const isChecked = (formData.profValuesSelected || []).includes(val.label)
                      return (
                        <button
                          key={val.label}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => toggleArrayItem('profValuesSelected', val.label)}
                          className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2 ${
                            isChecked
                              ? 'bg-[#F6B72D]/15 border-[#F6B72D] text-black'
                              : 'bg-gray-50/70 border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type='checkbox'
                            checked={isChecked}
                            readOnly
                            className='mt-0.5 rounded text-[#F6B72D]'
                          />
                          <div>
                            <p className='text-xs font-bold text-gray-900'>{val.label}</p>
                            <p className='text-[10px] text-gray-500 leading-snug'>{val.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className='p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2'>
                  <p className='text-xs font-black text-amber-950 uppercase'>
                    Top 3 Professional Choices in Order of Importance:
                  </p>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type='text'
                        disabled={isReadOnly}
                        value={(formData.profValuesTop3 || [])[idx] || ''}
                        onChange={(e) => handleArrayIdxChange('profValuesTop3', idx, e.target.value)}
                        placeholder={`#${idx + 1} Professional Priority...`}
                        className='w-full border border-gray-300 rounded-lg p-2 text-xs font-sans bg-white'
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 1.7 Work-Life Balance % Allocation */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <div className='border-b pb-2 flex items-center justify-between'>
                  <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 flex items-center gap-2'>
                    <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                      1.7
                    </span>
                    Work-Life Balance Weekly Allocation (%)
                  </h3>
                  <span className={`text-xs font-black px-2.5 py-1 rounded ${
                    calculatedTotalPercent === 100
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Total: {calculatedTotalPercent}% {calculatedTotalPercent === 100 ? '✅ Balanced' : '(Target: 100%)'}
                  </span>
                </div>

                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
                  {[
                    { label: 'Work', field: 'timeWork' },
                    { label: 'Family', field: 'timeFamily' },
                    { label: 'Friends', field: 'timeFriends' },
                    { label: 'Personal Dev', field: 'timePersonalDev' },
                    { label: 'Leisure / Social', field: 'timeLeisure' },
                    { label: 'Community', field: 'timeCommunity' },
                  ].map((item) => (
                    <div key={item.field} className='p-3 bg-gray-50 rounded-lg text-center'>
                      <label className='block text-[11px] font-bold text-gray-700 uppercase mb-1'>{item.label}</label>
                      <div className='flex items-center justify-center gap-1'>
                        <input
                          type='number'
                          disabled={isReadOnly}
                          value={formData[item.field]}
                          onChange={(e) => handleFieldChange(item.field, e.target.value)}
                          className='w-16 border border-gray-300 rounded text-center text-sm font-black p-1 bg-white'
                        />
                        <span className='text-xs font-bold text-gray-500'>%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                  <span className='text-xs font-bold text-gray-800'>Current satisfaction with work-life balance:</span>
                  <div className='flex flex-wrap gap-1.5'>
                    {LIKERT_5_SATISFACTION.map((opt) => (
                      <button
                        key={opt}
                        type='button'
                        disabled={isReadOnly}
                        onClick={() => handleFieldChange('satWorkLifeBalance', opt)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                          formData.satWorkLifeBalance === opt
                            ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1.8 Happiness Likert Breakdown */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    1.8
                  </span>
                  Personal Happiness Assessment
                </h3>

                <div className='space-y-3'>
                  {[
                    { label: 'Family Life', field: 'happyFamily' },
                    { label: 'Personal Health & Well-being', field: 'happyHealth' },
                    { label: 'Social Connections', field: 'happySocial' },
                    { label: 'Financial Security', field: 'happyFinancial' },
                  ].map((item) => (
                    <div key={item.field} className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg'>
                      <span className='text-xs sm:text-sm font-bold text-gray-800'>{item.label}</span>
                      <div className='flex flex-wrap gap-1.5'>
                        {LIKERT_5_HAPPINESS.map((opt) => (
                          <button
                            key={opt}
                            type='button'
                            disabled={isReadOnly}
                            onClick={() => handleFieldChange(item.field, opt)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                              formData[item.field] === opt
                                ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                                : 'bg-white text-gray-600 border-gray-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFESSIONAL PROFILE */}
          {activeTab === 'professional' && (
            <div className='space-y-6'>
              {/* 2.1 Current Professional Role */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    2.1
                  </span>
                  Current Professional Role
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Current Job Title</label>
                    <input
                      type='text'
                      disabled={isReadOnly}
                      value={formData.currentJobTitle}
                      onChange={(e) => handleFieldChange('currentJobTitle', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Company Name</label>
                    <input
                      type='text'
                      disabled={isReadOnly}
                      value={formData.companyName}
                      onChange={(e) => handleFieldChange('companyName', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Company Overview (Industry, Company Type, Size)</label>
                    <input
                      type='text'
                      disabled={isReadOnly}
                      value={formData.companyOverview}
                      onChange={(e) => handleFieldChange('companyOverview', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                  <div className='md:col-span-2'>
                    <label className='block text-xs font-bold text-gray-700 uppercase'>Current Key Responsibilities</label>
                    <textarea
                      rows={2}
                      disabled={isReadOnly}
                      value={formData.keyResponsibilities}
                      onChange={(e) => handleFieldChange('keyResponsibilities', e.target.value)}
                      className='mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm font-sans'
                    />
                  </div>
                </div>

                {/* Audience Speaking Confidence */}
                <div className='pt-2 space-y-2.5'>
                  <p className='text-xs font-bold uppercase tracking-wider text-gray-800'>Speaking Confidence by Audience:</p>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {[
                      { label: 'Board of Directors', field: 'confBoard' },
                      { label: 'Senior Leadership Team', field: 'confExecTeam' },
                      { label: 'External Stakeholders', field: 'confStakeholders' },
                      { label: 'Media', field: 'confMedia' },
                    ].map((aud) => (
                      <div key={aud.field} className='p-3 bg-gray-50 rounded-lg flex items-center justify-between'>
                        <span className='text-xs font-bold text-gray-700'>{aud.label}</span>
                        <div className='flex gap-1'>
                          {LIKERT_5_COMMUNICATION.map((opt) => (
                            <button
                              key={opt}
                              type='button'
                              disabled={isReadOnly}
                              onClick={() => handleFieldChange(aud.field, opt)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                formData[aud.field] === opt
                                  ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                                  : 'bg-white text-gray-600 border-gray-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2.2 Multi-Industry Work Experience */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <div className='border-b pb-2 flex items-center justify-between'>
                  <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 flex items-center gap-2'>
                    <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                      2.2
                    </span>
                    Multi-Industry Work Experience
                  </h3>
                  {!isReadOnly && (
                    <button
                      type='button'
                      onClick={addExperienceRow}
                      className='inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold'
                    >
                      <Plus className='w-3.5 h-3.5' /> Add Role
                    </button>
                  )}
                </div>

                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-gray-100 uppercase text-gray-700 font-bold'>
                      <tr>
                        <th className='p-2.5'>Position</th>
                        <th className='p-2.5'>Company</th>
                        <th className='p-2.5'>Industry</th>
                        <th className='p-2.5'>Years</th>
                        {!isReadOnly && <th className='p-2.5 w-10'>Action</th>}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {(formData.workExperienceList || []).map((exp, idx) => (
                        <tr key={idx} className='hover:bg-gray-50/50'>
                          <td className='p-2'>
                            <input
                              type='text'
                              disabled={isReadOnly}
                              value={exp.position || ''}
                              onChange={(e) => handleExperienceRowChange(idx, 'position', e.target.value)}
                              placeholder='e.g., VP Operations'
                              className='w-full border border-gray-300 rounded p-1.5 text-xs bg-white'
                            />
                          </td>
                          <td className='p-2'>
                            <input
                              type='text'
                              disabled={isReadOnly}
                              value={exp.company || ''}
                              onChange={(e) => handleExperienceRowChange(idx, 'company', e.target.value)}
                              placeholder='e.g., Global Corp'
                              className='w-full border border-gray-300 rounded p-1.5 text-xs bg-white'
                            />
                          </td>
                          <td className='p-2'>
                            <input
                              type='text'
                              disabled={isReadOnly}
                              value={exp.industry || ''}
                              onChange={(e) => handleExperienceRowChange(idx, 'industry', e.target.value)}
                              placeholder='e.g., Fintech'
                              className='w-full border border-gray-300 rounded p-1.5 text-xs bg-white'
                            />
                          </td>
                          <td className='p-2'>
                            <input
                              type='text'
                              disabled={isReadOnly}
                              value={exp.years || ''}
                              onChange={(e) => handleExperienceRowChange(idx, 'years', e.target.value)}
                              placeholder='e.g., 5 Yrs'
                              className='w-full border border-gray-300 rounded p-1.5 text-xs bg-white'
                            />
                          </td>
                          {!isReadOnly && (
                            <td className='p-2 text-center'>
                              <button
                                type='button'
                                onClick={() => removeExperienceRow(idx)}
                                className='text-red-500 hover:text-red-700 p-1'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2.6 Leadership Style Archetypes */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    2.6
                  </span>
                  Leadership Style & Effectiveness
                </h3>

                <div>
                  <label className='block text-xs font-bold text-gray-700 uppercase mb-2'>
                    Primary Leadership Style:
                  </label>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
                    {LEADERSHIP_STYLE_ARCHETYPES.map((arch) => {
                      const isSelected = formData.leadershipStylePrimary === arch.name
                      return (
                        <button
                          key={arch.name}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('leadershipStylePrimary', arch.name)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-[#F6B72D]/15 border-[#F6B72D] text-black font-black ring-1 ring-[#F6B72D]'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <p className='text-xs font-bold text-gray-900'>{arch.name}</p>
                          <p className='text-[10px] text-gray-500 leading-snug mt-0.5'>{arch.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                  <div className='p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200'>
                    <p className='text-xs font-black text-emerald-900 uppercase'>Top 3 Traits of a GOOD Leader:</p>
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type='text'
                        disabled={isReadOnly}
                        value={(formData.goodLeaderTraits || [])[idx] || ''}
                        onChange={(e) => handleArrayIdxChange('goodLeaderTraits', idx, e.target.value)}
                        placeholder={`#${idx + 1} Good Leader Trait...`}
                        className='w-full border border-gray-300 rounded-lg p-2 text-xs font-sans bg-white'
                      />
                    ))}
                  </div>
                  <div className='p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200'>
                    <p className='text-xs font-black text-rose-900 uppercase'>Top 3 Traits of a BAD Leader:</p>
                    {[0, 1, 2].map((idx) => (
                      <input
                        key={idx}
                        type='text'
                        disabled={isReadOnly}
                        value={(formData.badLeaderTraits || [])[idx] || ''}
                        onChange={(e) => handleArrayIdxChange('badLeaderTraits', idx, e.target.value)}
                        placeholder={`#${idx + 1} Bad Leader Trait...`}
                        className='w-full border border-gray-300 rounded-lg p-2 text-xs font-sans bg-white'
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 2.7 Board & Stakeholder Relations */}
              <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4'>
                <h3 className='text-sm sm:text-base font-black uppercase text-gray-900 border-b pb-2 flex items-center gap-2'>
                  <span className='w-6 h-6 rounded-full bg-[#F6B72D] text-black text-xs font-black flex items-center justify-center'>
                    2.7
                  </span>
                  Stakeholder & Board Relationships
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='p-3 bg-gray-50 rounded-lg space-y-2'>
                    <span className='text-xs font-bold text-gray-800 block'>
                      Relationship with all internal and external board members and stakeholders:
                    </span>
                    <div className='flex flex-wrap gap-1'>
                      {LIKERT_5_COMMUNICATION.map((opt) => (
                        <button
                          key={opt}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('satStakeholderRelations', opt)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                            formData.satStakeholderRelations === opt
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='p-3 bg-gray-50 rounded-lg space-y-2'>
                    <span className='text-xs font-bold text-gray-800 block'>
                      Do you conduct regular 360-degree Board Members position effectiveness assessments?
                    </span>
                    <div className='flex gap-2'>
                      {['Yes', 'No', 'Do Not Know'].map((ans) => (
                        <button
                          key={ans}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('conducts360BoardAssessments', ans)}
                          className={`px-3 py-1 rounded text-xs font-bold border ${
                            formData.conducts360BoardAssessments === ans
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINAL REFLECTION & SUBMISSION */}
          {activeTab === 'alignment' && (
            <div className='space-y-6'>
              <div className='bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5'>
                <h3 className='text-base sm:text-lg font-black uppercase text-gray-900 border-b pb-3 flex items-center gap-2'>
                  <span className='w-7 h-7 rounded-full bg-[#F6B72D] text-black text-sm font-black flex items-center justify-center'>
                    2.8
                  </span>
                  Final Alignment Reflection & Digital Certification
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <div className='p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200'>
                    <span className='text-xs font-bold text-gray-800 block'>
                      Do you feel your personal and professional lives are well aligned?
                    </span>
                    <div className='flex gap-2 text-xs'>
                      {['Yes', 'No', 'Do Not Know'].map((ans) => (
                        <button
                          key={ans}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('personalProfAligned', ans)}
                          className={`px-3 py-1 rounded border font-bold ${
                            formData.personalProfAligned === ans
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-200'>
                    <span className='text-xs font-bold text-gray-800 block'>
                      How satisfied are you with this alignment?
                    </span>
                    <div className='flex flex-wrap gap-1.5'>
                      {LIKERT_5_SATISFACTION.map((opt) => (
                        <button
                          key={opt}
                          type='button'
                          disabled={isReadOnly}
                          onClick={() => handleFieldChange('satPersonalProfAlignment', opt)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                            formData.satPersonalProfAlignment === opt
                              ? 'bg-[#F6B72D] text-black border-[#d99f1b]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-gray-800 uppercase mb-1'>
                    What is the one thing you would most like to change or improve?
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={formData.oneThingToChange}
                    onChange={(e) => handleFieldChange('oneThingToChange', e.target.value)}
                    placeholder='Enter your primary personal or professional transformation priority...'
                    className='w-full border border-gray-300 rounded-lg p-3 text-sm font-sans'
                  />
                </div>

                <div className='p-5 bg-amber-50 rounded-xl border border-amber-200 space-y-3'>
                  <label className='flex items-start gap-3 cursor-pointer select-none'>
                    <input
                      type='checkbox'
                      disabled={isReadOnly}
                      checked={formData.certifiedAccurate}
                      onChange={(e) => handleFieldChange('certifiedAccurate', e.target.checked)}
                      className='mt-1 rounded text-[#F6B72D] focus:ring-[#F6B72D]'
                    />
                    <div className='text-xs text-amber-950 font-medium leading-relaxed'>
                      <strong>Final Certification:</strong> I certify that all personal and professional information provided in this assessment is accurate and complete to the best of my knowledge, providing a trustworthy foundation for my executive coaching program.
                    </div>
                  </label>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200/60'>
                    <div>
                      <span className='block text-[10px] font-bold uppercase text-gray-600'>Executive Digital Signature</span>
                      <input
                        type='text'
                        disabled={isReadOnly}
                        value={formData.signatureName}
                        onChange={(e) => handleFieldChange('signatureName', e.target.value)}
                        className='mt-1 w-full border border-amber-300 rounded p-2 text-xs bg-white font-sans'
                      />
                    </div>
                    <div>
                      <span className='block text-[10px] font-bold uppercase text-gray-600'>Date</span>
                      <input
                        type='text'
                        disabled={isReadOnly}
                        value={formData.signatureDate}
                        onChange={(e) => handleFieldChange('signatureDate', e.target.value)}
                        className='mt-1 w-full border border-amber-300 rounded p-2 text-xs bg-white font-sans'
                      />
                    </div>
                  </div>
                </div>

                <div className='p-4 bg-slate-900 text-white rounded-xl text-xs leading-relaxed font-exo'>
                  {PERSONAL_PROFESSIONAL_ASSESSMENT_DATA.closingNotice}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className='bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 text-xs font-semibold text-gray-600'>
            <span>Sections: 1. Personal Details • 2. Professional Profile • 2.8 Final Certification</span>
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

