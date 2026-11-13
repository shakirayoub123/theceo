export const COMPETENCY_PROFICIENCY_TIERS = [
  {
    key: 'expert',
    label: 'Expert',
    desc: 'Consistently demonstrates at an exemplary level; coaches/mentors others.',
    badgeClass: 'bg-[#F6B72D] text-black border-[#d99f1b]',
  },
  {
    key: 'proficient',
    label: 'Proficient',
    desc: 'Consistently demonstrates effectively and independently, achieving desired outcomes.',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    key: 'developing',
    label: 'Developing',
    desc: 'Demonstrates sometimes, noticeable room for growth, requiring occasional guidance.',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    key: 'foundational',
    label: 'Foundational',
    desc: 'Basic understanding but rarely demonstrates effectively, or new area of focus.',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  {
    key: 'not_applicable',
    label: 'Not Applicable',
    desc: 'Not relevant to current role, responsibilities, or immediate career aspirations.',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
]

export const LEADERSHIP_COMPETENCIES_DATA = {
  id: 4,
  title: 'Senior Executive Leadership Core Competencies Assessment: A Diagnostic for Professional Excellence',
  subtitle: 'A Synthesized Multi-Framework Diagnostic (OPM ECQ, Korn Ferry, Wharton, OLLU) for C-Suite Leadership',
  introduction:
    'This assessment serves as a powerful diagnostic tool for senior executive leaders, enabling a precise identification of professional core competency skills strengths and areas ripe for development. It moves beyond generic evaluations to provide a granular view of leadership capabilities essential for navigating complex organizational landscapes to drive sustained success.',
  purpose:
    'The true measure of this assessment lies in what is done with the knowledge. It acts as a proactive catalyst for shaping future leadership capacity, connecting past performance to future goals and setting clear objectives for professional advancement.',
  domains: [
    {
      id: 'domain_1',
      title: '3.1: Strategic Vision & Empathetic Change Leadership',
      description:
        'Formulates objectives and priorities consistent with long-term interests in a volatile global environment, capitalizing on opportunities, managing risk, guiding organizations through transitions, and cultivating innovation.',
      skills: [
        { id: 1, text: 'I consistently articulate a compelling long-term vision for my organization/team that inspires and aligns stakeholders.' },
        { id: 2, text: 'I proactively identify and capitalize on new opportunities while strategically managing associated risks in a global context.' },
        { id: 3, text: 'I effectively lead and manage significant organizational change initiatives, minimizing disruption and fostering employee buy-in.' },
        { id: 4, text: 'I demonstrate flexibility and resilience in adapting to rapidly changing conditions, unexpected obstacles, or ambiguous situations.' },
        { id: 5, text: 'I consistently encourage and implement innovative ideas, challenging conventional approaches to drive new programs or processes.' },
        { id: 6, text: 'I keep up-to-date on local, national, and international policies and trends that affect the organization and shape stakeholders\' views.' },
      ],
    },
    {
      id: 'domain_2',
      title: '3.2: People Leadership & Development',
      description:
        'Inspires, motivates, develops, and effectively manages leaders, diverse teams, individuals, and stakeholders towards shared aligned objectives while fostering high emotional intelligence and psychological safety.',
      skills: [
        { id: 7, text: 'I consistently articulate a clear vision and goals that motivate my team members and align them with organizational objectives.' },
        { id: 8, text: 'I actively foster an inclusive work environment where diversity is valued, and all team members feel empowered to contribute.' },
        { id: 9, text: 'I consistently provide constructive feedback, coaching, and development opportunities that enhance my team members\' capabilities and career growth.' },
        { id: 10, text: 'I effectively manage conflicts within my team, facilitating constructive resolution and maintaining positive working relationships.' },
        { id: 11, text: 'I demonstrate high emotional intelligence, effectively managing my own emotions and understanding/influencing those of others.' },
        { id: 12, text: 'I delegate tasks effectively, using it as an opportunity to develop others and distribute workload strategically.' },
        { id: 13, text: 'I build strong, cohesive teams with a diverse mix of styles and perspectives, fostering open dialogue and collaboration.' },
      ],
    },
    {
      id: 'domain_3',
      title: '3.3: Results Orientation & Decision Making',
      description:
        'Drives performance, makes timely decisions even under uncertainty, solves complex problems, and takes personal ownership and accountability for outcomes.',
      skills: [
        { id: 14, text: 'I consistently achieve or exceed organizational goals and customer expectations, demonstrating a strong drive for results.' },
        { id: 15, text: 'I make timely, well-informed decisions, even under uncertainty or with incomplete information, that align with long-term organizational strategy.' },
        { id: 16, text: 'I effectively identify, analyze, and solve complex problems, generating and evaluating alternative solutions.' },
        { id: 17, text: 'I take full personal responsibility for my decisions, actions, and outcomes, ensuring accountability for myself and my team.' },
        { id: 18, text: 'I proactively identify and seize new opportunities, displaying an entrepreneurial mindset and taking calculated risks to achieve objectives.' },
        { id: 19, text: 'I continuously optimize work processes to enhance efficiency, quality, and productivity.' },
      ],
    },
    {
      id: 'domain_4',
      title: '3.4: Business Acumen & Resource Management',
      description:
        'Strategic management of human, financial, technology, and organizational resources; understanding systemic interconnectedness and value creation across the enterprise.',
      skills: [
        { id: 20, text: 'I possess a deep understanding of my organization\'s business model, key financial indicators, and how value is created.' },
        { id: 21, text: 'I strategically manage human capital, ensuring talent acquisition, development, and deployment align with business needs.' },
        { id: 22, text: 'I leverage technology effectively to drive innovation, improve operations, and gain competitive advantage.' },
        { id: 23, text: 'I effectively allocate and manage financial resources to optimize return on investment and achieve strategic objectives.' },
        { id: 24, text: 'I understand the interconnectedness of organizational elements (e.g., strategy, structure, systems, staff) and manage them holistically.' },
        { id: 25, text: 'I keep abreast of current and future policies, practices, and trends in the industry and marketplace.' },
      ],
    },
    {
      id: 'domain_5',
      title: '3.5: Building Coalitions & Influence',
      description:
        'Cultivates strong relationships, navigates organizational politics, persuades and negotiates skillfully without damaging relationships, and balances complex stakeholder expectations.',
      skills: [
        { id: 26, text: 'I consistently build and leverage strong formal and informal networks across diverse internal and external stakeholders.' },
        { id: 27, text: 'I effectively navigate organizational politics, understanding power dynamics and influence structures to achieve objectives.' },
        { id: 28, text: 'I skillfully persuade and influence others to support my initiatives, even in challenging situations, while maintaining strong relationships.' },
        { id: 29, text: 'I proactively seek out and build strategic partnerships to achieve common goals and expand organizational reach.' },
        { id: 30, text: 'I effectively balance the often-conflicting interests and expectations of multiple stakeholders.' },
        { id: 31, text: 'I am adept at negotiating complex agreements, winning concessions without damaging essential relationships.' },
      ],
    },
    {
      id: 'domain_6',
      title: '3.6: Self-Mastery & Adaptability',
      description:
        'Profound internal self-awareness, emotional composure under extreme adversity, rapid recovery from setbacks, active pursuit of feedback, and unwavering integrity.',
      skills: [
        { id: 32, text: 'I consistently demonstrate strong self-awareness, understanding my strengths, weaknesses, values, and emotional triggers.' },
        { id: 33, text: 'I effectively manage my emotions under pressure, maintaining composure and optimism even during adversity.' },
        { id: 34, text: 'I recover quickly from setbacks and learn valuable lessons from failures and mistakes.' },
        { id: 35, text: 'I proactively seek and openly receive constructive feedback, using it for continuous personal and professional development.' },
        { id: 36, text: 'I readily adapt my approach and behavior to new information, changing conditions, or unexpected obstacles.' },
        { id: 37, text: 'I consistently demonstrate a commitment to continuous learning and self-development, actively pursuing new skills and knowledge.' },
        { id: 38, text: 'I maintain a strong sense of integrity and trust, consistently aligning my words with my actions.' },
      ],
    },
  ],
  interpretationGuide: [
    {
      rating: 'Expert',
      interpretation: 'Significant strength consistently demonstrated at an exemplary level.',
      implication: 'Leverage this strength; seek opportunities to apply it strategically and mentor others.',
      action: 'Seek opportunities to lead high-stakes initiatives or mentor emerging leaders in this area.',
    },
    {
      rating: 'Proficient',
      interpretation: 'Well-developed and consistently applied effectively in various situations.',
      implication: 'Maintain and refine this skill; continue to apply it independently.',
      action: 'Look for opportunities to take on more complex projects where this skill can be further honed.',
    },
    {
      rating: 'Developing',
      interpretation: 'Emerging skill requiring conscious effort, focused practice, or occasional guidance.',
      implication: 'Focus development efforts; identify specific learning opportunities and practice scenarios.',
      action: 'Enroll in a specialized workshop, work with an executive coach, or request a stretch assignment.',
    },
    {
      rating: 'Foundational',
      interpretation: 'Basic understanding but rarely demonstrated effectively; new area of focus.',
      implication: 'Prioritize foundational learning; seek structured training and deliberate practice.',
      action: 'Identify core learning resources, practice deliberately, and seek regular feedback from mentors.',
    },
    {
      rating: 'Not Applicable',
      interpretation: 'Not currently relevant to the executive’s role or career trajectory.',
      implication: 'No immediate action required; re-evaluate relevance as career path evolves.',
      action: 'Review periodically to determine if future roles or organizational shifts make this skill relevant.',
    },
  ],
}

export function getAllCompetencySkills() {
  return LEADERSHIP_COMPETENCIES_DATA.domains.flatMap((d) =>
    d.skills.map((s) => ({ ...s, domainTitle: d.title }))
  )
}

export function calculateCompetencySummary(answersMap = {}) {
  const all = getAllCompetencySkills()
  let expertCount = 0
  let proficientCount = 0
  let developingCount = 0
  let foundationalCount = 0
  let notAppCount = 0
  let answeredCount = 0

  all.forEach((skill) => {
    const val = answersMap[skill.id] || answersMap[String(skill.id)]
    if (val) {
      answeredCount++
      if (val === 'Expert') expertCount++
      else if (val === 'Proficient') proficientCount++
      else if (val === 'Developing') developingCount++
      else if (val === 'Foundational') foundationalCount++
      else if (val === 'Not Applicable') notAppCount++
    }
  })

  return {
    total: all.length,
    answeredCount,
    isComplete: answeredCount === all.length,
    expertCount,
    proficientCount,
    developingCount,
    foundationalCount,
    notAppCount,
  }
}

