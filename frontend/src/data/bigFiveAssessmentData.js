// The Senior Leader's Big 5 Personality Profile Assessment (OCEAN)
// Scientifically validated framework for senior executive leadership

export const BIG_FIVE_SCALE = [
  { value: 1, label: 'Strongly Disagree', short: 'SD' },
  { value: 2, label: 'Disagree', short: 'D' },
  { value: 3, label: 'Neutral', short: 'N' },
  { value: 4, label: 'Agree', short: 'A' },
  { value: 5, label: 'Strongly Agree', short: 'SA' },
]

export const BIG_FIVE_STATEMENTS = [
  { id: 1, text: 'I am energized by complex, abstract discussions about the future of the industry.' },
  { id: 2, text: 'I maintain a calm, composed exterior even when facing a significant business crisis.' },
  { id: 3, text: 'My schedule is meticulously planned to ensure I meet all my strategic objectives.' },
  { id: 4, text: 'I find it more effective to be direct and challenging in discussions rather than prioritizing group harmony.' },
  { id: 5, text: 'I am often the one to initiate conversations at networking events or with new stakeholders.' },
  { id: 6, text: 'I feel a deep sense of unease when critical projects fall behind schedule.' },
  { id: 7, text: 'I am known for my ability to remain optimistic and resilient after a major setback.' },
  { id: 8, text: 'I enjoy being the public face of the organization, speaking at conferences or to the media.' },
  { id: 9, text: 'I am naturally curious and will invest time in understanding disruptive technologies or business models, even if they aren\'t immediately relevant to my P&L.' },
  { id: 10, text: 'I am sensitive to the morale of my team and consider their feelings when making difficult decisions.' },
  { id: 11, text: 'When a decision needs to be made, I trust my rational analysis over the consensus of the group.' },
  { id: 12, text: 'I rarely express my anxieties or stress to my team.' },
  { id: 13, text: 'I am quick to assert my perspective in high-level meetings.' },
  { id: 14, text: 'I find it more rewarding to create a collaborative, trusting team environment than to foster internal competition.' },
  { id: 15, text: 'I am more comfortable with established, proven methods than with highly experimental strategies.' },
  { id: 16, text: 'I am thorough and detail-oriented when preparing for board meetings or major presentations.' },
  { id: 17, text: 'I frequently worry about potential threats to the business that others may have overlooked.' },
  { id: 18, text: 'I prefer working in a quiet, focused environment to a bustling, highly interactive one.' },
  { id: 19, text: 'I am passionate about driving a culture of accountability and results.' },
  { id: 20, text: 'I find it easy to empathize with the professional challenges and personal situations of my direct reports.' },
  { id: 21, text: 'I am invigorated by change and thrive in environments of strategic ambiguity.' },
  { id: 22, text: 'I can become impatient with team members who are not as organized or disciplined as I am.' },
  { id: 23, text: 'In a negotiation, my focus is on achieving the optimal business outcome, even if it strains relationships.' },
  { id: 24, text: 'I am generally relaxed and don\'t let small problems or critiques get under my skin.' },
  { id: 25, text: 'I actively seek out diverse and even unconventional viewpoints to challenge my own thinking.' },
  { id: 26, text: 'I feel drained after long periods of social engagement, even if they are productive.' },
  { id: 27, text: 'I am confident in my ability to navigate volatile market conditions without becoming overly stressed.' },
  { id: 28, text: 'My colleagues would describe me as compassionate and approachable.' },
  { id: 29, text: 'I am not easily distracted; when I commit to a task, I see it through to completion.' },
  { id: 30, text: 'I enjoy taking the lead in group settings and guiding the direction of the conversation.' },
  { id: 31, text: 'I am willing to make unpopular decisions if I believe they are in the best long-term interest of the company.' },
  { id: 32, text: 'I have a strong appreciation for aesthetic and creative excellence in product design, marketing, or strategy.' },
  { id: 33, text: 'My mood remains stable and predictable, regardless of the pressures of the quarter.' },
  { id: 34, text: 'People who know me well would say I am driven by a strong sense of duty and responsibility.' },
  { id: 35, text: 'I am more of a private person and prefer to process information internally before speaking.' },
]

