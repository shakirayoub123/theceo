from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

SIX_ASSESSMENTS = [
    (
        1,
        "MBTI – Meyers-Briggs Personality Profile Assessment",
        [
            "1. When facing a critical strategic challenge, you are more likely to:",
            "2. After a long week of board meetings and high-level negotiations, you feel:",
            "3. In a large industry conference or networking event, you tend to:",
            "4. Your communication style is generally:",
            "5. When leading a major company-wide announcement, you are most comfortable:",
            "6. When reviewing a new business proposal, you focus first on:",
            "7. To solve a complex operational problem, you trust:",
            "8. When absorbing a market analysis report, you are more interested in:",
            "9. You would describe your approach as more:",
            "10. In strategic planning, you are most skilled at:",
            "11. When making a difficult decision, such as a departmental restructuring, your primary driver is:",
            "12. Your feedback to a direct report is more likely to be:",
            "13. You believe a fair leader is someone who:",
            "14. When a strategic choice pits efficiency against team morale, you instinctively lean towards:",
            "15. You are most persuaded by an argument that is:",
            "16. At the start of a major project, you feel most comfortable when you have:",
            "17. Your typical workday is:",
            "18. You view deadlines as:",
            "19. When a meeting concludes, you prefer to leave with:",
            "20. In your leadership style, you value:",
        ],
    ),
    (
        2,
        "Senior Executive Leader Soft & Hard Skills Assessment",
        [
            "1. Inspiring and articulating a compelling innovative corporate vision",
            "2. Leading and managing large-scale organizational change initiatives",
            "3. Coaching and developing other senior leaders/successors/future organizational talent management pipeline",
            "4. Cultivating a high-performance, all-inclusive holistic organizational culture",
            "5. Influencing and leading Board of Directors and key stakeholder relations",
            "6. Leading organizational manpower, technology and resources through significant crisis or ambiguity",
            "7. Developing and executing full cycle multi-year corporate strategy",
            "8. Anticipating and responding effectively to disruptive short/mid/long-range market shifts & volatility",
            "9. Fostering and implementing a vision with a correlated strategy to create a fully scalable culture of innovation",
            "10. Conducting complex scenario strategy planning and contingency analysis based on accurate real world business intelligence",
            "11. Translating long-term strategic vision into actionable annual goals (OKRs/KPIs)",
            "12. Demonstrating effective executive presence, gravitas and positive influence across the organization and with key stakeholders",
            "13. Conducting high-stakes time sensitive negotiations (e.g., M&A, Key partnerships & Strategic Alliances)",
            "14. Serving as a savvy public organizational spokesperson (multi-media, investors, board, networking)",
            "15. Articulating complex ideas with impactful simplicity to diverse target audiences",
            "16. Facilitating and leading alignment within a divided executive team to successfully resolve conflict",
            "17. Maintaining total composure and decisive judgment under extreme pressure/stress",
            "18. High degree of self-awareness (accurately identifying personal/professional strengths and growth areas)",
            "19. Practicing empathetic leadership to build trust and engagement across the organization",
            "20. Navigating complex internal/external political and interpersonal dynamics",
            "21. Personal leadership resilience and sustainable performance (burnout prevention)",
            "22. Full P&L ownership and management for a major division or enterprise",
            "23. Successful strategic capital allocation and long-term resource planning",
            "24. Leading successful fundraising initiatives, investor relations, or shareholder management",
            "25. Evaluating and integrating successful mergers and acquisitions (M&A)",
            "26. Enterprise-level financial modeling, forecasting, risk analysis and mitigation",
            "27. Scaling enterprise-wide operations (processes, technology, people, resources) for rapid growth",
            "28. Designing and managing effective global supply chains or complex service delivery systems",
            "29. Applying real-world data analytics for operational efficiency and performance improvement",
            "30. Implementing quality management systems (e.g., Six Sigma, TQM)",
            "31. Strategic full cycle Enterprise Resource Planning (ERP) and systems optimization",
            "32. Leading a major digital transformation initiative across the organization effectively",
            "33. Leveraging verified data science, AI, or ML for strategic marketplace advantage",
            "34. Cybersecurity governance, enterprise risk management and loss prevention",
            "35. Developing and launching AI/technology-based products or services",
            "36. Evaluating emerging technologies for full cycle business impact success",
            "37. Corporate governance and working with board committees (Audit, Comp, etc.)",
            "38. Navigating complex multi-jurisdictional international regulatory compliance environments",
            "39. Leading enterprise-wide legal strategy, risk management, and litigation oversight",
            "40. Developing and implementing ESG (Environmental, Social, Governance) strategy",
            "41. Managing reputational risk and crisis communications during an adverse event",
            "42. Developing and executing competitive go-to-market strategies for new products/markets",
            "43. Deep understanding of enterprise customer acquisition, retention, and lifetime value",
            "44. Building and stewarding a globally recognized, differentiated corporate brand",
            "45. Strategic oversight of commercial sales pipelines and enterprise account growth",
            "46. Deep understanding of customer experience (CX) and user journey optimization",
            "47. Building executive and organizational talent acquisition strategies for key roles",
            "48. Designing executive compensation and incentive structures aligned with strategy",
            "49. Designing optimal organizational structures for agility, collaboration, execution",
            "50. Leading through significant reduction-in-force (RIF) or organizational restructuring",
            "51. Developing global diversity, equity, and inclusion (DEI) strategies",
            "52. Developing and executing international market entry and expansion strategies",
            "53. Managing cross-cultural teams and operating in diverse global business environments",
            "54. Navigating geopolitical risks, trade policies, and currency fluctuations",
            "55. Adapting products and business models to local international market nuances",
            "56. Directing long-term R&D investments aligned with corporate strategic objectives",
            "57. Intellectual property (IP) strategy, development, monetization, and protection",
            "58. Establishing strategic innovation partnerships with universities, startups, labs",
            "59. Managing innovation portfolios balancing core optimization with disruptive bets",
            "60. Building organizational capability to rapidly prototype and commercialize ideas",
            "61. Sourcing, evaluating, negotiating strategic corporate alliances and JVs",
            "62. Managing complex stakeholder ecosystems (government, NGOs, industry groups)",
            "63. Strategic vendor and supplier management to drive innovation and cost advantage",
            "64. Influencing public policy and regulatory developments impacting your industry",
            "65. Engaging with community and civic leaders to build local social license to operate",
            "66. Developing enterprise sustainability and circular economy initiatives",
            "67. Setting and achieving science-based carbon reduction and net-zero targets",
            "68. Integrating sustainability into core product design and service delivery",
            "69. Transparent ESG reporting and engagement with responsible investors",
            "70. Leading positive social impact initiatives aligned with company purpose",
            "71. Designing and executing complex business turnaround and restructuring plans",
            "72. Managing company-wide transformation programs under intense scrutiny",
            "73. Leading the divestiture or carve-out of non-core business units",
            "74. Rapid operational cost reduction while preserving strategic capabilities",
            "75. Rebuilding organizational morale and trust following a major crisis",
        ],
    ),
    (
        3,
        "Executive Leader: Client Personal & Professional Assessment",
        [
            "1.1 Leadership Foundations & Strategic Vision",
            "1.2 Professional Experience & Core Capabilities",
            "1.3 Current Organizational Landscape & Scope",
            "1.4 Executive Leadership Strengths & Challenges",
            "1.5 Coaching Objectives, Targets & Success Metrics",
            "2.1 Personal Mission, Core Values & Life Vision",
            "2.2 Energy Management, Work-Life Harmony & Vitality",
            "2.3 Emotional Intelligence & Stress Resilience",
            "2.4 Personal Relationships & Support Networks",
            "2.5 High-Performance Habits & Routines",
            "2.6 Leadership Style Archetypes & Traits",
            "2.7 Stakeholder & Board Relationships",
            "2.8 Final Reflection & Certification",
        ],
    ),
    (
        4,
        "Senior Executive Leadership Core Competencies Assessment",
        [
            "1. Articulate a compelling long-term vision that inspires stakeholders",
            "2. Proactively identify opportunities & manage risks in global context",
            "3. Lead and manage significant organizational change initiatives",
            "4. Flexibility and resilience in adapting to rapidly changing conditions",
            "5. Encourage and implement innovative ideas challenging conventional approaches",
            "6. Stay current on policies and trends shaping stakeholder views",
            "7. Articulate clear vision & goals that motivate team members",
            "8. Foster an inclusive environment where diversity is valued",
            "9. Constructive feedback, coaching, and talent pipeline development",
            "10. Conflict management and constructive team resolution",
            "11. High emotional intelligence managing self and others",
            "12. Effective delegation for talent development and workload distribution",
            "13. Build strong cohesive teams with diverse styles and perspectives",
            "14. Drive for results and consistently achieving/exceeding organizational goals",
            "15. Timely, well-informed decision making under uncertainty",
            "16. Complex problem solving, analysis, and solution evaluation",
            "17. Personal responsibility, accountability for self and team",
            "18. Entrepreneurial mindset and calculated risk taking",
            "19. Continuous process optimization for efficiency, quality, productivity",
            "20. Business model acumen, key financial indicators & value creation",
            "21. Strategic human capital management and talent alignment",
            "22. Leverage technology and innovation for competitive advantage",
            "23. Strategic allocation and management of financial resources (ROI)",
            "24. Holistic enterprise systems thinking (strategy, structure, staff)",
            "25. Industry policies, practices, and marketplace trend mastery",
            "26. Build and leverage formal/informal multi-stakeholder networks",
            "27. Navigating organizational politics and power dynamics",
            "28. Exceptional executive communication and gravitas",
            "29. High-stakes negotiation achieving mutually beneficial outcomes",
            "30. Cross-functional and cross-border boundary-spanning collaboration",
            "31. Strong client/customer relationship focus delivering value",
            "32. Persuasion, coalition building and mobilizing organizational action",
            "33. Self-awareness: accurate assessment of strengths & growth areas",
            "34. Intellectual curiosity and proactive continuous learning",
            "35. Emotional composure and steadiness under extreme pressure",
            "36. Relentless personal resilience and bounce-back from setbacks",
            "37. High ethical integrity, transparency and moral leadership",
            "38. Sustainable executive performance and personal vitality",
            "39. Humility, openness to candid feedback and constructive critique",
            "40. Comfort with strategic ambiguity and navigating paradox",
            "41. Global mindset valuing cultural differences and nuance",
            "42. Cross-cultural intelligence and agile adaptive communication",
            "43. Multi-regional leadership across languages, cultures & time zones",
            "44. Navigating geopolitical shifts, regulatory & international policy",
            "45. Establishing international market operations and strategic JVs",
            "46. Enterprise P&L management and balance sheet accountability",
            "47. Corporate governance and effective board committee alignment",
            "48. Mergers, acquisitions, joint ventures and corporate carve-outs",
            "49. Investor relations, shareholder communications & capital markets",
            "50. ESG stewardship, enterprise sustainability and carbon targets",
            "51. Crisis management, rapid response and reputation protection",
            "52. Executive compensation, talent retention and succession design",
            "53. Cyber risk, data governance, intellectual property & AI ethics",
            "54. Global supply chain resilience, optimization and cost control",
            "55. Strategic pricing, commercial packaging and revenue growth",
            "56. Public company regulatory compliance (SEC, SOX, GDPR, etc.)",
            "57. Organizational design for agility, speed and strategic clarity",
            "58. Omnichannel brand stewardship and public executive voice",
            "59. Innovation portfolio management balancing risk and future bets",
            "60. Turnaround strategy and operational restructuring under duress",
            "61. Board advisory, fiduciary discipline and committee governance",
            "62. Executive sponsorship of company-wide digital transformations",
            "63. Strategic talent mobility and global workforce planning",
            "64. Cultivating psychological safety while holding teams accountable",
            "65. Mentoring next-generation C-suite successors and executives",
            "66. Fostering continuous learning and agile growth mindset culture",
            "67. Leading remote, hybrid and distributed international teams",
            "68. Strategic workforce transition during automation and AI shifts",
            "69. Aligning individual performance plans with enterprise KPIs",
            "70. Championing diversity, equity and belonging across all levels",
            "71. Fostering courageous innovation and psychological safety for failure",
            "72. Managing executive stress, burnout and cognitive bandwidth",
            "73. Articulating corporate social responsibility and community impact",
            "74. Long-term legacy thinking beyond short-term quarterly cycles",
            "75. Building an enduring organizational culture that outlasts leadership",
        ],
    ),
    (
        5,
        "Global Industry Experience Assessment",
        [
            "1. Technology & Software (SaaS, Enterprise, Cloud, Cybersecurity, AI/ML)",
            "2. Healthcare & Life Sciences (Biotech, Pharma, Medical Devices, Digital Health)",
            "3. Financial Services & Banking (Fintech, Investment Banking, Wealth Mgmt, Insurance)",
            "4. Manufacturing & Industrial (Aerospace, Defense, Automotive, Heavy Machinery)",
            "5. Consumer Goods & Retail (CPG, E-Commerce, Luxury, Apparel, Food & Beverage)",
            "6. Energy & Clean Technology (Renewables, Oil & Gas, Utilities, Carbon Transition)",
            "7. Telecommunications & Media (5G, Broadband, Entertainment, Streaming, Publishing)",
            "8. Professional & Business Services (Consulting, Legal, Accounting, HR & Search)",
            "9. Real Estate, Infrastructure & Construction (Commercial, PropTech, Architecture)",
            "10. Transportation, Logistics & Supply Chain (Freight, Maritime, Aviation, 3PL)",
            "11. Education & EdTech (Higher Ed, Corporate L&D, K-12, Online Platforms)",
            "12. Government, Public Sector & Defense (Federal, State, Municipal, Defense Contractors)",
            "13. Non-Profit, NGO & Social Enterprise (Foundations, Multilaterals, Philanthropy)",
            "14. Hospitality, Travel & Leisure (Hotels, Airlines, Tourism, Event Management)",
            "15. Agriculture, AgTech & Food Processing (Sustainable Farming, Precision Ag, Supply)",
            "16. Chemicals, Materials & Mining (Specialty Chem, Advanced Materials, Critical Minerals)",
            "17. Automotive & Future Mobility (EVs, Autonomous Systems, Battery Tech, Fleet)",
            "18. Media, Advertising & Entertainment (AdTech, Creative Agencies, Gaming, Sports)",
            "19. Pharmaceuticals & Biotechnology (Drug Discovery, Clinical Trials, Genomics)",
            "20. Life Sciences Tools & Diagnostics (Lab Automation, Instruments, Reagents)",
            "21. Insurance & InsurTech (P&C, Life, Reinsurance, Parametric, Underwriting)",
            "22. Asset Management & Private Equity (Venture Capital, Buyout, Real Assets, Credit)",
            "23. Space, Defense & Dual-Use Tech (Satellite, Geospatial, Defense Systems)",
            "24. Environmental & Circular Economy (Waste Mgmt, Water, Recycling, Carbon Markets)",
            "25. Sports, Gaming & Immersive Media (Esports, Metaverse, Licensing, Live Events)",
        ],
    ),
    (
        6,
        "The Senior Leader's Big 5 Personality Profile Assessment",
        [
            "1. Stimulated by abstract concepts, strategic theory, and future models",
            "2. Methodical, organized, and hold high standards of execution",
            "3. Energized by large group discussions, networking, and public speaking",
            "4. Naturally considerate of team member feelings and value harmony",
            "5. Calm and resilient under high-stakes crises or market turbulence",
            "6. Prefer proven, battle-tested solutions over radical experimentation",
            "7. Spontaneous and adaptable, adjusting schedules as priorities evolve",
            "8. Reserved; recharge through focused independent reflection",
            "9. Direct, competitive, and challenge assumptions even if it causes tension",
            "10. Experience stress, worry, or rumination over difficult decisions",
            "11. Intellectual curiosity drives continuous learning across disciplines",
            "12. Highly disciplined with deep focus on precision and follow-through",
            "13. Comfortable stepping into spotlight to rally and persuade teams",
            "14. Prioritize building deep trust and consensus among executive peers",
            "15. Emotionally steady; bounce back quickly from organizational setbacks",
            "16. Grounded in concrete facts, practical realities, and current KPIs",
            "17. Flexible approach to deadlines, prioritizing agility over rigid plans",
            "18. Prefer small intimate meetings over massive industry conferences",
            "19. Sceptical of proposals until rigorously supported by validated data",
            "20. Empathize with professional & personal challenges of reports",
            "21. Invigorated by change and thrive in strategic ambiguity",
            "22. Impatient with team members not as organized / disciplined",
            "23. Optimal business outcome focus in negotiations vs relationships",
            "24. Relaxed; don't let small problems or critiques get under skin",
            "25. Actively seek diverse & unconventional viewpoints to challenge thinking",
            "26. Drained after long periods of social engagement",
            "27. Confident navigating volatile market without becoming overly stressed",
            "28. Colleagues describe as compassionate and approachable",
            "29. Not easily distracted; see committed tasks through to completion",
            "30. Enjoy taking lead in group settings & guiding conversation",
            "31. Willing to make unpopular decisions in long-term company interest",
            "32. Strong appreciation for aesthetic & creative excellence",
            "33. Mood remains stable and predictable regardless of quarterly pressure",
            "34. Driven by strong sense of duty and responsibility",
            "35. Private person; process information internally before speaking",
        ],
    ),
]


