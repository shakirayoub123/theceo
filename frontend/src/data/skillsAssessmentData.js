export const EXPERIENCE_TIERS = [
  {
    key: '0_yrs',
    label: '0 Yrs',
    title: 'Awareness Only',
    description: 'You understand the concept but have no practical experience applying it.',
    level: 0,
    category: 'Development Opportunity',
  },
  {
    key: '1_3_yrs',
    label: '1-3 Yrs',
    title: 'Developing',
    description: 'You have some hands-on experience, likely in a supervised or smaller-scale capacity.',
    level: 1,
    category: 'Development Opportunity',
  },
  {
    key: '4_7_yrs',
    label: '4-7 Yrs',
    title: 'Proficient',
    description: 'You have consistently and successfully applied this skill independently in significant roles.',
    level: 2,
    category: 'Core Proficiency',
  },
  {
    key: '8_12_yrs',
    label: '8-12 Yrs',
    title: 'Expert',
    description: 'You have deep experience, have handled highly complex situations, and likely mentor others in this area.',
    level: 3,
    category: 'Signature Strength',
  },
  {
    key: '13_plus_yrs',
    label: '13+ Yrs',
    title: 'Mastery / Thought Leader',
    description: 'This skill is second nature. You have shaped strategy and driven enterprise-level outcomes based on this skill for over a decade.',
    level: 4,
    category: 'Signature Strength',
  },
]

