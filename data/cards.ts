export type CardData = {
  id: string;
  name: string;
  age?: number;
  emoji: string;
  role: string;
  bio: string;
  skills: string[];
  match: boolean;
  compatibilityScore?: number;
  interestCount?: number;
  avatarUrl?: string | null;
};

export const founderCards: CardData[] = [
  {
    id: '1',
    name: 'Sara Kim',
    age: 26,
    emoji: '🎨',
    role: 'UI/UX Designer',
    bio: 'Designed products used by 50k+ users. Passionate about consumer apps and edtech. Looking to found something from scratch.',
    skills: ['Figma', 'Framer', 'Prototyping', 'User Research'],
    match: true,
  },
  {
    id: '2',
    name: 'Marcus Lee',
    age: 29,
    emoji: '📈',
    role: 'Growth Marketer',
    bio: 'Grew a SaaS product from 0 to 10k users in 6 months. I know how to find product-market fit. You build, I grow.',
    skills: ['SEO', 'Paid Ads', 'Analytics', 'Copywriting'],
    match: false,
  },
  {
    id: '3',
    name: 'Priya Nair',
    age: 24,
    emoji: '🤖',
    role: 'ML Engineer',
    bio: 'Masters in AI at UNSW. Published researcher. Want to build something real with AI, not just fine-tune prompts.',
    skills: ['Python', 'PyTorch', 'LLMs', 'Data Science'],
    match: true,
  },
  {
    id: '4',
    name: 'Jake Torres',
    age: 27,
    emoji: '💼',
    role: 'Product Manager',
    bio: "PM at a Series B startup. I've shipped 3 major products. Now looking to go 0→1 with the right technical co-founder.",
    skills: ['Roadmapping', 'SQL', 'Customer Discovery', 'Jira'],
    match: false,
  },
  {
    id: '5',
    name: 'Mei Wong',
    age: 25,
    emoji: '🌐',
    role: 'Frontend Dev',
    bio: 'React wizard. Built 8 startups (2 shipped). I move fast and love the early messy stage of building.',
    skills: ['React', 'Next.js', 'TypeScript', 'WebGL'],
    match: true,
  },
];

export const ideaCards: CardData[] = [
  {
    id: '6',
    name: 'HealthTrack AI',
    emoji: '💊',
    role: 'HealthTech · Seed',
    bio: 'AI-powered medication adherence app. Reduces hospital readmission by 40% in pilot. $10k MRR goal in 6 months.',
    skills: ['React Native', 'ML', 'Healthcare', 'B2C'],
    match: false,
  },
  {
    id: '7',
    name: 'LegalEase',
    emoji: '⚖️',
    role: 'LegalTech · Idea',
    bio: "Plain-English legal document analysis. Lawyers charge $400/hr — we charge $9/mo. Massive underserved market.",
    skills: ['NLP', 'SaaS', 'B2B', 'Document AI'],
    match: true,
  },
  {
    id: '8',
    name: 'FounderFlow',
    emoji: '🚀',
    role: 'SaaS · MVP',
    bio: 'All-in-one tool for solo founders: CRM, roadmap, investor updates. 87 people on waitlist already.',
    skills: ['SaaS', 'B2B', 'Productivity'],
    match: false,
  },
];
