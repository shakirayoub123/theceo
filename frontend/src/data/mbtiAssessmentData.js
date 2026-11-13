export const MBTI_ASSESSMENT_DATA = {
  id: 1,
  title: 'MBTI – MEYERS-BRIGGS PERSONALITY PROFILE ASSESSMENT 1',
  subtitle: 'The Executive Leader Personality Profile (ELPP) — Based on the Myers-Briggs Typology Framework',
  overview:
    'This comprehensive personality profile assessment tool is crafted specifically for the senior executive context and is custom tailored for the complexities and demands of senior executive leadership. By focusing on how personality preferences manifest in high-stakes environments of strategy, leadership, and organizational management you will gain valuable insights and strategic takeaways that can optimize your leadership style and overall organizational results.',
  secondaryOverview:
    'This tool is not meant to be a restrictive label, but rather a powerful instrument for self-awareness to illuminate by providing a structured framework for self-awareness, enhancing leadership effectiveness, and fostering a deeper understanding of your impact on your team and organization. By understanding your innate personality preferences, you can unlock new levels of effectiveness in your strategic decision-making, team leadership, and interpersonal communications. By fully understanding and leveraging your personality profile type, it will provide you with a framework to maximize your key internal/external stakeholder relationships, while fully understanding and optimizing your personal leadership style to gain new personal and professional results not previously attained.',
  objective:
    'To provide senior leaders with a clear, actionable understanding of their innate preferences in how they gain energy, process information, make decisions, and organize their world. This awareness is the foundation for effective, authentic adaptive leadership.',
  instructions:
    'For each of the 20 questions below, please select the statement (A or B) that is more naturally you. Do not overthink your answers. Your initial, gut-level response is often the most accurate. This is not a test; there are no right or wrong answers.',
  sections: [
    {
      id: 1,
      name: 'Section 1: How You Direct and Receive Energy – Your Source of Power',
      dimension: 'EI',
      traitA: 'E',
      traitB: 'I',
      questions: [
        {
          id: 1,
          prompt: 'When facing a critical strategic challenge, you are more likely to:',
          optionA: {
            text: 'Immediately call a meeting to brainstorm, talk through the issues, and generate energy with your team.',
            trait: 'E',
          },
          optionB: {
            text: 'Schedule time for solitary reflection to process the variables and formulate your initial thoughts before engaging others.',
            trait: 'I',
          },
        },
        {
          id: 2,
          prompt: 'After a long week of board meetings and high-level negotiations, you feel:',
          optionA: {
            text: "Energized and \"in the zone,\" ready to connect with colleagues or your network socially.",
            trait: 'E',
          },
          optionB: {
            text: 'Drained and in need of quiet time to decompress and recharge your internal batteries.',
            trait: 'I',
          },
        },
        {
          id: 3,
          prompt: 'In a large industry conference or networking event, you tend to:',
          optionA: {
            text: 'Work the room, engaging with a wide variety of people and initiating many conversations.',
            trait: 'E',
          },
          optionB: {
            text: 'Seek out a few meaningful, in-depth conversations with key individuals you already know or wish to know better.',
            trait: 'I',
          },
        },
        {
          id: 4,
          prompt: 'Your communication style is generally:',
          optionA: {
            text: 'Outwardly expressive; you often think aloud and find clarity through dialogue.',
            trait: 'E',
          },
          optionB: {
            text: 'Internally focused; you prefer to compose your thoughts fully before speaking.',
            trait: 'I',
          },
        },
        {
          id: 5,
          prompt: 'When leading a major company-wide announcement, you are most comfortable:',
          optionA: {
            text: 'On stage, feeding off the energy of the crowd and engaging directly with the audience.',
            trait: 'E',
          },
          optionB: {
            text: 'Having prepared meticulously, focusing on the clear delivery of a well-rehearsed message, perhaps followed by structured Q&A.',
            trait: 'I',
          },
        },
      ],
    },
    {
      id: 2,
      name: 'Section 2: How You Perceive Information – Your View of Reality',
      dimension: 'SN',
      traitA: 'S',
      traitB: 'N',
      questions: [
        {
          id: 6,
          prompt: 'When reviewing a new business proposal, you focus first on:',
          optionA: {
            text: 'The concrete data, performance metrics, historical precedents, and verifiable facts presented.',
            trait: 'S',
          },
          optionB: {
            text: 'The overarching vision, the innovative potential, the future trends it connects to, and the "big picture."',
            trait: 'N',
          },
        },
        {
          id: 7,
          prompt: 'To solve a complex operational problem, you trust:',
          optionA: {
            text: 'Proven methods and practical, real-world experience. You want to know what has worked before.',
            trait: 'S',
          },
          optionB: {
            text: 'Unconventional insights and theoretical models. You are intrigued by new, untested possibilities.',
            trait: 'N',
          },
        },
        {
          id: 8,
          prompt: 'When absorbing a market analysis report, you are more interested in:',
          optionA: {
            text: 'The specific details, figures, and sequential steps outlined in the findings.',
            trait: 'S',
          },
          optionB: {
            text: 'The underlying patterns, themes, and future implications that can be inferred from the data.',
            trait: 'N',
          },
        },
        {
          id: 9,
          prompt: 'You would describe your approach as more:',
          optionA: {
            text: 'Grounded and realistic, focused on the immediate realities of "what is."',
            trait: 'S',
          },
          optionB: {
            text: 'Visionary and conceptual, focused on the future possibilities of "what could be."',
            trait: 'N',
          },
        },
        {
          id: 10,
          prompt: 'In strategic planning, you are most skilled at:',
          optionA: {
            text: 'Developing detailed, step-by-step implementation plans and ensuring feasibility.',
            trait: 'S',
          },
          optionB: {
            text: 'Generating the high-level strategic vision and inspiring others with its potential.',
            trait: 'N',
          },
        },
      ],
    },
    {
      id: 3,
      name: 'Section 3: How You Make Decisions – Your Basis for Judgment',
      dimension: 'TF',
      traitA: 'T',
      traitB: 'F',
      questions: [
        {
          id: 11,
          prompt: 'When making a difficult decision, such as a departmental restructuring, your primary driver is:',
          optionA: {
            text: 'An objective analysis of logic, business principles, and impartial criteria to find the most effective outcome.',
            trait: 'T',
          },
          optionB: {
            text: 'The impact on the people involved, company culture, and core values, seeking a harmonious and compassionate outcome.',
            trait: 'F',
          },
        },
        {
          id: 12,
          prompt: 'Your feedback to a direct report is more likely to be:',
          optionA: {
            text: 'Direct, candid, and focused on the logical critique of their performance and areas for improvement.',
            trait: 'T',
          },
          optionB: {
            text: 'Diplomatic, encouraging, and focused on maintaining morale and preserving the relationship.',
            trait: 'F',
          },
        },
        {
          id: 13,
          prompt: 'You believe a fair leader is someone who:',
          optionA: {
            text: 'Applies rules and policies consistently and equitably to everyone, without exception.',
            trait: 'T',
          },
          optionB: {
            text: 'Considers the unique circumstances of each individual situation, seeking fairness through flexibility.',
            trait: 'F',
          },
        },
        {
          id: 14,
          prompt: 'When a strategic choice pits efficiency against team morale, you instinctively lean towards:',
          optionA: {
            text: "The path that the data and analysis show to be the most logical and effective for the business, even if it's unpopular.",
            trait: 'T',
          },
          optionB: {
            text: "The path that best supports your team and aligns with organizational values, even if it's less efficient.",
            trait: 'F',
          },
        },
        {
          id: 15,
          prompt: 'You are most persuaded by an argument that is:',
          optionA: {
            text: 'Well-reasoned, logically sound, and supported by objective evidence.',
            trait: 'T',
          },
          optionB: {
            text: 'Compelling, value-driven, and considers the human element of the situation.',
            trait: 'F',
          },
        },
      ],
    },
    {
      id: 4,
      name: 'Section 4: How You Approach the Outer World – Your Work Style',
      dimension: 'JP',
      traitA: 'J',
      traitB: 'P',
      questions: [
        {
          id: 16,
          prompt: 'At the start of a major project, you feel most comfortable when you have:',
          optionA: {
            text: 'A clear plan, established milestones, and firm deadlines from the outset.',
            trait: 'J',
          },
          optionB: {
            text: 'A flexible outline that allows for new information, emergent strategies, and adaptation as the project evolves.',
            trait: 'P',
          },
        },
        {
          id: 17,
          prompt: 'Your typical workday is:',
          optionA: {
            text: 'Structured and scheduled. You prefer to complete tasks and make decisions decisively to achieve closure.',
            trait: 'J',
          },
          optionB: {
            text: 'Spontaneous and open-ended. You enjoy juggling multiple priorities and thrive on last-minute adaptations.',
            trait: 'P',
          },
        },
        {
          id: 18,
          prompt: 'You view deadlines as:',
          optionA: {
            text: 'Critical anchors; fixed points to be met to ensure order and progress.',
            trait: 'J',
          },
          optionB: {
            text: 'Malleable guidelines; useful targets that can be adjusted as new priorities emerge.',
            trait: 'P',
          },
        },
        {
          id: 19,
          prompt: 'When a meeting concludes, you prefer to leave with:',
          optionA: {
            text: 'A clear set of action items, assigned responsibilities, and a settled decision.',
            trait: 'J',
          },
          optionB: {
            text: 'A list of interesting options and possibilities to explore further before committing to a final plan.',
            trait: 'P',
          },
        },
        {
          id: 20,
          prompt: 'In your leadership style, you value:',
          optionA: {
            text: 'Organization and control. You like to see things settled, sorted, and moving according to plan.',
            trait: 'J',
          },
          optionB: {
            text: 'Adaptability and curiosity. You like to keep your options open and respond to the flow of events.',
            trait: 'P',
          },
        },
      ],
    },
  ],
  traitDescriptions: {
    EI: {
      title: 'Dichotomy 1: Energy and Focus (E vs. I)',
      E: {
        title: 'The Extraverted (E) Leader: Focus on Action and Breadth',
        subtitle:
          'You are energized by external engagement and interaction. You are an outwardly focused leader who processes information best through active discussion and engagement with your environment and people.',
        behaviors: [
          'You are energized by back-to-back meetings and external-facing activities.',
          'You tend to "think out loud," using conversation to clarify your thoughts.',
          'You are naturally skilled at networking and building a wide range of contacts.',
          'You prefer to communicate by talking rather than writing.',
          'You are typically expressive, accessible, and highly visible within the organization.',
          'You are comfortable being the center of attention and acting as the public face of the company.',
        ],
      },
      I: {
        title: 'The Introverted (I) Leader: Focus on Reflection and Depth',
        subtitle:
          'You are energized by internal reflection and focused concentration. You are an inwardly focused leader who processes information best by quietly contemplating concepts and ideas before acting.',
        behaviors: [
          'You feel drained by excessive external demands and require private time to recharge.',
          'You fully process your thoughts internally before you speak.',
          'You prefer deep, one-on-one relationships with a few key stakeholders.',
          'You prefer to communicate in writing (e.g., memos, emails) to ensure precision.',
          'You project a calm, reserved, and observant demeanor.',
          'You create space for others to talk and are often perceived as an excellent listener.',
        ],
      },
    },
    SN: {
      title: 'Dichotomy 2: Information Gathering (S vs. N)',
      S: {
        title: 'The Sensing (S) Leader: The Realist and Pragmatist',
        subtitle:
          'You trust tangible, concrete information that can be verified by the senses. You are a practical, grounded leader who focuses on the specific details of the present reality and past experience.',
        behaviors: [
          'You prioritize facts, figures, and direct experience when making a case.',
          'You are highly attuned to the details of an operational plan.',
          'You rely on proven, established methods and trust what has worked in the past.',
          'You build your strategy sequentially, from the ground up, ensuring each step is solid.',
          'You are most comfortable dealing with the immediate, practical challenges of the business.',
          'You ask "what" and "how" questions to ensure clarity and feasibility.',
        ],
      },
      N: {
        title: 'The Intuitive (N) Leader: The Visionary and Innovator',
        subtitle:
          'You trust patterns, connections, and abstract possibilities. You are a conceptual, future-focused leader who is more interested in the "big picture" and inspiring a vision of what could be.',
        behaviors: [
          'You prioritize future possibilities, emerging trends, and the overarching vision.',
          'You are skilled at connecting disparate ideas to create novel strategies.',
          'You are energized by complexity, ambiguity, and the challenge of innovation.',
          'You build your strategy from the top down, starting with the end vision.',
          'You are most comfortable discussing long-range possibilities and inspiring change.',
          'You ask "why" and "what if" questions to challenge the status quo.',
        ],
      },
    },
    TF: {
      title: 'Dichotomy 3: Decision Making (T vs. F)',
      T: {
        title: 'The Thinking (T) Leader: The Analyst and Strategist',
        subtitle:
          'You make decisions based on objective logic, principles, and impersonal analysis. You are a firm-minded leader who seeks rational order and approaches situations with an analytical, critical eye.',
        behaviors: [
          'You can detach emotionally to make tough, objective decisions for the good of the business.',
          'You value consistency, logic, and fairness defined as treating everyone by the same standards.',
          'Your analysis is driven by pros and cons, cost-benefit ratios, and logical consequences.',
          'You are motivated by achieving strategic goals and effective outcomes.',
          'You are skilled at identifying flaws, critiquing strategies, and holding people accountable to the facts.',
          'You may be perceived as direct, decisive, and sometimes tough.',
        ],
      },
      F: {
        title: 'The Feeling (F) Leader: The Harmonizer and Motivator',
        subtitle:
          'You make decisions based on personal values, empathy, and the impact on people. You are a people-focused leader who seeks consensus and approaches situations with an eye toward harmony and morale.',
        behaviors: [
          'You naturally consider the human impact of every strategic decision.',
          'You value empathy, consensus, and fairness defined as considering individual circumstances.',
          'Your analysis is driven by how decisions align with company values and affect stakeholders.',
          'You are motivated by creating a positive, collaborative culture and developing people.',
          'You are skilled at persuasion, building buy-in, and recognizing the contributions of others.',
          'You may be perceived as diplomatic, supportive, and sometimes accommodating.',
        ],
      },
    },
    JP: {
      title: 'Dichotomy 4: Outer World Approach (J vs. P)',
      J: {
        title: 'The Judging (J) Leader: The Organizer and Executor',
        subtitle:
          'You approach the world in a planned, orderly, and decisive way. You are a structured leader who values closure and control, preferring to have things settled and organized.',
        behaviors: [
          'You thrive on creating clear plans, schedules, and Standard Operating Procedures (SOPs).',
          'You feel a sense of urgency to make decisions and move on to the next task.',
          'You are highly organized, methodical, and results-oriented.',
          'You are uncomfortable with ambiguity and work to establish clarity and structure.',
          'You drive projects to completion and have a strong respect for deadlines.',
          'You lead by establishing direction, setting goals, and managing execution.',
        ],
      },
      P: {
        title: 'The Perceiving (P) Leader: The Adapter and Explorer',
        subtitle:
          'You approach the world in a flexible, spontaneous, and open-ended way. You are an adaptive leader who values keeping options open and responding to emergent opportunities.',
        behaviors: [
          'You thrive in dynamic environments where you can react to new information.',
          'You prefer to keep your options open and resist making decisions until necessary.',
          'You are curious, adaptable, and process-oriented, enjoying the journey of discovery.',
          'You are comfortable with ambiguity and enjoy the freedom of a flexible structure.',
          'You view deadlines as flexible targets and are willing to change course as needed.',
          'You lead by facilitating exploration, asking questions, and empowering autonomy.',
        ],
      },
    },
  },
  nextSteps: [
    {
      title: 'Strengths & Blind Spots',
      text: 'Where do your natural personality type preferences give you a distinct advantage? Where might they create blind spots that require you to consciously adapt to improve outcomes?',
    },
    {
      title: 'Team Composition',
      text: 'How does your style complement or conflict with the styles of your direct reports and all internal/external key stakeholders and board members? How can you build an effective leadership team with diverse preferences to ensure balanced key decision-making?',
    },
    {
      title: 'Communication & Influence',
      text: 'How can you adjust your communication style to be more influential with all stakeholders who have different personality preferences and background components? (e.g., A Thinking leader presenting to a Feeling-oriented board and different educational backgrounds, social/cultural influences, personal/professional backgrounds).',
    },
    {
      title: 'Effective Positive Change Leadership',
      text: 'How does your preference for either structure (J) or flexibility (P) impact how you lead your organization through change? What are the key indicators to challenges or successes?',
    },
  ],
  conclusion:
    'We will use this detailed profile as a cornerstone of our coaching work to build strategies that leverage your authentic strengths while developing the versatility required of world-class executive leadership. By understanding these preferences, you can better shape your environment, build a complementary leadership team, and communicate and connect more effectively with your board, employees, and key stakeholders internally and externally. True leadership mastery comes from leveraging your natural strengths while consciously developing strategies to manage your blind spots and turn your weaknesses into strengths.',
}