export const BIG_FIVE_TRAITS = [
  {
    key: 'openness',
    name: 'Openness to Experience',
    acronym: 'O',
    minScore: 6,
    maxScore: 30,
    items: [1, 9, 15, 21, 25, 32],
    reversedItems: [15],
    description: 'Reflects orientation towards innovation, intellectual curiosity, and strategic thinking. Comfort with the new, abstract, and ambiguous.',
    brackets: {
      high: {
        range: '22-30',
        min: 22,
        archetype: 'The Visionary / Innovator',
        summary: 'Strategic, forward-thinking leader who thrives on new ideas, embraces transformational change, and navigates complexity comfortably.',
        strengths: [
          'Driving innovation & disruptive business models',
          'Anticipating future trends and macro industry shifts',
          'Fostering a culture of continuous learning and agility',
          'Excelling at transformational enterprise change',
        ],
        watchOuts: [
          'Pursuing novel ideas at the expense of practical execution',
          'Overlooking granular operational details',
          'Impatience with slower implementation cadences',
          'Risk of creating strategic whiplash across teams',
        ],
      },
      moderate: {
        range: '15-21',
        min: 15,
        archetype: 'Balanced Strategic Thinker',
        summary: 'Balances tested operational models with selective innovation. Pragmatically adopts new approaches when business ROI is demonstrated.',
        strengths: [
          'Pragmatic adoption of technology and innovations',
          'Balanced risk-reward evaluation',
          'Stable execution with openness to process improvements',
        ],
        watchOuts: [
          'May hesitate during rapid industry disruption',
          'Can lean too conservative if data is incomplete',
        ],
      },
      low: {
        range: '6-14',
        min: 6,
        archetype: 'The Pragmatist / Optimizer',
        summary: 'Grounded, practical, and results-focused leader who values hard data, proven methodologies, operational excellence, and risk mitigation.',
        strengths: [
          'Ensuring rock-solid operational stability',
          'Flawless execution on existing business plans',
          'Laser focus on core business objectives and P&L',
          'Providing a steady hand during market volatility',
        ],
        watchOuts: [
          'Resistance to disruptive or non-linear change',
          'Dismissing unconventional or exploratory ideas prematurely',
          'Risk of being outmaneuvered by more agile market competitors',
        ],
      },
    },
  },
  {
    key: 'conscientiousness',
    name: 'Conscientiousness',
    acronym: 'C',
    minScore: 7,
    maxScore: 35,
    items: [3, 6, 16, 19, 22, 29, 34],
    reversedItems: [],
    description: 'Primary predictor of leadership effectiveness. Reflects discipline, reliability, planning, strategic follow-through, and drive for achievement.',
    brackets: {
      high: {
        range: '26-35',
        min: 26,
        archetype: 'The Driver / Executor',
        summary: 'Highly dependable, structured, and goal-oriented. Sets uncompromising standards for self and organization with powerful drive to deliver.',
        strengths: [
          'Flawless enterprise execution and milestone delivery',
          'Building institutional systems of accountability',
          'Relentless drive for quantifiable business results',
          'Pillar of reliability for boards, investors, and teams',
        ],
        watchOuts: [
          'Risk of micromanagement and bottlenecks',
          'Standards perceived as inflexible or perfectionistic',
          'Difficulty delegating when fearing slight drops in quality',
        ],
      },
      moderate: {
        range: '17-25',
        min: 17,
        archetype: 'Pragmatic Achiever',
        summary: 'Combines dependable delivery with pragmatic flexibility. Focuses on critical path deliverables without becoming paralyzed by details.',
        strengths: [
          'Healthy balance between rigor and velocity',
          'Empowers lieutenants while maintaining oversight',
          'Adapts schedules when strategic priorities shift',
        ],
        watchOuts: [
          'Occasional variance in follow-through across secondary initiatives',
        ],
      },
      low: {
        range: '7-16',
        min: 7,
        archetype: 'The Adaptable / Flexible Leader',
        summary: 'Spontaneous, highly agile, and comfortable operating with minimal rigid structure. Capable of rapid strategic pivots without attachment to prior plans.',
        strengths: [
          'Adapting instantaneously to sudden market shifts',
          'Fostering nimbleness and reducing corporate bureaucracy',
          'Encouraging creative problem-solving outside rigid rules',
        ],
        watchOuts: [
          'Struggling with multi-year planning and sustained follow-through',
          'Key operational details and risk checkpoints missed',
          'Team perceiving ambiguity or lack of clear accountability',
        ],
      },
    },
  },
  {
    key: 'extraversion',
    name: 'Extraversion',
    acronym: 'E',
    minScore: 7,
    maxScore: 35,
    items: [5, 8, 13, 18, 26, 30, 35],
    reversedItems: [18, 26, 35],
    description: 'Measures how energy is mobilized in social contexts, assertiveness, public presence, and role as the organization\'s external ambassador.',
    brackets: {
      high: {
        range: '26-35',
        min: 26,
        archetype: 'The Influencer / Ambassador',
        summary: 'Energized by external interaction, naturally assertive, compelling in public forums, and skilled at energizing broad teams and stakeholders.',
        strengths: [
          'Compelling public face for the organization (media, investors, conferences)',
          'Building extensive networks of strategic influence and alliances',
          'Motivating, inspiring, and energizing large enterprise workforces',
          'Taking decisive command in high-stakes group settings',
        ],
        watchOuts: [
          'Quick to speak and slow to actively listen',
          'Overshadowing introverted thinkers whose strategic insights are critical',
          'Risk of dominating discussions and creating group compliance',
        ],
      },
      moderate: {
        range: '17-25',
        min: 17,
        archetype: 'Situational Communicator',
        summary: 'Flexes between public advocacy and quiet strategic analysis based on organizational requirements. Comfortable on stage or behind the scenes.',
        strengths: [
          'Effective in both large keynotes and intimate executive working sessions',
          'Balances speaking with active listening',
          'Conserves energy strategically across long travel cadences',
        ],
        watchOuts: [
          'May need intentional activation to drive networking momentum',
        ],
      },
      low: {
        range: '7-16',
        min: 7,
        archetype: 'The Reflective / Analytical Leader',
        summary: 'Reserved, deliberate, and deeply thoughtful. Gains energy from internal reflection and prioritizes focused 1-on-1 strategic dialogue.',
        strengths: [
          'Deep, rigorous consideration of complex challenges',
          'Exceptional active listening and emotional presence',
          'Projecting a calm, unflappable, and gravitas-rich demeanor',
          'Creating space for others to take the spotlight and shine',
        ],
        watchOuts: [
          'May lack sufficient visibility across broader employee base',
          'Reserved nature misinterpreted as aloofness or lack of passion',
          'Voice occasionally overshadowed in aggressive board or conference environments',
        ],
      },
    },
  },
  {
    key: 'agreeableness',
    name: 'Agreeableness',
    acronym: 'A',
    minScore: 8,
    maxScore: 40,
    items: [4, 10, 11, 14, 20, 23, 28, 31],
    reversedItems: [4, 11, 23, 31],
    description: 'Relates to approach to collaboration, constructive conflict, compassion, trust, and balancing organizational empathy with firm accountability.',
    brackets: {
      high: {
        range: '30-40',
        min: 30,
        archetype: 'The Collaborator / Coach',
        summary: 'Deeply empathetic, trusting, and committed to psychological safety and team morale. Excels at mentorship, culture building, and consensus.',
        strengths: [
          'Fostering exceptional team cohesion and psychological safety',
          'Building profound organizational loyalty and retention',
          'Skilled collaborative negotiator and conflict resolver',
          'Compassionate, supportive, and accessible leadership style',
        ],
        watchOuts: [
          'Hesitation to engage in necessary high-stakes conflict',
          'Delaying difficult personnel exits or departmental cuts',
          'Prioritizing social harmony over holding poor performers accountable',
        ],
      },
      moderate: {
        range: '19-29',
        min: 19,
        archetype: 'Balanced Diplomat',
        summary: 'Pairs genuine empathy with clear performance expectations. Able to deliver tough feedback with respect and support.',
        strengths: [
          'Practices constructive candor and directness',
          'Maintains strong rapport without compromising business imperatives',
          'Protects company culture while demanding high execution',
        ],
        watchOuts: [
          'May occasionally experience internal friction between people and P&L priorities',
        ],
      },
      low: {
        range: '8-18',
        min: 8,
        archetype: 'The Challenger / Analyst',
        summary: 'Analytical, objective, and fearless in challenging sacred cows. Prioritizes optimal business ROI and shareholder outcomes over social harmony.',
        strengths: [
          'Making difficult, unpopular decisions with swift decisiveness',
          'Providing unvarnished, highly objective performance critiques',
          'Challenging the status quo and aggressively eliminating groupthink',
          'Holding rigorous, unsentimental boundaries in commercial negotiations',
        ],
        watchOuts: [
          'Perceived as abrasive, overly critical, or unconcerned with morale',
          'Can inadvertently create an atmosphere of fear or defensive behavior',
          'Straining key relationships during critical turnaround periods',
        ],
      },
    },
  },
  {
    key: 'emotional_stability',
    name: 'Emotional Stability (Ocean Stability)',
    acronym: 'N',
    minScore: 7,
    maxScore: 35,
    items: [2, 7, 12, 17, 24, 27, 33],
    reversedItems: [17],
    description: 'Capacity for resilience, stress regulation, and steady executive composure. Acts as the organizational "non-anxious presence" during crises.',
    brackets: {
      high: {
        range: '26-35',
        min: 26,
        archetype: 'The Anchor / Stabilizer',
        summary: 'Imperturbably calm, highly resilient, and emotionally steady under severe market or operational pressures. Unshakeable beacon of stability.',
        strengths: [
          'Leading effectively and decisively through catastrophic crises',
          'Maintaining infectious optimism and grounded confidence',
          'Clear-headed, uncompromised decision-making under intense duress',
          'Creating a predictable, tranquil emotional climate for the entire company',
        ],
        watchOuts: [
          'May underestimate legitimate operational or market risks',
          'Can appear disconnected from the acute anxiety felt by staff',
          'Risk of being perceived as unfeeling or dismissive of legitimate urgency',
        ],
      },
      moderate: {
        range: '17-25',
        min: 17,
        archetype: 'Measured Realist',
        summary: 'Recognizes operational stress points realistically while maintaining executive poise. Absorbs pressure without transmitting panic.',
        strengths: [
          'Healthy sensitivity to real risks coupled with steady execution',
          'Acknowledges team stress constructively without amplifying it',
          'Demonstrates authentic human leadership under adversity',
        ],
        watchOuts: [
          'Extended periods of crisis require intentional recovery to avoid burnout',
        ],
      },
      low: {
        range: '7-16',
        min: 7,
        archetype: 'The Sensitive / Vigilant Leader',
        summary: 'Intensely attuned to risk, potential vulnerabilities, and what could go wrong. Deeply sensitive to team sentiment and market shifts.',
        strengths: [
          'Anticipating risk and threats before others see them',
          'Proactive risk mitigation and contingency readiness',
          'High sensitivity and attunement to emotional undercurrents in the team',
        ],
        watchOuts: [
          'Anxiety can be contagious and trigger panic across leadership ranks',
          'Hesitation or analysis-paralysis due to catastrophizing',
          'High risk of personal burnout and executive fatigue',
        ],
      },
    },
  },
]

