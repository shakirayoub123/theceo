import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        about: 'About',
        services: 'Services',
        blog: 'Blog',
        contact: 'Contact',
        login: 'Login',
      },
      // Hero Section
      hero: {
        title: 'Positively ',
        titleHighlight: 're-defining',
        titleEnd: ' 21st century leadership',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' is a next-generation executive leadership and organizational performance optimization coaching consultancy that empowers leaders from start-ups to multinational corporations to maximize success in the 21st-century global business marketplace.',
        cta: 'Get Started',
        buttons: {
          viewVideo: 'VIEW INTRODUCTION VIDEO',
          scheduleCall: 'SCHEDULE A DISCOVERY CALL',
        },
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
        subtitle: 'Professional services to elevate your business',
        sectionHeader: 'WHAT WE PROVIDE',
        sectionTitle: 'OUR SERVICES',
        sectionDescription:
          'We deliver tailored leadership and performance programs empowering leaders with clarity and confidence.',
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
            'Proprietary live two-to-one coaching that elevates self-awareness, communication, emotional intelligence, and strategic vision — driving innovative critical thinking and consistent real-world results.',
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
            'Proprietary live two-to-one coaching that elevates self-awareness, communication, emotional intelligence, and strategic vision — driving innovative critical thinking and consistent real-world results.',
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
        sectionDescription:
          'Our expert coaching advisors provide cutting edge, personalized 2-on-1 coaching.',
        buttons: {
          readBio: 'READ BIO',
          viewIntro: 'VIEW INTRO',
        },
        experience: '20+ YEARS OF EXPERIENCE',
        members: {
          james: {
            name: 'JAMES ARMSTRONG',
            title:
              'CDC/HPB/RMC International-Certified C-Suite Leadership and Business Mentor',
          },
          claire: {
            name: 'DR. CLAIRE KEOGH',
            title:
              'BSc IT (Hons), PhD. International C-Suite Leadership and Business Mentor',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        sectionHeader: 'WHAT WE PROVIDE',
        sectionTitle: 'OUR EBOOKS',
        sectionDescription:
          'Explore our curated eBooks packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.',
        viewMore: 'VIEW MORE',
        items: {
          humanAlgorithm: {
            focusLabel: 'IN FOCUS',
            category: 'BUSINESS CRITICAL TOPIC',
            title:
              'THE HUMAN ALGORITHM: NAVIGATING THE ORGANIZATIONAL SHOCKWAVES OF AI',
            subtitle:
              'AI, Automation & the Future of Work: Strategic Imperatives in the Age of Intelligent Technology',
            primaryButton: 'PURCHASE NOW',
            secondaryButton: 'VIEW SERIES',
          },
          organizationalShockwaves: {
            focusLabel: 'IN FOCUS',
            category: 'BUSINESS CRITICAL TOPIC',
            title:
              'THE HUMAN ALGORITHM: NAVIGATING THE ORGANIZATIONAL SHOCKWAVES OF AI',
            subtitle:
              'AI, Automation & the Future of Work: Strategic Imperatives in the Age of Intelligent Technology',
            primaryButton: 'PURCHASE EBOOK',
            secondaryButton: 'VIEW SERIES',
          },
          aiStrategic: {
            focusLabel: 'IN FOCUS',
            category: 'BUSINESS CRITICAL TOPIC',
            title:
              'THE HUMAN ALGORITHM: NAVIGATING THE ORGANIZATIONAL SHOCKWAVES OF AI',
            subtitle:
              'AI, Automation & the Future of Work: Strategic Imperatives in the Age of Intelligent Technology',
            primaryButton: 'PURCHASE EBOOK',
            secondaryButton: 'VIEW SERIES',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        sectionHeader: 'OUR CLIENT',
        sectionTitle: 'TESTIMONIALS',
        items: {
          james: {
            mentor: 'JAMES ARMSTRONG',
            text: "James is a very dynamic individual who has extensive knowledge of the executive business environment. He is a master mentor to all of his associates and has contributed to their great success and advancement. James has become a leader in his realm by his keen insights, strong dedication, and masterful knowledge of human nature. I trust James' judgement completely.",
            client: 'ROBERT MCDONOUGH',
            title: 'RETIRED SENIOR EXECUTIVE:',
            company: 'MULTIPLE INTERNATIONAL INDUSTRIES',
          },
          claire: {
            mentor: 'DR. CLAIRE KEOGH',
            text: 'Dr. Claire Keogh brings exceptional expertise and insight to executive coaching. Her analytical approach combined with deep understanding of organizational dynamics has transformed our leadership team. Her guidance has been instrumental in developing our strategic vision and improving our decision-making processes across all levels of management.',
            client: 'SARAH WILLIAMS',
            title: 'CEO:',
            company: 'GLOBAL TECHNOLOGY SOLUTIONS',
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'WHY US',
        sectionTitle: 'Real numbers. Real impact. Real transformation.',
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
        sectionDescription:
          'We believe true leadership is about people, not power. We empower next-gen leaders with the skills and mindset for long-term success. Our programs cultivate visionary leadership rooted in empathy, integrity, and purpose. We help leaders develop their moral compass to drive business success and social impact globally.',
        items: {
          holisticLeadership: {
            title: 'HOLISTIC 360° LEADERSHIP DEVELOPMENT',
            description:
              'Experience our "Two-To-One Advantage™" with two expert mentors offering diverse global perspectives. Our proprietary models align personal and professional growth using data-driven diagnosis for hyper-personalized, verifiable results. This flexible, full-cycle development transforms every interaction into a moment of influence.',
          },
          profitability: {
            title: 'LONG-TERM PROFITABILITY',
            description:
              'Sustainable growth stems from empathetic, ethical leadership. We prioritize transparency and responsibility to build resilient cultures and brand loyalty. Using neuroscience to enhance decision-making, we help organizations outperform peers, attract purpose-driven talent, and turn shared values into a competitive advantage.',
          },
          globalExpertise: {
            title: 'GLOBAL EXPERTISE, LOCAL IMPACT',
            description:
              'We translate international insights into actionable, market-specific strategies. Mentoring 5,000+ executives across 186 industries, we align global best practices with local realities. We help you anticipate trends and use local precision to position your organization as a sustainable industry leader.',
          },
          empathy: {
            title: 'EMPATHY AT THE CORE',
            description:
              'Empathy is a strategic imperative that fosters inclusive cultures and inspires trust. We help executives unlock engagement and drive innovation by placing empathy at the core of leadership. Genuine empathy builds alignment, reduces resistance, and positions your organization as an employer of choice.',
          },
          partnerships: {
            title: 'BUILDING STRATEGIC PARTNERSHIPS & ALLIANCES',
            description:
              'Strategic alliances are essential for resilience and growth. We coach leaders to develop partnerships that expand capabilities and enter new markets. Our program fosters next-generation collaborations based on shared values, helping you forge relationships that deliver sustainable, long-term value and win/win outcomes.',
          },
          aiTechnology: {
            title: 'MAXIMIZING AI TECHNOLOGY STRATEGY',
            description:
              'AI is a strategic enabler. We advise leaders on harnessing AI to optimize decision-making and uncover growth opportunities. By embedding AI into core strategy, you gain a dynamic edge. We help you navigate risks, ensure compliance, and turn complexity into clarity for global value creation.',
          },
        },
      },
      blog: {
        title: 'OUR BLOGS',
        subtitle:
          'Explore our curated blogs packed with case studies, expert insights, and actionable frameworks to elevate executive performance and organizational effectiveness.',
        readMore: 'READ FULL BLOG',
        viewMore: 'VIEW MORE',
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
        about: 'Acerca de',
        services: 'Servicios',
        blog: 'Blog',
        contact: 'Contacto',
        login: 'Iniciar sesión',
      },
      // Hero Section
      hero: {
        title: 'Positivamente ',
        titleHighlight: 'redefiniendo',
        titleEnd: ' el negocio del siglo XXI',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' es una firma de coaching ejecutivo de nueva generación que empodera a líderes desde startups hasta corporaciones multinacionales para tener éxito en el panorama empresarial del siglo XXI.',
        cta: 'Comenzar',
        buttons: {
          viewVideo: 'VER VIDEO DE INTRODUCCIÓN',
          scheduleCall: 'PROGRAMAR UNA LLAMADA DE DESCUBRIMIENTO',
        },
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
        subtitle: 'Servicios profesionales para elevar tu negocio',
        sectionHeader: 'QUÉ PROPORCIONAMOS',
        sectionTitle: 'NUESTROS SERVICIOS',
        sectionDescription:
          'Entregamos programas de liderazgo y rendimiento a medida que empoderan a los líderes con claridad y confianza.',
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
            'Coaching en vivo propietario de dos a uno que eleva la autoconciencia, la comunicación, la inteligencia emocional y la visión estratégica — impulsando el pensamiento crítico innovador y resultados consistentes en el mundo real.',
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
            'Coaching en vivo propietario de dos a uno que eleva la autoconciencia, la comunicación, la inteligencia emocional y la visión estratégica — impulsando el pensamiento crítico innovador y resultados consistentes en el mundo real.',
          trainTheTrainer:
            '"ENTRENAR AL ENTRENADOR" INTELIGENCIA EMOCIONAL Y EMPATÍA ENFOCADA PROGRAMA DE 1 SEMANA',
          trainTheTrainerDesc:
            'Seminarios personalizados en sitio con módulos interactivos, simulaciones y role-play para acelerar el desarrollo de habilidades, fortalecer la toma de decisiones y mejorar la colaboración en toda tu organización.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'QUIÉNES SOMOS',
        sectionTitle: 'NUESTROS INFLUENCIADORES',
        sectionDescription:
          'Nuestros asesores de coaching expertos proporcionan coaching de vanguardia, personalizado de 2 a 1, seminarios intensivos de negocio acelerados e innovación en liderazgo.',
        buttons: {
          readBio: 'LEER BIO',
          viewIntro: 'VER INTRO',
        },
        experience: '20+ AÑOS DE EXPERIENCIA',
        members: {
          james: {
            name: 'JAMES ARMSTRONG',
            title: 'Mentor Internacional Certificado',
          },
          claire: {
            name: 'DR. CLAIRE KEOGH',
            title: 'BSc IT (Hons), PhD.',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        sectionHeader: 'QUÉ PROPORCIONAMOS',
        sectionTitle: 'NUESTROS EBOOKS',
        sectionDescription:
          'Explora nuestros eBooks curados llenos de estudios de caso, insights de expertos y marcos accionables para elevar el rendimiento ejecutivo y la efectividad organizacional.',
        viewMore: 'VER MÁS',
        items: {
          humanAlgorithm: {
            focusLabel: 'EN FOCO',
            category: 'TEMA CRÍTICO DE NEGOCIO',
            title:
              'EL ALGORITMO HUMANO: NAVEGANDO LAS ONDAS DE CHOQUE ORGANIZACIONALES DE LA IA',
            subtitle:
              'IA, Automatización y el Futuro del Trabajo: Imperativos Estratégicos en la Era de la Tecnología Inteligente',
            primaryButton: 'COMPRAR AHORA',
            secondaryButton: 'VER SERIE',
          },
          organizationalShockwaves: {
            focusLabel: 'EN FOCO',
            category: 'TEMA CRÍTICO DE NEGOCIO',
            title:
              'EL ALGORITMO HUMANO: NAVEGANDO LAS ONDAS DE CHOQUE ORGANIZACIONALES DE LA IA',
            subtitle:
              'IA, Automatización y el Futuro del Trabajo: Imperativos Estratégicos en la Era de la Tecnología Inteligente',
            primaryButton: 'COMPRAR EBOOK',
            secondaryButton: 'VER SERIE',
          },
          aiStrategic: {
            focusLabel: 'EN FOCO',
            category: 'TEMA CRÍTICO DE NEGOCIO',
            title:
              'EL ALGORITMO HUMANO: NAVEGANDO LAS ONDAS DE CHOQUE ORGANIZACIONALES DE LA IA',
            subtitle:
              'IA, Automatización y el Futuro del Trabajo: Imperativos Estratégicos en la Era de la Tecnología Inteligente',
            primaryButton: 'COMPRAR EBOOK',
            secondaryButton: 'VER SERIE',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        sectionHeader: 'NUESTRO CLIENTE',
        sectionTitle: 'TESTIMONIOS',
        items: {
          james: {
            mentor: 'JAMES ARMSTRONG',
            text: 'James es un individuo muy dinámico que tiene un amplio conocimiento del entorno empresarial ejecutivo. Es un mentor maestro para todos sus asociados y ha contribuido a su gran éxito y avance. James se ha convertido en un líder en su ámbito por sus agudos insights, fuerte dedicación y magistral conocimiento de la naturaleza humana. Confío completamente en el juicio de James.',
            client: 'ROBERT MCDONOUGH',
            title: 'EJECUTIVO SENIOR RETIRADO:',
            company: 'MÚLTIPLES INDUSTRIAS INTERNACIONALES',
          },
          claire: {
            mentor: 'DR. CLAIRE KEOGH',
            text: 'La Dra. Claire Keogh aporta excepcional expertise e insight al coaching ejecutivo. Su enfoque analítico combinado con una profunda comprensión de las dinámicas organizacionales ha transformado nuestro equipo de liderazgo. Su guía ha sido instrumental en el desarrollo de nuestra visión estratégica y mejora de nuestros procesos de toma de decisiones en todos los niveles de gestión.',
            client: 'SARAH WILLIAMS',
            title: 'CEO:',
            company: 'SOLUCIONES TECNOLÓGICAS GLOBALES',
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'POR QUÉ NOSOTROS',
        sectionTitle: 'Números reales. Impacto real. Transformación real.',
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
        sectionDescription:
          'Creemos que el verdadero liderazgo se trata de personas, no de poder. Empoderamos a líderes de nueva generación con las habilidades y mentalidad para el éxito a largo plazo. Nuestros programas cultivan liderazgo visionario arraigado en empatía, integridad y propósito. Ayudamos a los líderes a desarrollar su brújula moral para impulsar el éxito empresarial e impacto social global.',
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
              'Traducimos insights internacionales en estrategias accionables, específicas del mercado. Mentorizando a más de 5,000 ejecutivos en 186 industrias, alineamos mejores prácticas globales con realidades locales. Te ayudamos a anticipar tendencias y usar precisión local para posicionar tu organización como líder sostenible en la industria.',
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
        title: 'NUESTROS BLOGS',
        subtitle:
          'Explora nuestros blogs curados llenos de estudios de caso, insights de expertos y marcos accionables para elevar el rendimiento ejecutivo y la efectividad organizacional.',
        readMore: 'LEER BLOG COMPLETO',
        viewMore: 'VER MÁS',
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
        home: 'Startseite',
        about: 'Über uns',
        services: 'Dienstleistungen',
        blog: 'Blog',
        contact: 'Kontakt',
        login: 'Anmelden',
      },
      hero: {
        title: 'Positiv ',
        titleHighlight: 'neu definieren',
        titleEnd: ' des 21. Jahrhunderts Geschäft',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' ist eine Coaching-Firma der nächsten Generation für Führungskräfte, die Führungskräfte von Start-ups bis hin zu multinationalen Unternehmen dabei unterstützt, im Geschäftsumfeld des 21. Jahrhunderts erfolgreich zu sein.',
        cta: 'Loslegen',
        buttons: {
          viewVideo: 'EINFÜHRUNGSVIDEO ANSEHEN',
          scheduleCall: 'ENTDECKUNGSGESPRÄCH VEREINBAREN',
        },
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
        subtitle:
          'Professionelle Dienstleistungen zur Weiterentwicklung Ihres Unternehmens',
        sectionHeader: 'WAS WIR BIETEN',
        sectionTitle: 'UNSERE DIENSTLEISTUNGEN',
        sectionDescription:
          'Wir liefern maßgeschneiderte Führungs- und Leistungsprogramme, die Führungskräfte mit Klarheit und Vertrauen stärken.',
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
            'Proprietäres Live-Zwei-zu-Eins-Coaching, das Selbstbewusstsein, Kommunikation, emotionale Intelligenz und strategische Vision erhöht – innovative kritische Denkweise und konsistente reale Ergebnisse fördert.',
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
            'Proprietäres Live-Zwei-zu-Eins-Coaching, das Selbstbewusstsein, Kommunikation, emotionale Intelligenz und strategische Vision erhöht – innovative kritische Denkweise und konsistente reale Ergebnisse fördert.',
          trainTheTrainer:
            '"TRAIN-THE-TRAINER" EMOTIONALE INTELLIGENZ & EMPATHIE FOKUSSIERTES 1-WOCHEN-PROGRAMM',
          trainTheTrainerDesc:
            'Maßgeschneiderte Vor-Ort-Seminare mit interaktiven Modulen, Simulationen und Rollenspielen zur Beschleunigung der Fähigkeitsentwicklung, Stärkung der Entscheidungsfindung und Verbesserung der Zusammenarbeit in Ihrer Organisation.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'WER WIR SIND',
        sectionTitle: 'UNSERE EINFLUSSNEHMER',
        sectionDescription:
          'Unsere erfahrenen Coaching-Berater bieten erstklassiges, personalisiertes 2-zu-1-Coaching, beschleunigte intensive Geschäftsseminare und innovative Führung.',
        buttons: {
          readBio: 'BIO LESEN',
          viewIntro: 'INTRO ANSEHEN',
        },
        experience: '20+ JAHRE ERFAHRUNG',
        members: {
          james: {
            name: 'JAMES ARMSTRONG',
            title: 'Zertifizierter Internationaler Mentor',
          },
          claire: {
            name: 'DR. CLAIRE KEOGH',
            title: 'BSc IT (Hons), PhD.',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        sectionHeader: 'WAS WIR BIETEN',
        sectionTitle: 'UNSERE EBOOKS',
        sectionDescription:
          'Entdecken Sie unsere kuratierten eBooks mit Fallstudien, Expertenwissen und umsetzbaren Frameworks zur Steigerung der Führungsleistung und organisatorischen Effektivität.',
        viewMore: 'MEHR ANZEIGEN',
        items: {
          humanAlgorithm: {
            focusLabel: 'IM FOKUS',
            category: 'KRITISCHES GESCHÄFTSTHEMA',
            title:
              'DER MENSCHLICHE ALGORITHMUS: NAVIGATION DURCH DIE ORGANISATORISCHEN SCHOCKWELLEN DER KI',
            subtitle:
              'KI, Automatisierung & die Zukunft der Arbeit: Strategische Imperative im Zeitalter der intelligenten Technologie',
            primaryButton: 'BUNDLE KAUFEN',
            secondaryButton: 'SERIE ANSEHEN',
          },
          organizationalShockwaves: {
            focusLabel: 'IM FOKUS',
            category: 'KRITISCHES GESCHÄFTSTHEMA',
            title:
              'DER MENSCHLICHE ALGORITHMUS: NAVIGATION DURCH DIE ORGANISATORISCHEN SCHOCKWELLEN DER KI',
            subtitle:
              'KI, Automatisierung & die Zukunft der Arbeit: Strategische Imperative im Zeitalter der intelligenten Technologie',
            primaryButton: 'EBOOK KAUFEN',
            secondaryButton: 'SERIE ANSEHEN',
          },
          aiStrategic: {
            focusLabel: 'IM FOKUS',
            category: 'KRITISCHES GESCHÄFTSTHEMA',
            title:
              'DER MENSCHLICHE ALGORITHMUS: NAVIGATION DURCH DIE ORGANISATORISCHEN SCHOCKWELLEN DER KI',
            subtitle:
              'KI, Automatisierung & die Zukunft der Arbeit: Strategische Imperative im Zeitalter der intelligenten Technologie',
            primaryButton: 'EBOOK KAUFEN',
            secondaryButton: 'SERIE ANSEHEN',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        sectionHeader: 'UNSERE KLIENTEN',
        sectionTitle: 'TESTIMONIALS',
        items: {
          james: {
            mentor: 'JAMES ARMSTRONG',
            text: "James ist eine sehr dynamische Person mit umfassendem Wissen über die Geschäftsumgebung für Führungskräfte. Er ist ein Meistermentor für alle seine Mitarbeiter und hat zu ihrem großen Erfolg und Fortschritt beigetragen. James ist durch seine scharfen Einblicke, starke Hingabe und meisterhafte Kenntnis der menschlichen Natur zu einem Führer in seinem Bereich geworden. Ich vertraue James' Urteilsvermögen vollständig.",
            client: 'ROBERT MCDONOUGH',
            title: 'PENSIONIERTER SENIOR EXECUTIVE:',
            company: 'MEHRERE INTERNATIONALE INDUSTRIEZWEIGE',
          },
          claire: {
            mentor: 'DR. CLAIRE KEOGH',
            text: 'Dr. Claire Keogh bringt außergewöhnliche Expertise und Einblicke in das Executive Coaching. Ihr analytischer Ansatz in Kombination mit tiefem Verständnis der organisatorischen Dynamik hat unser Führungsteam transformiert. Ihre Führung war entscheidend für die Entwicklung unserer strategischen Vision und die Verbesserung unserer Entscheidungsprozesse auf allen Managementebenen.',
            client: 'SARAH WILLIAMS',
            title: 'CEO:',
            company: 'GLOBALE TECHNOLOGIELÖSUNGEN',
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'WARUM WIR',
        sectionTitle: 'Reale Zahlen. Reale Wirkung. Reale Transformation.',
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
        title: 'UNSERE BLOGS',
        subtitle:
          'Entdecken Sie unsere kuratierten Blogs mit Fallstudien, Expertenwissen und umsetzbaren Frameworks zur Steigerung der Führungsleistung und organisatorischen Effektivität.',
        readMore: 'VOLlständigen Blog lesen',
        viewMore: 'MEHR ANZEIGEN',
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
        about: 'À propos',
        services: 'Services',
        blog: 'Blog',
        contact: 'Contact',
        login: 'Connexion',
      },
      hero: {
        title: 'Redéfinir positivement ',
        titleHighlight: 'les affaires',
        titleEnd: ' du 21ème siècle',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' est une entreprise de coaching exécutif de nouvelle génération qui permet aux leaders des start-ups aux multinationales de réussir dans le paysage commercial du 21ème siècle.',
        cta: 'Commencer',
        buttons: {
          viewVideo: "VOIR LA VIDÉO D'INTRODUCTION",
          scheduleCall: 'PLANIFIER UN APPEL DE DÉCOUVERTE',
        },
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
        subtitle: 'Services professionnels pour élever votre entreprise',
        sectionHeader: 'CE QUE NOUS PROPOSONS',
        sectionTitle: 'NOS SERVICES',
        sectionDescription:
          'Nous proposons des programmes de leadership et de performance sur mesure qui donnent aux leaders clarté et confiance.',
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
            "Coaching propriétaire en direct deux-à-un qui élève la conscience de soi, la communication, l'intelligence émotionnelle et la vision stratégique — stimulant la pensée critique innovante et des résultats réels cohérents.",
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
            "Coaching propriétaire en direct deux-à-un qui élève la conscience de soi, la communication, l'intelligence émotionnelle et la vision stratégique — stimulant la pensée critique innovante et des résultats réels cohérents.",
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
        sectionDescription:
          'Nos conseillers de coaching experts offrent un coaching 2-à-1 de pointe, personnalisé, des séminaires intensifs accélérés sur les affaires et un leadership innovant.',
        buttons: {
          readBio: 'LIRE LA BIO',
          viewIntro: "VOIR L'INTRO",
        },
        experience: "20+ ANNÉES D'EXPÉRIENCE",
        members: {
          james: {
            name: 'JAMES ARMSTRONG',
            title: 'Mentor International Certifié',
          },
          claire: {
            name: 'DR. CLAIRE KEOGH',
            title: 'BSc IT (Hons), PhD.',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        sectionHeader: 'CE QUE NOUS PROPOSONS',
        sectionTitle: 'NOS EBOOKS',
        sectionDescription:
          "Explorez nos eBooks curatés remplis d'études de cas, d'informations d'experts et de frameworks actionnables pour élever les performances exécutives et l'efficacité organisationnelle.",
        viewMore: 'VOIR PLUS',
        items: {
          humanAlgorithm: {
            focusLabel: "AU CENTRE DE L'ATTENTION",
            category: "SUJET CRITIQUE D'AFFAIRES",
            title:
              "L'ALGORITHME HUMAIN : NAVIGUER LES ONDES DE CHOC ORGANISATIONNELLES DE L'IA",
            subtitle:
              "IA, Automatisation & l'Avenir du Travail : Impératifs Stratégiques à l'Ère de la Technologie Intelligente",
            primaryButton: 'ACHETER LE LOT',
            secondaryButton: 'VOIR LA SÉRIE',
          },
          organizationalShockwaves: {
            focusLabel: "AU CENTRE DE L'ATTENTION",
            category: "SUJET CRITIQUE D'AFFAIRES",
            title:
              "L'ALGORITHME HUMAIN : NAVIGUER LES ONDES DE CHOC ORGANISATIONNELLES DE L'IA",
            subtitle:
              "IA, Automatisation & l'Avenir du Travail : Impératifs Stratégiques à l'Ère de la Technologie Intelligente",
            primaryButton: "ACHETER L'EBOOK",
            secondaryButton: 'VOIR LA SÉRIE',
          },
          aiStrategic: {
            focusLabel: "AU CENTRE DE L'ATTENTION",
            category: "SUJET CRITIQUE D'AFFAIRES",
            title:
              "L'ALGORITHME HUMAIN : NAVIGUER LES ONDES DE CHOC ORGANISATIONNELLES DE L'IA",
            subtitle:
              "IA, Automatisation & l'Avenir du Travail : Impératifs Stratégiques à l'Ère de la Technologie Intelligente",
            primaryButton: "ACHETER L'EBOOK",
            secondaryButton: 'VOIR LA SÉRIE',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        sectionHeader: 'NOS CLIENTS',
        sectionTitle: 'TÉMOIGNAGES',
        items: {
          james: {
            mentor: 'JAMES ARMSTRONG',
            text: "James est un individu très dynamique qui possède une connaissance approfondie de l'environnement commercial exécutif. Il est un mentor maître pour tous ses associés et a contribué à leur grand succès et avancement. James est devenu un leader dans son domaine grâce à ses intuitions aiguisées, sa forte dévotion et sa connaissance magistrale de la nature humaine. Je fais entièrement confiance au jugement de James.",
            client: 'ROBERT MCDONOUGH',
            title: 'EXECUTIVE SENIOR RETRAITÉ :',
            company: 'MULTIPLES INDUSTRIES INTERNATIONALES',
          },
          claire: {
            mentor: 'DR. CLAIRE KEOGH',
            text: 'Le Dr Claire Keogh apporte une expertise et des insights exceptionnels au coaching exécutif. Son approche analytique combinée à une compréhension profonde de la dynamique organisationnelle a transformé notre équipe de leadership. Ses conseils ont été déterminants pour développer notre vision stratégique et améliorer nos processus de prise de décision à tous les niveaux de gestion.',
            client: 'SARAH WILLIAMS',
            title: 'CEO :',
            company: 'SOLUTIONS TECHNOLOGIQUES GLOBALES',
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'POURQUOI NOUS',
        sectionTitle: 'Des chiffres reels. Un impact reel. Une transformation reelle.',
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
        title: 'NOS BLOGS',
        subtitle:
          "Explorez nos blogs curatés remplis d'études de cas, d'informations d'experts et de frameworks actionnables pour élever les performances exécutives et l'efficacité organisationnelle.",
        readMore: 'LIRE LE BLOG COMPLET',
        viewMore: 'VOIR PLUS',
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
        about: 'Chi siamo',
        services: 'Servizi',
        blog: 'Blog',
        contact: 'Contatto',
        login: 'Accedi',
      },
      hero: {
        title: 'Ridefinire positivamente ',
        titleHighlight: 'il business',
        titleEnd: ' del 21° secolo',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          ' è una società di coaching esecutivo di nuova generazione che permette ai leader dalle start-up alle multinazionali di avere successo nel panorama aziendale del 21° secolo.',
        cta: 'Inizia',
        buttons: {
          viewVideo: 'GUARDA IL VIDEO INTRODUTTIVO',
          scheduleCall: 'PROGRAMMA UNA CHIAMATA DI SCOPERTA',
        },
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
        subtitle: 'Servizi professionali per elevare la vostra attività',
        sectionHeader: 'QUELLO CHE FORNIAMO',
        sectionTitle: 'I NOSTRI SERVIZI',
        sectionDescription:
          'Consegniamo programmi di leadership e performance su misura che danno ai leader chiarezza e fiducia.',
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
            "Coaching proprietario dal vivo due-a-uno che eleva la consapevolezza di sé, la comunicazione, l'intelligenza emotiva e la visione strategica — guidando il pensiero critico innovativo e risultati reali coerenti.",
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
            "Coaching proprietario dal vivo due-a-uno che eleva la consapevolezza di sé, la comunicazione, l'intelligenza emotiva e la visione strategica — guidando il pensiero critico innovativo e risultati reali coerenti.",
          trainTheTrainer:
            'PROGRAMMA "FORMA IL FORMATORE" CONCENTRATO SU INTELLIGENZA EMOTIVA E EMPATIA DI 1 SETTIMANA',
          trainTheTrainerDesc:
            'Seminari su sito personalizzati con moduli interattivi, simulazioni e giochi di ruolo per accelerare lo sviluppo delle competenze, rafforzare il processo decisionale e migliorare la collaborazione nella vostra organizzazione.',
        },
      },
      // Team Section
      team: {
        sectionHeader: 'CHI SIAMO',
        sectionTitle: 'I NOSTRI INFLUENCERS',
        sectionDescription:
          "I nostri consulenti di coaching esperti offrono coaching 2-a-1 all'avanguardia, personalizzato, seminari intensivi accelerati sugli affari e leadership innovativa.",
        buttons: {
          readBio: 'LEGGI BIO',
          viewIntro: 'GUARDA INTRO',
        },
        experience: '20+ ANNI DI ESPERIENZA',
        members: {
          james: {
            name: 'JAMES ARMSTRONG',
            title: 'Mentore Internazionale Certificato',
          },
          claire: {
            name: 'DR. CLAIRE KEOGH',
            title: 'BSc IT (Hons), PhD.',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        sectionHeader: 'QUELLO CHE FORNIAMO',
        sectionTitle: 'I NOSTRI EBOOK',
        sectionDescription:
          "Esplora i nostri eBook curati ricchi di casi studio, intuizioni di esperti e framework attuabili per elevare le prestazioni esecutive e l'efficacia organizzativa.",
        viewMore: 'VEDI DI PIÙ',
        items: {
          humanAlgorithm: {
            focusLabel: 'IN FOCUS',
            category: 'ARGOMENTO CRITICO PER GLI AFFARI',
            title:
              "L'ALGORITMO UMANO: NAVIGARE LE ONDE D'URTO ORGANIZZATIVE DELL'IA",
            subtitle:
              "IA, Automazione & il Futuro del Lavoro: Imperativi Strategici nell'Era della Tecnologia Intelligente",
            primaryButton: 'ACQUISTA PACCHETTO',
            secondaryButton: 'VEDI SERIE',
          },
          organizationalShockwaves: {
            focusLabel: 'IN FOCUS',
            category: 'ARGOMENTO CRITICO PER GLI AFFARI',
            title:
              "L'ALGORITMO UMANO: NAVIGARE LE ONDE D'URTO ORGANIZZATIVE DELL'IA",
            subtitle:
              "IA, Automazione & il Futuro del Lavoro: Imperativi Strategici nell'Era della Tecnologia Intelligente",
            primaryButton: 'ACQUISTA EBOOK',
            secondaryButton: 'VEDI SERIE',
          },
          aiStrategic: {
            focusLabel: 'IN FOCUS',
            category: 'ARGOMENTO CRITICO PER GLI AFFARI',
            title:
              "L'ALGORITMO UMANO: NAVIGARE LE ONDE D'URTO ORGANIZZATIVE DELL'IA",
            subtitle:
              "IA, Automazione & il Futuro del Lavoro: Imperativi Strategici nell'Era della Tecnologia Intelligente",
            primaryButton: 'ACQUISTA EBOOK',
            secondaryButton: 'VEDI SERIE',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        sectionHeader: 'I NOSTRI CLIENTI',
        sectionTitle: 'TESTIMONIANZE',
        items: {
          james: {
            mentor: 'JAMES ARMSTRONG',
            text: "James è un individuo molto dinamico che ha una conoscenza approfondita dell'ambiente aziendale esecutivo. È un mentore maestro per tutti i suoi associati e ha contribuito al loro grande successo e avanzamento. James è diventato un leader nel suo campo grazie alle sue intuizioni acute, forte dedizione e conoscenza magistrale della natura umana. Mi fido completamente del giudizio di James.",
            client: 'ROBERT MCDONOUGH',
            title: 'EXECUTIVE SENIOR IN PENSIONE:',
            company: 'MULTIPLE INDUSTRIE INTERNAZIONALI',
          },
          claire: {
            mentor: 'DR. CLAIRE KEOGH',
            text: 'Il Dr. Claire Keogh porta expertise e intuizioni eccezionali al coaching esecutivo. Il suo approccio analitico combinato con una profonda comprensione della dinamica organizzativa ha trasformato il nostro team di leadership. La sua guida è stata determinante per sviluppare la nostra visione strategica e migliorare i nostri processi decisionali a tutti i livelli di management.',
            client: 'SARAH WILLIAMS',
            title: 'CEO:',
            company: 'SOLUZIONI TECNOLOGICHE GLOBALI',
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: 'PERCHÉ NOI',
        sectionTitle: 'Numeri reali. Impatto reale. Trasformazione reale.',
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
        title: 'I NOSTRI BLOG',
        subtitle:
          "Esplora i nostri blog curati ricchi di casi studio, intuizioni di esperti e framework attuabili per elevare le prestazioni esecutive e l'efficacia organizzativa.",
        readMore: 'LEGGI IL BLOG COMPLETO',
        viewMore: 'VEDI DI PIÙ',
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
        about: '关于我们',
        services: '服务',
        blog: '博客',
        contact: '联系我们',
        login: '登录',
      },
      hero: {
        title: '积极重新定义',
        titleHighlight: '21世纪',
        titleEnd: '商业',
        subtitleStart: 'The CEO Influencers',
        subtitleEnd:
          '是一家下一代高管教练公司，帮助从初创企业到跨国公司的领导者在21世纪商业环境中取得成功。',
        cta: '开始使用',
        buttons: {
          viewVideo: '观看介绍视频',
          scheduleCall: '安排发现通话',
        },
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
        subtitle: '提升您业务的优质服务',
        sectionHeader: '我们提供什么',
        sectionTitle: '我们的服务',
        sectionDescription:
          '我们提供定制的领导力和绩效计划，帮助领导者获得清晰度和信心。',
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
            '专有的现场二人教练，提升自我意识、沟通、情商和战略视野——推动创新性批判性思维和一致的实际结果。',
          corporateTraining: '企业领导力客户现场培训1周研讨会',
          corporateTrainingDesc:
            '定制的现场研讨会，包含互动模块、模拟和角色扮演，以加速技能发展，加强决策制定，并增强组织内的协作。',
          businessMastermind: '商业智囊团小组1周密集活动',
          businessMastermindDesc:
            '自定进度的二人教练课程，旨在建立高绩效团队，嵌入信任和问责制，并根据您的日程安排促进协作和创新。',
          businessMastermindInfluencer: '商业智囊团影响者1天课程',
          businessMastermindInfluencerDesc:
            '专有的现场二人教练，提升自我意识、沟通、情商和战略视野——推动创新性批判性思维和一致的实际结果。',
          trainTheTrainer: '"培训师培训" 情绪智力与同理心聚焦1周课程',
          trainTheTrainerDesc:
            '定制的现场研讨会，包含互动模块、模拟和角色扮演，以加速技能发展，加强决策制定，并增强组织内的协作。',
        },
      },
      // Team Section
      team: {
        sectionHeader: '我们是谁',
        sectionTitle: '我们的影响者',
        sectionDescription:
          '我们的专家教练顾问提供尖端、个性化的2对1教练、加速商业密集研讨会和创新领导力。',
        buttons: {
          readBio: '阅读简介',
          viewIntro: '观看介绍',
        },
        experience: '20+年经验',
        members: {
          james: {
            name: 'JAMES ARMSTRONG',
            title: '认证国际导师',
          },
          claire: {
            name: 'DR. CLAIRE KEOGH',
            title: 'BSc IT (Hons), PhD.',
          },
        },
      },
      // Ebooks Section
      ebooks: {
        sectionHeader: '我们提供什么',
        sectionTitle: '我们的电子书',
        sectionDescription:
          '探索我们精心策划的电子书，包含案例研究、专家洞察和可操作框架，以提升高管绩效和组织效能。',
        viewMore: '查看更多',
        items: {
          humanAlgorithm: {
            focusLabel: '焦点',
            category: '商业关键主题',
            title: '人类算法：驾驭人工智能的组织冲击波',
            subtitle: '人工智能、自动化与工作未来：在智能技术时代战略要务',
            primaryButton: '购买套装',
            secondaryButton: '查看系列',
          },
          organizationalShockwaves: {
            focusLabel: '焦点',
            category: '商业关键主题',
            title: '人类算法：驾驭人工智能的组织冲击波',
            subtitle: '人工智能、自动化与工作未来：在智能技术时代战略要务',
            primaryButton: '购买电子书',
            secondaryButton: '查看系列',
          },
          aiStrategic: {
            focusLabel: '焦点',
            category: '商业关键主题',
            title: '人类算法：驾驭人工智能的组织冲击波',
            subtitle: '人工智能、自动化与工作未来：在智能技术时代战略要务',
            primaryButton: '购买电子书',
            secondaryButton: '查看系列',
          },
        },
      },
      // Testimonials Section
      testimonials: {
        sectionHeader: '我们的客户',
        sectionTitle: '推荐',
        items: {
          james: {
            mentor: 'JAMES ARMSTRONG',
            text: 'James是一个非常有活力的个人，对高管商业环境有广泛的知识。他是他所有同事的大师级导师，并为他们的巨大成功和进步做出了贡献。James通过他的敏锐洞察、坚定奉献和对人性的精湛知识成为了他领域中的领导者。我完全信任James的判断。',
            client: 'ROBERT MCDONOUGH',
            title: '退休高级执行官：',
            company: '多个国际行业',
          },
          claire: {
            mentor: 'DR. CLAIRE KEOGH',
            text: 'Claire Keogh博士为高管教练带来了卓越的专业知识和洞察力。她分析性的方法结合了对组织动态的深入理解，改变了我们的领导团队。她的指导对于发展我们的战略愿景和改善所有管理层面的决策过程至关重要。',
            client: 'SARAH WILLIAMS',
            title: 'CEO：',
            company: '全球技术解决方案',
          },
        },
      },
      // Stats Section
      stats: {
        sectionHeader: '为什么选择我们',
        sectionTitle: '真实数字。真实影响。真实转型。',
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
        title: '我们的博客',
        subtitle:
          '探索我们精心策划的博客，包含案例研究、专家洞察和可操作框架，以提升高管绩效和组织效能。',
        readMore: '阅读完整博客',
        viewMore: '查看更多',
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