export function calculateMbtiScore(answersMap = {}) {
  let counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }

  MBTI_ASSESSMENT_DATA.sections.forEach((section) => {
    section.questions.forEach((q) => {
      const choice = answersMap[q.id] || answersMap[String(q.id)]
      if (choice === 'A' || choice === q.optionA.text) {
        counts[q.optionA.trait] = (counts[q.optionA.trait] || 0) + 1
      } else if (choice === 'B' || choice === q.optionB.text) {
        counts[q.optionB.trait] = (counts[q.optionB.trait] || 0) + 1
      }
    })
  })

  const letter1 = counts.E >= counts.I ? (counts.E === counts.I ? (counts.E > 0 ? 'E' : '-') : 'E') : 'I'
  const letter2 = counts.S >= counts.N ? (counts.S === counts.N ? (counts.S > 0 ? 'S' : '-') : 'S') : 'N'
  const letter3 = counts.T >= counts.F ? (counts.T === counts.F ? (counts.T > 0 ? 'T' : '-') : 'T') : 'F'
  const letter4 = counts.J >= counts.P ? (counts.J === counts.P ? (counts.J > 0 ? 'J' : '-') : 'J') : 'P'

  const profile = `${letter1}${letter2}${letter3}${letter4}`
  const totalAnswered = Object.values(counts).reduce((a, b) => a + b, 0)

  return {
    counts,
    profile: profile.includes('-') && totalAnswered < 20 ? profile : profile,
    totalAnswered,
    isComplete: totalAnswered === 20,
  }
}