export const SKILLS_ASSESSMENT_DATA = {
  id: 2,
  title: 'Senior Executive Leader Soft & Hard Skills Assessment',
  subtitle: 'A Comprehensive Cumulative Evaluation of Executive Experience, Technical Expertise & Leadership Mastery',
  instructions:
    'For each specific skill listed below, please check one box that best represents your cumulative years of practical application and experience for each area.',
  tierExplanations: [
    '0 Years (Awareness Only): You understand the concept but have no practical experience applying it.',
    '1-3 Years (Developing): You have some hands-on experience, likely in a supervised or smaller-scale capacity.',
    '4-7 Years (Proficient): You have consistently and successfully applied this skill independently in significant roles.',
    '8-12 Years (Expert): You have deep experience, have handled highly complex situations, and likely mentor others in this area.',
    '13+ Years (Mastery/Thought Leader): This skill is second nature. You have shaped strategy and driven enterprise-level outcomes based on this skill for over a decade.',
  ],
  part1: {
    title: 'Part I: Soft Skills Assessment (The Art of Leadership)',
    description: 'This section focuses on the interpersonal, strategic, and personal attributes that enable optimal executive leadership.',
    competencies: [
      {
        id: 'soft_1',
        title: '1. Leadership & Influence',
        skills: [
          { id: 1, text: 'Inspiring and articulating a compelling innovative corporate vision' },
          { id: 2, text: 'Leading and managing large-scale organizational change initiatives' },
          { id: 3, text: 'Coaching and developing other senior leaders/successors/future organizational talent management pipeline' },
          { id: 4, text: 'Cultivating a high-performance, all-inclusive holistic organizational culture' },
          { id: 5, text: 'Influencing and leading Board of Directors and key stakeholder relations' },
          { id: 6, text: 'Leading organizational manpower, technology and resources through significant crisis or ambiguity' },
        ],
      },
      {
        id: 'soft_2',
        title: '2. Full Cycle Strategic Thinking & Vision',
        skills: [
          { id: 7, text: 'Developing and executing full cycle multi-year corporate strategy' },
          { id: 8, text: 'Anticipating and responding effectively to disruptive short/mid/long-range market shifts & volatility' },
          { id: 9, text: 'Fostering and implementing a vision with a correlated strategy to create a fully scalable culture of innovation' },
          { id: 10, text: 'Conducting complex scenario strategy planning and contingency analysis based on accurate real world internal/external business intelligence' },
          { id: 11, text: 'Translating long-term strategic vision into actionable annual goals (OKRs/KPIs)' },
        ],
      },
      {
        id: 'soft_3',
        title: '3. Communication & Interpersonal relations Skills',
        skills: [
          { id: 12, text: 'Demonstrating effective executive presence, gravitas and positive influence across the organization and with key external stakeholders' },
          { id: 13, text: 'Conducting high-stakes time sensitive negotiations (e.g., M&A, Key business partnerships & Strategic Alliances)' },
          { id: 14, text: 'Serving as a savvy public organizational spokesperson (multi-media, investors, board, networking, conferences)' },
          { id: 15, text: 'Articulating complex ideas with impactful simplicity to diverse target audiences' },
          { id: 16, text: 'Facilitating and leading alignment within a divided executive team to successfully resolve conflict and achieve goals' },
        ],
      },
      {
        id: 'soft_4',
        title: '4. Emotional Intelligence & Resilience Agility',
        skills: [
          { id: 17, text: 'Maintaining total composure and decisive judgment under extreme pressure/stress' },
          { id: 18, text: 'High degree of self-awareness (accurately identifying personal/professional key strengths, growth opportunity areas)' },
          { id: 19, text: 'Practicing empathetic leadership to build trust and engagement across the organization' },
          { id: 20, text: 'Navigating complex internal/external political and interpersonal dynamics' },
          { id: 21, text: 'Personal leadership resilience and sustainable performance (burnout prevention)' },
        ],
      },
    ],
  },
  part2: {
    title: 'Part II: Hard Skills Assessment (The Science of Business)',
    description: 'This section focuses on the technical and functional expertise required to operate and grow a complex enterprise.',
    competencies: [
      {
        id: 'hard_1',
        title: '1. Full Cycle Financial Acumen',
        skills: [
          { id: 22, text: 'Full P&L ownership and management for a major division or enterprise' },
          { id: 23, text: 'Successful strategic capital allocation and long-term resource planning' },
          { id: 24, text: 'Leading successful fundraising initiatives, investor relations, or shareholder management' },
          { id: 25, text: 'Evaluating and integrating successful mergers and acquisitions (M&A)' },
          { id: 26, text: 'Enterprise-level financial modeling, forecasting, risk analysis and mitigation' },
        ],
      },
      {
        id: 'hard_2',
        title: '2. Operational Excellence',
        skills: [
          { id: 27, text: 'Scaling enterprise-wide operations (processes, technology, people, resources) for balanced rapid growth and expansion' },
          { id: 28, text: 'Designing and managing effective global supply chains or complex service delivery systems' },
          { id: 29, text: 'Applying real-world data analytics for operational efficiency and performance improvement initiatives' },
          { id: 30, text: 'Implementing quality management systems (e.g., Six Sigma, TQM)' },
          { id: 31, text: 'Strategic full cycle Enterprise Resource Planning (ERP) and systems optimization' },
        ],
      },
      {
        id: 'hard_3',
        title: '3. AI/Technology & Digital Acumen',
        skills: [
          { id: 32, text: 'Leading a major digital transformation initiative across the organization effectively' },
          { id: 33, text: 'Leveraging verified data science, AI, or ML for strategic marketplace advantage' },
          { id: 34, text: 'Cybersecurity governance, enterprise risk management and loss prevention' },
          { id: 35, text: 'Developing and launching AI/technology-based products or services' },
          { id: 36, text: 'Evaluating emerging technologies for full cycle business impact success' },
        ],
      },
      {
        id: 'hard_4',
        title: '4. Strategic Management & Governance',
        skills: [
          { id: 37, text: 'Corporate governance and working with board committees (Audit, Comp, etc.)' },
          { id: 38, text: 'Navigating complex national and international regulatory environments frameworks and legal/political systems' },
          { id: 39, text: 'Developing and managing intellectual property (IP) strategy and implementation' },
          { id: 40, text: 'Enterprise Risk Management (ERM) framework implementation and accountability follow-up verification' },
          { id: 41, text: 'Post-merger integration planning and execution' },
        ],
      },
      {
        id: 'hard_5',
        title: '5. Market & Business Development',
        skills: [
          { id: 42, text: 'Developing and executing a go-to-market strategy for new products and services' },
          { id: 43, text: 'Building and managing internal/external results-focused strategic alliances and partnerships' },
          { id: 44, text: 'Driving national/international market expansion and global branding implementation' },
          { id: 45, text: 'Advanced competitive analysis and market intelligence synthesis' },
          { id: 46, text: 'Leading complex, high-value B2B sales cycles or corporate development initiatives' },
        ],
      },
    ],
  },
  reviewSection: {
    title: 'Review and Action Plan',
    intro: 'After completing the assessment, take a moment to review the results. This is where the real work begins.',
    sections: [
      {
        id: 'signature_strengths',
        title: 'Identify Your Signature Strengths',
        criteria: 'Skills in the 8-12 Years and 13+ Years columns. These are the pillars of your leadership style effectiveness.',
        reflection: 'Reflection: How can you better leverage these strengths to benefit your organization and your team? Are you actively mentoring others in these areas across the organization?',
      },
      {
        id: 'core_proficiencies',
        title: 'Pinpoint Your Core Proficiencies',
        criteria: 'Review the skills in the 4-7 Years column. You are solid here, but there is still room for mastery.',
        reflection: 'Reflection: Which of these skills areas, if elevated to "Expert" or "Mastery," would have the greatest impact on your performance and career trajectory?',
      },
      {
        id: 'development_opportunities',
        title: 'Acknowledge Your Development Opportunities',
        criteria: 'Be honest about the skills in the 0 Years and 1-3 Years columns. These are your primary areas for growth to maximize your leadership style.',
        reflection: 'Reflection: Which of these skills are most critical for your current role and your future ambitions? Are any of these a significant liability or "derailer" if left unaddressed?',
      },
    ],
    next12MonthsTitle: 'My Leadership Development Focus for the Next 12 Months',
    next12MonthsDescription: 'Based on my assessment, I will prioritize developing the following three skills areas:',
    closing:
      'This assessment provides the data-driven foundation for a robust personal development plan. I encourage you to discuss these findings with your trusted coaching advisor influencer to take actionable steps for growth to ensure long-term leadership success.',
  },
}