def get_structured_assessments_for_user(client_user):
    """
    Returns structured list of all 6 assessments with their completion status
    and saved answers for the given user.
    """
    from people.models import ClientFormAnswers, Lead, LeadAssessmentEntry

    lead = Lead.objects.filter(email__iexact=client_user.email).first()
    structured_assessments = []

    for a_id, a_title, default_questions in SIX_ASSESSMENTS:
        titles_to_check = [a_title]
        if a_id == 1:
            titles_to_check.extend([
                "Fitness Assessment",
                "MBTI – MEYERS-BRIGGS PERSONALITY PROFILE ASSESSMENT 1",
                "MBTI Assessment",
            ])
        elif a_id == 2:
            titles_to_check.extend([
                "Nutrition Assessment",
                "Senior Executive Leader Soft & Hard Skills Assessment",
                "Soft & Hard Skills Assessment",
            ])
        elif a_id == 3:
            titles_to_check.extend([
                "Lifestyle Assessment",
                "Executive Leader: Client Personal & Professional Assessment",
                "Client Personal & Professional Assessment",
                "Personal & Professional Assessment",
            ])
        elif a_id == 4:
            titles_to_check.extend([
                "Goal Setting",
                "Senior Executive Leadership Core Competencies Assessment",
                "Leadership Core Competencies Assessment",
                "Core Competencies Assessment",
            ])
        elif a_id == 5:
            titles_to_check.extend([
                "Medical History",
                "Global Industry Experience Assessment",
                "Global Industry Experience Assessment: Senior Executive Leaders",
                "Industry Experience Assessment",
            ])
        elif a_id == 6:
            titles_to_check.extend([
                "Preferences & Availability",
                "The Senior Leader's Big 5 Personality Profile Assessment",
                "Big 5 Personality Assessment",
                "Big 5 Personality Profile Assessment",
                "OCEAN Assessment",
            ])

        cfa = ClientFormAnswers.objects.filter(
            user_email__iexact=client_user.email,
            questionnaire_title__in=titles_to_check,
        ).order_by("-created_at").first()

        lae = None
        if not cfa and lead:
            lae = LeadAssessmentEntry.objects.filter(
                lead=lead, assessment_id=a_id
            ).first()

        if cfa and cfa.data:
            answered_count = len(
                [x for x in cfa.data if str(x.get("answer", "")).strip() and not str(x.get("question", "")).startswith("__")]
            )
            is_completed = answered_count > 0
            structured_assessments.append(
                {
                    "id": a_id,
                    "title": a_title,
                    "completed": is_completed,
                    "completedAt": (
                        cfa.created_at.isoformat() if cfa.created_at else None
                    ),
                    "answeredCount": answered_count,
                    "totalQuestions": len(cfa.data),
                    "data": cfa.data,
                }
            )
        elif lae and lae.assessment_data:
            answers_list = [
                {"question": k, "answer": v}
                for k, v in lae.assessment_data.items()
            ]
            answered_count = len(
                [x for x in answers_list if str(x.get("answer", "")).strip() and not str(x.get("question", "")).startswith("__")]
            )
            structured_assessments.append(
                {
                    "id": a_id,
                    "title": a_title,
                    "completed": bool(lae.is_completed),
                    "completedAt": (
                        lae.completed_at.isoformat() if lae.completed_at else None
                    ),
                    "answeredCount": answered_count,
                    "totalQuestions": len(answers_list),
                    "data": answers_list,
                }
            )
        else:
            default_items = [
                {"question": q, "answer": ""} for q in default_questions
            ]
            structured_assessments.append(
                {
                    "id": a_id,
                    "title": a_title,
                    "completed": False,
                    "completedAt": None,
                    "answeredCount": 0,
                    "totalQuestions": len(default_questions),
                    "data": default_items,
                }
            )

    return structured_assessments


def save_assessment_for_user(user, assessment_id, questionnaire_title, data):
    """
    Saves or updates assessment responses for a client in ClientFormAnswers
    and syncs to LeadAssessmentEntry.
    """
    from people.models import ClientFormAnswers, Lead, LeadAssessmentEntry

    form_answer, _ = ClientFormAnswers.objects.update_or_create(
        user_email=user.email,
        questionnaire_title=questionnaire_title,
        defaults={
            "data": data,
            "created_at": timezone.now(),
        },
    )

    lead = Lead.objects.filter(email__iexact=user.email).first()
    if lead and assessment_id:
        try:
            dict_data = {
                item.get("question", f"q{i}"): item.get("answer", "")
                for i, item in enumerate(data)
            }
            LeadAssessmentEntry.objects.update_or_create(
                lead=lead,
                assessment_id=int(assessment_id),
                defaults={
                    "assessment_data": dict_data,
                    "is_completed": True,
                    "completed_at": timezone.now(),
                },
            )
        except Exception as e:
            logger.warning(f"Could not sync to LeadAssessmentEntry: {e}")

    return form_answer
