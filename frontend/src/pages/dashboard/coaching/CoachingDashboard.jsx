import { useState, useEffect, useMemo, useCallback } from 'react'
import { MetricCard } from '@/components/MetricCard'
import authService from '@/services/authService'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { getAssetUrl } from '@/lib/utils'
import {
  CalendarDays,
  LogOut,
  MessageSquare,
  NotebookText,
  Play,
  Save,
  Users,
  FileText,
  ExternalLink,
  X,
  CheckCircle2,
  Clock,
  Edit3,
  FileDown,
  AlertCircle,
  Sparkles,
  Target,
} from 'lucide-react'
import { FormAnswersCard } from '@/components/FormAnswersCard'
import { QuestionnaireProgressCard } from '@/components/QuestionnaireProgressCard'
import { URLS } from '@/config/urls'
import MbtiAssessmentModal from './MbtiAssessmentModal'
import SkillsAssessmentModal from './SkillsAssessmentModal'
import PersonalProfessionalAssessmentModal from './PersonalProfessionalAssessmentModal'
import LeadershipCompetenciesAssessmentModal from './LeadershipCompetenciesAssessmentModal'
import GlobalIndustryAssessmentModal from './GlobalIndustryAssessmentModal'
import BigFiveAssessmentModal from './BigFiveAssessmentModal'
import { MBTI_ASSESSMENT_DATA } from '@/data/mbtiAssessmentData'
import { SKILLS_ASSESSMENT_DATA, getAllSkillsList } from '@/data/skillsAssessmentData'
import { PERSONAL_PROFESSIONAL_ASSESSMENT_DATA } from '@/data/personalProfessionalAssessmentData'
import { LEADERSHIP_COMPETENCIES_DATA, getAllCompetencySkills } from '@/data/leadershipCompetenciesAssessmentData'
import { GLOBAL_INDUSTRY_DATA, getAllIndustryCategories } from '@/data/globalIndustryAssessmentData'
import { BIG_FIVE_ASSESSMENT_DATA } from '@/data/bigFiveAssessmentData'

const PAGE_SIZE = 8
const HERO_TAGLINE_OUTLINE = {
  WebkitTextStroke: '1px rgba(0, 0, 0, 0.75)',
  paintOrder: 'stroke fill',
}

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const uniqueNames = (values) =>
  values
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value, idx, arr) => arr.indexOf(value) === idx)

const extractPersonNames = (value) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractPersonNames(item))
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }
  if (typeof value === 'object') {
    const directName = value.name || value.full_name || value.fullName
    if (directName) return [String(directName).trim()]
    const joinedName = `${value.first_name || ''} ${value.last_name || ''}`.trim()
    if (joinedName) return [joinedName]
    if (value.username) return [String(value.username).trim()]
  }
  return []
}

