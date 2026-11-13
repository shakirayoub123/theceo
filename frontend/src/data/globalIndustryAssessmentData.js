export const GLOBAL_INDUSTRY_DATA = {
  id: 5,
  title: 'Global Industry Experience Assessment: Senior Executive Leaders',
  subtitle: 'A Quantitative & Sectoral Mapping of Executive Breadth, Functional Depth & Cross-Industry Experience',
  instructions:
    'Please review the industry categories below. For each industry where you possess professional work experience, check the corresponding box. Then, indicate the total number of years you have worked within that specific industry, rounding to the nearest half-year (e.g., 5.5 years, 10 years). If you have experience across multiple sub-sectors within a main industry, sum your total years within that primary category.',
  part1: {
    title: 'Part 1: Core Industry Experience',
    categories: [
      {
        id: 1,
        name: 'Technology & Software',
        subsectors: [
          'Software Development / Engineering',
          'IT Services / Consulting',
          'Cybersecurity',
          'Cloud Computing / SaaS',
          'Hardware Manufacturing',
          'Telecommunications',
          'E-commerce / Online Platforms',
          'Artificial Intelligence / Machine Learning',
          'Data Analytics / Big Data',
        ],
      },
      {
        id: 2,
        name: 'Financial Services',
        subsectors: [
          'Retail Banking',
          'Investment Banking / Capital Markets',
          'Wealth Management / Private Banking',
          'Asset Management',
          'Insurance (Life, Property & Casualty, Reinsurance)',
          'Fintech',
          'Private Equity / Venture Capital',
          'Risk Management / Compliance',
        ],
      },
      {
        id: 3,
        name: 'Healthcare & Pharmaceuticals',
        subsectors: [
          'Pharmaceutical Manufacturing',
          'Biotechnology',
          'Medical Devices',
          'Hospitals / Healthcare Providers',
          'Healthcare Administration / Management',
          'Health Insurance',
          'Clinical Research / R&D',
        ],
      },
      {
        id: 4,
        name: 'Manufacturing & Industrials',
        subsectors: [
          'Automotive',
          'Aerospace & Defense',
          'Heavy Machinery / Equipment',
          'Consumer Goods Manufacturing',
          'Industrial Components / Materials',
          'Supply Chain & Logistics (Manufacturing focus)',
          'Engineering & Construction',
        ],
      },
      {
        id: 5,
        name: 'Consumer Goods & Retail',
        subsectors: [
          'Food & Beverage',
          'Apparel & Fashion',
          'Home Goods & Durables',
          'Personal Care Products',
          'Luxury Goods',
          'Brick-and-Mortar Retail',
          'E-commerce Retail',
          'Wholesale / Distribution',
        ],
      },
      {
        id: 6,
        name: 'Energy & Utilities',
        subsectors: [
          'Oil & Gas (Upstream, Midstream, Downstream)',
          'Renewable Energy (Solar, Wind, Hydro)',
          'Utilities (Electricity, Water, Gas Distribution)',
          'Power Generation',
          'Energy Trading / Markets',
        ],
      },
      {
        id: 7,
        name: 'Professional Services & Consulting',
        subsectors: [
          'Management Consulting',
          'Strategy Consulting',
          'Human Resources Consulting',
          'IT Consulting (if not primarily technology focused)',
          'Legal Services',
          'Accounting / Audit Services',
          'Marketing / Advertising Agencies',
        ],
      },
      {
        id: 8,
        name: 'Media, Entertainment & Telecommunications',
        subsectors: [
          'Film & Television Production / Distribution',
          'Digital Media / Publishing',
          'Gaming',
          'Music Industry',
          'Sports Management',
          'Broadcasting (Radio, TV)',
          'Telecommunications Services (e.g., mobile carriers)',
        ],
      },
      {
        id: 9,
        name: 'Real Estate & Construction',
        subsectors: [
          'Commercial Real Estate Development',
          'Residential Real Estate Development',
          'Real Estate Investment / Management',
          'Construction Management',
          'Architecture / Design',
        ],
      },
      {
        id: 10,
        name: 'Government & Public Sector',
        subsectors: [
          'National / Federal / Central Government',
          'Local / State / Federal Government',
          'Municipal / Province / Regional Government',
          'Public Administration / Policy',
          'Non-Profit Organizations (Large-scale, advocacy-focused)',
        ],
      },
      {
        id: 11,
        name: 'Education',
        subsectors: [
          'Higher Education Administration',
          'K-12 Education Administration',
          'Educational Technology (EdTech)',
          'Corporate Learning & Development (as a primary industry)',
        ],
      },
      {
        id: 12,
        name: 'Transportation & Logistics',
        subsectors: [
          'Shipping / Maritime',
          'Airlines / Aviation',
          'Trucking / Road Freight',
          'Rail Transportation',
          'Supply Chain Management (primary focus on logistics)',
          'Warehousing / Distribution Centers',
        ],
      },
      {
        id: 13,
        name: 'Agriculture & Food Production',
        subsectors: [
          'Farming / Crop Production',
          'Livestock / Animal Agriculture',
          'Food Processing',
          'Agribusiness Management',
        ],
      },
    ],
  },
  part2: {
    title: 'Part 2: Specialized Cross-Industry Experience',
    description: 'This section is for experiences that span multiple industries but represent a distinct area of executive functional expertise.',
    categories: [
      {
        id: 14,
        name: 'Environmental, Social, and Governance (ESG) / Sustainability',
        subsectors: [
          'ESG Strategy / Consulting',
          'Renewable Energy Development / Project Management',
          'Environmental Consulting / Remediation',
          'Social Impact / Community Development',
          'Sustainable Finance',
        ],
      },
      {
        id: 15,
        name: 'Data Science & Analytics (Cross-Industry)',
        subsectors: [
          'Data Science Leadership / Management',
          'Business Intelligence (BI) Leadership',
          'AI/ML Strategy & Implementation (if primary role is cross-industry)',
          'Advanced Analytics Consulting',
        ],
      },
      {
        id: 16,
        name: 'Cybersecurity (Cross-Industry)',
        subsectors: [
          'Cybersecurity Strategy / Consulting',
          'Security Operations Leadership',
          'GRC (Governance, Risk, Compliance) - Cybersecurity Focus',
        ],
      },
      {
        id: 17,
        name: 'Mergers & Acquisitions (M&A) / Corporate Development',
        subsectors: [
          'M&A Strategy / Integration Leadership',
          'Corporate Development (identifying and executing acquisitions)',
          'Due Diligence Leadership',
        ],
      },
      {
        id: 18,
        name: 'Global Operations / International Business',
        subsectors: [
          'Leading Multi-National Operations',
          'International Market Entry / Expansion',
          'Cross-Cultural Team Leadership',
          'Global Supply Chain Management (if primary focus is global)',
        ],
      },
    ],
  },
  reflection: {
    title: 'Reflection and Next Steps',
    description:
      'This assessment provides a clear snapshot of your professional industry journey. Understanding the breadth and depth of your experience across various sectors is crucial for strategic career planning, identifying areas for further development, and leveraging your unique executive profile.',
    keyPoints: [
      'Identifying patterns and themes in your career trajectory.',
      'Leveraging transferable skills across industries.',
      'Pinpointing areas for growth or targeted industry exposure.',
      'Crafting your executive narrative based on your diverse experience.',
    ],
  },
}

export function getAllIndustryCategories() {
  return [
    ...GLOBAL_INDUSTRY_DATA.part1.categories.map((c) => ({ ...c, type: 'Core Industry' })),
    ...GLOBAL_INDUSTRY_DATA.part2.categories.map((c) => ({ ...c, type: 'Specialized Cross-Industry' })),
  ]
}

export function calculateIndustrySummary(experienceState = {}) {
  const all = getAllIndustryCategories()
  let totalYears = 0
  let activeIndustriesCount = 0
  let totalSubsectorsSelected = 0

  all.forEach((cat) => {
    const data = experienceState[cat.id] || {}
    const years = parseFloat(data.years) || 0
    const subs = Array.isArray(data.subsectors) ? data.subsectors : []

    if (years > 0 || subs.length > 0) {
      activeIndustriesCount++
      totalYears += years
      totalSubsectorsSelected += subs.length
    }
  })

  return {
    totalCategories: all.length,
    activeIndustriesCount,
    totalYears: Math.round(totalYears * 10) / 10,
    totalSubsectorsSelected,
  }
}

