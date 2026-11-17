import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        services: 'Services',
        salientFeatures: 'Salient Features',
        influencers: 'Influencers',
        testimonials: 'Testimonials',
        insights: 'Insights',
        caseStudies: 'Case Studies',
        connect: 'Connect',
        login: 'Login',
        dashboard: 'Dashboard',
        about: 'About',
        blog: 'Blog',
        contact: 'Contact',
      },
      // Hero Section
      hero: {
        tag: 'Building Better Leaders',
        title: 'Positively ',
        titleHighlight: 'Redefining',
        titleEnd: '21st Century Leadership.',
        subtitle:
          'The CEO Influencers is a next-generation executive leadership and organizational performance optimization coaching consultancy that empowers leaders from start-ups to multinational corporations to maximize success in the 21st-century global business marketplace.',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' is a next-generation executive leadership and organizational performance optimization coaching consultancy that empowers leaders from start-ups to multinational corporations to maximize success in the 21st-century global business marketplace.',
        cta: 'Get Started',
        buttons: {
          viewVideo: 'View Introduction Video',
          scheduleCall: 'Schedule A Discovery Call',
        },
        tickerItems: [
          'Microsoft', 'IBM', 'Apple', 'Google', 'U.S./UK Government Agencies',
          'U.S. Congress', 'Northrop Grumman', 'Ball Aerospace', 'ExxonMobil',
          'Dow Inc.', 'United Airlines', 'Boeing', 'UnitedHealthcare',
          'Merrill Lynch', 'Goldman Sachs', 'Citicorp', 'JPMorgan Chase & Co.',
          'FINRA', 'Visa', 'Ford', 'BMW', 'Toyota', 'Wyndham Hotels & Resorts Inc.',
          'Higher Education', 'and other leading global organizations.'
        ],
        railItems: {
          overview: 'OVERVIEW',
          influencers: 'INFLUENCERS',
          services: 'SERVICES',
          testimonials: 'TESTIMONIALS',
          insights: 'INSIGHTS',
          connect: 'CONNECT',
        },
        focusItems: {
          china: 'IN FOCUS: CHINA',
          ai: 'IN FOCUS: AI TECHNOLOGY ADVANCEMENTS',
          leadership: 'IN FOCUS: GLOBAL LEADERSHIP STYLES & CHALLENGES',
        },
        alt: {
          heroImage: 'Modern office with city skyline',
          logo: 'Logo',
        },
      },
      // Overview Section
      overview: {
        title: 'Elevate Your Leadership Potential',
        description:
          'Unlock your true leadership potential with personalized mentorship that transforms careers and drives extraordinary results.',
      },
      // Services Section
      services: {
        title: 'Our Services',
        titlePrefix: 'Our ',
        titleHighlight: 'Services',
        subtitle: 'Professional services to elevate your business',
        sectionHeader: 'WHAT WE PROVIDE',
        sectionTitle: 'OUR SERVICES',
        sectionDescription:
          'We deliver 9 tailored next generation leadership and organizational performance optimization programs to move leaders and their organizations forward.',
        buttons: {
          purchaseNow: 'PURCHASE NOW',
          bookAppointment: 'BOOK NOW',
          viewMore: 'VIEW MORE',
        },
        items: {
          consulting: 'Business Consulting',
          leadership: 'Leadership Development',
          strategy: 'Strategic Planning',
          liveCoaching:
            'LIVE LEADERSHIP COACHING & EXECUTIVE MENTORING 12-WEEK PROGRAMS',
          liveCoachingDesc:
            'Self-paced two-to-one coaching designed to build high-performance teams, embed trust and accountability, and foster collaboration and innovation on your schedule.',
          virtualCoaching:
            'VIRTUAL LEADERSHIP COACHING & EXECUTIVE MENTORING 12-WEEK PROGRAMS',
          virtualCoachingDesc:
            'Proprietary live two-to-one coaching that elevates self-awareness, communication, emotional intelligence, and strategic vision, driving innovative critical thinking and consistent real-world results.',
          corporateTraining:
            'CORPORATE LEADERSHIP CLIENT-SITE TRAINING 1-WEEK SEMINARS',
          corporateTrainingDesc:
            'Customized on-site seminars featuring interactive modules, simulations, and role-play to accelerate skill development, strengthen decision-making, and enhance collaboration across your organization.',
          businessMastermind:
            'BUSINESS MASTERMIND GROUP 1-WEEK INTENSIVE EVENTS',
          businessMastermindDesc:
            'Self-paced two-to-one coaching designed to build high-performance teams, embed trust and accountability, and foster collaboration and innovation on your schedule.',
          businessMastermindInfluencer:
            'BUSINESS MASTERMIND INFLUENCER 1-DAY CLASSES',
          businessMastermindInfluencerDesc:
            'Proprietary live two-to-one coaching that elevates self-awareness, communication, emotional intelligence, and strategic vision, driving innovative critical thinking and consistent real-world results.',
          trainTheTrainer:
            '"TRAIN-THE-TRAINER" EMOTIONAL INTELLIGENCE & EMPATHY FOCUSED 1-WEEK PROGRAM',
          trainTheTrainerDesc:
            'Customized on-site seminars featuring interactive modules, simulations, and role-play to accelerate skill development, strengthen decision-making, and enhance collaboration across your organization.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'WHO WE ARE',
        sectionTitle: 'OUR INFLUENCERS',
        titlePrefix: 'Our ',
        titleHighlight: 'Influencers',
        sectionDescription:
          'Our expert coaching advisors provide cutting edge, personalized 2-on-1 coaching.',
        clientsAdvised: 'Clients Advised',
        yearsExperience: 'Years Experience',
        biography: 'Biography',
        philosophy: 'Philosophy',
        totalClientsServed: 'Total Clients Served',
        avgRating: 'Avg Rating',
        yearsExperienceEach: 'Years Experience Each',
        buttons: {
          readBio: 'READ BIO',
          viewIntro: 'VIEW INTRO',
        },
        experience: '20+ YEARS OF EXPERIENCE',
        members: {
          james: {
            name: 'James Armstrong',
            title:
              'CDC/HPB/RMC INTERNATIONAL - CERTIFIED C-SUITE LEADERSHIP AND BUSINESS MENTOR',
          },
          claire: {
            name: 'Dr. Claire Keogh',
            title:
              'BSC IT (HONS), PHD. INTERNATIONAL C-SUITE LEADERSHIP AND BUSINESS MENTOR',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        badge: 'WHAT WE PROVIDE',
        titlePrefix: 'OUR ',
        titleHighlight: 'EBOOKS',
        sectionHeader: 'WHAT WE PROVIDE',
        sectionTitle: 'OUR EBOOKS',
        subtitle:
          'Explore our curated eBooks packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.',
        sectionDescription:
          'Explore our curated eBooks packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.',
        curationLabel: 'CURATION',
        curationValue: 'SERIES I-III / EBOOKS 1-12',
        editionsLabel: 'EDITIONS',
        editionsValue: 'III EXECUTIVE RELEASES / 2026 EDITION',
        seriesFeatured: 'FEATURED',
        seriesPrefix: 'SERIES',
        ebookPrefix: 'EBOOK',
        overview: 'Overview',
        defaultDescription: 'Explore the key ideas and practical insights in this eBook.',
        purchaseNow: 'PURCHASE NOW',
        readPreview: 'READ PREVIEW',
        viewMore: 'VIEW MORE',
        categories: {
          critical: 'BUSINESS-CRITICAL',
        },
        items: {
          algorithmic_ceo: {
            title: 'The Algorithmic CEO: Leading with Data, Not Just Guts',
            description: '"The Algorithmic CEO - Leading with Data, Not Just Guts" presents a framework for 21st-century leadership, arguing that the traditional intuition-driven model is insufficient for today\'s volatile business environment.',
          },
          executive_edge: {
            title: 'The Executive Edge: Cultivating Influence in the C-Suite',
            description: 'The eBook, "The Executive Edge: Cultivating Influence in the C-Suite," argues that modern leadership must shift from a hierarchical authority model to strategic cross-functional influence.',
          },
          radical_ambiguity: {
            title: 'Leading Through Radical Ambiguity',
            description: 'This Ebook, "Leading Through Turbulence: Managing Economic Uncertainty to Drive Positive Change and Sustainable Growth," is an executive guide for navigating volatile market dynamics.',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        badge: 'TESTIMONIALS',
        sectionHeader: 'Our Client ',
        sectionTitle: 'Testimonials',
        verified: 'VERIFIED',
        testimonial: 'Testimonial',
        of: 'of',
        tabs: {
          james: 'JAMES ARMSTRONG',
          video: 'CLIENT TESTIMONIAL',
          claire: 'DR. CLAIRE KEOGH',
        },
        items: {
          james: {
            item0: {
              client: 'Robert McDonough',
              title: 'Retired Senior Executive',
              company: 'Multiple Industries',
              text: "James is a very dynamic individual who has extensive knowledge of the executive business environment. He is a master mentor to all of his associates and has contributed to their great success and advancement. James has become a leader in his realm by his keen insights, strong dedication, and masterful knowledge of human nature. I trust James' judgement completely.",
            },
            item1: {
              client: 'Sandy Priester',
              title: 'CEO/Founder',
              company: 'Lifespark Cancer Resources',
              text: "James has advised LifeSpark on several occasions. As a non-profit organisation, we have tapped James expertise in the area of corporate fundraising, and he has assisted us with training committee members, and counsel on overall fundraising strategy. James has extensive connections throughout the business community, and his skills related to organisational development, marketing and branding, and leadership development are excellent.\n\nJames is smart, generous, talented, and very easy to work with. I would highly recommend James in any of these areas.",
            },
            item2: {
              client: 'Jay Garcia',
              title: 'Executive AICP, LEEP AP',
              company: 'Multiple Industries',
              text: "James Armstrong is an extremely well-rounded professional with a strong and diverse background in numerous industries on an international scale. More importantly, James is a good man and a nice person. He communicates well with all types of people at all different levels and while he is extremely good at providing valuable insight and guidance he is also open to taking advice and suggestions for possible solutions. He treats every relationship (personal and professional) with positive and meaningful success and I have seen him motivate others in dynamic and creative ways. This is the mark of a true leader. He is honest, has strong core values and his personal integrity is of the highest quality.\n\nJames has helped me to understand the nuisances of leadership and professional development. He has shown me how to articulate and explain my professional experience to people from other industries and he has exposed me to incredible networking opportunities and tactics for personal branding.\n\nI would strongly recommend James to anyone who is interested in developing or refining their professional brand/network/identity because his knowledge for all industries and his strategic approach to professional growth are top notch.",
            },
          },
          video: {
            client: 'Client Testimonial',
            title: 'The CEO Influencers Client',
          },
          claire: {
            item0: {
              client: 'Professor Helen Richardson',
              title: 'Professor',
              company: 'Sheffield University Business School',
              text: "Claire demonstrated exceptional research capabilities during her tenure at the University of Salford, where she led multiple research initiatives examining gender disparity within the Information Communication Technology sector. Her work garnered significant recognition, resulting in numerous peer-reviewed publications and high-profile presentations to key stakeholders, including British parliamentary briefings at the House of Commons and strategic industry forums.\n\nClaire's research methodology and stakeholder engagement skills proved exemplary across all organisational levels, from C-suite executives to technical specialists. Her ability to extract meaningful insights and build immediate rapport with diverse audiences consistently yielded valuable, actionable research outcomes.",
            },
            item1: {
              client: 'Dr. Sarina S.',
              title: 'Director of Nursing',
              company: 'NHS - National Health Service',
              text: "I have had the privilege of collaborating with Claire over several years across strategic research initiatives, leadership development programs, and innovative organisational transformation projects. Throughout this professional partnership, Claire has consistently demonstrated an exceptional capacity to bridge the gap between rigorous academic research and practical business application.\n\nClaire's distinguishing strength lies in her systematic yet innovative approach to problem-solving. She possesses a rare ability to synthesise complex empirical evidence and translates theoretical frameworks into actionable strategies that deliver measurable impact. Her analytical rigor is matched by her visionary creative thinking, enabling her to develop solutions that are both evidence-informed and contextually relevant.\n\nWhat sets Claire apart is her empathetic holistic perspective on organisational development. She recognises that sustainable organisational improvement must address both individual capability and systemic organisational factors. This dual focus has enabled her to design customised business interventions that not only achieve immediate operational objectives but also build long-term organisational capacity and resilience.\n\nClaire's superior consulting performance consistently demonstrates global commercial awareness and a results-oriented mindset. She engages stakeholders effectively at all levels, ensuring that research insights are not merely documented, but actively embedded into strategic planning and operational practice across the organisation. Her contributions have generated tangible value for both leaders and all key internal and external stakeholders across the broader organisation.\n\nI highly recommend Claire without reservation for senior-level business advisory, research, and leadership development mentoring.",
            },
            item2: {
              client: 'CEO Confidential',
              title: 'Kent County Council',
              company: 'British Government',
              text: "Dr. Claire Keogh is a strategic analyst of exceptional caliber whose work has consistently delivered high-impact intelligence solutions to our C-Suite and board-level stakeholders. Claire possesses a rare ability to translate complex data into actionable insights that drive meaningful organisational performance across critical public services.\n\nThroughout her tenure, Claire provided executive-level strategic direction on mission-critical initiatives spanning Children's Services, Safeguarding, and Public Health portfolios. Her comprehensive analytical reporting informed senior executive leadership decision-making and shaped organisational priorities at the highest levels, demonstrating her sophisticated understanding of complex public sector challenges.\n\nClaire established and operationalised enterprise-wide standards for empirical research methodologies and survey designs, ensuring robust accurate evidence generation for service leadership teams. The frameworks she developed enhanced the quality and reliability of insights used to guide service delivery improvements and resource allocation decisions across the organisation. She orchestrated multi-stakeholder engagement initiatives with exceptional diplomatic skill, bridging internal service teams and external partners to develop evidence-based policy frameworks. Claire applied sophisticated models to optimise customer engagement strategies, redesign service delivery protocols, and elevate staff performance outcomes.\n\nClaire has consistently demonstrated the strategic acumen, analytical rigor, and stakeholder management capabilities essential for senior executive roles requiring advanced business intelligence leadership. I highly recommend her without reservation.",
            },
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'WHY US',
        sectionTitle: 'Real numbers. Real impact. Real transformation.',
        titleLine1: 'Real Numbers. Real Impact.',
        titleLine2: 'Real Transformation.',
        sectionDescription:
          'From emerging start-ups to global enterprises, The CEO Influencers has set the benchmark for measurable leadership excellence across every industry, on every continent.',
        stats: {
          clientsServed: "CLIENTS SERVED",
          successRate: 'CLIENT SATISFACTION',
          countries: 'INDUSTRIES SERVED',
          yearsExperience: 'STRATEGIC PARTNERSHIPS',
          partnerships: 'LEADERSHIP PERFORMANCE',
        },
        details: {
          clientsServed: 'Leaders and organizations empowered globally',
          successRate:
            'Overall client satisfaction: Consistently world-class',
          countries: 'Sectors transformed from tech to manufacturing',
          yearsExperience:
            'Global alliances maintained at the highest performance tier',
          partnerships:
            'Every client program delivers measurable performance gain',
        },
        badges: {
          clientsServed: 'Worldwide',
          successRate: 'Top-rated',
          countries: 'All sectors',
          yearsExperience: 'Global network',
          partnerships: 'Guaranteed',
        },
      },
      // Features Section
      features: {
        sectionHeader: 'SALIENT FEATURES',
        titlePrefix: 'Salient ',
        titleHighlight: 'Features',
        ctaTitle: 'Ready To Transform ?',
        ctaSubtitle: 'Strategic guidance. Executive insight. Measurable transformation.',
        startJourney: 'Start Your Journey',
        sectionDescription:
          'At The CEO Influencers, we believe true leadership is about people, not power. We are an international leadership and organizational performance optimization consultancy empowering 21st Century leaders with the skills, values, and mindset to succeed in today’s global marketplace. Claire and James have successfully served 7,500+ executive clients combined over 20+ years. Our custom-designed programs cultivate leadership rooted in empathy, integrity, respect, accountability, and purpose.',
        items: {
          holisticLeadership: {
            title: 'COMPREHENSIVE HOLISTIC 360 DEGREE LEADERSHIP DEVELOPMENT',
            description: 'Our Two-To-One Advantage™ combines two expert mentors for a tailored 360-degree development experience, supported by APO-aligned optimization, the LLM-Linear Leadership Model™, and data-driven diagnosis.',
          },
          profitability: {
            title: 'LONG-TERM PROFITABILITY',
            description:
              'Sustainable growth stems from empathetic, ethical leadership. We prioritize transparency and responsibility to build resilient cultures and brand loyalty. Using neuroscience to enhance decision-making, we help organizations outperform peers, attract purpose-driven talent, and turn shared values into a competitive advantage.',
          },
          globalExpertise: {
            title: 'GLOBAL EXPERTISE, LOCAL IMPACT',
            description:
              'Claire and James have successfully served 7,500+ executive clients combined over 20+ years, with experience spanning more than 186 industries. They translate global insights into locally relevant strategies to help leaders anticipate trends and deliver measurable outcomes.',
          },
          empathy: {
            title: 'EMPATHY AT THE CORE',
            description:
              'Empathy is a strategic imperative that fosters inclusive cultures and inspires trust. We help executives unlock engagement and drive innovation by placing empathy at the core of leadership. Genuine empathy builds alignment, reduces resistance, and positions your organization as an employer of choice.',
          },
          partnerships: {
            title: 'BUILDING 21ST CENTURY STRATEGIC PARTNERSHIPS AND ALLIANCES',
            description:
              'Strategic alliances are essential for resilience and growth. We coach leaders to develop partnerships that expand capabilities and enter new markets. Our program fosters next-generation collaborations based on shared values, helping you forge relationships that deliver sustainable, long-term value and win/win outcomes.',
          },
          aiTechnology: {
            title: 'MAXIMIZING COMPREHENSIVE TECHNOLOGY STRATEGY',
            description:
              'Technology is a strategic enabler that can transform data into decisive, future-ready action. We help leaders optimize decisions, uncover opportunities, and build a comprehensive technology strategy with safeguards for privacy, bias, governance, and change.',
          },
        },
      },
      blog: {
        badge: 'OUR BLOGS',
        title: 'OUR BLOGS',
        titlePrefix: 'Our ',
        titleHighlight: 'Blogs',
        subtitle:
          'Explore our curated blogs packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.',
        exploreAll: 'Explore all publications',
        readArticle: 'Read Article',
        minRead: 'min read',
        author: 'The CEO Influencers',
        readMore: 'READ FULL BLOG',
        viewMore: 'VIEW MORE',
        categories: {
          needToKnow: 'BUSINESS-NEED-TO-KNOW',
          hot: 'BUSINESS-HOT',
          critical: 'BUSINESS-CRITICAL',
        },
        posts: {
          algorithm_of_trust: {
            title: 'The algorithm of trust: building human-centered leadership in an AI-driven world',
            subtitle: 'Exploring how trust, empathy, and human judgment can shape stronger leadership.',
            publishedAt: '16th Oct, 2024',
          },
          collaboration_or_competition: {
            title: 'Collaboration or competition? How aligned values define the future of strategic alliances',
            subtitle: '',
            publishedAt: '28th Sept, 2024',
          },
          human_algorithm: {
            title: 'The human algorithm: navigating the organizational shockwaves of AI',
            subtitle: '',
            publishedAt: '14th Sept, 2024',
          },
          pressure_points: {
            title: 'Pressure points: the structural shift in global business resilience',
            subtitle: '',
            publishedAt: '30th Aug, 2024',
          },
        },
      },
      // Newsletter Section
      newsletter: {
        title: 'OUR NEWSLETTERS',
        subtitle:
          'Unlock a decisive competitive edge with our quarterly strategic briefing, where we deconstruct business-critical shifts across global continents and local markets, distilling high-stakes industry trends and corporate maneuvers into actionable leadership blueprints tailored for today’s complex economic landscape',
        months: {
          january: 'JANUARY',
          february: 'FEBRUARY',
          march: 'MARCH',
          april: 'APRIL',
          may: 'MAY',
          june: 'JUNE',
          july: 'JULY',
          august: 'AUGUST',
          september: 'SEPTEMBER',
          october: 'OCTOBER',
          november: 'NOVEMBER',
          december: 'DECEMBER',
        },
      },
      // Case Studies Section
      caseStudies: {
        badge: 'CLIENT SUCCESS STORIES',
        titlePrefix: 'OUR ',
        titleHighlight: 'CASE STUDIES',
        subtitle: 'Real results from real leaders. Explore how The CEO Influencers has transformed executives, organizations, and careers across industries worldwide.',
        disclaimer: 'These case studies are based on TCI’s work with actual former clients and use no other companies’ data or externally sourced outcomes.',
        viewAll: 'VIEW ALL 11 CASE STUDIES',
        readFull: 'Read Full Case Study',
        caseStudy: 'CASE STUDY',
        overview: 'OVERVIEW',
        keyResult: 'KEY RESULT',
        explore: 'Explore',
        items: {
          study_1: {
            title: 'Project Phoenix: The 30-Day Business Critical Turnaround',
            subtitle: 'Strategic Crisis Intervention & Profit Optimization for High-Net-Worth Influencer Assets.',
            overview: 'Project Phoenix: a confidential executive global case study of a 30-day strategic crisis intervention and profit optimization for a leading UK global influencer.',
            keyResult: '93% Profit Increase | 150% Overall Profitability Increase | 30 Days',
            tags: ['Crisis Management', 'Revenue Recovery', 'Brand Restoration'],
          },
          study_2: {
            title: 'From Universally Loathed to Highly Admired',
            subtitle: "A CEO's Total Life and Leadership Transformation",
            overview: "The CEO of a Wall Street Fortune 1,000 financial services company was experiencing systemic failure across every professional and personal dimension. After TCI's fully integrated 3-month coaching engagement, all five KPIs transformed, with an average 70-point uplift across all 5 KPIs and a complete financial turnaround from negative equity to 90% profitability.",
            keyResult: '+70 pts Average KPI Uplift | 90% Profitability | 95% Staff Retention',
            tags: ['CEO Coaching', 'Fortune 1,000', 'Leadership Transformation'],
          },
          study_3: {
            title: 'Spirit Media Network',
            subtitle: 'Revolutionizing Global Media Through Purpose, Positivity & Possibility',
            overview: 'From a pre-revenue startup to a positive multimedia global enterprise serving more than 5 million customers across 95 countries, Spirit Media Network reimagined media through purpose, positivity, and possibility.',
            keyResult: '5M+ Global Customers | 95 Countries | 4 Media Divisions | #1 Positive Media Platform',
            tags: ['Media Startup', 'Global Growth', 'Purpose-Driven'],
          },
          study_4: {
            title: 'From Political Arena to Corporate Pinnacle',
            subtitle: 'A Chief Legal Officer Transformation',
            overview: 'A former congressional legal executive used a bespoke, full-cycle coaching and organizational performance optimization engagement to transition into a Fortune 1,000 global energy company Chief Legal Officer role.',
            keyResult: 'Fortune 1,000 CLO Appointment | Global Energy Sector | Transition Within 6 Months',
            tags: ['Career Transformation', 'Fortune 1,000', 'Legal Executive'],
          },
          study_5: {
            title: 'Pentagon Command to Global Business Dominance',
            subtitle: 'How a Top Military Officer Became a Preeminent Technology CEO',
            overview: "A decorated senior military officer managing $2B+ P&L hit a command-and-control ceiling. TCI's 12-month Integrated Leadership Transformation Framework helped him found an independent tech enterprise, secure $47M Series A funding, and achieve profitability six months ahead of projections.",
            keyResult: '$47M Series A | Profitable Month 14 | eNPS 87 (Top 3%) | +206% Work-Life Integration',
            tags: ['Military-to-CEO', 'Technology Startup', '$47M Series A'],
          },
          study_6: {
            title: 'From Authoritarian to Transformational Leadership',
            subtitle: 'The Comprehensive Reinvention of a Fortune 100 CEO',
            overview: "An 18-month executive coaching and organizational performance optimization program transformed a Fortune 100 CEO's leadership, reversed organizational decline, restored trust, and established a lasting leadership legacy.",
            keyResult: '+73 pts Leadership Trust | Customer NPS -12 to +58 | 1,847% Program ROI',
            tags: ['Fortune 100', '18-Month Program', 'CEO Transformation'],
          },
          study_7: {
            title: 'From Complete Burnout to Top Performance',
            subtitle: 'One CEO’s Complete Life & Leadership Transformation',
            overview: 'A global Fortune 100 banking CEO moved from personal and professional crisis to a successful new venture through a bespoke 3-month leadership and whole-person coaching program, with outcomes measured over 12 months.',
            keyResult: '+63.75 Average KPI Uplift | 94% Profitability | 96% Staff Retention',
            tags: ['Fortune 100', 'Executive Burnout', 'Banking'],
          },
          study_8: {
            title: 'Visionary New Services Development',
            subtitle: 'A Landmark Study in Transformational Leadership, Community Transformation & Industry-Defining Excellence',
            overview: 'A visionary, community-centered new service initiative achieved 100% regulatory compliance, 94% consumer satisfaction, a 3x quality-of-life improvement, and a #1 industry ranking while shaping new sector standards.',
            keyResult: '94% Consumer Satisfaction | 3x QoL Improvement | #1 Industry Ranking | 100% Compliance',
            tags: ['Service Design', 'Community Impact', 'Public Sector'],
          },
          study_9: {
            title: 'Operational Excellence Programme',
            subtitle: 'Transforming Organisational Standards, Service Quality & Governance Excellence',
            overview: 'An embedded 12-month operational excellence engagement institutionalised service standards, governance protocols, and evidence-led executive decision-making, achieving 100% research recommendation adoption and record service quality.',
            keyResult: '100% Research Adoption (First in History) | 100% Complaints Actioned | Record Service Quality',
            tags: ['Operational Excellence', 'Public Sector', '100% Adoption'],
          },
          study_10: {
            title: 'Workforce Equity & Community Health Transformation Programme',
            subtitle: 'Ethnic Minority Inclusion | Workforce Wellbeing & Institutional Health Equity',
            overview: 'A national public healthcare programme addressed workforce inequity and community health through co-design, evidence-led monitoring, and executive governance. Targets were exceeded, and its frameworks now inform wider policy development.',
            keyResult: '+30% Staff Retention | +40 Engagement Points | +50 Community Trust Points | 100% Board Adoption',
            tags: ['Workforce Equity', 'Healthcare', 'Ethnic Minority Inclusion'],
          },
          study_11: {
            title: 'Transforming Customer Service',
            subtitle: 'Through Evidence-Led Community Engagement',
            overview: 'A Greater Manchester housing provider used large-scale resident research, executive advocacy, policy audit, public consultation, and service design to improve support for vulnerable residents, especially older people in Sheltered Housing.',
            keyResult: '6,000+ Customers Surveyed | 2 Housing Partners | 100% Executive Buy-In | New Service Model Launched',
            tags: ['Customer Service', 'Social Housing', 'Evidence-Led Design'],
          },
        },
      },
      // Footer
      footer: {
        about: 'About Us',
        contact: 'Contact',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        copyright: '© 2026 The CEO Influencers. All rights reserved.',
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'An error occurred',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
      },
      // Appointment Modal
      appointment: {
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your full name',
        email: 'Email Address',
        emailPlaceholder: 'Enter your email address',
        phone: 'Phone Number',
        country: 'Country',
        countryPlaceholder: 'Country',
        address: 'Address',
        jobTitle: 'Job Title',
        companyName: 'Company Name',
        industry: 'Industry',
        referredBy: 'Referred By',
        referredByPlaceholder: 'Referral source',
        programOfInterest: 'Program of Interest',
        selectProgram: 'Select a program',
        date: 'Preferred Date',
        time: 'Preferred Time',
        selectTime: 'Select a time',
        submit: 'Schedule Appointment',
        submitting: 'Scheduling...',
      },
    },
  },
  es: {
    translation: {
      // Navigation
      nav: {
        home: 'Inicio',
        services: 'Servicios',
        salientFeatures: 'Destacados',
        influencers: 'Influencers',
        testimonials: 'Testimonios',
        insights: 'Perspectivas',
        caseStudies: 'Casos',
        connect: 'Contacto',
        login: 'Iniciar sesión',
        dashboard: 'Panel',
        about: 'Acerca de',
        blog: 'Blog',
        contact: 'Contacto',
      },
      // Hero Section
      hero: {
        tag: 'Construyendo mejores líderes',
        title: 'Positivamente ',
        titleHighlight: 'redefiniendo',
        titleEnd: ' el liderazgo del siglo XXI.',
        subtitle:
          'The CEO Influencers es una consultora de coaching ejecutivo de nueva generación y optimización del rendimiento organizacional que capacita a líderes desde startups hasta corporaciones multinacionales para maximizar el éxito en el mercado empresarial global del siglo XXI.',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' es una firma de coaching ejecutivo de nueva generación que empodera a líderes desde startups hasta corporaciones multinacionales para tener éxito en el panorama empresarial del siglo XXI.',
        cta: 'Comenzar',
        buttons: {
          viewVideo: 'Ver video de introducción',
          scheduleCall: 'Programar una llamada de descubrimiento',
        },
        tickerItems: [
          'Microsoft', 'IBM', 'Apple', 'Google', 'Agencias gubernamentales de EE. UU. y Reino Unido',
          'Congreso de los EE. UU.', 'Northrop Grumman', 'Ball Aerospace', 'ExxonMobil',
          'Dow Inc.', 'United Airlines', 'Boeing', 'UnitedHealthcare',
          'Merrill Lynch', 'Goldman Sachs', 'Citicorp', 'JPMorgan Chase & Co.',
          'FINRA', 'Visa', 'Ford', 'BMW', 'Toyota', 'Wyndham Hotels & Resorts Inc.',
          'Educación Superior', 'y otras organizaciones globales líderes.'
        ],
        railItems: {
          overview: 'RESUMEN',
          influencers: 'INFLUENCIADORES',
          services: 'SERVICIOS',
          testimonials: 'TESTIMONIOS',
          insights: 'INSIGHTES',
          connect: 'CONECTAR',
        },
        focusItems: {
          china: 'EN FOCO: CHINA',
          ai: 'EN FOCO: AVANCES EN TECNOLOGÍA DE IA',
          leadership: 'EN FOCO: ESTILOS Y DESAFÍOS DE LIDERAZGO GLOBAL',
        },
        alt: {
          heroImage: 'Oficina moderna con horizonte urbano',
          logo: 'Logo',
        },
      },
      // Overview Section
      overview: {
        title: 'Eleva Tu Potencial de Liderazgo',
        description:
          'Desbloquea tu verdadero potencial de liderazgo con mentoría personalizada que transforma carreras y genera resultados extraordinarios.',
      },
      // Services Section
      services: {
        title: 'Nuestros Servicios',
        titlePrefix: 'Nuestros ',
        titleHighlight: 'Servicios',
        subtitle: 'Servicios profesionales para elevar tu negocio',
        sectionHeader: 'QUÉ PROPORCIONAMOS',
        sectionTitle: 'NUESTROS SERVICIOS',
        sectionDescription:
          'Ofrecemos 9 programas personalizados de liderazgo de nueva generación y optimización del rendimiento organizacional para impulsar a los líderes y sus organizaciones.',
        buttons: {
          purchaseNow: 'COMPRAR AHORA',
          bookAppointment: 'RESERVAR CITA',
          viewMore: 'VER MÁS',
        },
        items: {
          consulting: 'Consultoría Empresarial',
          leadership: 'Desarrollo de Liderazgo',
          strategy: 'Planificación Estratégica',
          liveCoaching:
            'PROGRAMAS DE COACHING DE LIDERAZGO EN VIVO Y MENTORÍA EJECUTIVA DE 12 SEMANAS',
          liveCoachingDesc:
            'Coaching de ritmo propio de dos a uno diseñado para construir equipos de alto rendimiento, incrustar confianza y responsabilidad, y fomentar la colaboración e innovación en tu horario.',
          virtualCoaching:
            'PROGRAMAS DE COACHING DE LIDERAZGO VIRTUAL Y MENTORÍA EJECUTIVA DE 12 SEMANAS',
          virtualCoachingDesc:
            'Coaching en vivo propietario de dos a uno que eleva la autoconciencia, la comunicación, la inteligencia emocional y la visión estratégica, impulsando el pensamiento crítico innovador y resultados consistentes en el mundo real.',
          corporateTraining:
            'ENTRENAMIENTO DE LIDERAZGO CORPORATIVO EN SITIO DEL CLIENTE SEMINARIOS DE 1 SEMANA',
          corporateTrainingDesc:
            'Seminarios personalizados en sitio con módulos interactivos, simulaciones y role-play para acelerar el desarrollo de habilidades, fortalecer la toma de decisiones y mejorar la colaboración en toda tu organización.',
          businessMastermind:
            'GRUPO DE MENTE EMPRESARIAL EVENTOS INTENSIVOS DE 1 SEMANA',
          businessMastermindDesc:
            'Coaching de ritmo propio de dos a uno diseñado para construir equipos de alto rendimiento, incrustar confianza y responsabilidad, y fomentar la colaboración e innovación en tu horario.',
          businessMastermindInfluencer:
            'INFLUENCIADOR DE MENTE EMPRESARIAL CLASES DE 1 DÍA',
          businessMastermindInfluencerDesc:
            'Coaching en vivo propietario de dos a uno que eleva la autoconciencia, la comunicación, la inteligencia emocional y la visión estratégica, impulsando el pensamiento crítico innovador y resultados consistentes en el mundo real.',
          trainTheTrainer:
            '"ENTRENAR AL ENTRENADOR" INTELIGENCIA EMOCIONAL Y EMPATÍA ENFOCADA PROGRAMA DE 1 SEMANA',
          trainTheTrainerDesc:
            'Seminarios personalizados en sitio con módulos interactivos, simulaciones y role-play para acelerar el desarrollo de habilidades, fortalecer la toma de decisiones y mejorar la colaboración en toda tu organización.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'QUIÉNES SOMOS',
        sectionTitle: 'NUESTROS INFLUENCERS',
        titlePrefix: 'Nuestros ',
        titleHighlight: 'Influencers',
        sectionDescription:
          'Nuestros asesores expertos en coaching brindan un coaching personalizado 2 a 1 de vanguardia.',
        clientsAdvised: 'Clientes Asesorados',
        yearsExperience: 'Años de Experiencia',
        biography: 'Biografía',
        philosophy: 'Filosofía',
        totalClientsServed: 'Total de Clientes Asesorados',
        avgRating: 'Calificación Promedio',
        yearsExperienceEach: 'Años de Experiencia Cada Uno',
        buttons: {
          readBio: 'LEER BIO',
          viewIntro: 'VER INTRO',
        },
        experience: '20+ AÑOS DE EXPERIENCIA',
        members: {
          james: {
            name: 'James Armstrong',
            title:
              'CDC/HPB/RMC Mentor Internacional Certificado en Liderazgo Ejecutivo y Negocios',
          },
          claire: {
            name: 'Dra. Claire Keogh',
            title:
              'Lic. en TI (Hons), Dra. Mentora Internacional en Liderazgo Ejecutivo y Negocios',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        badge: 'QUÉ PROPORCIONAMOS',
        titlePrefix: 'NUESTROS ',
        titleHighlight: 'EBOOKS',
        sectionHeader: 'QUÉ PROPORCIONAMOS',
        sectionTitle: 'NUESTROS EBOOKS',
        subtitle:
          'Explora nuestros eBooks seleccionados, llenos de estudios de caso, perspectivas de expertos y marcos de trabajo prácticos para elevar el rendimiento ejecutivo y la efectividad organizacional.',
        sectionDescription:
          'Explora nuestros eBooks seleccionados, llenos de estudios de caso, perspectivas de expertos y marcos de trabajo prácticos para elevar el rendimiento ejecutivo y la efectividad organizacional.',
        curationLabel: 'CURADURÍA',
        curationValue: 'SERIES I-III / EBOOKS 1-12',
        editionsLabel: 'EDICIONES',
        editionsValue: 'III LANZAMIENTOS EJECUTIVOS / EDICIÓN 2026',
        seriesFeatured: 'DESTACADO',
        seriesPrefix: 'SERIE',
        ebookPrefix: 'EBOOK',
        overview: 'Descripción General',
        defaultDescription: 'Explora las ideas clave y los conocimientos prácticos de este eBook.',
        purchaseNow: 'COMPRAR AHORA',
        readPreview: 'LEER VISTA PREVIA',
        viewMore: 'VER MÁS',
        categories: {
          critical: 'CRÍTICO PARA EL NEGOCIO',
        },
        items: {
          algorithmic_ceo: {
            title: 'El CEO Algorítmico: Liderar con Datos, No Solo con Instinto',
            description: '"El CEO Algorítmico - Liderar con Datos, No Solo con Instinto" presenta un marco integral para el liderazgo del siglo XXI, demostrando que la intuición sola es insuficiente ante la volatilidad económica actual.',
          },
          executive_edge: {
            title: 'La Ventaja Ejecutiva: Cultivando Influencia en la Alta Dirección',
            description: 'El eBook "La Ventaja Ejecutiva: Cultivando Influencia en la Alta Dirección" plantea que el liderazgo contemporáneo debe evolucionar del poder jerárquico hacia una influencia estratégica interdepartamental.',
          },
          radical_ambiguity: {
            title: 'Liderando a Través de la Ambigüedad Radical',
            description: 'Este eBook, "Liderando en Tiempos de Turbulencia: Gestionar la Incertidumbre Económica para Impulsar Cambios Positivos", es una guía directiva fundamental para navegar mercados volátiles.',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        badge: 'TESTIMONIOS',
        sectionHeader: 'Testimonios de ',
        sectionTitle: 'Nuestros Clientes',
        verified: 'VERIFICADO',
        testimonial: 'Testimonio',
        of: 'de',
        tabs: {
          james: 'JAMES ARMSTRONG',
          video: 'TESTIMONIO EN VIDEO',
          claire: 'DRA. CLAIRE KEOGH',
        },
        items: {
          james: {
            item0: {
              client: 'Robert McDonough',
              title: 'Ejecutivo Senior Retirado',
              company: 'Múltiples Industrias',
              text: 'James es un individuo muy dinámico que tiene un amplio conocimiento del entorno empresarial ejecutivo. Es un mentor maestro para todos sus asociados y ha contribuido a su gran éxito y avance. James se ha convertido en un líder en su ámbito por sus agudos insights, fuerte dedicación y magistral conocimiento de la naturaleza humana. Confío completamente en el juicio de James.',
            },
            item1: {
              client: 'Sandy Priester',
              title: 'CEO y Fundadora',
              company: 'Lifespark Cancer Resources',
              text: 'James ha asesorado a LifeSpark en varias ocasiones. Como organización sin fines de lucro, recurrimos a su experiencia en recaudación de fondos corporativos y nos asistió con la capacitación de miembros del comité y la estrategia general de financiamiento. James es inteligente, generoso, talentoso y muy fácil de trabajar con él. Lo recomiendo ampliamente.',
            },
            item2: {
              client: 'Jay Garcia',
              title: 'Ejecutivo AICP, LEEP AP',
              company: 'Múltiples Industrias',
              text: 'James Armstrong es un profesional extraordinariamente integral con una trayectoria sólida y diversa en numerosas industrias a escala internacional. Es honesto, posee sólidos valores fundamentales y su integridad personal es de la más alta calidad. Lo recomiendo sin reservas a cualquiera que busque elevar su marca y liderazgo.',
            },
          },
          video: {
            client: 'Testimonio de Cliente',
            title: 'Cliente de The CEO Influencers',
          },
          claire: {
            item0: {
              client: 'Profesora Helen Richardson',
              title: 'Profesora',
              company: 'Escuela de Negocios de la Universidad de Sheffield',
              text: 'Claire demostró capacidades excepcionales de investigación durante su tiempo en la Universidad de Salford, liderando múltiples iniciativas clave en el sector de tecnologías de la información. Su metodología de investigación y habilidades de relación con stakeholders resultaron ejemplares a todos los niveles organizacionales.',
            },
            item1: {
              client: 'Dra. Sarina S.',
              title: 'Directora de Enfermería',
              company: 'NHS - Servicio Nacional de Salud',
              text: 'He tenido el privilegio de colaborar con Claire durante varios años en iniciativas estratégicas de investigación y programas de desarrollo de liderazgo. Su fuerza distintiva radica en su enfoque sistemático e innovador para la resolución de problemas, uniendo el rigor académico con el impacto práctico en los negocios.',
            },
            item2: {
              client: 'CEO Confidencial',
              title: 'Consejo del Condado de Kent',
              company: 'Gobierno Británico',
              text: 'La Dra. Claire Keogh es una analista estratégica de calibre excepcional cuyo trabajo ha proporcionado constantemente soluciones de inteligencia de alto impacto a nuestros directivos y miembros de la junta directiva. Recomiendo a Claire sin reservas.',
            },
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'POR QUÉ NOSOTROS',
        sectionTitle: 'Números reales. Impacto real. Transformación real.',
        titleLine1: 'Números Reales. Impacto Real.',
        titleLine2: 'Transformación Real.',
        sectionDescription:
          'Desde start-ups emergentes hasta empresas globales, The CEO Influencers ha establecido el referente de excelencia de liderazgo medible en cada industria y continente.',
        stats: {
          clientsServed: 'CLIENTES ATENDIDOS',
          successRate: 'SATISFACCIÓN DEL CLIENTE',
          countries: 'INDUSTRIAS ATENDIDAS',
          yearsExperience: 'ALIANZAS ESTRATÉGICAS',
          partnerships: 'RENDIMIENTO DE LIDERAZGO',
        },
        details: {
          clientsServed: 'Líderes y organizaciones empoderados globalmente',
          successRate:
            'Satisfacción general del cliente: consistentemente de clase mundial',
          countries: 'Sectores transformados desde tecnología hasta manufactura',
          yearsExperience:
            'Alianzas globales mantenidas en el nivel más alto de rendimiento',
          partnerships:
            'Cada programa de cliente entrega una mejora de rendimiento medible',
        },
        badges: {
          clientsServed: 'Mundial',
          successRate: 'Mejor valorado',
          countries: 'Todos los sectores',
          yearsExperience: 'Red global',
          partnerships: 'Garantizado',
        },
      },
      // Features Section
      features: {
        sectionHeader: 'CARACTERÍSTICAS SALIENTES',
        titlePrefix: 'Características ',
        titleHighlight: 'Destacadas',
        ctaTitle: '¿Listo Para Transformar?',
        ctaSubtitle: 'Orientación estratégica. Perspicacia ejecutiva. Transformación medible.',
        startJourney: 'Comienza Tu Viaje',
        sectionDescription:
          'En The CEO Influencers creemos que el verdadero liderazgo se trata de las personas, no del poder. Somos una consultoría internacional de liderazgo y optimización del rendimiento organizacional que ayuda a líderes del siglo XXI a prosperar en el mercado global. Claire y James han atendido con éxito a más de 7.500 clientes ejecutivos en conjunto durante más de 20 años. Nuestros programas personalizados fomentan un liderazgo basado en empatía, integridad, respeto, responsabilidad y propósito.',
        items: {
          holisticLeadership: {
            title: 'DESARROLLO DE LIDERAZGO HOLÍSTICO 360°',
            description:
              'Experimenta nuestra "Ventaja de Dos a Uno™" con dos mentores expertos ofreciendo perspectivas globales diversas. Nuestros modelos propietarios alinean crecimiento personal y profesional usando diagnóstico basado en datos para resultados hiper-personalizados, verificables. Este desarrollo flexible, de ciclo completo transforma cada interacción en un momento de influencia.',
          },
          profitability: {
            title: 'RENTABILIDAD A LARGO PLAZO',
            description:
              'El crecimiento sostenible proviene de liderazgo empático, ético. Priorizamos la transparencia y responsabilidad para construir culturas resilientes y lealtad a la marca. Usando neurociencia para mejorar la toma de decisiones, ayudamos a las organizaciones a superar a sus pares, atraer talento impulsado por propósito y convertir valores compartidos en una ventaja competitiva.',
          },
          globalExpertise: {
            title: 'EXPERTISE GLOBAL, IMPACTO LOCAL',
            description:
              'Claire y James han atendido con éxito a más de 7.500 clientes ejecutivos en conjunto durante más de 20 años, con experiencia en más de 186 industrias. Transforman perspectivas globales en estrategias locales para ayudar a los líderes a anticipar tendencias y lograr resultados medibles.',
          },
          empathy: {
            title: 'EMPATÍA EN EL NÚCLEO',
            description:
              'La empatía es un imperativo estratégico que fomenta culturas inclusivas e inspira confianza. Ayudamos a los ejecutivos a desbloquear engagement e impulsar innovación colocando empatía en el núcleo del liderazgo. La empatía genuina construye alineación, reduce resistencia y posiciona tu organización como empleador de elección.',
          },
          partnerships: {
            title: 'CONSTRUYENDO ALIANZAS Y SOCIEDADES ESTRATÉGICAS',
            description:
              'Las alianzas estratégicas son esenciales para resiliencia y crecimiento. Entrenamos a líderes para desarrollar asociaciones que expandan capacidades e entren en nuevos mercados. Nuestro programa fomenta colaboraciones de nueva generación basadas en valores compartidos, ayudándote a forjar relaciones que entreguen valor sostenible, a largo plazo y resultados win/win.',
          },
          aiTechnology: {
            title: 'MAXIMIZANDO ESTRATEGIA DE TECNOLOGÍA DE IA',
            description:
              'La IA es un habilitador estratégico. Asesoramos a líderes sobre aprovechar IA para optimizar toma de decisiones y descubrir oportunidades de crecimiento. Incrustando IA en estrategia central, ganas un borde dinámico. Te ayudamos a navegar riesgos, asegurar cumplimiento y convertir complejidad en claridad para creación de valor global.',
          },
        },
      },
      blog: {
        badge: 'NUESTROS BLOGS',
        title: 'NUESTROS BLOGS',
        titlePrefix: 'Nuestros ',
        titleHighlight: 'Blogs',
        subtitle:
          'Explora nuestros blogs seleccionados, repletos de estudios de caso, perspectivas de expertos y marcos de trabajo prácticos para elevar el rendimiento ejecutivo y la efectividad organizacional.',
        exploreAll: 'Explorar todas las publicaciones',
        readArticle: 'Leer artículo',
        minRead: 'min de lectura',
        author: 'The CEO Influencers',
        readMore: 'LEER BLOG COMPLETO',
        viewMore: 'VER MÁS',
        categories: {
          needToKnow: 'NEGOCIO IMPRESCINDIBLE',
          hot: 'TEMA CANDENTE',
          critical: 'CRÍTICO PARA EL NEGOCIO',
        },
        posts: {
          algorithm_of_trust: {
            title: 'El algoritmo de la confianza: construyendo un liderazgo centrado en las personas en un mundo impulsado por IA',
            subtitle: 'Explorando cómo la confianza, la empatía y el juicio humano pueden moldear un liderazgo más sólido.',
            publishedAt: '16 de Oct, 2024',
          },
          collaboration_or_competition: {
            title: '¿Colaboración o competencia? Cómo los valores alineados definen el futuro de las alianzas estratégicas',
            subtitle: '',
            publishedAt: '28 de Sept, 2024',
          },
          human_algorithm: {
            title: 'El algoritmo humano: navegando las ondas de choque organizacionales de la IA',
            subtitle: '',
            publishedAt: '14 de Sept, 2024',
          },
          pressure_points: {
            title: 'Puntos de presión: el cambio estructural en la resiliencia empresarial global',
            subtitle: '',
            publishedAt: '30 de Ago, 2024',
          },
        },
      },
      // Newsletter Section
      newsletter: {
        title: 'NUESTROS BOLETINES',
        subtitle:
          'Explora nuestros blogs y eBooks curados llenos de estudios de caso, insights de expertos y marcos accionables para elevar el rendimiento ejecutivo y efectividad.',
        months: {
          january: 'ENERO',
          february: 'FEBRERO',
          march: 'MARZO',
          april: 'ABRIL',
          may: 'MAYO',
          june: 'JUNIO',
          july: 'JULIO',
          august: 'AGOSTO',
          september: 'SEPTIEMBRE',
          october: 'OCTUBRE',
          november: 'NOVIEMBRE',
          december: 'DICIEMBRE',
        },
      },
      // Case Studies Section
      caseStudies: {
        badge: 'HISTORIAS DE ÉXITO DE CLIENTES',
        titlePrefix: 'NUESTROS ',
        titleHighlight: 'CASOS DE ESTUDIO',
        subtitle: 'Resultados reales de líderes reales. Descubra cómo The CEO Influencers ha transformado ejecutivos, organizaciones y carreras en diversas industrias en todo el mundo.',
        disclaimer: 'Estos casos de estudio se basan en el trabajo de TCI con clientes anteriores reales y no utilizan datos de otras empresas ni resultados obtenidos externamente.',
        viewAll: 'VER LOS 11 CASOS DE ESTUDIO',
        readFull: 'Leer Caso de Estudio Completo',
        caseStudy: 'CASO DE ESTUDIO',
        overview: 'DESCRIPCIÓN GENERAL',
        keyResult: 'RESULTADO CLAVE',
        explore: 'Explorar',
        items: {
          study_1: {
            title: 'Proyecto Phoenix: El rescate crítico de negocio en 30 días',
            subtitle: 'Intervención estratégica de crisis y optimización de beneficios para activos de influencers de alto patrimonio.',
            overview: 'Proyecto Phoenix: estudio de caso confidencial sobre una intervención estratégica de 30 días y optimización de beneficios para un destacado influencer global del Reino Unido.',
            keyResult: '93% Aumento de Beneficios | 150% Rentabilidad General | 30 Días',
            tags: ['Gestión de Crisis', 'Recuperación de Ingresos', 'Restauración de Marca'],
          },
          study_2: {
            title: 'De Universalmente Rechazado a Altamente Admirado',
            subtitle: 'La Transformación Integral de Vida y Liderazgo de un CEO',
            overview: 'El CEO de una empresa de servicios financieros Fortune 1,000 de Wall Street experimentaba un colapso sistémico profesional y personal, logrando una transformación completa en 3 meses.',
            keyResult: '+70 pts Mejora Media de KPI | 90% Rentabilidad | 95% Retención de Personal',
            tags: ['Coaching de CEO', 'Fortune 1.000', 'Transformación de Liderazgo'],
          },
          study_3: {
            title: 'Spirit Media Network',
            subtitle: 'Revolucionando los medios globales con propósito, positividad y posibilidades',
            overview: 'De una startup sin ingresos a una empresa multimedia global con más de 5 millones de clientes en 95 países, Spirit Media Network redefinió los medios con contenidos basados en valores.',
            keyResult: '5M+ Clientes Globales | 95 Países | 4 Divisiones de Medios | Plataforma #1 en Medios Positivos',
            tags: ['Startup de Medios', 'Crecimiento Global', 'Propósito'],
          },
          study_4: {
            title: 'De la Arena Política a la Cúspide Corporativa',
            subtitle: 'La Transformación de un Director Jurídico (CLO)',
            overview: 'Un ex asesor jurídico del Congreso logró integrarse como Director Jurídico en una compañía global de energía Fortune 1.000 mediante un programa ejecutivo integral de TCI.',
            keyResult: 'Nombramiento CLO Fortune 1.000 | Sector Energético Global | Transición en 6 Meses',
            tags: ['Transformación Profesional', 'Fortune 1.000', 'Ejecutivo Legal'],
          },
          study_5: {
            title: 'Del Mando del Pentágono al Liderazgo Empresarial Global',
            subtitle: 'Cómo un alto oficial militar se convirtió en un destacado CEO tecnológico',
            overview: 'Un veterano oficial militar fundó una empresa tecnológica independiente, aseguró una ronda Serie A de $47M y alcanzó rentabilidad antes de lo previsto gracias a TCI.',
            keyResult: '$47M Serie A | Rentabilidad en Mes 14 | eNPS 87 (Top 3%) | +206% Integración Vida-Trabajo',
            tags: ['Militar a CEO', 'Startup Tecnológica', 'Serie A $47M'],
          },
          study_6: {
            title: 'De Liderazgo Autoritario a Liderazgo Transformacional',
            subtitle: 'La Reinvención Integral de un CEO Fortune 100',
            overview: 'Un programa de 18 meses transformó el estilo de liderazgo de un CEO Fortune 100, frenó el declive organizacional, restauró la confianza e instauró un legado perdurable.',
            keyResult: '+73 pts Confianza en Liderazgo | NPS Clientes de -12 a +58 | 1.847% Retorno del Programa',
            tags: ['Fortune 100', 'Programa de 18 Meses', 'Transformación de CEO'],
          },
          study_7: {
            title: 'Del Agotamiento Total al Rendimiento Máximo',
            subtitle: 'La Transformación Integral de Vida y Liderazgo de un CEO',
            overview: 'El CEO de un banco global Fortune 100 superó una severa crisis personal y laboral para liderar una nueva y exitosa iniciativa mediante un programa de 3 meses.',
            keyResult: '+63,75 Mejora Media de KPI | 94% Rentabilidad | 96% Retención de Personal',
            tags: ['Fortune 100', 'Agotamiento Ejecutivo', 'Banca'],
          },
          study_8: {
            title: 'Desarrollo Visionario de Nuevos Servicios',
            subtitle: 'Un Estudio Emblemático en Liderazgo Transformacional e Impacto Comunitario',
            overview: 'Una iniciativa comunitaria pionera logró el 100% de cumplimiento normativo, 94% de satisfacción del usuario, triplicó la calidad de vida y obtuvo el puesto #1 del sector.',
            keyResult: '94% Satisfacción de Usuarios | Mejora de Calidad de Vida x3 | Puesto #1 Sectorial | 100% Cumplimiento',
            tags: ['Diseño de Servicios', 'Impacto Comunitario', 'Sector Público'],
          },
          study_9: {
            title: 'Programa de Excelencia Operativa',
            subtitle: 'Transformando Estándares Organizacionales, Calidad de Servicio y Gobernanza',
            overview: 'Un programa de excelencia operativa de 12 meses institucionalizó nuevos estándares de servicio y protocolos de gobernanza, logrando la adopción del 100% de las recomendaciones.',
            keyResult: '100% Adopción de Investigación (Hito Histórico) | 100% Reclamaciones Resueltas | Calidad Récord',
            tags: ['Excelencia Operativa', 'Sector Público', 'Adopción 100%'],
          },
          study_10: {
            title: 'Programa de Equidad Laboral y Salud Comunitaria',
            subtitle: 'Inclusión de Minorías Étnicas | Bienestar Laboral y Equidad en Salud Institucional',
            overview: 'Un programa nacional de salud pública abordó la equidad laboral y comunitaria mediante gobernanza basada en evidencia, superando metas con 100% de aprobación del directorio.',
            keyResult: '+30% Retención de Personal | +40 Pts Compromiso | +50 Pts Confianza | 100% Adopción Directiva',
            tags: ['Equidad Laboral', 'Salud Pública', 'Inclusión de Minorías'],
          },
          study_11: {
            title: 'Transformando la Atención al Cliente',
            subtitle: 'A Través del Compromiso Comunitario Basado en Evidencia',
            overview: 'Un proveedor de vivienda social aplicó investigación a gran escala y rediseño de servicios para transformar la atención y el apoyo a residentes vulnerables.',
            keyResult: '6.000+ Usuarios Encuestados | 2 Socios de Vivienda | 100% Respaldo Ejecutivo | Nuevo Modelo Lanzado',
            tags: ['Servicio al Cliente', 'Vivienda Social', 'Diseño Basado en Evidencia'],
          },
        },
      },
      // Footer
      footer: {
        about: 'Acerca de Nosotros',
        contact: 'Contacto',
        privacy: 'Política de Privacidad',
        terms: 'Términos de Servicio',
        copyright:
          '© 2026 The CEO Influencers. Todos los derechos reservados.',
      },
      // Common
      common: {
        loading: 'Cargando...',
        error: 'Ocurrió un error',
        back: 'Atrás',
        next: 'Siguiente',
        previous: 'Anterior',
      },
      // Appointment Modal
      appointment: {
        fullName: 'Nombre Completo',
        fullNamePlaceholder: 'Ingresa tu nombre completo',
        email: 'Dirección de Correo Electrónico',
        emailPlaceholder: 'Ingresa tu dirección de correo electrónico',
        phone: 'Número de Teléfono',
        country: 'País',
        countryPlaceholder: 'País',
        address: 'Dirección',
        jobTitle: 'Título Profesional',
        companyName: 'Nombre de la Empresa',
        industry: 'Industria',
        referredBy: 'Referido Por',
        referredByPlaceholder: 'Fuente de referencia',
        programOfInterest: 'Programa de Interés',
        selectProgram: 'Selecciona un programa',
        date: 'Fecha Preferida',
        time: 'Hora Preferida',
        selectTime: 'Seleccionar una hora',
        submit: 'Programar Cita',
        submitting: 'Programando...',
      },
    },
  },
  de: {
    translation: {
      nav: {
        home: 'Home',
        services: 'Leistungen',
        salientFeatures: 'Highlights',
        influencers: 'Influencer',
        testimonials: 'Referenzen',
        insights: 'Einblicke',
        caseStudies: 'Fallstudien',
        connect: 'Kontakt',
        login: 'Anmelden',
        dashboard: 'Dashboard',
        about: 'Über uns',
        blog: 'Blog',
        contact: 'Kontakt',
      },
      hero: {
        tag: 'Bessere Führungskräfte aufbauen',
        title: 'Positiv ',
        titleHighlight: 'neu definieren',
        titleEnd: ' die Führung im 21. Jahrhundert.',
        subtitle:
          'The CEO Influencers ist ein Coaching-Beratungsunternehmen der nächsten Generation für Führungskräfte und betriebliche Leistungsoptimierung, das Führungskräfte von Start-ups bis hin zu multinationalen Unternehmen dabei unterstützt, ihren Erfolg auf dem globalen Markt des 21. Jahrhunderts zu maximieren.',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' ist eine Coaching-Firma der nächsten Generation für Führungskräfte, die Führungskräfte von Start-ups bis hin zu multinationalen Unternehmen dabei unterstützt, im Geschäftsumfeld des 21. Jahrhunderts erfolgreich zu sein.',
        cta: 'Loslegen',
        buttons: {
          viewVideo: 'Einführungsvideo ansehen',
          scheduleCall: 'Entdeckungsgespräch vereinbaren',
        },
        tickerItems: [
          'Microsoft', 'IBM', 'Apple', 'Google', 'US-/UK-Regierungsbehörden',
          'US-Kongress', 'Northrop Grumman', 'Ball Aerospace', 'ExxonMobil',
          'Dow Inc.', 'United Airlines', 'Boeing', 'UnitedHealthcare',
          'Merrill Lynch', 'Goldman Sachs', 'Citicorp', 'JPMorgan Chase & Co.',
          'FINRA', 'Visa', 'Ford', 'BMW', 'Toyota', 'Wyndham Hotels & Resorts Inc.',
          'Hochschulbildung', 'und weitere weltweit führende Organisationen.'
        ],
        railItems: {
          overview: 'ÜBERSICHT',
          influencers: 'EINFLUSSNEHMER',
          services: 'DIENSTLEISTUNGEN',
          testimonials: 'TESTIMONIALS',
          insights: 'EINBLICKE',
          connect: 'VERBINDEN',
        },
        focusItems: {
          china: 'IM FOKUS: CHINA',
          ai: 'IM FOKUS: KI-TECHNOLOGIE-FORTSCHRITTE',
          leadership: 'IM FOKUS: GLOBALE FÜHRUNGSSTILE & HERAUSFORDERUNGEN',
        },
        alt: {
          heroImage: 'Modernes Büro mit Stadt-Skyline',
          logo: 'Logo',
        },
      },
      overview: {
        title: 'Erweitern Sie Ihr Führungspotenzial',
        description:
          'Schalten Sie Ihr wahres Führungspotenzial mit personalisierter Mentorschaft frei, die Karrieren transformiert und außergewöhnliche Ergebnisse erzielt. Unsere Expertencoaches bieten die strategische Führung, emotionale Intelligenz-Schulung und Zugang zu exekutiven Netzwerken, die außergewöhnliche Führungskräfte von den anderen unterscheidet.',
      },
      services: {
        title: 'Unsere Dienstleistungen',
        titlePrefix: 'Unsere ',
        titleHighlight: 'Leistungen',
        subtitle:
          'Professionelle Dienstleistungen zur Weiterentwicklung Ihres Unternehmens',
        sectionHeader: 'WAS WIR BIETEN',
        sectionTitle: 'UNSERE DIENSTLEISTUNGEN',
        sectionDescription:
          'Wir bieten 9 maßgeschneiderte Programme der nächsten Generation für Führung und organisatorische Leistungsoptimierung, um Führungskräfte und ihre Unternehmen voranzubringen.',
        buttons: {
          purchaseNow: 'JETZT KAUFEN',
          bookAppointment: 'TERMIN BUCHEN',
          viewMore: 'MEHR ANZEIGEN',
        },
        items: {
          consulting: 'Unternehmensberatung',
          leadership: 'Führungsentwicklung',
          strategy: 'Strategische Planung',
          liveCoaching:
            'LIVE-LEITUNGS-COACHING & EXECUTIVE MENTORING 12-WOCHEN-PROGRAMME',
          liveCoachingDesc:
            'Selbstgesteuertes Zwei-zu-Eins-Coaching, das darauf ausgelegt ist, Hochleistungsteams aufzubauen, Vertrauen und Verantwortlichkeit zu verankern und Zusammenarbeit und Innovation nach Ihrem Zeitplan zu fördern.',
          virtualCoaching:
            'VIRTUELLES LEITUNGS-COACHING & EXECUTIVE MENTORING 12-WOCHEN-PROGRAMME',
          virtualCoachingDesc:
            'Proprietäres Live-Zwei-zu-Eins-Coaching, das Selbstbewusstsein, Kommunikation, emotionale Intelligenz und strategische Vision erhöht, innovative kritische Denkweise und konsistente reale Ergebnisse fördert.',
          corporateTraining:
            'KORPORATIVE LEITUNG KUNDEN-SITE-SCHULUNG 1-WOCHEN-SEMINARE',
          corporateTrainingDesc:
            'Maßgeschneiderte Vor-Ort-Seminare mit interaktiven Modulen, Simulationen und Rollenspielen zur Beschleunigung der Fähigkeitsentwicklung, Stärkung der Entscheidungsfindung und Verbesserung der Zusammenarbeit in Ihrer Organisation.',
          businessMastermind:
            'BUSINESS MASTERMIND GRUPPE 1-WOCHEN-INTENSIVE EVENTS',
          businessMastermindDesc:
            'Selbstgesteuertes Zwei-zu-Eins-Coaching, das darauf ausgelegt ist, Hochleistungsteams aufzubauen, Vertrauen und Verantwortlichkeit zu verankern und Zusammenarbeit und Innovation nach Ihrem Zeitplan zu fördern.',
          businessMastermindInfluencer:
            'BUSINESS MASTERMIND INFLUENCER 1-TAG-KLASSEN',
          businessMastermindInfluencerDesc:
            'Proprietäres Live-Zwei-zu-Eins-Coaching, das Selbstbewusstsein, Kommunikation, emotionale Intelligenz und strategische Vision erhöht, innovative kritische Denkweise und konsistente reale Ergebnisse fördert.',
          trainTheTrainer:
            '"TRAIN-THE-TRAINER" EMOTIONALE INTELLIGENZ & EMPATHIE FOKUSSIERTES 1-WOCHEN-PROGRAMM',
          trainTheTrainerDesc:
            'Maßgeschneiderte Vor-Ort-Seminare mit interaktiven Modulen, Simulationen und Rollenspielen zur Beschleunigung der Fähigkeitsentwicklung, Stärkung der Entscheidungsfindung und Verbesserung der Zusammenarbeit in Ihrer Organisation.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'WER WIR SIND',
        sectionTitle: 'UNSERE INFLUENCER',
        titlePrefix: 'Unsere ',
        titleHighlight: 'Influencer',
        sectionDescription:
          'Unsere erfahrenen Coaching-Berater bieten erstklassiges, personalisiertes 2-zu-1-Coaching.',
        clientsAdvised: 'Beratene Kunden',
        yearsExperience: 'Jahre Erfahrung',
        biography: 'Biografie',
        philosophy: 'Philosophie',
        totalClientsServed: 'Gesamtzahl Betreuter Kunden',
        avgRating: 'Durchschnittsbewertung',
        yearsExperienceEach: 'Jahre Erfahrung Jeweils',
        buttons: {
          readBio: 'BIO LESEN',
          viewIntro: 'INTRO ANSEHEN',
        },
        experience: '20+ JAHRE ERFAHRUNG',
        members: {
          james: {
            name: 'James Armstrong',
            title:
              'CDC/HPB/RMC International Zertifizierter C-Suite Führungs- und Business-Mentor',
          },
          claire: {
            name: 'Dr. Claire Keogh',
            title:
              'BSc IT (Hons), PhD. Internationale C-Suite Führungs- und Business-Mentorin',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        badge: 'WAS WIR BIETEN',
        titlePrefix: 'UNSERE ',
        titleHighlight: 'EBOOKS',
        sectionHeader: 'WAS WIR BIETEN',
        sectionTitle: 'UNSERE EBOOKS',
        subtitle:
          'Entdecken Sie unsere kuratierten eBooks mit Fallstudien, Expertenwissen und umsetzbaren Frameworks zur Steigerung der Führungsleistung und organisatorischen Effektivität.',
        sectionDescription:
          'Entdecken Sie unsere kuratierten eBooks mit Fallstudien, Expertenwissen und umsetzbaren Frameworks zur Steigerung der Führungsleistung und organisatorischen Effektivität.',
        curationLabel: 'KURATIERUNG',
        curationValue: 'SERIEN I-III / EBOOKS 1-12',
        editionsLabel: 'EDITIONEN',
        editionsValue: 'III FÜHRUNGS-EDITIONEN / AUSGABE 2026',
        seriesFeatured: 'EMPFOHLEN',
        seriesPrefix: 'SERIE',
        ebookPrefix: 'EBOOK',
        overview: 'Überblick',
        defaultDescription: 'Entdecken Sie die zentralen Ideen und praktischen Einblicke in diesem eBook.',
        purchaseNow: 'JETZT KAUFEN',
        readPreview: 'VORSCHAU LESEN',
        viewMore: 'MEHR ANZEIGEN',
        categories: {
          critical: 'GESCHÄFTSKRITISCH',
        },
        items: {
          algorithmic_ceo: {
            title: 'Der algorithmische CEO: Führen mit Daten statt bloßem Bauchgefühl',
            description: '„Der algorithmische CEO“ liefert Führungskräften des 21. Jahrhunderts ein messbares Rahmenwerk und zeigt auf, warum herkömmliche Intuition im heutigen volatilen Marktumfeld nicht mehr genügt.',
          },
          executive_edge: {
            title: 'Der Führungsvorteil: Einfluss in der Führungsetage kultivieren',
            description: 'Das eBook „Der Führungsvorteil“ argumentiert, dass moderne Führung sich von hierarchischen Strukturen hin zu strategischem, bereichsübergreifendem Einfluss wandeln muss.',
          },
          radical_ambiguity: {
            title: 'Führung durch radikale Ambiguität',
            description: 'Dieses eBook „Führung durch Turbulenzen“ ist ein wegweisender Leitfaden für Führungskräfte, um wirtschaftliche Unsicherheiten erfolgreich zu meistern und nachhaltiges Wachstum zu sichern.',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        badge: 'TESTIMONIALS',
        sectionHeader: 'Testimonials ',
        sectionTitle: 'Unserer Klienten',
        verified: 'VERIFIZIERT',
        testimonial: 'Testimonial',
        of: 'von',
        tabs: {
          james: 'JAMES ARMSTRONG',
          video: 'KUNDEN-TESTIMONIAL',
          claire: 'DR. CLAIRE KEOGH',
        },
        items: {
          james: {
            item0: {
              client: 'Robert McDonough',
              title: 'Pensionierter Senior Executive',
              company: 'Mehrere Industrien',
              text: "James ist eine sehr dynamische Person mit umfassendem Wissen über die Geschäftsumgebung für Führungskräfte. Er ist ein Meistermentor für alle seine Mitarbeiter und hat zu ihrem großen Erfolg und Fortschritt beigetragen. Ich vertraue James' Urteilsvermögen vollständig.",
            },
            item1: {
              client: 'Sandy Priester',
              title: 'CEO/Gründerin',
              company: 'Lifespark Cancer Resources',
              text: 'James hat LifeSpark mehrfach beraten. Als gemeinnützige Organisation haben wir sein Fachwissen im Bereich der Unternehmensförderung genutzt. James ist klug, großzügig, talentiert und die Zusammenarbeit mit ihm ist hervorragend. Ich empfehle ihn uneingeschränkt weiter.',
            },
            item2: {
              client: 'Jay Garcia',
              title: 'Executive AICP, LEEP AP',
              company: 'Mehrere Industrien',
              text: 'James Armstrong ist ein äußerst vielseitiger Profi mit fundiertem Hintergrund in zahlreichen Branchen auf internationaler Ebene. Er ist ehrlich, hat starke Grundwerte und seine persönliche Integrität ist von höchster Qualität.',
            },
          },
          video: {
            client: 'Kunden-Testimonial',
            title: 'Klient von The CEO Influencers',
          },
          claire: {
            item0: {
              client: 'Professorin Helen Richardson',
              title: 'Professorin',
              company: 'Sheffield University Business School',
              text: 'Claire hat während ihrer Tätigkeit an der University of Salford außergewöhnliche Forschungsfähigkeiten bewiesen. Ihre Forschungsmethodik und ihre Fähigkeiten zur Einbindung von Stakeholdern waren auf allen organisatorischen Ebenen vorbildlich.',
            },
            item1: {
              client: 'Dr. Sarina S.',
              title: 'Direktorin für Pflegedienste',
              company: 'NHS - National Health Service',
              text: 'Ich hatte das Privileg, mehrere Jahre lang mit Claire bei strategischen Forschungsinitiativen und Führungskräfteentwicklungsprogrammen zusammenzuarbeiten. Ihre besondere Stärke liegt in ihrem systematischen und dennoch innovativen Ansatz zur Problemlösung.',
            },
            item2: {
              client: 'CEO Vertraulich',
              title: 'Kent County Council',
              company: 'Britische Regierung',
              text: 'Dr. Claire Keogh ist eine strategische Analystin von außergewöhnlichem Format, deren Arbeit unserer Führungsebene stets hochwirksame Lösungen geliefert hat. Ich kann sie ohne jeden Vorbehalt wärmstens empfehlen.',
            },
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'WARUM WIR',
        sectionTitle: 'Reale Zahlen. Reale Wirkung. Reale Transformation.',
        titleLine1: 'Reale Zahlen. Reale Wirkung.',
        titleLine2: 'Reale Transformation.',
        sectionDescription:
          'Von aufstrebenden Start-ups bis zu globalen Unternehmen hat The CEO Influencers den Massstab fuer messbare Fuehrungsexzellenz in jeder Branche und auf jedem Kontinent gesetzt.',
        stats: {
          clientsServed: 'BETREUTE KUNDEN',
          successRate: 'KUNDENZUFRIEDENHEIT',
          countries: 'BETREUTE BRANCHEN',
          yearsExperience: 'STRATEGISCHE PARTNERSCHAFTEN',
          partnerships: 'FUEHRUNGSLEISTUNG',
        },
        details: {
          clientsServed: 'Fuehrungskraefte und Organisationen weltweit gestaerkt',
          successRate:
            'Gesamte Kundenzufriedenheit: konstant auf Weltklasseniveau',
          countries: 'Branchen von Technologie bis Fertigung transformiert',
          yearsExperience:
            'Globale Allianzen auf hoechstem Leistungsniveau gepflegt',
          partnerships:
            'Jedes Kundenprogramm liefert messbaren Leistungsgewinn',
        },
        badges: {
          clientsServed: 'Weltweit',
          successRate: 'Top bewertet',
          countries: 'Alle Branchen',
          yearsExperience: 'Globales Netzwerk',
          partnerships: 'Garantiert',
        },
      },
      // Features Section
      features: {
        sectionHeader: 'HERVORRAGENDE MERKMALE',
        titlePrefix: 'Besondere ',
        titleHighlight: 'Merkmale',
        ctaTitle: 'Bereit für die Transformation?',
        ctaSubtitle: 'Strategische Führung. Führungsexzellenz. Messbare Transformation.',
        startJourney: 'Starten Sie Ihre Reise',
        sectionDescription:
          'Bei The CEO Influencers stärken wir Menschen mit 360° globaler Führungsschulung für nachhaltigen Erfolg.',
        items: {
          holisticLeadership: {
            title: 'GANZHEITLICHE FÜHRUNGSENTWICKLUNG',
            description: '360° personalisierte emotionale Intelligenz-Schulung',
          },
          profitability: {
            title: 'LANGFRISTIGE RENTABILITÄT',
            description: 'Nachhaltiges Wachstum durch ethische Führung',
          },
          globalExpertise: {
            title: 'GLOBALE EXPERTISE, LOKALE AUSWIRKUNG',
            description: 'Internationale Einblicke, maßgeschneidert für Sie',
          },
          empathy: {
            title: 'EMPATHIE IM KERN',
            description:
              'Empathie-gesteuerte kollaborative und integrative Führung',
          },
          partnerships: {
            title: 'STRATEGISCHE PARTNERSCHAFTEN/ ALLIANZEN AUFBAUEN',
            description: 'Zielgerichtete Allianzen für langfristige Ergebnisse',
          },
          aiTechnology: {
            title: 'KI-TECHNOLOGIE MAXIMIEREN',
            description: 'KI-gesteuerte Einblicke für Wettbewerbsvorteile',
          },
        },
      },
      blog: {
        badge: 'UNSERE BLOGS',
        title: 'UNSERE BLOGS',
        titlePrefix: 'Unsere ',
        titleHighlight: 'Blogs',
        subtitle:
          'Entdecken Sie unsere kuratierten Blogs mit Fallstudien, Expertenwissen und umsetzbaren Frameworks zur Steigerung der Führungsleistung und organisatorischen Effektivität.',
        exploreAll: 'Alle Publikationen entdecken',
        readArticle: 'Artikel lesen',
        minRead: 'Min. Lesezeit',
        author: 'The CEO Influencers',
        readMore: 'VOLLSTÄNDIGEN BLOG LESEN',
        viewMore: 'MEHR ANZEIGEN',
        categories: {
          needToKnow: 'UNBEDINGT WISSEN',
          hot: 'TOP-THEMA',
          critical: 'GESCHÄFTSKRITISCH',
        },
        posts: {
          algorithm_of_trust: {
            title: 'Der Algorithmus des Vertrauens: Menschzentrierte Führung in einer KI-gesteuerten Welt',
            subtitle: 'Erfahren Sie, wie Vertrauen, Empathie und menschliches Urteilsvermögen stärkere Führung formen.',
            publishedAt: '16. Okt. 2024',
          },
          collaboration_or_competition: {
            title: 'Kollaboration oder Konkurrenz? Wie abgestimmte Werte die Zukunft strategischer Allianzen prägen',
            subtitle: '',
            publishedAt: '28. Sept. 2024',
          },
          human_algorithm: {
            title: 'Der menschliche Algorithmus: Bewältigung der organisatorischen Erschütterungen durch KI',
            subtitle: '',
            publishedAt: '14. Sept. 2024',
          },
          pressure_points: {
            title: 'Druckpunkte: Der strukturelle Wandel der globalen Unternehmensresilienz',
            subtitle: '',
            publishedAt: '30. Aug. 2024',
          },
        },
      },
      newsletter: {
        title: 'UNSERE NEWSLETTER',
        subtitle:
          'Entdecken Sie unsere kuratierten Blogs und eBooks mit Fallstudien, Expertenwissen und umsetzbaren Frameworks zur Steigerung der Führungsleistung und Effektivität.',
        months: {
          january: 'JANUAR',
          february: 'FEBRUAR',
          march: 'MÄRZ',
          april: 'APRIL',
          may: 'MAI',
          june: 'JUNI',
          july: 'JULI',
          august: 'AUGUST',
          september: 'SEPTEMBER',
          october: 'OKTOBER',
          november: 'NOVEMBER',
          december: 'DEZEMBER',
        },
      },
      // Case Studies Section
      caseStudies: {
        badge: 'ERFOLGSGESCHICHTEN VON KUNDEN',
        titlePrefix: 'UNSERE ',
        titleHighlight: 'FALLSTUDIEN',
        subtitle: 'Echte Ergebnisse von echten Führungskräften. Erfahren Sie, wie The CEO Influencers Führungskräfte, Unternehmen und Karrieren weltweit transformiert hat.',
        disclaimer: 'Diese Fallstudien basieren auf der Arbeit von TCI mit tatsächlichen ehemaligen Kunden und verwenden keine Daten anderer Unternehmen oder extern bezogene Ergebnisse.',
        viewAll: 'ALLE 11 FALLSTUDIEN ANZEIGEN',
        readFull: 'Vollständige Fallstudie lesen',
        caseStudy: 'FALLSTUDIE',
        overview: 'ÜBERSICHT',
        keyResult: 'SCHLÜSSELERGEBNIS',
        explore: 'Erkunden',
        items: {
          study_1: {
            title: 'Projekt Phoenix: Der geschäftskritische 30-Tage-Turnaround',
            subtitle: 'Strategische Krisenintervention & Gewinnoptimierung für vermögende Influencer-Vermögenswerte.',
            overview: 'Projekt Phoenix: Vertrauliche Fallstudie über eine 30-tägige strategische Krisenintervention und Gewinnoptimierung für einen führenden globalen Influencer aus Großbritannien.',
            keyResult: '93% Gewinnsteigerung | 150% Gesamtrentabilität | 30 Tage',
            tags: ['Krisenmanagement', 'Umsatzrückgewinnung', 'Markenwiederherstellung'],
          },
          study_2: {
            title: 'Vom allseits Verhassten zur hochgeschätzten Führungskraft',
            subtitle: 'Die ganzheitliche Lebens- und Führungstransformation eines CEOs',
            overview: 'Der CEO eines Fortune-1.000-Finanzdienstleisters an der Wall Street erlebte ein systemisches Scheitern in allen Dimensionen und erreichte in 3 Monaten eine vollständige Kehrtwende.',
            keyResult: '+70 Punkte durchschn. KPI-Anstieg | 90% Rentabilität | 95% Mitarbeiterbindung',
            tags: ['CEO-Coaching', 'Fortune 1.000', 'Führungstransformation'],
          },
          study_3: {
            title: 'Spirit Media Network',
            subtitle: 'Revolutionierung der globalen Medien durch Sinn, Positivität und Chancen',
            overview: 'Vom Startup ohne Einnahmen zum weltweiten Medienunternehmen für über 5 Millionen Kunden in 95 Ländern: Spirit Media Network hat werteorientierten Journalismus neu definiert.',
            keyResult: '5M+ Globale Kunden | 95 Länder | 4 Mediensparten | Nr. 1 Positive Medienplattform',
            tags: ['Medien-Startup', 'Globales Wachstum', 'Sinnorientiert'],
          },
          study_4: {
            title: 'Von der politischen Arena an die Unternehmensspitze',
            subtitle: 'Die Transformation eines Chief Legal Officers',
            overview: 'Ein ehemaliger juristischer Berater des US-Kongresses wechselte dank einer maßgeschneiderten Begleitung erfolgreich in die Rolle des Chief Legal Officers eines Fortune-1.000-Energiekonzerns.',
            keyResult: 'Ernennung zum Fortune-1.000-CLO | Globaler Energiesektor | Wechsel in 6 Monaten',
            tags: ['Karrieretransformation', 'Fortune 1.000', 'Juristische Führung'],
          },
          study_5: {
            title: 'Vom Pentagon-Kommando zur weltweiten Marktführerschaft',
            subtitle: 'Wie ein hochdekorierter Offizier zum erfolgreichen Tech-CEO wurde',
            overview: 'Ein leitender Militäroffizier gründete mit Hilfe von TCI ein erfolgreiches Technologieunternehmen, sicherte sich 47 Mio. $ Series-A-Finanzierung und erzielte vorzeitig Gewinne.',
            keyResult: '47 Mio. $ Serie A | Profitabel in Monat 14 | eNPS 87 (Top 3%) | +206% Work-Life-Balance',
            tags: ['Militär zu CEO', 'Technologie-Startup', '47 Mio. $ Serie A'],
          },
          study_6: {
            title: 'Von autoritärer Führung zu transformativer Exzellenz',
            subtitle: 'Die umfassende Neuausrichtung eines Fortune-100-CEOs',
            overview: 'Ein 18-monatiges Führungsprogramm wandelte das Führungsverhalten eines Fortune-100-CEOs, stoppte den Unternehmensabstieg und stellte das Vertrauen der Belegschaft wieder her.',
            keyResult: '+73 Punkte Führungsvertrauen | Kunden-NPS von -12 auf +58 | 1.847% Programm-ROI',
            tags: ['Fortune 100', '18-Monats-Programm', 'CEO-Neuausrichtung'],
          },
          study_7: {
            title: 'Vom totalen Burnout zu absoluter Spitzenleistung',
            subtitle: 'Die ganzheitliche Transformation eines Fortune-100-Bank-CEOs',
            overview: 'Der CEO einer globalen Fortune-100-Bank überwand eine schwere Krise und gründete erfolgreich ein neues Unternehmen dank eines maßgeschneiderten 3-Monats-Programms.',
            keyResult: '+63,75 durchschn. KPI-Anstieg | 94% Rentabilität | 96% Mitarbeiterbindung',
            tags: ['Fortune 100', 'Führungs-Burnout', 'Bankensektor'],
          },
          study_8: {
            title: 'Visionäre Entwicklung neuer Dienstleistungen',
            subtitle: 'Eine wegweisende Studie zu transformativer Führung und gesellschaftlichem Wandel',
            overview: 'Eine innovative Initiative erzielte 100% regulatorische Compliance, 94% Kundenzufriedenheit, verdreifachte die Lebensqualität und sicherte Branchenrang 1.',
            keyResult: '94% Zufriedenheit | 3x mehr Lebensqualität | Branchenrang #1 | 100% Compliance',
            tags: ['Service-Design', 'Gemeinschaftswert', 'Öffentlicher Sektor'],
          },
          study_9: {
            title: 'Programm für operative Exzellenz',
            subtitle: 'Transformation von Organisationsstandards, Servicequalität und Governance',
            overview: 'Ein 12-monatiges Programm institutionalisierte servicerelevante Standards und Governance-Strukturen und erzielte eine 100%ige Umsetzung aller Empfehlungen.',
            keyResult: '100% Empfehlungsumsetzung (Erstmalig) | 100% Beschwerden behoben | Rekordqualität',
            tags: ['Operative Exzellenz', 'Öffentlicher Dienst', '100% Umsetzung'],
          },
          study_10: {
            title: 'Chancengleichheit am Arbeitsplatz & kommunale Gesundheit',
            subtitle: 'Inklusion ethnischer Minderheiten | Mitarbeiter-Wohlbefinden & gesundheitliche Gerechtigkeit',
            overview: 'Ein bundesweites Gesundheitsprogramm stärkte Fairness und Wohlbefinden durch evidenzbasierte Steuerung und übertraf alle Zielvorgaben mit 100%iger Vorstandsannahme.',
            keyResult: '+30% Mitarbeiterbindung | +40 Engagement-Punkte | +50 Vertrauenspunkte | 100% Vorstandsannahme',
            tags: ['Chancengleichheit', 'Gesundheitswesen', 'Minderheiten-Inklusion'],
          },
          study_11: {
            title: 'Transformation des Kundenservices',
            subtitle: 'Durch evidenzbasierte Bürger- und Mieterbeteiligung',
            overview: 'Ein großer Wohnungsanbieter nutzte empirische Befragungen und strategisches Servicedesign, um die Unterstützung schutzbedürftiger Bewohner grundlegend zu verbessern.',
            keyResult: '6.000+ Befragte Kunden | 2 Wohnungs-Partner | 100% Führungs-Zustimmung | Neuer Service Eingeführt',
            tags: ['Kundenservice', 'Sozialer Wohnungsbau', 'Evidenzbasiertes Design'],
          },
        },
      },
      footer: {
        about: 'Über uns',
        contact: 'Kontakt',
        privacy: 'Datenschutz',
        terms: 'Nutzungsbedingungen',
        copyright: '© 2026 The CEO Influencers. Alle Rechte vorbehalten.',
      },
      common: {
        loading: 'Lädt...',
        error: 'Ein Fehler ist aufgetreten',
        back: 'Zurück',
        next: 'Weiter',
        previous: 'Zurück',
      },
      // Appointment Modal
      appointment: {
        fullName: 'Vollständiger Name',
        fullNamePlaceholder: 'Geben Sie Ihren vollständigen Namen ein',
        email: 'E-Mail-Adresse',
        emailPlaceholder: 'Geben Sie Ihre E-Mail-Adresse ein',
        phone: 'Telefonnummer',
        country: 'Land',
        countryPlaceholder: 'Land',
        address: 'Adresse',
        jobTitle: 'Berufsbezeichnung',
        companyName: 'Firmenname',
        industry: 'Branche',
        referredBy: 'Empfohlen von',
        referredByPlaceholder: 'Empfehlungsquelle',
        programOfInterest: 'Programm von Interesse',
        selectProgram: 'Wählen Sie ein Programm aus',
        date: 'Bevorzugtes Datum',
        time: 'Bevorzugte Zeit',
        selectTime: 'Wählen Sie eine Zeit',
        submit: 'Termin vereinbaren',
        submitting: 'Wird geplant...',
      },
    },
  },
  fr: {
    translation: {
      nav: {
        home: 'Accueil',
        services: 'Services',
        salientFeatures: 'Points forts',
        influencers: 'Influenceurs',
        testimonials: 'Témoignages',
        insights: 'Insights',
        caseStudies: 'Études de cas',
        connect: 'Contact',
        login: 'Connexion',
        dashboard: 'Tableau de bord',
        about: 'À propos',
        blog: 'Blog',
        contact: 'Contact',
      },
      hero: {
        tag: 'Former de meilleurs leaders',
        title: 'Redéfinir positivement ',
        titleHighlight: 'le leadership',
        titleEnd: ' du 21ème siècle.',
        subtitle:
          "The CEO Influencers est un cabinet de conseil en coaching de direction générale et d'optimisation de la performance organisationnelle de nouvelle génération qui permet aux dirigeants, des start-ups aux multinationales, de maximiser leur succès sur le marché mondial des affaires du 21e siècle.",
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' est une entreprise de coaching exécutif de nouvelle génération qui permet aux leaders des start-ups aux multinationales de réussir dans le paysage commercial du 21ème siècle.',
        cta: 'Commencer',
        buttons: {
          viewVideo: "Voir la vidéo d'introduction",
          scheduleCall: 'Planifier un appel de découverte',
        },
        tickerItems: [
          'Microsoft', 'IBM', 'Apple', 'Google', 'Agences gouvernementales américaines et britanniques',
          'Congrès des États-Unis', 'Northrop Grumman', 'Ball Aerospace', 'ExxonMobil',
          'Dow Inc.', 'United Airlines', 'Boeing', 'UnitedHealthcare',
          'Merrill Lynch', 'Goldman Sachs', 'Citicorp', 'JPMorgan Chase & Co.',
          'FINRA', 'Visa', 'Ford', 'BMW', 'Toyota', 'Wyndham Hotels & Resorts Inc.',
          'Enseignement Supérieur', 'et d’autres organisations mondiales de premier plan.'
        ],
        railItems: {
          overview: 'APERÇU',
          influencers: 'INFLUENCEURS',
          services: 'SERVICES',
          testimonials: 'TÉMOIGNAGES',
          insights: 'APERÇUS',
          connect: 'CONNECTER',
        },
        focusItems: {
          china: "AU CENTRE DE L'ATTENTION : CHINE",
          ai: "AU CENTRE DE L'ATTENTION : PROGRÈS DE LA TECHNOLOGIE IA",
          leadership:
            "AU CENTRE DE L'ATTENTION : STYLES ET DÉFIS DE LEADERSHIP GLOBAL",
        },
        alt: {
          heroImage: 'Bureau moderne avec skyline urbain',
          logo: 'Logo',
        },
      },
      overview: {
        title: 'Élevez Votre Potentiel de Leadership',
        description:
          "Débloquez votre véritable potentiel de leadership avec un mentorat personnalisé qui transforme les carrières et génère des résultats extraordinaires. Nos coaches experts fournissent l'orientation stratégique, la formation en intelligence émotionnelle et l'accès au réseau exécutif qui distingue les leaders exceptionnels des autres.",
      },
      services: {
        title: 'Nos Services',
        titlePrefix: 'Nos ',
        titleHighlight: 'Services',
        subtitle: 'Services professionnels pour élever votre entreprise',
        sectionHeader: 'CE QUE NOUS PROPOSONS',
        sectionTitle: 'NOS SERVICES',
        sectionDescription:
          'Nous proposons 9 programmes sur mesure de leadership de nouvelle génération et d’optimisation de la performance organisationnelle pour faire progresser les dirigeants et leurs organisations.',
        buttons: {
          purchaseNow: 'ACHETER MAINTENANT',
          bookAppointment: 'RÉSERVER UN RENDEZ-VOUS',
          viewMore: 'VOIR PLUS',
        },
        items: {
          consulting: 'Conseil en entreprise',
          leadership: 'Développement du leadership',
          strategy: 'Planification stratégique',
          liveCoaching:
            'PROGRAMMES DE COACHING DE LEADERSHIP EN DIRECT & MENTORAT EXECUTIVE 12 SEMAINES',
          liveCoachingDesc:
            "Coaching deux-à-un à rythme personnel conçu pour construire des équipes de haute performance, intégrer la confiance et la responsabilité, et favoriser la collaboration et l'innovation selon votre emploi du temps.",
          virtualCoaching:
            'PROGRAMMES DE COACHING DE LEADERSHIP VIRTUEL & MENTORAT EXECUTIVE 12 SEMAINES',
          virtualCoachingDesc:
            "Coaching propriétaire en direct deux-à-un qui élève la conscience de soi, la communication, l'intelligence émotionnelle et la vision stratégique, stimulant la pensée critique innovante et des résultats réels cohérents.",
          corporateTraining:
            "FORMATION EN LEADERSHIP CORPORATIF SUR SITE CLIENT SÉMINAIRES D'1 SEMAINE",
          corporateTrainingDesc:
            'Séminaires sur site personnalisés mettant en vedette des modules interactifs, des simulations et des jeux de rôle pour accélérer le développement des compétences, renforcer la prise de décision et améliorer la collaboration au sein de votre organisation.',
          businessMastermind:
            "GROUPE BUSINESS MASTERMIND ÉVÉNEMENTS INTENSIFS D'1 SEMAINE",
          businessMastermindDesc:
            "Coaching deux-à-un à rythme personnel conçu pour construire des équipes de haute performance, intégrer la confiance et la responsabilité, et favoriser la collaboration et l'innovation selon votre emploi du temps.",
          businessMastermindInfluencer:
            "CLASSES BUSINESS MASTERMIND INFLUENCER D'1 JOUR",
          businessMastermindInfluencerDesc:
            "Coaching propriétaire en direct deux-à-un qui élève la conscience de soi, la communication, l'intelligence émotionnelle et la vision stratégique, stimulant la pensée critique innovante et des résultats réels cohérents.",
          trainTheTrainer:
            "PROGRAMME \"FORMATEUR DE FORMATEURS\" AXÉ SUR L'INTELLIGENCE ÉMOTIONNELLE ET L'EMPATHIE D'1 SEMAINE",
          trainTheTrainerDesc:
            'Séminaires sur site personnalisés mettant en vedette des modules interactifs, des simulations et des jeux de rôle pour accélérer le développement des compétences, renforcer la prise de décision et améliorer la collaboration au sein de votre organisation.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'QUI NOUS SOMMES',
        sectionTitle: 'NOS INFLUENCEURS',
        titlePrefix: 'Nos ',
        titleHighlight: 'Influenceurs',
        sectionDescription:
          'Nos conseillers experts en coaching offrent un coaching personnalisé 2-en-1 de pointe.',
        clientsAdvised: 'Clients Conseillés',
        yearsExperience: "Années d'Expérience",
        biography: 'Biographie',
        philosophy: 'Philosophie',
        totalClientsServed: 'Total des Clients Conseillés',
        avgRating: 'Note Moyenne',
        yearsExperienceEach: "Années d'Expérience Chacun",
        buttons: {
          readBio: 'LIRE LA BIO',
          viewIntro: "VOIR L'INTRO",
        },
        experience: "20+ ANNÉES D'EXPÉRIENCE",
        members: {
          james: {
            name: 'James Armstrong',
            title:
              'CDC/HPB/RMC Mentor International Certifié en Leadership Exécutif et Entreprise',
          },
          claire: {
            name: 'Dr. Claire Keogh',
            title:
              'BSc IT (Hons), PhD. Mentore Internationale en Leadership Exécutif et Entreprise',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        badge: 'CE QUE NOUS PROPOSONS',
        titlePrefix: 'NOS ',
        titleHighlight: 'EBOOKS',
        sectionHeader: 'CE QUE NOUS PROPOSONS',
        sectionTitle: 'NOS EBOOKS',
        subtitle:
          'Explorez nos eBooks sélectionnés, riches en études de cas, analyses d’experts et cadres opérationnels pour renforcer la performance de direction et l’efficacité organisationnelle.',
        sectionDescription:
          'Explorez nos eBooks sélectionnés, riches en études de cas, analyses d’experts et cadres opérationnels pour renforcer la performance de direction et l’efficacité organisationnelle.',
        curationLabel: 'CURATION',
        curationValue: 'SÉRIES I-III / EBOOKS 1-12',
        editionsLabel: 'ÉDITIONS',
        editionsValue: 'III ÉDITIONS EXÉCUTIVES / ÉDITION 2026',
        seriesFeatured: 'À LA UNE',
        seriesPrefix: 'SÉRIE',
        ebookPrefix: 'EBOOK',
        overview: 'Aperçu',
        defaultDescription: 'Découvrez les concepts clés et les analyses concrètes de cet eBook.',
        purchaseNow: 'ACHETER MAINTENANT',
        readPreview: 'LIRE L’APERÇU',
        viewMore: 'VOIR PLUS',
        categories: {
          critical: 'CRITIQUE POUR LE BUSINESS',
        },
        items: {
          algorithmic_ceo: {
            title: 'Le PDG Algorithmique : Diriger avec les Données, Pas Seulement à l’Intuition',
            description: '« Le PDG Algorithmique » présente un cadre innovant pour le leadership du XXIe siècle, démontrant que la seule intuition ne suffit plus face à la volatilité des marchés actuels.',
          },
          executive_edge: {
            title: 'L’Avantage Exécutif : Développer son Influence au Sommet de l’Entreprise',
            description: 'L’eBook « L’Avantage Exécutif » démontre que le leadership moderne doit passer d’une autorité purement hiérarchique à une influence stratégique transverse pérenne.',
          },
          radical_ambiguity: {
            title: 'Diriger dans l’Ambiguïté Radicale',
            description: 'Cet eBook « Diriger dans les Turbulences » constitue un guide stratégique incontournable pour piloter l’incertitude économique et générer une croissance durable.',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        badge: 'TÉMOIGNAGES',
        sectionHeader: 'Témoignages de ',
        sectionTitle: 'Nos Clients',
        verified: 'VÉRIFIÉ',
        testimonial: 'Témoignage',
        of: 'sur',
        tabs: {
          james: 'JAMES ARMSTRONG',
          video: 'TÉMOIGNAGE EN VIDÉO',
          claire: 'DR. CLAIRE KEOGH',
        },
        items: {
          james: {
            item0: {
              client: 'Robert McDonough',
              title: 'Cadre Dirigeant Retraité',
              company: 'Multiples Industries',
              text: "James est un individu très dynamique qui possède une vaste connaissance de l'environnement d'affaires exécutif. C'est un mentor exceptionnel qui a grandement contribué au succès de ses pairs. J'ai une confiance absolue dans le jugement de James.",
            },
            item1: {
              client: 'Sandy Priester',
              title: 'PDG et Fondatrice',
              company: 'Lifespark Cancer Resources',
              text: 'James a conseillé LifeSpark à plusieurs reprises. En tant qu’organisation à but non lucratif, nous avons fait appel à son expertise en matière de financement d’entreprise. James est brillant, généreux et talentueux. Je le recommande vivement.',
            },
            item2: {
              client: 'Jay Garcia',
              title: 'Dirigeant AICP, LEEP AP',
              company: 'Multiples Industries',
              text: 'James Armstrong est un professionnel complet doté d’une expérience remarquable à l’échelle internationale. Il est honnête, guidé par des valeurs solides et d’une intégrité irréprochable. C’est la marque d’un véritable leader.',
            },
          },
          video: {
            client: 'Témoignage Client',
            title: 'Client de The CEO Influencers',
          },
          claire: {
            item0: {
              client: 'Professeure Helen Richardson',
              title: 'Professeure',
              company: 'Sheffield University Business School',
              text: 'Claire a démontré des compétences de recherche exceptionnelles lors de son mandat à l’Université de Salford. Ses méthodologies de recherche et son engagement auprès des parties prenantes ont été exemplaires à tous les niveaux de l’organisation.',
            },
            item1: {
              client: 'Dr. Sarina S.',
              title: 'Directrice des Soins Infirmiers',
              company: 'NHS - Service National de Santé',
              text: 'J’ai eu le privilège de collaborer avec Claire pendant plusieurs années sur des initiatives stratégiques de leadership et de transformation organisationnelle. Sa force distinctive réside dans son approche systématique et innovante de la résolution de problèmes.',
            },
            item2: {
              client: 'PDG Confidentiel',
              title: 'Conseil du Comté de Kent',
              company: 'Gouvernement Britannique',
              text: 'Le Dr Claire Keogh est une analyste stratégique de très haut niveau dont les travaux ont toujours apporté des solutions à fort impact à nos dirigeants et conseils d’administration. Je la recommande sans réserve.',
            },
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'POURQUOI NOUS',
        sectionTitle: 'Des chiffres reels. Un impact reel. Une transformation reelle.',
        titleLine1: 'Des Chiffres Réels. Un Impact Réel.',
        titleLine2: 'Une Transformation Réelle.',
        sectionDescription:
          'Des start-ups emergentes aux entreprises mondiales, The CEO Influencers a etabli la reference en matiere d excellence mesurable du leadership dans chaque secteur et sur chaque continent.',
        stats: {
          clientsServed: 'CLIENTS SERVIS',
          successRate: 'SATISFACTION CLIENT',
          countries: 'SECTEURS SERVIS',
          yearsExperience: 'PARTENARIATS STRATEGIQUES',
          partnerships: 'PERFORMANCE DU LEADERSHIP',
        },
        details: {
          clientsServed:
            'Leaders et organisations accompagnes a l echelle mondiale',
          successRate:
            'Satisfaction client globale : constamment de classe mondiale',
          countries: 'Secteurs transformes, de la tech a la fabrication',
          yearsExperience:
            'Alliances mondiales maintenues au plus haut niveau de performance',
          partnerships:
            'Chaque programme client produit un gain de performance mesurable',
        },
        badges: {
          clientsServed: 'Mondial',
          successRate: 'Tres bien note',
          countries: 'Tous secteurs',
          yearsExperience: 'Reseau mondial',
          partnerships: 'Garanti',
        },
      },
      // Features Section
      features: {
        sectionHeader: 'CARACTÉRISTIQUES SALIENTES',
        titlePrefix: 'Caractéristiques ',
        titleHighlight: 'Principales',
        ctaTitle: 'Prêt à Vous Transformer ?',
        ctaSubtitle: 'Conseil stratégique. Vision de direction. Transformation mesurable.',
        startJourney: 'Commencez Votre Parcours',
        sectionDescription:
          'Chez The CEO Influencers, nous renforçons les gens avec une formation en leadership global 360° pour un succès durable.',
        items: {
          holisticLeadership: {
            title: 'DÉVELOPPEMENT HOLISTIQUE DU LEADERSHIP',
            description:
              'Formation en intelligence émotionnelle personnalisée 360°',
          },
          profitability: {
            title: 'RENTABILITÉ À LONG TERME',
            description: 'Croissance durable grâce au leadership éthique',
          },
          globalExpertise: {
            title: 'EXPERTISE GLOBALE, IMPACT LOCAL',
            description: 'Informations internationales adaptées à vous',
          },
          empathy: {
            title: "L'EMPATHIE AU CŒUR",
            description:
              "Leadership collaboratif et inclusif axé sur l'empathie",
          },
          partnerships: {
            title: 'CONSTRUIRE DES PARTENARIATS STRATÉGIQUES/ ALLIANCES',
            description:
              'Alliances ciblées générant des résultats à long terme',
          },
          aiTechnology: {
            title: 'MAXIMISER LA TECHNOLOGIE IA',
            description:
              "Informations alimentées par l'IA pour un avantage concurrentiel",
          },
        },
      },
      blog: {
        badge: 'NOS BLOGS',
        title: 'NOS BLOGS',
        titlePrefix: 'Nos ',
        titleHighlight: 'Blogs',
        subtitle:
          'Explorez nos blogs sélectionnés, riches en études de cas, analyses d’experts et cadres opérationnels pour renforcer la performance de direction et l’efficacité organisationnelle.',
        exploreAll: 'Explorer toutes les publications',
        readArticle: 'Lire l’article',
        minRead: 'min de lecture',
        author: 'The CEO Influencers',
        readMore: 'LIRE LE BLOG COMPLET',
        viewMore: 'VOIR PLUS',
        categories: {
          needToKnow: 'ESSENTIEL DU BUSINESS',
          hot: 'SUJET BRÛLANT',
          critical: 'CRITIQUE POUR LE BUSINESS',
        },
        posts: {
          algorithm_of_trust: {
            title: 'L’algorithme de la confiance : bâtir un leadership centré sur l’humain à l’ère de l’IA',
            subtitle: 'Explorer comment la confiance, l’empathie et le discernement humain renforcent le leadership.',
            publishedAt: '16 oct. 2024',
          },
          collaboration_or_competition: {
            title: 'Collaboration ou compétition ? Comment les valeurs communes définissent l’avenir des alliances stratégiques',
            subtitle: '',
            publishedAt: '28 sept. 2024',
          },
          human_algorithm: {
            title: 'L’algorithme humain : naviguer à travers les ondes de choc organisationnelles de l’IA',
            subtitle: '',
            publishedAt: '14 sept. 2024',
          },
          pressure_points: {
            title: 'Points de pression : le tournant structurel de la résilience des entreprises mondiales',
            subtitle: '',
            publishedAt: '30 août 2024',
          },
        },
      },
      newsletter: {
        title: 'NOS NEWSLETTERS',
        subtitle:
          "Explorez nos blogs et eBooks curatés remplis d'études de cas, d'informations d'experts et de frameworks actionnables pour élever les performances exécutives et l'efficacité.",
        months: {
          january: 'JANVIER',
          february: 'FÉVRIER',
          march: 'MARS',
          april: 'AVRIL',
          may: 'MAI',
          june: 'JUIN',
          july: 'JUILLET',
          august: 'AOÛT',
          september: 'SEPTEMBRE',
          october: 'OCTOBRE',
          november: 'NOVEMBRE',
          december: 'DÉCEMBRE',
        },
      },
      // Case Studies Section
      caseStudies: {
        badge: 'HISTOIRES DE SUCCÈS CLIENTS',
        titlePrefix: 'NOS ',
        titleHighlight: 'ÉTUDES DE CAS',
        subtitle: 'De vrais résultats de vrais dirigeants. Découvrez comment The CEO Influencers a transformé des dirigeants, des organisations et des carrières dans le monde entier.',
        disclaimer: 'Ces études de cas sont basées sur le travail de TCI avec de véritables anciens clients et n’utilisent aucune donnée d’autres entreprises ni aucun résultat externe.',
        viewAll: 'VOIR LES 11 ÉTUDES DE CAS',
        readFull: 'Lire l’étude de cas complète',
        caseStudy: 'ÉTUDE DE CAS',
        overview: 'APERÇU',
        keyResult: 'RÉSULTAT CLÉ',
        explore: 'Explorer',
        items: {
          study_1: {
            title: 'Projet Phoenix : Le redressement critique en 30 jours',
            subtitle: 'Intervention stratégique de crise et optimisation des profits pour influenceurs à forte valeur.',
            overview: 'Projet Phoenix : étude de cas confidentielle d’une intervention stratégique de 30 jours et d’optimisation des profits pour un influenceur mondial basé au Royaume-Uni.',
            keyResult: '+93% de bénéfices | 150% de rentabilité globale | 30 Jours',
            tags: ['Gestion de crise', 'Reprise des revenus', 'Restauration de marque'],
          },
          study_2: {
            title: 'De Détesté de Tous à Hautement Admiré',
            subtitle: 'La Transformation Intégrale de la Vie et du Leadership d’un PDG',
            overview: "Le PDG d'une société financière du Fortune 1 000 de Wall Street vivait un échec systémique dans toutes ses dimensions, réalisant un redressement complet en 3 mois.",
            keyResult: '+70 pts de hausse moyenne des KPI | 90% de rentabilité | 95% de rétention du personnel',
            tags: ['Coaching de PDG', 'Fortune 1 000', 'Transformation du leadership'],
          },
          study_3: {
            title: 'Spirit Media Network',
            subtitle: 'Révolutionner les médias mondiaux par le sens, la positivité et le potentiel',
            overview: 'D’une startup sans chiffre d’affaires à une entreprise multimédia mondiale servant plus de 5 millions de clients dans 95 pays, Spirit Media Network réinvente les médias porteurs de sens.',
            keyResult: '5M+ Clients Mondiaux | 95 Pays | 4 Divisions Média | Plateforme N°1 de Médias Positifs',
            tags: ['Startup Média', 'Croissance Mondiale', 'Axé sur le Sens'],
          },
          study_4: {
            title: 'De l’Arène Politique au Sommet des Entreprises',
            subtitle: 'La Transformation d’un Directeur Juridique (CLO)',
            overview: "Un ancien conseiller juridique du Congrès a réussi sa transition vers le poste de Directeur Juridique d'un groupe énergétique mondial du Fortune 1 000 en six mois.",
            keyResult: 'Nomination CLO Fortune 1 000 | Secteur Énergétique Mondial | Transition en 6 Mois',
            tags: ['Reconversion Professionnelle', 'Fortune 1 000', 'Direction Juridique'],
          },
          study_5: {
            title: 'Du Commandement du Pentagone au Sommet de la Tech Mondiale',
            subtitle: 'Comment un haut gradé militaire est devenu un PDG technologique d’élite',
            overview: 'Un officier militaire décoré a fondé une entreprise technologique innovante, levé 47 millions de dollars en Série A et atteint la rentabilité avec six mois d’avance.',
            keyResult: '47M$ Série A | Rentabilité au 14e Mois | eNPS 87 (Top 3%) | +206% Équilibre de Vie',
            tags: ['Militaire vers PDG', 'Startup Technologique', 'Série A 47M$'],
          },
          study_6: {
            title: 'Du Leadership Autoritaire au Leadership Transformationnel',
            subtitle: 'La Réinvention Complète d’un PDG du Fortune 100',
            overview: 'Un programme d’accompagnement de 18 mois a réinventé le leadership d’un PDG Fortune 100, enrayé le déclin de l’organisation et rétabli la confiance interne et externe.',
            keyResult: '+73 pts Confiance Direction | NPS Client passé de -12 à +58 | 1 847% ROI du Programme',
            tags: ['Fortune 100', 'Programme 18 Mois', 'Transformation de PDG'],
          },
          study_7: {
            title: 'De l’Épuisement Total à la Haute Performance',
            subtitle: 'La Transformation de Vie et de Leadership d’un PDG de Banque',
            overview: 'Le PDG d’une banque mondiale Fortune 100 a surmonté un burnout critique pour fonder un projet à grand succès grâce à un programme intensif de 3 mois.',
            keyResult: '+63,75 pts Hausse Moyenne KPI | 94% Rentabilité | 96% Rétention des Équipes',
            tags: ['Fortune 100', 'Burnout Exécutif', 'Banque'],
          },
          study_8: {
            title: 'Développement Visionnaire de Nouveaux Services',
            subtitle: 'Une Étude Majeure en Leadership Transformationnel et Impact Communautaire',
            overview: 'Une initiative communautaire innovante a atteint 100% de conformité réglementaire, 94% de satisfaction usagers, triplé la qualité de vie et atteint le rang N°1 du secteur.',
            keyResult: '94% Satisfaction Usagers | Qualité de Vie x3 | Rang N°1 du Secteur | 100% Conformité',
            tags: ['Design de Services', 'Impact Communautaire', 'Secteur Public'],
          },
          study_9: {
            title: 'Programme d’Excellence Opérationnelle',
            subtitle: 'Transformer les Standards Organisationnels, la Qualité de Service et la Gouvernance',
            overview: 'Une mission de 12 mois a institutionnalisé de nouveaux standards de service et protocoles de gouvernance, aboutissant à l’adoption de 100% des recommandations formulées.',
            keyResult: '100% d’Adoption des Recommandations (Inédit) | 100% Réclamations Traitées | Qualité Record',
            tags: ['Excellence Opérationnelle', 'Secteur Public', '100% Adoption'],
          },
          study_10: {
            title: 'Équité au Travail & Transformation de la Santé Communautaire',
            subtitle: 'Inclusion des Minorités Ethniques | Bien-être des Équipes & Équité Institutionnelle',
            overview: 'Un programme national de santé publique a renforcé l’équité professionnelle et la santé communautaire par une gouvernance factuelle, dépassant tous les objectifs.',
            keyResult: '+30% Rétention Personnel | +40 Pts Engagement | +50 Pts Confiance | 100% Adoption du Conseil',
            tags: ['Équité au Travail', 'Santé Publique', 'Inclusion des Minorités'],
          },
          study_11: {
            title: 'Transformer le Service Client',
            subtitle: 'Grâce à l’Engagement Communautaire Fondé sur des Données Probantes',
            overview: 'Un important bailleur social a mobilisé de vastes enquêtes et le design de services pour améliorer radicalement l’accompagnement des résidents vulnérables.',
            keyResult: '6 000+ Résidents Enquêtés | 2 Bailleurs Partenaires | 100% Adhésion Exécutive | Nouveau Modèle Lancé',
            tags: ['Service Client', 'Logement Social', 'Design Fondé sur les Preuves'],
          },
        },
      },
      footer: {
        about: 'À propos de nous',
        contact: 'Contact',
        privacy: 'Politique de confidentialité',
        terms: "Conditions d'utilisation",
        copyright: '© 2026 The CEO Influencers. Tous droits réservés.',
      },
      common: {
        loading: 'Chargement...',
        error: "Une erreur s'est produite",
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
      },
      // Appointment Modal
      appointment: {
        fullName: 'Nom complet',
        fullNamePlaceholder: 'Entrez votre nom complet',
        email: 'Adresse e-mail',
        emailPlaceholder: 'Entrez votre adresse e-mail',
        phone: 'Numéro de téléphone',
        country: 'Pays',
        countryPlaceholder: 'Pays',
        address: 'Adresse',
        jobTitle: 'Poste',
        companyName: "Nom de l'entreprise",
        industry: 'Secteur',
        referredBy: 'Recommandé par',
        referredByPlaceholder: 'Source de recommandation',
        programOfInterest: "Programme d'intérêt",
        selectProgram: 'Sélectionnez un programme',
        date: 'Date préférée',
        time: 'Heure préférée',
        selectTime: 'Sélectionnez une heure',
        submit: 'Planifier un rendez-vous',
        submitting: 'Planification...',
      },
    },
  },
  it: {
    translation: {
      nav: {
        home: 'Home',
        services: 'Servizi',
        salientFeatures: 'Punti di forza',
        influencers: 'Influencer',
        testimonials: 'Testimonianze',
        insights: 'Insights',
        caseStudies: 'Casi di studio',
        connect: 'Contatto',
        login: 'Accedi',
        dashboard: 'Dashboard',
        about: 'Chi siamo',
        blog: 'Blog',
        contact: 'Contatto',
      },
      hero: {
        tag: 'Costruire leader migliori',
        title: 'Ridefinire positivamente ',
        titleHighlight: 'la leadership',
        titleEnd: ' del 21° secolo.',
        subtitle:
          "The CEO Influencers è una società di consulenza per la leadership esecutiva e l'ottimizzazione delle prestazioni aziendali di nuova generazione che consente ai leader, dalle start-up alle multinazionali, di massimizzare il successo nel mercato globale del 21° secolo.",
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' è una società di coaching esecutivo di nuova generazione che permette ai leader dalle start-up alle multinazionali di avere successo nel panorama aziendale del 21° secolo.',
        cta: 'Inizia',
        buttons: {
          viewVideo: 'Guarda il video introduttivo',
          scheduleCall: 'Programma una chiamata di scoperta',
        },
        tickerItems: [
          'Microsoft', 'IBM', 'Apple', 'Google', 'Agenzie governative di Stati Uniti e Regno Unito',
          'Congresso degli Stati Uniti', 'Northrop Grumman', 'Ball Aerospace', 'ExxonMobil',
          'Dow Inc.', 'United Airlines', 'Boeing', 'UnitedHealthcare',
          'Merrill Lynch', 'Goldman Sachs', 'Citicorp', 'JPMorgan Chase & Co.',
          'FINRA', 'Visa', 'Ford', 'BMW', 'Toyota', 'Wyndham Hotels & Resorts Inc.',
          'Istruzione Superiore', 'e altre organizzazioni globali leader.'
        ],
        railItems: {
          overview: 'PANORAMICA',
          influencers: 'INFLUENCERS',
          services: 'SERVIZI',
          testimonials: 'TESTIMONIANZE',
          insights: 'APPROFONDIMENTI',
          connect: 'CONNETTI',
        },
        focusItems: {
          china: 'IN FOCUS: CINA',
          ai: 'IN FOCUS: AVANZAMENTI TECNOLOGIA IA',
          leadership: 'IN FOCUS: STILI E SFIDE LEADERSHIP GLOBALI',
        },
        alt: {
          heroImage: 'Ufficio moderno con skyline cittadino',
          logo: 'Logo',
        },
      },
      overview: {
        title: 'Elevate Il Tuo Potenziale di Leadership',
        description:
          "Sblocca il tuo vero potenziale di leadership con un mentorato personalizzato che trasforma le carriere e genera risultati straordinari. I nostri coach esperti forniscono l'orientamento strategico, la formazione in intelligenza emotiva e l'accesso alla rete esecutiva che distingue i leader eccezionali dagli altri.",
      },
      services: {
        title: 'I nostri servizi',
        titlePrefix: 'I nostri ',
        titleHighlight: 'Servizi',
        subtitle: 'Servizi professionali per elevare la vostra attività',
        sectionHeader: 'QUELLO CHE FORNIAMO',
        sectionTitle: 'I NOSTRI SERVIZI',
        sectionDescription:
          'Offriamo 9 programmi su misura per la leadership di nuova generazione e l’ottimizzazione delle prestazioni organizzative, per guidare i leader e le loro organizzazioni verso il futuro.',
        buttons: {
          purchaseNow: 'ACQUISTA ORA',
          bookAppointment: 'PRENOTA UN APPUNTAMENTO',
          viewMore: 'VEDI DI PIÙ',
        },
        items: {
          consulting: 'Consulenza aziendale',
          leadership: 'Sviluppo leadership',
          strategy: 'Pianificazione strategica',
          liveCoaching:
            'PROGRAMMI DI COACHING DELLA LEADERSHIP DAL VIVO & MENTORING EXECUTIVE 12 SETTIMANE',
          liveCoachingDesc:
            'Coaching due-a-uno a ritmo personale progettato per costruire team ad alte prestazioni, integrare fiducia e responsabilità, e favorire collaborazione e innovazione secondo il vostro programma.',
          virtualCoaching:
            'PROGRAMMI DI COACHING DELLA LEADERSHIP VIRTUALE & MENTORING EXECUTIVE 12 SETTIMANE',
          virtualCoachingDesc:
            "Coaching proprietario dal vivo due-a-uno che eleva la consapevolezza di sé, la comunicazione, l'intelligenza emotiva e la visione strategica, guidando il pensiero critico innovativo e risultati reali coerenti.",
          corporateTraining:
            'FORMAZIONE LEADERSHIP AZIENDALE SUL SITO CLIENTE SEMINARI DI 1 SETTIMANA',
          corporateTrainingDesc:
            'Seminari su sito personalizzati con moduli interattivi, simulazioni e giochi di ruolo per accelerare lo sviluppo delle competenze, rafforzare il processo decisionale e migliorare la collaborazione nella vostra organizzazione.',
          businessMastermind:
            'GRUPPO BUSINESS MASTERMIND EVENTI INTENSIVI DI 1 SETTIMANA',
          businessMastermindDesc:
            'Coaching due-a-uno a ritmo personale progettato per costruire team ad alte prestazioni, integrare fiducia e responsabilità, e favorire collaborazione e innovazione secondo il vostro programma.',
          businessMastermindInfluencer:
            'CLASSI BUSINESS MASTERMIND INFLUENCER DI 1 GIORNO',
          businessMastermindInfluencerDesc:
            "Coaching proprietario dal vivo due-a-uno che eleva la consapevolezza di sé, la comunicazione, l'intelligenza emotiva e la visione strategica, guidando il pensiero critico innovativo e risultati reali coerenti.",
          trainTheTrainer:
            'PROGRAMMA "FORMA IL FORMATORE" CONCENTRATO SU INTELLIGENZA EMOTIVA E EMPATIA DI 1 SETTIMANA',
          trainTheTrainerDesc:
            'Seminari su sito personalizzati con moduli interattivi, simulazioni e giochi di ruolo per accelerare lo sviluppo delle competenze, rafforzare il processo decisionale e migliorare la collaborazione nella vostra organizzazione.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'CHI SIAMO',
        sectionTitle: 'I NOSTRI INFLUENCER',
        titlePrefix: 'I Nostri ',
        titleHighlight: 'Influencer',
        sectionDescription:
          "I nostri consulenti di coaching esperti offrono un coaching personalizzato 2-a-1 all'avanguardia.",
        clientsAdvised: 'Clienti Seguiti',
        yearsExperience: 'Anni di Esperienza',
        biography: 'Biografia',
        philosophy: 'Filosofia',
        totalClientsServed: 'Totale Clienti Seguiti',
        avgRating: 'Valutazione Media',
        yearsExperienceEach: 'Anni di Esperienza Ciascuno',
        buttons: {
          readBio: 'LEGGI BIO',
          viewIntro: 'GUARDA INTRO',
        },
        experience: '20+ ANNI DI ESPERIENZA',
        members: {
          james: {
            name: 'James Armstrong',
            title:
              'CDC/HPB/RMC Mentore Internazionale Certificato per la Leadership C-Suite e il Business',
          },
          claire: {
            name: 'Dott.ssa Claire Keogh',
            title:
              'BSc IT (Hons), PhD. Mentore Internazionale per la Leadership C-Suite e il Business',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        badge: 'COSA OFFRIAMO',
        titlePrefix: 'I NOSTRI ',
        titleHighlight: 'EBOOK',
        sectionHeader: 'COSA OFFRIAMO',
        sectionTitle: 'I NOSTRI EBOOK',
        subtitle:
          'Esplora i nostri eBook selezionati, ricchi di casi studio, approfondimenti di esperti e framework operativi per potenziare le prestazioni esecutive e l’efficacia organizzativa.',
        sectionDescription:
          'Esplora i nostri eBook selezionati, ricchi di casi studio, approfondimenti di esperti e framework operativi per potenziare le prestazioni esecutive e l’efficacia organizzativa.',
        curationLabel: 'CURATELA',
        curationValue: 'SERIE I-III / EBOOK 1-12',
        editionsLabel: 'EDIZIONI',
        editionsValue: 'III VERSIONI EXECUTIVE / EDIZIONE 2026',
        seriesFeatured: 'IN EVIDENZA',
        seriesPrefix: 'SERIE',
        ebookPrefix: 'EBOOK',
        overview: 'Panoramica',
        defaultDescription: 'Scopri i concetti chiave e le soluzioni pratiche illustrate in questo eBook.',
        purchaseNow: 'ACQUISTA ORA',
        readPreview: 'LEGGI L’ANTEPRIMA',
        viewMore: 'VEDI DI PIÙ',
        categories: {
          critical: 'CRITICO PER IL BUSINESS',
        },
        items: {
          algorithmic_ceo: {
            title: 'Il CEO Algoritmico: Guidare con i Dati, Non Solo con l’Istinto',
            description: '«Il CEO Algoritmico» delinea un modello trasformativo per i leader del XXI secolo, dimostrando come l’intuito da solo sia ormai inadeguato nei mercati globali contemporanei.',
          },
          executive_edge: {
            title: 'Il Vantaggio Esecutivo: Coltivare l’Influenza nella C-Suite',
            description: 'L’eBook «Il Vantaggio Esecutivo» evidenzia come la leadership contemporanea debba evolvere da una gerarchia formale verso un’influenza strategica trasversale ad alto impatto.',
          },
          radical_ambiguity: {
            title: 'Guidare Attraverso l’Ambiguità Radicale',
            description: 'Questo eBook «Guidare nella Turbolenza» offre ai vertici aziendali una guida indispensabile per gestire l’incertezza economica e garantire una solida crescita sostenibile.',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        badge: 'TESTIMONIANZE',
        sectionHeader: 'Testimonianze dei ',
        sectionTitle: 'Nostri Clienti',
        verified: 'VERIFICATO',
        testimonial: 'Testimonianza',
        of: 'di',
        tabs: {
          james: 'JAMES ARMSTRONG',
          video: 'TESTIMONIANZA VIDEO',
          claire: 'DOTT.SSA CLAIRE KEOGH',
        },
        items: {
          james: {
            item0: {
              client: 'Robert McDonough',
              title: 'Executive Senior in Pensione',
              company: 'Molteplici Settori',
              text: "James è un individuo molto dinamico che possiede una profonda conoscenza dell'ambiente aziendale esecutivo. È un mentore maestro che ha contribuito al grande successo e avanzamento di tutti i suoi collaboratori. Mi fido pienamente del suo giudizio.",
            },
            item1: {
              client: 'Sandy Priester',
              title: 'CEO e Fondatrice',
              company: 'Lifespark Cancer Resources',
              text: 'James ha consigliato LifeSpark in diverse occasioni. Come organizzazione non-profit abbiamo fatto affidamento sulla sua competenza nella raccolta fondi aziendale e nello sviluppo della leadership. James è intelligente, generoso e talentuoso.',
            },
            item2: {
              client: 'Jay Garcia',
              title: 'Executive AICP, LEEP AP',
              company: 'Molteplici Settori',
              text: 'James Armstrong è un professionista eccezionale e versatile con una solida esperienza in numerosi settori su scala internazionale. È onesto, guidato da solidi valori etici e la sua integrità personale è del massimo livello.',
            },
          },
          video: {
            client: 'Testimonianza Cliente',
            title: 'Cliente di The CEO Influencers',
          },
          claire: {
            item0: {
              client: 'Professoressa Helen Richardson',
              title: 'Professoressa',
              company: 'Sheffield University Business School',
              text: "Claire ha dimostrato eccezionali capacità di ricerca durante il suo operato presso l'Università di Salford. La sua metodologia di ricerca e le sue doti di coinvolgimento degli stakeholder sono state esemplari a tutti i livelli organizzativi.",
            },
            item1: {
              client: 'Dott.ssa Sarina S.',
              title: 'Direttrice Sanitaria',
              company: 'NHS - Servizio Sanitario Nazionale',
              text: 'Ho avuto il privilegio di collaborare con Claire per diversi anni in iniziative di ricerca strategica e programmi di sviluppo della leadership. La sua capacità di unire il rigore scientifico all’impatto aziendale pratico è davvero straordinaria.',
            },
            item2: {
              client: 'CEO Riservato',
              title: 'Consiglio della Contea di Kent',
              company: 'Governo Britannico',
              text: 'La Dott.ssa Claire Keogh è un’analista strategica di altissimo livello il cui lavoro ha costantemente fornito soluzioni ad alto impatto per il nostro C-Suite e per il Consiglio di Amministrazione. La raccomando senza alcuna esitazione.',
            },
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'PERCHÉ NOI',
        sectionTitle: 'Numeri reali. Impatto reale. Trasformazione reale.',
        titleLine1: 'Numeri Reali. Impatto Reale.',
        titleLine2: 'Trasformazione Reale.',
        sectionDescription:
          'Dalle start-up emergenti alle imprese globali, The CEO Influencers ha stabilito il benchmark per un eccellenza di leadership misurabile in ogni settore e continente.',
        stats: {
          clientsServed: 'CLIENTI SERVITI',
          successRate: 'SODDISFAZIONE CLIENTE',
          countries: 'SETTORI SERVITI',
          yearsExperience: 'PARTNERSHIP STRATEGICHE',
          partnerships: 'PERFORMANCE DI LEADERSHIP',
        },
        details: {
          clientsServed: 'Leader e organizzazioni potenziati globalmente',
          successRate:
            'Soddisfazione complessiva del cliente: costantemente world-class',
          countries: 'Settori trasformati dalla tecnologia alla manifattura',
          yearsExperience:
            'Alleanze globali mantenute al piu alto livello di performance',
          partnerships:
            'Ogni programma cliente offre un miglioramento misurabile delle performance',
        },
        badges: {
          clientsServed: 'Worldwide',
          successRate: 'Top-rated',
          countries: 'Tutti i settori',
          yearsExperience: 'Rete globale',
          partnerships: 'Garantito',
        },
      },
      // Features Section
      features: {
        sectionHeader: 'CARATTERISTICHE SALIENTI',
        titlePrefix: 'Caratteristiche ',
        titleHighlight: 'Distintive',
        ctaTitle: 'Pronto a Trasformarti?',
        ctaSubtitle: 'Guida strategica. Visione esecutiva. Trasformazione misurabile.',
        startJourney: 'Inizia Il Tuo Percorso',
        sectionDescription:
          'In The CEO Influencers, rafforziamo le persone con formazione di leadership globale 360° per un successo duraturo.',
        items: {
          holisticLeadership: {
            title: 'SVILUPPO OLISTICO DEL LEADERSHIP',
            description:
              'Formazione di intelligenza emotiva personalizzata 360°',
          },
          profitability: {
            title: 'RENTABILITÀ A LUNGO TERMINE',
            description: 'Crescita sostenibile attraverso leadership etica',
          },
          globalExpertise: {
            title: 'ESPERTISE GLOBALE, IMPATTO LOCALE',
            description: 'Approfondimenti internazionali su misura per te',
          },
          empathy: {
            title: 'EMPATIA AL CENTRO',
            description:
              "Leadership collaborativa e inclusiva guidata dall'empatia",
          },
          partnerships: {
            title: 'COSTRUZIONE DI PARTNERSHIP STRATEGICHE/ ALLEANZE',
            description:
              'Alleanze mirate che guidano risultati a lungo termine',
          },
          aiTechnology: {
            title: 'MASSIMIZZARE LA TECNOLOGIA IA',
            description:
              "Approfondimenti guidati dall'IA per vantaggi competitivi",
          },
        },
      },
      blog: {
        badge: 'I NOSTRI BLOG',
        title: 'I NOSTRI BLOG',
        titlePrefix: 'I Nostri ',
        titleHighlight: 'Blog',
        subtitle:
          'Esplora i nostri blog selezionati, ricchi di casi studio, approfondimenti di esperti e framework operativi per potenziare le prestazioni esecutive e l’efficacia organizzativa.',
        exploreAll: 'Esplora tutte le pubblicazioni',
        readArticle: 'Leggi l’articolo',
        minRead: 'min di lettura',
        author: 'The CEO Influencers',
        readMore: 'LEGGI IL BLOG COMPLETO',
        viewMore: 'VEDI DI PIÙ',
        categories: {
          needToKnow: 'DA SAPERE NEL BUSINESS',
          hot: 'TEMA CALDO',
          critical: 'CRITICO PER IL BUSINESS',
        },
        posts: {
          algorithm_of_trust: {
            title: 'L’algoritmo della fiducia: costruire una leadership incentrata sull’uomo in un mondo guidato dall’IA',
            subtitle: 'Esplorando come la fiducia, l’empatia e il giudizio umano possono plasmare una leadership più forte.',
            publishedAt: '16 Ott 2024',
          },
          collaboration_or_competition: {
            title: 'Collaborazione o competizione? Come i valori condivisi definiscono il futuro delle alleanze strategiche',
            subtitle: '',
            publishedAt: '28 Set 2024',
          },
          human_algorithm: {
            title: 'L’algoritmo umano: navigare tra le onde d’urto organizzative dell’IA',
            subtitle: '',
            publishedAt: '14 Set 2024',
          },
          pressure_points: {
            title: 'Punti di pressione: il cambiamento strutturale nella resilienza aziendale globale',
            subtitle: '',
            publishedAt: '30 Ago 2024',
          },
        },
      },
      newsletter: {
        title: 'LE NOSTRE NEWSLETTER',
        subtitle:
          "Esplora i nostri blog ed eBook curati ricchi di casi studio, intuizioni di esperti e framework attuabili per elevare le prestazioni esecutive e l'efficacia.",
        months: {
          january: 'GENNAIO',
          february: 'FEBBRAIO',
          march: 'MARZO',
          april: 'APRILE',
          may: 'MAGGIO',
          june: 'GIUGNO',
          july: 'LUGLIO',
          august: 'AGOSTO',
          september: 'SETTEMBRE',
          october: 'OTTOBRE',
          november: 'NOVEMBRE',
          december: 'DICEMBRE',
        },
      },
      // Case Studies Section
      caseStudies: {
        badge: 'STORIE DI SUCCESSO DEI CLIENTI',
        titlePrefix: 'I NOSTRI ',
        titleHighlight: 'CASI DI STUDIO',
        subtitle: 'Risultati reali da leader reali. Scopri come The CEO Influencers ha trasformato dirigenti, organizzazioni e carriere in tutto il mondo.',
        disclaimer: 'Questi casi di studio si basano sul lavoro di TCI con clienti precedenti reali e non utilizzano dati di altre aziende né risultati esterni.',
        viewAll: 'VISUALIZZA TUTTI GLI 11 CASI DI STUDIO',
        readFull: 'Leggi il caso di studio completo',
        caseStudy: 'CASO DI STUDIO',
        overview: 'PANORAMICA',
        keyResult: 'RISULTATO CHIAVE',
        explore: 'Esplora',
      },
      footer: {
        about: 'Chi siamo',
        contact: 'Contatto',
        privacy: 'Informativa privacy',
        terms: 'Termini di servizio',
        copyright: '© 2026 The CEO Influencers. Tutti i diritti riservati.',
      },
      common: {
        loading: 'Caricamento...',
        error: 'Si è verificato un errore',
        back: 'Indietro',
        next: 'Avanti',
        previous: 'Precedente',
      },
      // Appointment Modal
      appointment: {
        fullName: 'Nome completo',
        fullNamePlaceholder: 'Inserisci il tuo nome completo',
        email: 'Indirizzo email',
        emailPlaceholder: 'Inserisci il tuo indirizzo email',
        phone: 'Numero di telefono',
        country: 'Paese',
        countryPlaceholder: 'Paese',
        address: 'Indirizzo',
        jobTitle: 'Titolo professionale',
        companyName: "Nome dell'azienda",
        industry: 'Settore',
        referredBy: 'Segnalato da',
        referredByPlaceholder: 'Fonte di segnalazione',
        programOfInterest: 'Programma di Interesse',
        selectProgram: 'Seleziona un programma',
        date: 'Data preferita',
        time: 'Ora preferita',
        selectTime: "Seleziona un'ora",
        submit: 'Prenota appuntamento',
        submitting: 'Pianificazione...',
      },
    },
  },
  zh: {
    translation: {
      nav: {
        home: '首页',
        services: '服务',
        salientFeatures: '特色',
        influencers: '影响力者',
        testimonials: '客户评价',
        insights: '洞察',
        caseStudies: '案例',
        connect: '联系',
        login: '登录',
        dashboard: '控制面板',
        about: '关于我们',
        blog: '博客',
        contact: '联系我们',
      },
      hero: {
        tag: '培养更优秀的领导者',
        title: '积极重新定义 ',
        titleHighlight: '21世纪',
        titleEnd: ' 领导力。',
        subtitle:
          'The CEO Influencers 是一家专注于高管领导力发展与组织绩效优化的新一代咨询机构，致力于赋能从初创公司到跨国集团的商业领袖，在21世纪全球商业市场中实现卓越成功。',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          '是一家下一代高管教练公司，帮助从初创企业到跨国公司的领导者在21世纪商业环境中取得成功。',
        cta: '开始使用',
        buttons: {
          viewVideo: '观看介绍视频',
          scheduleCall: '安排发现通话',
        },
        tickerItems: [
          '微软 (Microsoft)', 'IBM', '苹果 (Apple)', '谷歌 (Google)', '美英政府机构',
          '美国国会', '诺斯罗普·格鲁曼 (Northrop Grumman)', '鲍尔航天 (Ball Aerospace)', '埃克森美孚 (ExxonMobil)',
          '陶氏公司 (Dow Inc.)', '美国联合航空 (United Airlines)', '波音 (Boeing)', '联合健康保险 (UnitedHealthcare)',
          '美林证券 (Merrill Lynch)', '高盛集团 (Goldman Sachs)', '花旗集团 (Citicorp)', '摩根大通 (JPMorgan Chase & Co.)',
          '美国金融业监管局 (FINRA)', 'Visa', '福特汽车 (Ford)', '宝马 (BMW)', '丰田汽车 (Toyota)', '温德姆酒店及度假村集团',
          '顶尖高等学府', '以及其他全球领先领军机构。'
        ],
        railItems: {
          overview: '概述',
          influencers: '影响者',
          services: '服务',
          testimonials: '推荐',
          insights: '洞察',
          connect: '连接',
        },
        focusItems: {
          china: '焦点：中国',
          ai: '焦点：人工智能技术进步',
          leadership: '焦点：全球领导风格与挑战',
        },
        alt: {
          heroImage: '现代办公室与城市天际线',
          logo: '标志',
        },
      },
      overview: {
        title: '提升您的领导潜力',
        description:
          '通过个性化指导释放您的真正领导潜力，这种指导可以改变职业生涯并带来非凡成果。我们的专家教练提供战略指导、情商培训和高管网络访问，这些将杰出领导者与其他领导者区分开来。',
      },
      services: {
        title: '我们的服务',
        titlePrefix: '我们的',
        titleHighlight: '服务',
        subtitle: '提升您业务的优质服务',
        sectionHeader: '我们提供什么',
        sectionTitle: '我们的服务',
        sectionDescription:
          '我们提供9个量身定制的下一代领导力与组织绩效优化项目，推动商业领袖及其组织持续前行。',
        buttons: {
          purchaseNow: '立即购买',
          bookAppointment: '预约',
          viewMore: '查看更多',
        },
        items: {
          consulting: '商业咨询',
          leadership: '领导力发展',
          strategy: '战略规划',
          liveCoaching: '现场领导力教练与高管指导12周课程',
          liveCoachingDesc:
            '自定进度的二人教练课程，旨在建立高绩效团队，嵌入信任和问责制，并根据您的日程安排促进协作和创新。',
          virtualCoaching: '虚拟领导力教练与高管指导12周课程',
          virtualCoachingDesc:
            '专有的现场二人教练，提升自我意识、沟通、情商和战略视野，推动创新性批判性思维和一致的实际结果。',
          corporateTraining: '企业领导力客户现场培训1周研讨会',
          corporateTrainingDesc:
            '定制的现场研讨会，包含互动模块、模拟和角色扮演，以加速技能发展，加强决策制定，并增强组织内的协作。',
          businessMastermind: '商业智囊团小组1周密集活动',
          businessMastermindDesc:
            '自定进度的二人教练课程，旨在建立高绩效团队，嵌入信任和问责制，并根据您的日程安排促进协作和创新。',
          businessMastermindInfluencer: '商业智囊团影响者1天课程',
          businessMastermindInfluencerDesc:
            '专有的现场二人教练，提升自我意识、沟通、情商和战略视野，推动创新性批判性思维和一致的实际结果。',
          trainTheTrainer: '"培训师培训" 情绪智力与同理心聚焦1周课程',
          trainTheTrainerDesc:
            '定制的现场研讨会，包含互动模块、模拟和角色扮演，以加速技能发展，加强决策制定，并增强组织内的协作。',
        },
      },
      // Team Section
      team: {
        sectionHeader: '关于我们',
        sectionTitle: '我们的导师',
        titlePrefix: '我们的',
        titleHighlight: '导师',
        sectionDescription:
          '我们的资深领导力教练顾问提供前沿、量身定制的2对1高管辅导。',
        clientsAdvised: '指导客户数',
        yearsExperience: '从业年限',
        biography: '人物生平',
        philosophy: '导师理念',
        totalClientsServed: '累计服务客户总数',
        avgRating: '平均评分',
        yearsExperienceEach: '每位导师资深年限',
        buttons: {
          readBio: '阅读简介',
          viewIntro: '观看介绍',
        },
        experience: '20+年经验',
        members: {
          james: {
            name: '詹姆斯·阿姆斯特朗 (James Armstrong)',
            title:
              'CDC/HPB/RMC 国际认证高管领导力与商业导师',
          },
          claire: {
            name: '克莱尔·基奥博士 (Dr. Claire Keogh)',
            title:
              '信息技术理学士（荣誉）、博士，国际高管领导力与商业导师',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        badge: '精选专著与方案',
        titlePrefix: '我们的',
        titleHighlight: '高管电子书',
        sectionHeader: '精选专著与方案',
        sectionTitle: '我们的高管电子书',
        subtitle:
          '探索我们精心编撰的精选高管电子书，汇聚深度案例研究、权威专家洞察与落地战略框架，全面赋能卓越领导力与组织效能。',
        sectionDescription:
          '探索我们精心编撰的精选高管电子书，汇聚深度案例研究、权威专家洞察与落地战略框架，全面赋能卓越领导力与组织效能。',
        curationLabel: '策划阵容',
        curationValue: '系列 I-III / 电子书 1-12',
        editionsLabel: '发布版本',
        editionsValue: '三套高管首发版 / 2026 年度巨献',
        seriesFeatured: '重磅推荐',
        seriesPrefix: '系列',
        ebookPrefix: '第',
        overview: '内容概述',
        defaultDescription: '探索本期电子书所蕴含的核心战略理念与高管实践洞察。',
        purchaseNow: '立即订购',
        readPreview: '在线试读',
        viewMore: '查看更多',
        categories: {
          critical: '关键战略决策',
        },
        items: {
          algorithmic_ceo: {
            title: '算法型CEO：以数据驱动决策，超越经验与直觉',
            description: '《算法型CEO：以数据驱动决策，超越经验与直觉》为21世纪商业领袖构建了全新的数字化决策框架，深入剖析为何传统直觉驱动在当今高变动市场中已难以为继。',
          },
          executive_edge: {
            title: '高管制胜优势：在最高决策层培育战略影响力',
            description: '《高管制胜优势》指出，现代卓越领导力必须从等级权威彻底转型为跨职能战略影响力，全面重塑高层协同与组织创新动能。',
          },
          radical_ambiguity: {
            title: '在极端不确定性中引领变革与破局',
            description: '《在动荡中破局：应对经济不确定性以推动积极变革与可持续增长》是高层管理者驾驭复杂局势、实现韧性增长的必读战略指南。',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        badge: '客户评价',
        sectionHeader: '客户',
        sectionTitle: '真实评价与推荐',
        verified: '已验证',
        testimonial: '推荐评价',
        of: '/',
        tabs: {
          james: '詹姆斯·阿姆斯特朗 (James Armstrong)',
          video: '客户视频评价',
          claire: '克莱尔·基奥博士 (Dr. Claire Keogh)',
        },
        items: {
          james: {
            item0: {
              client: '罗伯特·麦克多诺 (Robert McDonough)',
              title: '退休资深高管',
              company: '跨多个国际行业',
              text: 'James 是一位极具活力的卓越导师，对高管商业环境有着深厚的洞察力。他是所有同行与合作伙伴的大师级导师，为他们的巨大成就做出了不可替代的贡献。凭借敏锐的洞察力、坚定的奉献精神以及对人性的深刻理解，James 已经成为该领域的顶尖领袖。我完全信任他的专业判断。',
            },
            item1: {
              client: '桑迪·普里斯特 (Sandy Priester)',
              title: '首席执行官兼创始人',
              company: 'Lifespark 癌症关怀基金会',
              text: 'James 曾多次为 LifeSpark 提供战略顾问指导。作为非营利组织，我们充分汲取了 James 在企业资金筹集方面的专业经验，他协助培训委员会成员并指导整体战略。James 睿智、慷慨、才华横溢，合作体验极为愉快。在这些领域，我向所有人极力推荐他。',
            },
            item2: {
              client: '杰·加西亚 (Jay Garcia)',
              title: '资深高管 AICP, LEEP AP',
              company: '跨行业高管',
              text: 'James Armstrong 是一位全方位卓越的专业人士，在国际各行各业拥有深厚丰富的背景。他诚实守信、价值观坚定，展现出最高品质的个人诚信与领袖风范。他帮助我深刻理解了领导力与职业发展的核心要义。对于希望升级品牌影响力与职业高度的人士，我毫无保留地强烈推荐 James。',
            },
          },
          video: {
            client: '真实客户视频评价',
            title: 'The CEO Influencers 辅导客户',
          },
          claire: {
            item0: {
              client: '海伦·理查森 教授 (Prof. Helen Richardson)',
              title: '商学院教授',
              company: '谢菲尔德大学商学院',
              text: 'Claire 在索尔福德大学任职期间展现了卓越的研究能力，主导了信息技术领域多项关键研究计划。她的研究方法和利益相关者沟通能力在组织各个层面（从跨国高管到技术专家）均堪称典范，总能产出极具实操价值的高端决策成果。',
            },
            item1: {
              client: '萨琳娜 博士 (Dr. Sarina S.)',
              title: '护理总监',
              company: '英国国家医疗服务体系 (NHS)',
              text: '我有幸与 Claire 在多项战略研究和领导力发展项目中合作多年。Claire 最突出的优势在于她系统化且极具创新性的问题解决能力，能够将前沿学术理论无缝转化为切实可行的高绩效战略，为组织和高管创造实实在在的长期价值。',
            },
            item2: {
              client: '保密高管 (CEO Confidential)',
              title: '肯特郡议会',
              company: '英国政府公共部门',
              text: 'Claire Keogh 博士是一位水准极高、令人惊叹的战略分析专家，她的战略报告和洞察解决方案为我们高管层和董事会提供了强大的决策支撑。无论从战略敏锐度、严谨分析力还是高层沟通能力来看，她都表现卓越。我毫无保留地高度推荐她。',
            },
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: '为什么选择我们',
        sectionTitle: '真实数字。真实影响。真实转型。',
        titleLine1: '真实数据 · 真实影响力',
        titleLine2: '真实重塑与卓越成效',
        sectionDescription:
          '从新兴初创企业到全球企业，The CEO Influencers 在每个行业、每个大陆都树立了可衡量领导力卓越的标杆。',
        stats: {
          clientsServed: '服务客户',
          successRate: '客户满意度',
          countries: '服务行业',
          yearsExperience: '战略合作伙伴关系',
          partnerships: '领导力表现',
        },
        details: {
          clientsServed: '在全球赋能领导者和组织',
          successRate: '整体客户满意度：始终保持世界级水准',
          countries: '从科技到制造业，各行业实现转型',
          yearsExperience: '全球联盟保持最高绩效层级',
          partnerships: '每个客户项目都带来可衡量的绩效提升',
        },
        badges: {
          clientsServed: '全球',
          successRate: '顶级评价',
          countries: '所有行业',
          yearsExperience: '全球网络',
          partnerships: '有保障',
        },
      },
      // Features Section
      features: {
        sectionHeader: '显著特点',
        titlePrefix: '核心',
        titleHighlight: '优势特色',
        ctaTitle: '准备好开启卓越转型了吗？',
        ctaSubtitle: '战略指引 · 高管洞察 · 衡量可见的卓越蜕变',
        startJourney: '开启您的旅程',
        sectionDescription:
          '在CEO影响者，我们通过360°全球领导力培训赋权人们，实现持久成功。',
        items: {
          holisticLeadership: {
            title: '整体领导力发展',
            description: '360°个性化情绪智力培训',
          },
          profitability: {
            title: '长期盈利能力',
            description: '通过道德领导实现可持续增长',
          },
          globalExpertise: {
            title: '全球专业知识，本地影响',
            description: '为您量身定制的国际洞察',
          },
          empathy: {
            title: '以同理心为核心',
            description: '以同理心驱动的协作性和包容性领导',
          },
          partnerships: {
            title: '建立战略伙伴关系/联盟',
            description: '针对性联盟推动长期结果',
          },
          aiTechnology: {
            title: '最大化人工智能技术',
            description: '人工智能驱动的洞察推动竞争优势',
          },
        },
      },
      blog: {
        badge: '我们的博客',
        title: '我们的博客',
        titlePrefix: '我们的',
        titleHighlight: '精选博客',
        subtitle:
          '探索我们精心策划的博客，汇聚前沿案例研究、权威专家洞察与落地执行框架，全面赋能高管卓越表现与组织效能。',
        exploreAll: '浏览所有出版物',
        readArticle: '阅读全文',
        minRead: '分钟阅读',
        author: 'The CEO Influencers',
        readMore: '阅读完整博客',
        viewMore: '查看更多',
        categories: {
          needToKnow: '商业必读',
          hot: '热门商业议题',
          critical: '关键战略决策',
        },
        posts: {
          algorithm_of_trust: {
            title: '信任的算法：在人工智能驱动的世界中构建以人为本的领导力',
            subtitle: '探索信任、同理心与人类判断力如何塑造更具韧性的卓越领导力。',
            publishedAt: '2024年10月16日',
          },
          collaboration_or_competition: {
            title: '合作还是竞争？一致的价值观如何定义战略联盟的未来',
            subtitle: '',
            publishedAt: '2024年9月28日',
          },
          human_algorithm: {
            title: '人类算法：应对人工智能带来的组织冲击波与重塑',
            subtitle: '',
            publishedAt: '2024年9月14日',
          },
          pressure_points: {
            title: '关键施压点：全球企业韧性与战略应变的结构性转变',
            subtitle: '',
            publishedAt: '2024年8月30日',
          },
        },
      },
      newsletter: {
        title: '我们的通讯',
        subtitle:
          '探索我们精心策划的博客和电子书，包含案例研究、专家洞察和可操作框架，以提升高管绩效和效能。',
        months: {
          january: '一月',
          february: '二月',
          march: '三月',
          april: '四月',
          may: '五月',
          june: '六月',
          july: '七月',
          august: '八月',
          september: '九月',
          october: '十月',
          november: '十一月',
          december: '十二月',
        },
      },
      // Case Studies Section
      caseStudies: {
        badge: '客户成功案例',
        titlePrefix: '我们的',
        titleHighlight: '案例研究',
        subtitle: '真实领袖的真实成果。探索 The CEO Influencers 如何在全球范围内助力高管、企业与职业转型。',
        disclaimer: '这些案例研究基于 TCI 与实际过往客户的真实合作，不采用任何其他公司的数据或外部来源结果。',
        viewAll: '查看全部11个案例研究',
        readFull: '阅读完整案例研究',
        caseStudy: '案例研究',
        overview: '概述',
        keyResult: '核心成效',
        explore: '探索',
        items: {
          study_1: {
            title: '凤凰计划：30天业务重大逆转与扭亏为盈',
            subtitle: '针对高净值影响力资产的战略危机干预与利润优化',
            overview: '凤凰计划：针对英国顶级全球影响力人士开展的为期30天战略危机干预与利润优化保密高管案例研究。',
            keyResult: '利润增长93% | 整体盈利能力提升150% | 30天完成',
            tags: ['危机管理', '收入恢复', '品牌声誉重建'],
          },
          study_2: {
            title: '从备受抵触到深得人心：CEO领导力蜕变',
            subtitle: '一位CEO人生与卓越领导力全方位重塑',
            overview: '一家华尔街财富1000强金融服务公司CEO面临各维度的系统性危机。经过TCI为期3个月的全面辅导，实现五大KPI平均提升70分与从亏损到90%盈利的全面扭转。',
            keyResult: '平均KPI提升70分 | 90%盈利能力 | 95%员工留任率',
            tags: ['CEO高管教练', '财富1000强', '领导力转型'],
          },
          study_3: {
            title: '灵性媒体网络 (Spirit Media Network)',
            subtitle: '以使命、积极向善与无限可能重塑全球媒体格局',
            overview: '从零收入初创公司成长为覆盖95个国家、服务超过500万客户的全球多媒体企业，Spirit Media Network以使命感重构了现代媒体传播体系。',
            keyResult: '500万+全球客户 | 95个国家 | 4大媒体部门 | 排名第一的正向媒体平台',
            tags: ['媒体创业', '全球扩张', '使命驱动'],
          },
          study_4: {
            title: '从政界殿堂到企业巅峰：首席法务官的战略转型',
            subtitle: '一位首席法务官 (CLO) 的跨界飞跃',
            overview: '一位前国会资深法律顾问通过TCI量身定制的全周期高管辅导，在6个月内成功履新一家财富1000强全球能源集团的首席法务官。',
            keyResult: '获聘财富1000强首席法务官 | 全球能源巨头 | 6个月内完成跨界',
            tags: ['职业跨界转型', '财富1000强', '法律高管'],
          },
          study_5: {
            title: '从五角大楼指挥官到全球科技巨头CEO',
            subtitle: '顶级军官转型为卓越科技企业掌门人的蜕变之路',
            overview: '一位战功卓著的高级军官通过TCI为期12个月的综合领导力框架，创立独立科技企业，成功斩获4700万美元A轮融资，并提前6个月实现全面盈利。',
            keyResult: '4700万美元A轮融资 | 第14个月实现盈利 | eNPS净推荐值87 | 工作生活平衡度提升206%',
            tags: ['军界转型CEO', '科技初创企业', '4700万美元A轮'],
          },
          study_6: {
            title: '从威权控制到变革型卓越领导力',
            subtitle: '一位财富100强CEO的全面领导力重构',
            overview: '一个为期18个月的高管辅导与组织效能优化项目重塑了一位财富100强CEO的领导力，扭转了组织下滑态势，重建了高管团队信任与持续增长格局。',
            keyResult: '领导力信任度提高73分 | 客户NPS从-12升至+58 | 项目投资回报率1847%',
            tags: ['财富100强', '18个月周期', 'CEO领导力转型'],
          },
          study_7: {
            title: '从极度职业倦怠到巅峰效能表现',
            subtitle: '一位全球财富100强银行CEO的人生与领导力蜕变',
            overview: '一位全球财富100强银行CEO通过为期3个月的定制领导力与全人身心辅导，摆脱严重职业倦怠危机并成功创办新企业，成果持续显现。',
            keyResult: '五大KPI平均提升63.75分 | 94%盈利能力 | 96%员工留任率',
            tags: ['财富100强', '高管职业倦怠', '银行业金融'],
          },
          study_8: {
            title: '前瞻性创新服务体系研发与落地',
            subtitle: '变革型领导力、社区赋能与行业标杆典范案例',
            overview: '一项富有远见的社区创新服务举措实现了100%监管合规、94%客户满意度、生活质量改善3倍，并跃居行业第一，树立了全新行业标准。',
            keyResult: '94%客户满意度 | 生活质量提升3倍 | 行业排名第一 | 100%监管合规',
            tags: ['服务设计创新', '社区深远影响', '公共服务体系'],
          },
          study_9: {
            title: '卓越运营与治理赋能提升计划',
            subtitle: '全面重构组织标准、服务品质与卓越治理体系',
            overview: '一个为期12个月的深度运营优化项目将服务标准与治理规范全面制度化，历史上首次实现调研建议100%落地采纳，服务质量创历史新高。',
            keyResult: '调研建议100%落地采纳（历史首次） | 客户投诉100%闭环处置 | 服务品质创历史纪录',
            tags: ['卓越运营', '公共治理', '100%落地采纳'],
          },
          study_10: {
            title: '职场公平与社区健康体系重塑计划',
            subtitle: '少数族裔平等融入 | 员工身心健康福祉与机构健康公平',
            overview: '一项国家级公共医疗体系计划通过协同设计与循证治理解决职场不平等与社区健康问题，所有目标超额完成并获得董事会100%全票通过。',
            keyResult: '员工留任率提升30% | 员工敬业度提升40分 | 社区信任度提升50分 | 董事会100%采纳',
            tags: ['职场公平', '医疗健康', '少数族裔包容'],
          },
          study_11: {
            title: '重塑客户服务与体验体系',
            subtitle: '以循证社区深度参与推动服务创新',
            overview: '大曼彻斯特住房服务机构通过大规模居民调研、高层政策倡导与精细化服务设计，全面升级了对弱势群体的照护与服务支持体系。',
            keyResult: '调研走访6000+名客户 | 2家大型住房机构联合 | 高层100%支持 | 全新服务体系正式发布',
            tags: ['客户服务创新', '公共住房保障', '循证服务设计'],
          },
        },
      },
      footer: {
        about: '关于我们',
        contact: '联系我们',
        privacy: '隐私政策',
        terms: '服务条款',
        copyright: '© 2026 CEO影响者。保留所有权利。',
      },
      common: {
        loading: '加载中...',
        error: '发生错误',
        back: '返回',
        next: '下一步',
        previous: '上一步',
      },
      // Appointment Modal
      appointment: {
        fullName: '全名',
        fullNamePlaceholder: '输入您的全名',
        email: '电子邮件地址',
        emailPlaceholder: '输入您的电子邮件地址',
        phone: '电话号码',
        country: '国家/地区',
        countryPlaceholder: '国家/地区',
        address: '地址',
        jobTitle: '职位名称',
        companyName: '公司名称',
        industry: '行业',
        referredBy: '推荐人',
        referredByPlaceholder: '推荐来源',
        programOfInterest: '感兴趣的项目',
        selectProgram: '选择一个项目',
        date: '首选日期',
        time: '首选时间',
        selectTime: '选择时间',
        submit: '安排预约',
        submitting: '正在安排...',
      },
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n