const formatDate = (dateString) => {
  if (!dateString) return 'TBD'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const SIX_CORE_ASSESSMENTS = [
  {
    id: 1,
    title: 'MBTI – MEYERS-BRIGGS PERSONALITY PROFILE ASSESSMENT 1',
    description:
      'Executive Leader Personality Profile (ELPP) based on Myers-Briggs typology: Energy, Information, Decisions, and Work Style.',
    defaultQuestions: MBTI_ASSESSMENT_DATA.sections
      .flatMap((s) => s.questions)
      .map((q) => `${q.id}. ${q.prompt}`),
  },
  {
    id: 2,
    title: 'Senior Executive Leader Soft & Hard Skills Assessment',
    description:
      'Cumulative evaluation across 46 executive competencies: Soft Skills (Leadership, Strategic Thinking, Communication, EQ) and Hard Skills (Financial Acumen, Operations, AI/Tech, Governance, Market Dev).',
    defaultQuestions: getAllSkillsList().map(
      (s) => `${s.id}. [${s.competency}] ${s.text}`,
    ),
  },
  {
    id: 3,
    title: 'Executive Leader: Client Personal & Professional Assessment',
    description:
      '360-degree baseline evaluation of personal values, professional beliefs, work-life balance, career trajectory, leadership style, and board relations.',
    defaultQuestions: [
      '1.1 Personal & Family Details',
      '1.2 Family & Friend Relationships',
      '1.3 Personal Beliefs & Values',
      '1.4 Professional Beliefs & Values',
      '1.5 Likes & Dislikes',
      '1.6 Hobbies & Interests',
      '1.7 Work-Life Balance (%)',
      '1.8 Personal Happiness Assessment',
      '1.9 Interpersonal & Community Networking',
      '2.1 Current Professional Role & Speaking Confidence',
      '2.2 Multi-Industry Work Experience',
      '2.3 Strategic Associations & Alliances',
      '2.4 Professional Happiness & Job Satisfaction',
      '2.5 Professional Networking',
      '2.6 Leadership Style Archetypes & Traits',
      '2.7 Stakeholder & Board Relationships',
      '2.8 Final Reflection & Certification',
    ],
  },
  {
    id: 4,
    title: 'Senior Executive Leadership Core Competencies Assessment',
    description:
      'Synthesized Multi-Framework Diagnostic (OPM ECQ, Korn Ferry, Wharton, OLLU) across 38 competencies in 6 domains.',
    defaultQuestions: getAllCompetencySkills().map(
      (s) => `${s.id}. [${s.domainTitle}] ${s.text}`,
    ),
  },
  {
    id: 5,
    title: 'Global Industry Experience Assessment',
    description:
      'Quantitative & sectoral mapping of executive breadth, functional depth, and cross-industry experience across 18 core and specialized industries.',
    defaultQuestions: getAllIndustryCategories().map(
      (c) => `${c.id}. ${c.name} (${c.type})`,
    ),
  },
  {
    id: 6,
    title: "The Senior Leader's Big 5 Personality Profile Assessment",
    description:
      'Scientifically validated OCEAN diagnostic: Openness, Conscientiousness, Extraversion, Agreeableness, and Emotional Stability for executive optimization.',
    defaultQuestions: BIG_FIVE_ASSESSMENT_DATA.statements.map(
      (s) => `${s.id}. ${s.text}`,
    ),
  },
]

export default function CoachingDashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [upcomingMeetings, setUpcomingMeetings] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [programs, setPrograms] = useState([])
  const [allPrograms, setAllPrograms] = useState([])
  const [activeProgramId, setActiveProgramId] = useState(null)
  const [activeProgramModules, setActiveProgramModules] = useState([])
  const [notes, setNotes] = useState('')
  const [notesSavedAt, setNotesSavedAt] = useState(null)
  const [assignedClients, setAssignedClients] = useState([])
  const [selectedClientForAssessment, setSelectedClientForAssessment] = useState(null)
  const [clientAssessmentDetails, setClientAssessmentDetails] = useState(null)
  const [loadingAssessmentDetails, setLoadingAssessmentDetails] = useState(false)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [selectedClientAssessments, setSelectedClientAssessments] = useState([])
  const [activeEditingAssessment, setActiveEditingAssessment] = useState(null)
  const [isSavingAssessment, setIsSavingAssessment] = useState(false)
  const [viewingSingleAssessment, setViewingSingleAssessment] = useState(null)

  const downloadFile = useCallback(async (file) => {
    const fileUrl = getAssetUrl(file?.fileUrl || file?.url || file?.file)
    if (!fileUrl) return

    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download =
        file?.title || file?.name || fileUrl.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.error('Failed to download file directly:', error)
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleModuleDownload = useCallback(
    async (module) => {
      const moduleFiles = Array.isArray(module?.files) ? module.files : []
      if (!moduleFiles.length) return

      for (const file of moduleFiles) {
        await downloadFile(file)
      }
    },
    [downloadFile],
  )

  const mergeCalendarMonths = (...calendarResponses) => {
    return calendarResponses.reduce((merged, response) => {
      const calendar = response?.meetings || response
      if (!calendar || typeof calendar !== 'object') return merged

      Object.entries(calendar).forEach(([date, meetings]) => {
        const normalizedMeetings = Array.isArray(meetings) ? meetings : []
        merged[date] = [...(merged[date] || []), ...normalizedMeetings]
      })

      return merged
    }, {})
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const [
          response,
          calendarThisMonth,
          calendarNextMonth,
          allProgramsResponse,
          coachingClientsResponse,
        ] = await Promise.all([
          authService.getCoachingDashboard(),
          authService.getCoachingCalendar({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
          authService.getCoachingCalendar({
            year: nextMonth.getFullYear(),
            month: nextMonth.getMonth() + 1,
          }),
          authService.getAllPrograms(),
          authService.getCoachingClients().catch(() => ({ clients: [] })),
        ])
        setDashboardData(response)
        const clientList = Array.isArray(coachingClientsResponse?.clients)
          ? coachingClientsResponse.clients
          : []
        setAssignedClients(clientList)
        const mergedCalendar = mergeCalendarMonths(
          calendarThisMonth,
          calendarNextMonth,
        )
        const meetingsList = extractUpcomingMeetings(mergedCalendar)
        setUpcomingMeetings(meetingsList)
        const allProgramsList =
          allProgramsResponse?.programs || allProgramsResponse || []
        setAllPrograms(allProgramsList)

        const mergedPrograms = mergePrograms(
          response?.programs,
          response?.clients,
          mergedCalendar,
        )
        const sortedPrograms = sortProgramsByEnrollment(mergedPrograms)
        setPrograms(sortedPrograms)
        const fallbackPrograms = sortedPrograms.length
          ? sortedPrograms
          : allProgramsList
        setActiveProgramId(
          fallbackPrograms[0]?.id ?? fallbackPrograms[0]?.uuid ?? null,
        )
        setCurrentPage(1)
      } catch (error) {
        console.error('Failed to fetch coaching dashboard data:', error)
        toast.error('Failed to load dashboard data')
        setPrograms([])
        setAllPrograms([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const extractUpcomingMeetings = (calendarData) => {
    const calendar = calendarData?.meetings || calendarData
    if (!calendar || typeof calendar !== 'object') return []

    const toDateTime = (dateString, timeString) => {
      if (!dateString) return null
      if (!timeString) return new Date(dateString)
      const [time, meridian] = timeString.split(' ')
      const [rawHours, rawMinutes] = (time || '').split(':')
      if (!rawHours) return new Date(dateString)
      let hours = parseInt(rawHours, 10)
      const minutes = parseInt(rawMinutes || '0', 10)
      const meridianLower = (meridian || '').toLowerCase()
      if (meridianLower === 'pm' && hours < 12) hours += 12
      if (meridianLower === 'am' && hours === 12) hours = 0
      const isoTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
      return new Date(`${dateString}T${isoTime}`)
    }

    const flattened = Object.entries(calendar).flatMap(([date, meetings]) =>
      (meetings || []).map((meeting) => ({
        ...meeting,
        date,
        dateTime: toDateTime(date, meeting.time),
      })),
    )

    return flattened
      .filter((meeting) => meeting.dateTime)
      .sort((a, b) => b.dateTime - a.dateTime)
  }

  const extractProgramsFromCalendar = (calendarData) => {
    const calendar = calendarData?.meetings || calendarData
    if (!calendar || typeof calendar !== 'object') return []

    return Object.values(calendar)
      .flatMap((list) => list || [])
      .map((meeting) => ({
        id:
          meeting.programId ||
          meeting.program_id ||
          meeting.serviceId ||
          meeting.service_id ||
          meeting.program ||
          meeting.title,
        name:
          meeting.program || meeting.programName || meeting.title || 'Program',
        clientName: meeting.clientName,
        enrolledOn: meeting.enrolledOn || meeting.enrolled_on,
      }))
      .filter((p) => p.id || p.name)
  }

  const mergePrograms = (programArray, clientsArray, calendarData) => {
    const fromPrograms = programArray || []
    const fromClients = (clientsArray || []).flatMap((client) =>
      (client.programs || []).map((program) => ({
        ...program,
        clientName:
          client.name ||
          `${client.first_name || ''} ${client.last_name || ''}`.trim(),
      })),
    )
    const fromCalendar = extractProgramsFromCalendar(calendarData)
    const merged = [...fromPrograms, ...fromClients, ...fromCalendar]
    const unique = []
    const seen = new Set()

    merged.forEach((program) => {
      const key = program.id ? `id-${program.id}` : `name-${program.name}`
      if (!key || seen.has(key)) return
      seen.add(key)
      unique.push(program)
    })

    return unique
  }

  const sortProgramsByEnrollment = (programList) => {
    return [...(programList || [])].sort((a, b) => {
      const aDate = new Date(a?.enrolledOn || a?.enrolled_on || 0)
      const bDate = new Date(b?.enrolledOn || b?.enrolled_on || 0)
      return bDate - aDate
    })
  }

  const belongsToProgram = (meeting, program) => {
    if (!program) return false
    const programId = program.id?.toString()
    const programName = program.name
    const candidateIds = [
      meeting.programId,
      meeting.program_id,
      meeting.serviceId,
      meeting.service_id,
    ]
      .filter(Boolean)
      .map((id) => id.toString())

    if (programId && candidateIds.includes(programId)) return true

    const candidateNames = [
      meeting.program,
      meeting.programName,
      meeting.title,
      meeting.name,
    ].filter(Boolean)

    return programName && candidateNames.some((n) => n === programName)
  }

  const selectablePrograms = useMemo(() => {
    const sourcePrograms = programs.length ? programs : allPrograms
    const uniquePrograms = []
    const seen = new Set()

    sourcePrograms.forEach((program) => {
      const programId = program?.id || program?.uuid
      const programName = program?.name || program?.title || 'Program'
      const dedupeKey = programId
        ? `id-${String(programId)}`
        : `name-${normalizeText(programName)}`
      if (!dedupeKey || seen.has(dedupeKey)) return
      seen.add(dedupeKey)
      uniquePrograms.push({
        ...program,
        id: programId || dedupeKey,
        name: programName,
      })
    })

    return uniquePrograms
  }, [allPrograms, programs])

  const activeProgram = useMemo(() => {
    if (!selectablePrograms.length) return null
    if (activeProgramId === null) return selectablePrograms[0]
    return (
      selectablePrograms.find(
        (program) => String(program.id) === String(activeProgramId),
      ) || selectablePrograms[0]
    )
  }, [activeProgramId, selectablePrograms])

  useEffect(() => {
    if (!selectablePrograms.length) {
      if (activeProgramId !== null) setActiveProgramId(null)
      return
    }
    const selectedExists = selectablePrograms.some(
      (program) => String(program.id) === String(activeProgramId),
    )
    if (!selectedExists) {
      setActiveProgramId(selectablePrograms[0].id)
    }
  }, [activeProgramId, selectablePrograms])

  const extractModulesFromProgram = (program) => {
    if (!program) return []
    const modules =
      program.modules ||
      program.chapters ||
      program.lessons ||
      program.sections ||
      program.program_chapters ||
      []
    return Array.isArray(modules) ? modules : []
  }

  useEffect(() => {
    setActiveProgramModules(extractModulesFromProgram(activeProgram))
  }, [activeProgram])

  const sessionsForActiveProgram = useMemo(() => {
    if (!upcomingMeetings.length) return []
    if (!activeProgram) return upcomingMeetings
    const filtered = upcomingMeetings.filter((meeting) =>
      belongsToProgram(meeting, activeProgram),
    )
    return filtered.length ? filtered : upcomingMeetings
  }, [activeProgram, upcomingMeetings])

  const nextMeeting = useMemo(() => {
    const sorted = [...sessionsForActiveProgram].sort(
      (a, b) => a.dateTime - b.dateTime,
    )
    if (sorted.length) return sorted[0]
    return [...upcomingMeetings].sort((a, b) => a.dateTime - b.dateTime)[0]
  }, [sessionsForActiveProgram, upcomingMeetings])

  const totalPages = Math.max(1, Math.ceil(upcomingMeetings.length / PAGE_SIZE))
  const paginatedMeetings = upcomingMeetings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const coachingInfluencersDisplay = useMemo(() => {
    const merged = [
      ...extractPersonNames(activeProgram?.assignedAdvisors),
      ...extractPersonNames(activeProgram?.coachingInfluencers),
      ...extractPersonNames(dashboardData?.coachingInfluencers),
      ...extractPersonNames(dashboardData?.coaching_influencers),
      ...extractPersonNames(dashboardData?.advisors),
      ...sessionsForActiveProgram.flatMap((meeting) =>
        extractPersonNames(meeting?.advisor || meeting?.otherTrainers),
      ),
    ]
    const normalized = uniqueNames(merged)
    return normalized.length ? normalized.join(' & ') : '—'
  }, [activeProgram, dashboardData, sessionsForActiveProgram])

  const salesInfluencerDisplay = useMemo(() => {
    const merged = [
      ...extractPersonNames(activeProgram?.salesInfluencer),
      ...extractPersonNames(activeProgram?.sales_influencer),
      ...extractPersonNames(activeProgram?.salesAdvisor),
      ...extractPersonNames(activeProgram?.sales_advisor),
      ...extractPersonNames(dashboardData?.salesInfluencer),
      ...extractPersonNames(dashboardData?.sales_influencer),
      ...extractPersonNames(dashboardData?.salesAdvisor),
      ...extractPersonNames(dashboardData?.sales_advisor),
      ...extractPersonNames(dashboardData?.salesInfluencers),
    ]
    const normalized = uniqueNames(merged)
    return normalized[0] || '—'
  }, [activeProgram, dashboardData])

  const activeProgramContent = useMemo(() => {
    if (activeProgramModules.length) {
      return activeProgramModules.slice(0, 12).map((module, idx) => ({
        type: 'module',
        files: Array.isArray(module?.files) ? module.files : [],
        title:
          module?.title ||
          module?.name ||
          module?.chapter_title ||
          module?.subtitle ||
          `Module ${idx + 1}`,
        subtitle:
          module?.shortDescription ||
          module?.short_description ||
          module?.description ||
          module?.content ||
          null,
      }))
    }

    const details = [
      { label: 'Program', value: activeProgram?.name || activeProgram?.title },
      { label: 'Client', value: activeProgram?.clientName || activeProgram?.client },
      { label: 'Status', value: activeProgram?.status },
      {
        label: 'Enrollment',
        value: formatDate(activeProgram?.enrolledOn || activeProgram?.enrolled_on),
      },
      { label: 'Sales Influencer', value: salesInfluencerDisplay },
      { label: 'Coaching Influencers', value: coachingInfluencersDisplay },
    ]

    return details
      .filter(
        (item) =>
          item.value !== undefined &&
          item.value !== null &&
          `${item.value}` !== '' &&
          `${item.value}` !== 'TBD',
      )
      .slice(0, 12)
      .map((item) => ({
        type: 'detail',
        title: item.label,
        subtitle: String(item.value),
      }))
  }, [
    activeProgram,
    activeProgramModules,
    coachingInfluencersDisplay,
    salesInfluencerDisplay,
  ])

  const loadNotes = (program) => {
    try {
      const raw = localStorage.getItem('coaching_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      return parsed[key] || ''
    } catch (err) {
      console.warn('Unable to read coaching notes from storage', err)
      return ''
    }
  }

  const saveNotes = (program, value) => {
    try {
      const raw = localStorage.getItem('coaching_notes_v1')
      const parsed = raw ? JSON.parse(raw) : {}
      const key = `notes-${program?.id || 'global'}`
      parsed[key] = value
      localStorage.setItem('coaching_notes_v1', JSON.stringify(parsed))
      setNotesSavedAt(new Date())
    } catch (err) {
      console.warn('Unable to save coaching notes', err)
    }
  }

  useEffect(() => {
    setNotes(loadNotes(activeProgram))
  }, [activeProgram])

  const clientsAssigned = dashboardData?.clientsAssigned ?? 24
  const clientsMeetingToday = dashboardData?.clientsMeetingToday ?? 1
  const activeClientId =
    activeProgram?.clientId || activeProgram?.client_id || null
  const activeClientLink = activeClientId
    ? `/coaching-dashboard/clients/${activeClientId}`
    : URLS.coaching.clients

  const currentAssessmentClient = useMemo(() => {
    if (selectedClientForAssessment) return selectedClientForAssessment
    if (activeClientId) {
      const match = assignedClients.find(
        (c) => String(c.clientID) === String(activeClientId),
      )
      if (match) return match
      return {
        clientID: activeClientId,
        clientName: activeProgram?.clientName || 'Assigned Client',
        completedAssessments: null,
      }
    }
    return assignedClients[0] || null
  }, [activeClientId, activeProgram, assignedClients, selectedClientForAssessment])

  // Load assessments whenever selected client changes
  useEffect(() => {
    const fetchAssessmentsForClient = async () => {
      if (!currentAssessmentClient?.clientID) {
        setSelectedClientAssessments(
          SIX_CORE_ASSESSMENTS.map((a) => ({
            ...a,
            completed: false,
            answeredCount: 0,
            totalQuestions: a.defaultQuestions.length,
            data: a.defaultQuestions.map((q) => ({ question: q, answer: '' })),
          })),
        )
        return
      }

      try {
        setLoadingAssessmentDetails(true)
        const details = await authService.getCoachingClientDetails(
          currentAssessmentClient.clientID,
        )
        setClientAssessmentDetails(details)

        if (Array.isArray(details?.assessments) && details.assessments.length > 0) {
          const merged = SIX_CORE_ASSESSMENTS.map((base) => {
            const found = details.assessments.find(
              (a) =>
                a.id === base.id ||
                a.title?.toLowerCase() === base.title.toLowerCase(),
            )
            if (found) {
              return {
                ...base,
                ...found,
                data:
                  Array.isArray(found.data) && found.data.length > 0
                    ? found.data
                    : base.defaultQuestions.map((q) => ({ question: q, answer: '' })),
              }
            }
            return {
              ...base,
              completed: false,
              answeredCount: 0,
              totalQuestions: base.defaultQuestions.length,
              data: base.defaultQuestions.map((q) => ({ question: q, answer: '' })),
            }
          })
          setSelectedClientAssessments(merged)
        } else {
          const answersList = Array.isArray(details?.formAnswers)
            ? details.formAnswers
            : []
          const built = SIX_CORE_ASSESSMENTS.map((base) => {
            const found = answersList.find(
              (f) =>
                f.questionnaireTitle?.toLowerCase() === base.title.toLowerCase(),
            )
            if (found && Array.isArray(found.data) && found.data.length > 0) {
              const answered = found.data.filter((q) =>
                String(q?.answer || '').trim(),
              ).length
              return {
                ...base,
                completed: answered > 0,
                completedAt: found.createdAt || found.updatedAt,
                answeredCount: answered,
                totalQuestions: found.data.length,
                data: found.data,
              }
            }
            return {
              ...base,
              completed: false,
              completedAt: null,
              answeredCount: 0,
              totalQuestions: base.defaultQuestions.length,
              data: base.defaultQuestions.map((q) => ({ question: q, answer: '' })),
            }
          })
          setSelectedClientAssessments(built)
        }
      } catch (err) {
        console.error('Failed to load client assessment details:', err)
      } finally {
        setLoadingAssessmentDetails(false)
      }
    }

    fetchAssessmentsForClient()
  }, [currentAssessmentClient?.clientID])

  const handleOpenAssessmentModal = async (clientId, clientName) => {
    setShowAssessmentModal(true)
    setLoadingAssessmentDetails(true)
    try {
      if (clientId) {
        const details = await authService.getCoachingClientDetails(clientId)
        setClientAssessmentDetails(details)
      } else {
        setClientAssessmentDetails(null)
      }
    } catch (err) {
      console.error('Failed to fetch client assessment details:', err)
      setClientAssessmentDetails(null)
    } finally {
      setLoadingAssessmentDetails(false)
    }
  }

  const handleOpenEditAssessment = (assessment) => {
    const questionsData =
      Array.isArray(assessment.data) && assessment.data.length > 0
        ? assessment.data.map((item) => ({ ...item }))
        : (assessment.defaultQuestions || []).map((q) => ({
            question: q,
            answer: '',
          }))

    setActiveEditingAssessment({
      ...assessment,
      data: questionsData,
    })
  }

  const handleSaveAssessmentToMasterDb = async (customPayload = null) => {
    const assessmentToSave = customPayload || activeEditingAssessment
    if (!currentAssessmentClient?.clientID || !assessmentToSave) return
    setIsSavingAssessment(true)
    try {
      const payload = {
        assessment_id: assessmentToSave.id,
        questionnaire_title: assessmentToSave.title,
        data: assessmentToSave.data,
      }
      const response = await authService.saveCoachingClientAssessment(
        currentAssessmentClient.clientID,
        payload,
      )
      toast.success(
        response?.message ||
          `${assessmentToSave.title} saved to master internal database!`,
      )

      const answeredCount = assessmentToSave.data.filter((q) =>
        String(q.answer || '').trim() && !String(q.question || '').startsWith('__'),
      ).length

      setSelectedClientAssessments((prev) =>
        prev.map((item) =>
          item.id === assessmentToSave.id
            ? {
                ...item,
                completed: answeredCount > 0,
                completedAt: new Date().toISOString(),
                answeredCount: answeredCount,
                data: assessmentToSave.data,
              }
            : item,
        ),
      )

      // Refresh client details from backend
      authService
        .getCoachingClientDetails(currentAssessmentClient.clientID)
        .then((refreshed) => setClientAssessmentDetails(refreshed))
        .catch(() => {})

      setActiveEditingAssessment(null)
    } catch (err) {
      console.error('Failed to save assessment to master database:', err)
      toast.error('Failed to save assessment to master internal database')
    } finally {
      setIsSavingAssessment(false)
    }
  }

  const handleViewSingleAssessment = (assessment) => {
    setViewingSingleAssessment(assessment)
  }

  if (isLoading) {
    return (
      <div className='max-w-7xl mx-auto space-y-8'>
        <h1 className='text-3xl font-bold uppercase tracking-wide text-black'>
          OVERVIEW
        </h1>
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#F6B72D]'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto space-y-8'>
      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex-1 min-w-[220px]'>
            <p className='text-xs uppercase tracking-[0.2em] text-[#F6B72D] font-semibold'>
              <span style={HERO_TAGLINE_OUTLINE}>
                The CEO Influencers • Building Better Leaders
              </span>
            </p>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900'>
              Coaching Dashboard
            </h1>
            <p className='text-lg font-exo text-gray-600'>
              Oversee programs, sessions, and client progress in one view.
            </p>
          </div>
          <div className='w-full sm:w-auto self-center'>
            <div className='bg-[#0f172a] text-white rounded-lg px-4 py-3 text-sm sm:text-base font-semibold space-y-1'>
              <p className='text-sm sm:text-base font-semibold'>
                Program 1:{' '}
                {activeProgram?.name || activeProgram?.title || 'Learning Sessions'}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Sales Influencer: {salesInfluencerDisplay}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Coaching Influencers: {coachingInfluencersDisplay}
              </p>
              <p className='text-xs sm:text-sm text-white/85'>
                Client: {activeProgram?.clientName || '—'}
              </p>
              {activeProgram && (
                <Link
                  to={activeClientLink}
                  className='inline-flex text-xs sm:text-sm font-semibold text-[#F6B72D] hover:text-[#e6b82a]'
                >
                  View Client →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Initial Coaching New Client Discovery Meeting (2-Hour): 6 Client Assessments Suite */}
      <div className='bg-[#0f172a] border-2 border-[#F6B72D] rounded-2xl p-6 shadow-xl space-y-6 text-white'>
        {/* Section Header */}
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
              <span className='px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#F6B72D] text-black shadow-sm'>
                Coaching Discovery Protocol
              </span>
              <span className='px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-[#F6B72D] border border-[#F6B72D]/40'>
                6 Core Client Assessments
              </span>
            </div>
            <h2 className='text-xl sm:text-2xl font-black uppercase tracking-wide text-white'>
              Initial Coaching New Client Discovery Meeting (2-Hour)
            </h2>
            <p className='text-xs sm:text-sm text-white/70 mt-1 max-w-3xl leading-relaxed'>
              Prior to your initial 2-hour coaching discovery meeting, the client completes these 6 foundational personal and professional assessments. Results are stored in the master internal database for the coaching advisory team to review and evaluate together.
            </p>
          </div>

          {/* Client Selector & Profile */}
          <div className='flex flex-wrap items-center gap-3 shrink-0'>
            {assignedClients.length > 0 && (
              <div className='flex items-center gap-2 bg-slate-800 border border-[#F6B72D]/60 rounded-xl px-3 py-2'>
                <span className='text-xs text-white/60 font-medium'>Client:</span>
                <select
                  value={currentAssessmentClient?.clientID || ''}
                  onChange={(e) => {
                    const found = assignedClients.find(
                      (c) => String(c.clientID) === String(e.target.value),
                    )
                    setSelectedClientForAssessment(found || null)
                  }}
                  className='bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-2'
                >
                  {assignedClients.map((c) => (
                    <option
                      key={c.clientID}
                      value={c.clientID}
                      className='bg-slate-900 text-white'
                    >
                      {c.clientName} ({c.completedAssessments ?? 0}/6 Complete)
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type='button'
              onClick={() =>
                handleOpenAssessmentModal(
                  currentAssessmentClient?.clientID,
                  currentAssessmentClient?.clientName,
                )
              }
              className='inline-flex items-center gap-2 bg-[#F6B72D] hover:bg-[#e6b82a] text-black font-bold py-2 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-md'
            >
              <FileText className='w-4 h-4' />
              All Diagnostic Answers
            </button>
            {currentAssessmentClient?.clientID && (
              <Link
                to={`/coaching-dashboard/clients/${currentAssessmentClient.clientID}`}
                className='inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-3.5 rounded-xl text-xs sm:text-sm border border-white/20 transition-colors'
              >
                Client Profile
                <ExternalLink className='w-3.5 h-3.5' />
              </Link>
            )}
          </div>
        </div>

        {/* Next Step: Initial 2-Hour New Client Discovery Meeting Review Callout */}
        <div className='bg-[#F6B72D] text-black rounded-xl p-4 sm:p-5 border-2 border-amber-500 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 font-exo'>
          <div className='space-y-1.5'>
            <div className='flex items-center gap-2'>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black text-[#F6B72D]'>
                Next Step
              </span>
              <span className='text-xs font-black uppercase tracking-wide text-black/85'>
                Initial 2-Hour New Client Discovery Meeting
              </span>
            </div>
            <h3 className='text-base sm:text-lg font-black text-black leading-snug'>
              Review 6 TCI Assessment Diagnostic Results with {currentAssessmentClient?.clientName || 'Client'}
            </h3>
            <p className='text-xs sm:text-sm text-black/80 leading-relaxed max-w-3xl'>
              As the Executive Coaching Influencer, review and evaluate the client's 6 baseline assessments during your initial 2-hour discovery meeting to establish signature strengths, core leadership competencies, blind spots, and formalize the executive development roadmap.
            </p>
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            <button
              type='button'
              onClick={() =>
                handleOpenAssessmentModal(
                  currentAssessmentClient?.clientID,
                  currentAssessmentClient?.clientName,
                )
              }
              className='inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow transition-all hover:scale-105 active:scale-95'
            >
              <Target className='w-4 h-4 text-[#F6B72D]' />
              Review Diagnostic Suite
            </button>
          </div>
        </div>

        {/* Progress Summary Banner */}
        <div className='bg-slate-800/80 rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-[#F6B72D]/20 border border-[#F6B72D] flex items-center justify-center font-black text-lg text-[#F6B72D]'>
              {selectedClientAssessments.filter((a) => a.completed).length}/6
            </div>
            <div>
              <p className='text-xs uppercase tracking-wider text-white/60 font-semibold'>
                Discovery Assessment Status
              </p>
              <p className='text-sm sm:text-base font-bold text-white'>
                {currentAssessmentClient?.clientName || 'Client'}:{' '}
                <span className='text-[#F6B72D]'>
                  {selectedClientAssessments.filter((a) => a.completed).length} of 6 Assessments Completed
                </span>
              </p>
            </div>
          </div>

          <div className='flex-1 max-w-md'>
            <div className='flex justify-between text-xs text-white/70 mb-1.5'>
              <span>Master Internal Database Sync</span>
              <span className='font-bold text-[#F6B72D]'>
                {Math.round(
                  (selectedClientAssessments.filter((a) => a.completed).length /
                    6) *
                    100,
                )}
                % Complete
              </span>
            </div>
            <div className='h-2.5 w-full rounded-full bg-slate-700 overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-[#F6B72D] to-amber-300 transition-all duration-500 rounded-full'
                style={{
                  width: `${Math.round(
                    (selectedClientAssessments.filter((a) => a.completed).length /
                      6) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 6 Assessments Interactive Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {selectedClientAssessments.map((assessment) => {
            const isCompleted = Boolean(assessment.completed)
            return (
              <div
                key={assessment.id}
                className='bg-slate-800/90 border border-white/10 hover:border-[#F6B72D]/60 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg space-y-3'
              >
                <div>
                  <div className='flex items-start justify-between gap-2 mb-2'>
                    <span className='w-7 h-7 rounded-lg bg-[#F6B72D]/20 text-[#F6B72D] font-extrabold text-xs flex items-center justify-center border border-[#F6B72D]/40'>
                      #{assessment.id}
                    </span>
                    {isCompleted ? (
                      <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'>
                        <CheckCircle2 className='w-3 h-3' />
                        Completed
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40'>
                        <Clock className='w-3 h-3' />
                        Not Completed
                      </span>
                    )}
                  </div>

                  <h3 className='text-sm sm:text-base font-bold text-white mb-1'>
                    {assessment.title}
                  </h3>
                  <p className='text-xs text-white/60 line-clamp-2'>
                    {assessment.description ||
                      'Foundational assessment for initial coaching discovery review.'}
                  </p>
                </div>

                <div className='pt-3 border-t border-white/10 space-y-2.5'>
                  <div className='flex items-center justify-between text-xs text-white/70'>
                    <span>Recorded Responses:</span>
                    <span className='font-semibold text-white'>
                      {assessment.answeredCount || 0} /{' '}
                      {assessment.totalQuestions || 6}
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      type='button'
                      onClick={() => handleViewSingleAssessment(assessment)}
                      className='inline-flex items-center justify-center gap-1 text-xs font-semibold py-2 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors'
                    >
                      <FileText className='w-3.5 h-3.5' />
                      View Results
                    </button>
                    <button
                      type='button'
                      onClick={() => handleOpenEditAssessment(assessment)}
                      className='inline-flex items-center justify-center gap-1 text-xs font-bold py-2 px-2.5 rounded-lg bg-[#F6B72D] hover:bg-[#e6b82a] text-black transition-colors'
                    >
                      <Edit3 className='w-3.5 h-3.5' />
                      {isCompleted ? 'Edit Results' : 'Add Results'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12 gap-6'>
        {/* Learning sessions rail */}
        <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px] self-start'>
          <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm h-[744px] max-h-[744px] flex flex-col overflow-hidden'>
            <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
              <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                Learning Modules
              </span>
              <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                {activeProgramContent.length}
              </span>
            </div>
            <div className='flex-1 min-h-0 h-full overflow-y-auto divide-y divide-gray-100'>
              {activeProgramContent.length ? (
                activeProgramContent.map((item, idx) => {
                  const content = (
                    <>
                      <p className='text-xs text-gray-500 uppercase'>
                        {item.type === 'module'
                          ? `Module ${idx + 1}`
                          : 'Program Detail'}
                      </p>
                      <p className='text-sm font-semibold text-gray-900 truncate'>
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className='text-xs text-gray-500 truncate mt-1'>
                          {item.subtitle}
                        </p>
                      )}
                    </>
                  )

                  if (item.type === 'module') {
                    return (
                      <button
                        key={`${item.title}-${idx}`}
                        type='button'
                        className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${
                          item.files?.length ? '' : 'cursor-default'
                        }`}
                        onClick={() => handleModuleDownload(item)}
                      >
                        {content}
                      </button>
                    )
                  }

                  return (
                    <div
                      key={`${item.title}-${idx}`}
                      className='block px-4 py-3 hover:bg-gray-50'
                    >
                      {content}
                    </div>
                  )
                })
              ) : (
                <div className='px-4 py-6 text-sm text-gray-500'>
                  No modules available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className='col-span-12 lg:col-span-6 xl:col-span-6 min-w-[320px] flex flex-col gap-4 h-full'>
          <div className='bg-[#0f172a] text-white rounded-2xl p-6 shadow-lg min-h-[240px] flex flex-col justify-between border-2 border-[#F6B72D]'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h2 className='text-2xl sm:text-3xl font-extrabold leading-tight'>
                  Video Meeting
                </h2>
                <p className='text-sm sm:text-base font-semibold text-[#F6B72D] mt-1'>
                  Program 1:{' '}
                  {activeProgram?.name || activeProgram?.title || 'Learning Sessions'}
                </p>
                <h3 className='text-base sm:text-lg font-semibold mt-3 leading-tight'>
                  {nextMeeting
                    ? nextMeeting.title || 'Upcoming Live Session'
                    : 'No live session scheduled'}
                </h3>
                <p className='text-sm text-white/70 mt-1'>
                  {nextMeeting
                    ? `${formatDate(nextMeeting.date)} · ${nextMeeting.time || 'TBD'}`
                    : 'We will notify you when a session is added.'}
                </p>
                {nextMeeting?.clientName && (
                  <p className='text-xs text-white/60 mt-1'>
                    Client: {nextMeeting.clientName}
                  </p>
                )}
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3 mt-4'>
              <Link
                to={
                  nextMeeting?.id ? `/coaching/meeting/${nextMeeting.id}` : '#'
                }
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  nextMeeting?.id
                    ? 'bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                    : 'bg-white/10 text-white cursor-not-allowed'
                }`}
              >
                <Play className='w-4 h-4 mr-2' />
                {nextMeeting?.id ? 'Join Meeting' : 'Awaiting Schedule'}
              </Link>
              <Link
                to={activeClientLink}
                className='text-sm text-white/80 hover:text-[#F6B72D]'
              >
                Open Client Workspace →
              </Link>
            </div>
          </div>

          <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-4 shadow-sm flex flex-col flex-1'>
            <div className='flex items-center gap-2 mb-3'>
              <NotebookText className='w-5 h-5 text-[#1a2332]' />
              <h3 className='text-base sm:text-lg font-extrabold uppercase tracking-wide text-gray-800'>
                Notes
              </h3>
            </div>
            <p className='text-sm text-gray-600 leading-relaxed mb-3'>
              One place for coaching outcomes, prep, and follow-ups. Saved
              locally per program.
            </p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className='w-full min-h-[160px] rounded-lg border border-gray-200 p-3 text-sm text-gray-800 focus:border-[#F6B72D] focus:ring-2 focus:ring-[#F6B72D]/30 outline-none'
              placeholder='Type notes...'
            />
            <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
              <span>
                {activeProgram
                  ? `Program: ${activeProgram.name || activeProgram.title}`
                  : 'No program selected'}
              </span>
              <span>
                {notesSavedAt
                  ? `Saved ${notesSavedAt.toLocaleTimeString()}`
                  : 'Not saved yet'}
              </span>
            </div>
            <div className='mt-3 flex gap-3'>
              <button
                type='button'
                onClick={() => saveNotes(activeProgram, notes)}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#F6B72D] text-black text-sm font-semibold hover:bg-[#e6b82a]'
              >
                <Save className='w-4 h-4' /> Save notes
              </button>
              <Link
                to={activeClientLink}
                className='text-sm text-[#1a2332] font-semibold hover:text-[#F6B72D]'
              >
                Open client workspace →
              </Link>
            </div>
          </div>
        </div>

        {/* Program quick access rail */}
        <div className='col-span-12 lg:col-span-6 xl:col-span-3 space-y-3 min-w-[260px]'>
          <div className='bg-white border-2 border-[#F6B72D] rounded-xl shadow-sm h-full'>
            <div className='px-4 py-3 border-b border-black/10 bg-[#F6B72D] flex items-center justify-between'>
              <span className='text-sm font-extrabold uppercase tracking-wide text-black'>
                Programs
              </span>
              <span className='text-[10px] px-2 py-1 bg-black/10 rounded-full text-black'>
                {selectablePrograms.length}
              </span>
            </div>
            <div className='divide-y divide-gray-100'>
              {selectablePrograms.length ? (
                selectablePrograms.slice(0, 9).map((program, idx) => {
                  const isActive =
                    String(activeProgram?.id) === String(program.id)
                  return (
                    <button
                      type='button'
                      key={program.id || `${program.name}-${idx}`}
                      onClick={() => setActiveProgramId(program.id)}
                      className={`block w-full text-left px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-[#F6B72D]/15 text-black border-l-4 border-[#F6B72D]'
                          : 'hover:bg-[#F6B72D]/10'
                      }`}
                    >
                      <p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
                        Program {idx + 1}
                      </p>
                      <p className='text-sm font-semibold truncate'>
                        {program.name || program.title || 'Program'}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {program.clientName
                          ? `Client: ${program.clientName}`
                          : 'Assigned Program'}
                      </p>
                    </button>
                  )
                })
              ) : (
                <div className='px-4 py-6 text-sm text-gray-500'>
                  No programs available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <MetricCard
          title='CLIENTS ASSIGNED'
          value={clientsAssigned.toString()}
        />
        <MetricCard
          title='CLIENT MEETINGS TODAY'
          value={clientsMeetingToday.toString()}
        />
        <MetricCard
          title='ACTIVE PROGRAMS'
          value={selectablePrograms.length.toString()}
        />
      </div>

      {/* Upcoming meetings table */}
      <div className='bg-white border-2 border-[#F6B72D] rounded-xl p-6 shadow-sm'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-extrabold text-gray-900'>
            Upcoming Meetings
          </h3>
          <span className='text-sm text-gray-600'>
            Keep track of upcoming sessions
          </span>
        </div>
        {upcomingMeetings.length === 0 ? (
          <p className='text-sm text-gray-600'>
            No upcoming meetings scheduled. Check back soon.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 text-xs sm:text-sm'>
              <thead className='bg-[#F6B72D]'>
                <tr>
                  <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                    Date
                  </th>
                  <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                    Time
                  </th>
                  <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                    Client
                  </th>
                  <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                    Program
                  </th>
                  <th className='px-3 sm:px-4 py-2 text-left font-semibold text-black'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 font-exo'>
                {paginatedMeetings.map((meeting, index) => (
                  <tr key={`${meeting.date}-${meeting.id || index}`}>
                    <td className='px-3 sm:px-4 py-2 text-gray-900 font-medium'>
                      {new Date(meeting.date).toLocaleDateString()}
                    </td>
                    <td className='px-3 sm:px-4 py-2 text-gray-700'>
                      {meeting.time || 'TBD'}
                    </td>
                    <td className='px-3 sm:px-4 py-2 text-gray-900'>
                      {meeting.clientName || meeting.client || '—'}
                    </td>
                    <td className='px-3 sm:px-4 py-2 text-gray-700'>
                      {meeting.program || meeting.title || '—'}
                    </td>
                    <td className='px-3 sm:px-4 py-2'>
                      <Link
                        to={
                          meeting.id ? `/coaching/meeting/${meeting.id}` : '#'
                        }
                        className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${
                          meeting.id
                            ? 'bg-[#F6B72D] text-black hover:bg-[#e6b82a]'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Join
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className='flex items-center justify-end gap-3 mt-4 text-sm'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Previous
              </button>
              <span className='text-gray-700'>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className='px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions row */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Link
          to={URLS.coaching.clients}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Clients
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Manage Assignments
            </p>
          </div>
          <Users className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.coaching.calendar}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Calendar
            </p>
            <p className='text-base font-semibold text-gray-900'>
              View Schedule
            </p>
          </div>
          <CalendarDays className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.chat}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Chat
            </p>
            <p className='text-base font-semibold text-gray-900'>
              Message Clients
            </p>
          </div>
          <MessageSquare className='w-6 h-6 text-[#1a2332]' />
        </Link>

        <Link
          to={URLS.logout}
          className='flex items-center justify-between px-4 py-4 rounded-xl border-2 border-[#F6B72D] bg-white shadow-sm'
        >
          <div>
            <p className='text-xs uppercase tracking-wide text-gray-500'>
              Account
            </p>
            <p className='text-base font-semibold text-gray-900'>Log out</p>
          </div>
          <LogOut className='w-6 h-6 text-[#1a2332]' />
        </Link>
      </div>

      {/* Assessment Results Modal for Coaches */}
      {showAssessmentModal && (
        <div
          className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto'
          onClick={() => setShowAssessmentModal(false)}
        >
          <div
            className='bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#F6B72D] overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className='bg-[#0f172a] text-white p-5 border-b border-[#F6B72D]/40 flex items-center justify-between'>
              <div>
                <p className='text-xs uppercase tracking-widest text-[#F6B72D] font-bold'>
                  Diagnostic Assessment Suite
                </p>
                <h3 className='text-xl font-bold mt-0.5'>
                  {currentAssessmentClient?.clientName || 'Client'} — 6 Leadership Onboarding Assessments
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setShowAssessmentModal(false)}
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-6 overflow-y-auto space-y-6 flex-1'>
              {loadingAssessmentDetails ? (
                <div className='flex justify-center items-center py-16'>
                  <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#F6B72D]'></div>
                </div>
              ) : (
                <>
                  <QuestionnaireProgressCard
                    formAnswers={clientAssessmentDetails?.formAnswers || []}
                  />

                  <FormAnswersCard
                    formAnswers={clientAssessmentDetails?.formAnswers || []}
                    clientName={currentAssessmentClient?.clientName || 'Client'}
                  />
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className='bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3'>
              <span className='text-xs text-gray-500'>
                The CEO Influencers • Confidential Coaching Diagnostics
              </span>
              <div className='flex items-center gap-3'>
                {currentAssessmentClient?.clientID && (
                  <Link
                    to={`/coaching-dashboard/clients/${currentAssessmentClient.clientID}`}
                    onClick={() => setShowAssessmentModal(false)}
                    className='inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0f172a] hover:text-[#F6B72D] transition-colors'
                  >
                    Open Client Details Page
                    <ExternalLink className='w-3.5 h-3.5' />
                  </Link>
                )}
                <button
                  type='button'
                  onClick={() => setShowAssessmentModal(false)}
                  className='px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated MBTI Assessment 1 Modal (Enter / Update) */}
      {activeEditingAssessment && activeEditingAssessment.id === 1 && (
        <MbtiAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={activeEditingAssessment.data}
          onSave={handleSaveAssessmentToMasterDb}
          isSaving={isSavingAssessment}
          onClose={() => setActiveEditingAssessment(null)}
        />
      )}

      {/* Dedicated Skills Assessment 2 Modal (Enter / Update) */}
      {activeEditingAssessment && activeEditingAssessment.id === 2 && (
        <SkillsAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={activeEditingAssessment.data}
          onSave={handleSaveAssessmentToMasterDb}
          isSaving={isSavingAssessment}
          onClose={() => setActiveEditingAssessment(null)}
        />
      )}

      {/* Dedicated Personal & Professional Assessment 3 Modal (Enter / Update) */}
      {activeEditingAssessment && activeEditingAssessment.id === 3 && (
        <PersonalProfessionalAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={activeEditingAssessment.data}
          onSave={handleSaveAssessmentToMasterDb}
          isSaving={isSavingAssessment}
          onClose={() => setActiveEditingAssessment(null)}
        />
      )}

      {/* Dedicated Leadership Core Competencies Assessment 4 Modal (Enter / Update) */}
      {activeEditingAssessment && activeEditingAssessment.id === 4 && (
        <LeadershipCompetenciesAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={activeEditingAssessment.data}
          onSave={handleSaveAssessmentToMasterDb}
          isSaving={isSavingAssessment}
          onClose={() => setActiveEditingAssessment(null)}
        />
      )}

      {/* Dedicated Global Industry Experience Assessment 5 Modal (Enter / Update) */}
      {activeEditingAssessment && activeEditingAssessment.id === 5 && (
        <GlobalIndustryAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={activeEditingAssessment.data}
          onSave={handleSaveAssessmentToMasterDb}
          isSaving={isSavingAssessment}
          onClose={() => setActiveEditingAssessment(null)}
        />
      )}

      {/* Dedicated Senior Leader Big 5 Assessment 6 Modal (Enter / Update) */}
      {activeEditingAssessment && activeEditingAssessment.id === 6 && (
        <BigFiveAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={activeEditingAssessment.data}
          onSave={handleSaveAssessmentToMasterDb}
          isSaving={isSavingAssessment}
          onClose={() => setActiveEditingAssessment(null)}
        />
      )}

      {/* Modal for Entering / Editing Assessment Results directly into Master Internal Database (Fallback > 6) */}
      {activeEditingAssessment && activeEditingAssessment.id > 6 && (
        <div
          className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto'
          onClick={() => setActiveEditingAssessment(null)}
        >
          <div
            className='bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#F6B72D] overflow-hidden text-gray-900'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className='bg-[#0f172a] text-white p-5 border-b border-[#F6B72D]/40 flex items-center justify-between'>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F6B72D] text-black'>
                    Assessment #{activeEditingAssessment.id}
                  </span>
                  <span className='text-xs text-white/70'>
                    Client: {currentAssessmentClient?.clientName}
                  </span>
                </div>
                <h3 className='text-xl font-bold text-white'>
                  {activeEditingAssessment.title} — Enter / Update Results
                </h3>
              </div>
              <button
                type='button'
                onClick={() => setActiveEditingAssessment(null)}
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Questions Form Body */}
            <div className='p-6 overflow-y-auto space-y-4 flex-1 font-exo'>
              <div className='text-xs text-gray-700 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2'>
                <Sparkles className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                <p>
                  <strong>Coach Discovery Protocol:</strong> Record or verify answers during the initial 2-hour new client coaching discovery meeting. Saving will persist results directly into the <strong>master internal database</strong>.
                </p>
              </div>

              {activeEditingAssessment.data.map((item, idx) => (
                <div key={idx} className='space-y-1.5'>
                  <label className='block text-xs font-bold text-gray-700 uppercase tracking-wide'>
                    {idx + 1}. {item.question}
                  </label>
                  <textarea
                    rows={2}
                    value={item.answer || ''}
                    onChange={(e) => {
                      const updated = [...activeEditingAssessment.data]
                      updated[idx].answer = e.target.value
                      setActiveEditingAssessment({
                        ...activeEditingAssessment,
                        data: updated,
                      })
                    }}
                    placeholder={`Enter client's response for ${item.question}...`}
                    className='w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F6B72D] focus:border-transparent font-sans'
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className='bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3'>
              <button
                type='button'
                onClick={() => setActiveEditingAssessment(null)}
                className='px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors'
              >
                Cancel
              </button>

              <button
                type='button'
                disabled={isSavingAssessment}
                onClick={handleSaveAssessmentToMasterDb}
                className='inline-flex items-center gap-2 px-6 py-2.5 bg-[#F6B72D] hover:bg-[#e6b82a] text-black rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50'
              >
                <Save className='w-4 h-4' />
                {isSavingAssessment
                  ? 'Saving to Database...'
                  : 'Save to Master Internal Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated MBTI Assessment 1 Modal (View Diagnostic Results) */}
      {viewingSingleAssessment && viewingSingleAssessment.id === 1 && (
        <MbtiAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={viewingSingleAssessment.data}
          isReadOnly={true}
          onClose={() => setViewingSingleAssessment(null)}
        />
      )}

      {/* Dedicated Skills Assessment 2 Modal (View Diagnostic Results) */}
      {viewingSingleAssessment && viewingSingleAssessment.id === 2 && (
        <SkillsAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={viewingSingleAssessment.data}
          isReadOnly={true}
          onClose={() => setViewingSingleAssessment(null)}
        />
      )}

      {/* Dedicated Personal & Professional Assessment 3 Modal (View Diagnostic Results) */}
      {viewingSingleAssessment && viewingSingleAssessment.id === 3 && (
        <PersonalProfessionalAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={viewingSingleAssessment.data}
          isReadOnly={true}
          onClose={() => setViewingSingleAssessment(null)}
        />
      )}

      {/* Dedicated Leadership Core Competencies Assessment 4 Modal (View Diagnostic Results) */}
      {viewingSingleAssessment && viewingSingleAssessment.id === 4 && (
        <LeadershipCompetenciesAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={viewingSingleAssessment.data}
          isReadOnly={true}
          onClose={() => setViewingSingleAssessment(null)}
        />
      )}

      {/* Dedicated Global Industry Experience Assessment 5 Modal (View Diagnostic Results) */}
      {viewingSingleAssessment && viewingSingleAssessment.id === 5 && (
        <GlobalIndustryAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={viewingSingleAssessment.data}
          isReadOnly={true}
          onClose={() => setViewingSingleAssessment(null)}
        />
      )}

      {/* Dedicated Senior Leader Big 5 Assessment 6 Modal (View Diagnostic Results) */}
      {viewingSingleAssessment && viewingSingleAssessment.id === 6 && (
        <BigFiveAssessmentModal
          isOpen={true}
          client={currentAssessmentClient}
          initialData={viewingSingleAssessment.data}
          isReadOnly={true}
          onClose={() => setViewingSingleAssessment(null)}
        />
      )}

      {/* Modal for Viewing Single Assessment Diagnostic Results (Fallback > 6) */}
      {viewingSingleAssessment && viewingSingleAssessment.id > 6 && (
        <div
          className='fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto'
          onClick={() => setViewingSingleAssessment(null)}
        >
          <div
            className='bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-2 border-[#F6B72D] overflow-hidden text-gray-900'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='bg-[#0f172a] text-white p-5 border-b border-[#F6B72D]/40 flex items-center justify-between'>
              <div>
                <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F6B72D] text-black'>
                  Assessment #{viewingSingleAssessment.id}
                </span>
                <h3 className='text-lg font-bold text-white mt-1'>
                  {viewingSingleAssessment.title} — Diagnostic Results
                </h3>
                <p className='text-xs text-white/70'>
                  Client: {currentAssessmentClient?.clientName} • Status:{' '}
                  {viewingSingleAssessment.completed ? (
                    <span className='text-emerald-400 font-semibold'>
                      Completed
                    </span>
                  ) : (
                    <span className='text-amber-400 font-semibold'>
                      Pending / Incomplete
                    </span>
                  )}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setViewingSingleAssessment(null)}
                className='text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='p-6 overflow-y-auto space-y-4 flex-1 font-exo'>
              {viewingSingleAssessment.data &&
              viewingSingleAssessment.data.some((d) => d.answer?.trim()) ? (
                viewingSingleAssessment.data.map((item, idx) => (
                  <div
                    key={idx}
                    className='bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5'
                  >
                    <p className='text-xs font-bold text-gray-700 uppercase'>
                      {idx + 1}. {item.question}
                    </p>
                    <p className='text-sm text-gray-900 whitespace-pre-wrap font-sans'>
                      {item.answer ? (
                        item.answer
                      ) : (
                        <span className='text-gray-400 italic'>
                          (No response recorded)
                        </span>
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <div className='text-center py-10 text-gray-500'>
                  <AlertCircle className='w-8 h-8 text-amber-500 mx-auto mb-2' />
                  <p className='text-sm font-semibold'>
                    No responses recorded yet for this assessment.
                  </p>
                  <p className='text-xs mt-1 text-gray-400'>
                    Click "Enter / Edit Results" to record answers during the
                    2-hour discovery meeting.
                  </p>
                </div>
              )}
            </div>

            <div className='bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3'>
              <button
                type='button'
                onClick={() => {
                  const target = viewingSingleAssessment
                  setViewingSingleAssessment(null)
                  handleOpenEditAssessment(target)
                }}
                className='inline-flex items-center gap-1.5 px-4 py-2 bg-[#F6B72D] text-black font-bold rounded-lg text-xs hover:bg-[#e6b82a] transition-colors'
              >
                <Edit3 className='w-3.5 h-3.5' />
                Edit / Enter Answers
              </button>
              <button
                type='button'
                onClick={() => setViewingSingleAssessment(null)}
                className='px-5 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