export const BIG_FIVE_ASSESSMENT_DATA = {
  id: 6,
  title: 'The Senior Leader\'s Big 5 Personality Profile Assessment',
  subtitle: 'A Strategic Mirror & Scientifically Validated OCEAN Diagnostic for Senior Executive Leadership Optimization',
  foreword:
    'In the complex, high-stakes environment of senior leadership, your personality is not just a set of personal preferences; it is a strategic tool. How you think, act, and interact directly shapes overall organizational culture, strategy, performance, and success both inside and outside the organization.\n\nThe Big 5 model (also known as OCEAN) is the most respected and scientifically validated framework for understanding personality. This assessment will provide you with a clear, nuanced profile across the five core dimensions of your personality, translated into the language of executive leadership.',
  statements: BIG_FIVE_STATEMENTS,
  traits: BIG_FIVE_TRAITS,
}

// Calculate reverse score: 1->5, 2->4, 3->3, 4->2, 5->1
export function getScoreForAnswer(val, isReversed = false) {
  const num = parseInt(val, 10)
  if (isNaN(num) || num < 1 || num > 5) return 0
  if (isReversed) {
    return 6 - num
  }
  return num
}

export function calculateBigFiveScores(answersMap = {}) {
  let totalAnswered = 0

  BIG_FIVE_STATEMENTS.forEach((s) => {
    const raw = answersMap[s.id] || answersMap[String(s.id)]
    if (raw && parseInt(raw, 10) >= 1 && parseInt(raw, 10) <= 5) {
      totalAnswered++
    }
  })

  const traitResults = BIG_FIVE_TRAITS.map((trait) => {
    let rawScore = 0
    let answeredItems = 0

    trait.items.forEach((itemId) => {
      const raw = answersMap[itemId] || answersMap[String(itemId)]
      const isReversed = trait.reversedItems.includes(itemId)
      if (raw && parseInt(raw, 10) >= 1 && parseInt(raw, 10) <= 5) {
        answeredItems++
        rawScore += getScoreForAnswer(raw, isReversed)
      }
    })

    const isComplete = answeredItems === trait.items.length
    const scoreRange = trait.maxScore - trait.minScore
    const percentage = scoreRange > 0
      ? Math.round(Math.max(0, Math.min(100, ((rawScore - trait.minScore) / scoreRange) * 100)))
      : 0

    let category = 'Moderate'
    let bracket = trait.brackets.moderate

    if (rawScore >= trait.brackets.high.min) {
      category = 'High'
      bracket = trait.brackets.high
    } else if (rawScore < trait.brackets.moderate.min) {
      category = 'Low'
      bracket = trait.brackets.low
    }

    return {
      key: trait.key,
      name: trait.name,
      acronym: trait.acronym,
      rawScore,
      minScore: trait.minScore,
      maxScore: trait.maxScore,
      percentage,
      answeredItems,
      totalItems: trait.items.length,
      isComplete,
      category,
      archetype: bracket.archetype,
      summary: bracket.summary,
      strengths: bracket.strengths,
      watchOuts: bracket.watchOuts,
    }
  })

  const isFullyComplete = totalAnswered === BIG_FIVE_STATEMENTS.length

  return {
    totalStatements: BIG_FIVE_STATEMENTS.length,
    totalAnswered,
    isFullyComplete,
    traits: traitResults,
  }
}