export function getAllSkillsList() {
  const list = []
  SKILLS_ASSESSMENT_DATA.part1.competencies.forEach((c) => {
    c.skills.forEach((s) => {
      list.push({ ...s, type: 'Soft Skill', competency: c.title })
    })
  })
  SKILLS_ASSESSMENT_DATA.part2.competencies.forEach((c) => {
    c.skills.forEach((s) => {
      list.push({ ...s, type: 'Hard Skill', competency: c.title })
    })
  })
  return list
}

export function calculateSkillsSummary(answersMap = {}) {
  const allSkills = getAllSkillsList()
  const total = allSkills.length // 46

  let signatureStrengths = []
  let coreProficiencies = []
  let developmentOpportunities = []
  let answeredCount = 0

  allSkills.forEach((skill) => {
    const val = answersMap[skill.id] || answersMap[String(skill.id)]
    if (val) {
      answeredCount++
      const item = { ...skill, selection: val }
      if (val === '8-12 Yrs' || val === '13+ Yrs' || val === '8_12_yrs' || val === '13_plus_yrs') {
        signatureStrengths.push(item)
      } else if (val === '4-7 Yrs' || val === '4_7_yrs') {
        coreProficiencies.push(item)
      } else if (val === '0 Yrs' || val === '1-3 Yrs' || val === '0_yrs' || val === '1_3_yrs') {
        developmentOpportunities.push(item)
      }
    }
  })

  return {
    total,
    answeredCount,
    isComplete: answeredCount === total,
    signatureStrengths,
    coreProficiencies,
    developmentOpportunities,
  }
}

