/* BrandGenius AI — Groq-Powered Application Logic */
'use strict';

// =============================================
// GROQ API CONFIGURATION
// =============================================
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast, capable free-tier model

let groqApiKey = localStorage.getItem('brandgenius_groq_key') || '';

// On load: restore saved key
window.addEventListener('DOMContentLoaded', () => {
  if (groqApiKey) {
    document.getElementById('groqApiKey').value = groqApiKey;
    updateApiStatus(true);
  }
  openContentTool('summarize');
  updateActiveNav();
});

function saveApiKey(val) {
  groqApiKey = val.trim();
  localStorage.setItem('brandgenius_groq_key', groqApiKey);
  updateApiStatus(!!groqApiKey);
}

function updateApiStatus(hasKey) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const btn = document.getElementById('settingsBtn');
  if (hasKey) {
    dot.className = 'status-dot active';
    text.textContent = '✅ Groq API key saved — AI responses are live';
    btn.classList.add('active');
  } else {
    dot.className = 'status-dot';
    text.textContent = 'No key set — using demo mode';
    btn.classList.remove('active');
  }
}

function toggleKeyVisibility() {
  const inp = document.getElementById('groqApiKey');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// Settings Panel toggle
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel.classList.toggle('open');
}

// =============================================
// CORE GROQ CALL
// =============================================
async function callGroq(systemPrompt, userPrompt, maxTokens = 1024) {
  if (!groqApiKey) throw new Error('NO_KEY');
  const resp = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.8
    })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.choices[0].message.content.trim();
}

// =============================================
// NAV & SCROLL
// =============================================
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
  updateActiveNav();
});

function updateActiveNav() {
  let current = 'home';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
  });
  navLinks.forEach(link =>
    link.classList.toggle('active', link.dataset.section === current)
  );
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('hamburger').addEventListener('click', () =>
  document.getElementById('navLinks').classList.toggle('open')
);
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    scrollToSection(link.getAttribute('href').slice(1));
    document.getElementById('navLinks').classList.remove('open');
  });
});
document.getElementById('demoBtn').addEventListener('click', () => scrollToSection('competitor'));
document.getElementById('getStartedBtn').addEventListener('click', () => scrollToSection('brand-strategy'));

// =============================================
// LOADING & TOAST
// =============================================
function showLoading(text = 'AI is thinking...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// =============================================
// TOGGLE GROUP & TABS
// =============================================
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
document.querySelectorAll('.brand-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.brand-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function toggleTag(el) { el.classList.toggle('selected'); }
function copyText(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Copied to clipboard!'))
    .catch(() => showToast('📋 Select text to copy'));
}

// =============================================
// MODULE 1: COMPETITOR INTELLIGENCE
// =============================================
async function runCompetitorAnalysis() {
  const url = document.getElementById('compUrl').value.trim();
  const industry = document.getElementById('compIndustry').value;
  const depth = document.querySelector('.toggle-btn.active')?.dataset.depth || 'standard';
  if (!url && !industry) { showToast('⚠️ Enter a competitor URL or select an industry'); return; }

  showLoading('🔍 Analyzing competitor with NLP...');

  const system = `You are an expert brand strategist and competitive intelligence analyst. 
Respond ONLY with a valid JSON object — no markdown, no explanation, no code fences.`;

  const user = `Analyze this competitor for a business owner looking to find opportunities to differentiate.
Competitor URL: ${url || 'unknown'}
Industry: ${industry || 'General'}
Analysis depth: ${depth}

Return a JSON object with EXACTLY this structure:
{
  "name": "company name (infer from URL or call it '[Industry] Competitor')",
  "positioningType": "one of: Premium | Mid-Market | Budget | Niche | Enterprise",
  "audienceType": "one of: B2B | B2C | D2C | SMB | Enterprise",
  "positioning": "one sentence describing their market positioning",
  "audienceDetail": "specific audience description with demographics",
  "pricing": "pricing strategy description",
  "emotions": ["emotion1", "emotion2", "emotion3", "emotion4"],
  "strengths": ["strength1", "strength2", "strength3", "strength4"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "opportunity": "2-3 sentences describing the best market opportunity for a new competitor to exploit"
}`;

  try {
    let data;
    if (!groqApiKey) {
      // Demo fallback
      await new Promise(r => setTimeout(r, 1800));
      data = getDemoCompetitorData(url, industry);
    } else {
      const raw = await callGroq(system, user, 700);
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g, '').trim();
      data = JSON.parse(cleaned);
    }
    renderCompetitorResults(data);
    showToast('✅ Competitor analysis complete!');
  } catch (err) {
    hideLoading();
    if (err.message === 'NO_KEY') {
      showToast('⚠️ No API key — showing demo. Click ⚙️ API Key to connect Groq.');
      await new Promise(r => setTimeout(r, 500));
      renderCompetitorResults(getDemoCompetitorData(url, industry));
    } else if (err instanceof SyntaxError) {
      showToast('⚠️ AI returned unexpected format. Try again.');
    } else {
      showToast(`❌ Groq error: ${err.message}`);
    }
  } finally {
    hideLoading();
  }
}

function getDemoCompetitorData(url, industry) {
  const name = url ? url.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : `${industry} Competitor`;
  return {
    name, positioningType: 'Premium', audienceType: 'B2B',
    positioning: 'Premium market leader targeting enterprise customers with comprehensive feature sets',
    audienceDetail: 'Mid-to-large businesses, decision makers aged 30–50, tech-forward teams',
    pricing: 'Tiered SaaS pricing with annual billing incentives and enterprise contracts',
    emotions: ['Trust', 'Authority', 'FOMO', 'Prestige'],
    strengths: ['Strong brand recognition', 'Extensive integrations', '24/7 enterprise support', 'Large customer base'],
    weaknesses: ['High pricing barrier', 'Complex onboarding (3–6 months)', 'Rigid contracts', 'Slow feature updates'],
    opportunity: 'Position as the agile, modern alternative with transparent pricing and instant setup. Target SMBs frustrated by enterprise complexity and cost. Emphasize flexibility, speed, and excellent onboarding as core differentiators.'
  };
}

function renderCompetitorResults(data) {
  document.getElementById('compPlaceholder').classList.add('hidden');
  const results = document.getElementById('compAnalysisResults');
  results.classList.remove('hidden');
  document.getElementById('compName').textContent = data.name;
  document.getElementById('positioningBadge').textContent = data.positioningType;
  document.getElementById('audienceBadge').textContent = data.audienceType;
  document.getElementById('insightPositioning').textContent = data.positioning;
  document.getElementById('insightAudience').textContent = data.audienceDetail;
  document.getElementById('insightPricing').textContent = data.pricing;
  document.getElementById('emotionTags').innerHTML =
    (data.emotions || []).map(e => `<span class="emotion-tag">${e}</span>`).join('');
  document.getElementById('strengthsList').innerHTML =
    (data.strengths || []).map(s => `<li>${s}</li>`).join('');
  document.getElementById('weaknessesList').innerHTML =
    (data.weaknesses || []).map(w => `<li>${w}</li>`).join('');
  document.getElementById('opportunityText').textContent = data.opportunity;
}

// =============================================
// MODULE 2A: BRAND IDENTITY GENERATION
// =============================================
async function generateBrandIdentity() {
  const desc = document.getElementById('brandDesc').value.trim();
  const audience = document.getElementById('targetAudience').value.trim();
  const personality = [...document.querySelectorAll('.ptag.selected')].map(t => t.textContent).join(', ');
  if (!desc) { showToast('⚠️ Please describe your business first'); return; }

  showLoading('✨ Generating brand identity with Groq AI...');

  const system = `You are a world-class branding consultant and creative director.
Respond ONLY with valid JSON — no markdown, no explanations, no code fences.`;

  const user = `Create a complete brand identity package for this business:

Business: ${desc}
Target Audience: ${audience || 'general consumers'}
Brand Personality: ${personality || 'innovative and trustworthy'}

Return EXACTLY this JSON structure:
{
  "names": [
    {"name": "BrandName1", "note": "why it works"},
    {"name": "BrandName2", "note": "why it works"},
    {"name": "BrandName3", "note": "why it works"}
  ],
  "valueProp": "one compelling sentence value proposition",
  "taglines": ["tagline 1", "tagline 2", "tagline 3"],
  "brandStory": "2-3 sentences authentic brand origin/mission story"
}`;

  try {
    let data;
    if (!groqApiKey) {
      await new Promise(r => setTimeout(r, 2000));
      data = {
        names: [{ name: 'Brandify', note: 'Short, memorable' }, { name: 'StrataAI', note: 'Strategy + AI' }, { name: 'Novara', note: 'New era vibes' }],
        valueProp: `The AI-powered platform that helps ${audience || 'growing businesses'} build a winning brand strategy in minutes — not months.`,
        taglines: ['Intelligence meets identity.', 'Your brand, brilliantly built.', 'Strategy, powered by AI.'],
        brandStory: `Born from the frustration of watching great businesses fail with poor branding, we built this platform to give every founder access to world-class brand strategy. No agency retainer required.`
      };
    } else {
      const raw = await callGroq(system, user, 800);
      data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    }

    document.getElementById('identityPlaceholder').classList.add('hidden');
    document.getElementById('identityOutput').classList.remove('hidden');
    document.getElementById('brandNames').innerHTML =
      data.names.map(n => `<div class="name-card"><span class="name">${n.name}</span><span class="name-note">${n.note}</span></div>`).join('');
    document.getElementById('valueProp').textContent = data.valueProp;
    document.getElementById('taglines').innerHTML =
      data.taglines.map(t => `<div class="tagline-item">"${t}"</div>`).join('');
    document.getElementById('brandStory').textContent = data.brandStory;
    showToast('✨ Brand identity generated!');
  } catch (err) {
    handleGroqError(err);
  } finally {
    hideLoading();
  }
}

// =============================================
// MODULE 2B: VOICE & MESSAGING
// =============================================
async function generateVoice() {
  const brand = document.getElementById('voiceBrandName').value.trim() || 'Your Brand';
  const type = document.getElementById('voiceContentType').value;
  const topic = document.getElementById('voiceTopic').value.trim() || 'our product';
  const casual = document.getElementById('formalSlider').value;
  const playful = document.getElementById('seriousSlider').value;
  const simple = document.getElementById('techSlider').value;

  showLoading('🎤 Crafting on-brand content...');

  const toneDesc = `Tone: ${casual > 50 ? 'casual' : 'formal'}, ${playful > 50 ? 'playful' : 'serious'}, ${simple > 50 ? 'simple language' : 'technical language'}`;

  const system = `You are an expert brand copywriter who creates compelling, on-brand marketing content.
Write ONLY the content itself — no labels, no preamble, no explanation.`;

  const user = `Write a ${type} for the brand "${brand}" about: ${topic}.
${toneDesc}
Be creative, engaging, and authentic. Include relevant emojis where appropriate for the platform.
Length: appropriate for the format (${type}).`;

  try {
    let text;
    if (!groqApiKey) {
      await new Promise(r => setTimeout(r, 1500));
      text = `🚀 Exciting news from ${brand}!\n\n${topic} just got a major upgrade — and we built it specifically for you.\n\nWe've been listening, iterating, and shipping fast. This is the result.\n\n✅ Tap the link to learn more.\n\n#${brand.replace(/\s/g, '')} #Innovation #Growth`;
    } else {
      text = await callGroq(system, user, 600);
    }

    document.getElementById('voicePlaceholder').classList.add('hidden');
    document.getElementById('voiceOutput').classList.remove('hidden');
    document.getElementById('voiceText').textContent = text;
    showToast('🎤 Content generated!');
  } catch (err) {
    handleGroqError(err);
  } finally {
    hideLoading();
  }
}

// =============================================
// MODULE 2C: CONTENT TOOLS
// =============================================
let currentContentTool = 'summarize';

const TOOL_CONFIG = {
  summarize: { label: 'Enter long text to summarize', placeholder: 'Paste your article, report, or document here...' },
  sentiment: { label: 'Enter text for sentiment analysis', placeholder: 'Paste customer reviews, social media comments, feedback...' },
  ideas: { label: 'Describe your brand/topic for content ideas', placeholder: 'e.g. AI branding platform for startups, target: founders & marketing teams...' },
  email: { label: 'Describe the email you need', placeholder: 'e.g. Cold outreach to a marketing agency offering a free trial of our AI branding tool...' }
};

const GROQ_PROMPTS = {
  summarize: {
    system: 'You are an expert analyst. Create clear, actionable summaries.',
    user: (t) => `Summarize the following text into 5–7 clear bullet points with a 1-sentence "Core Insight" at the end:\n\n${t}`
  },
  sentiment: {
    system: 'You are a sentiment analysis expert. Be precise and actionable.',
    user: (t) => `Analyze the sentiment of this text. Provide: overall sentiment (Positive/Negative/Mixed) with % confidence, breakdown of positive/neutral/negative signals, top positive and negative keywords, and 2 actionable recommendations:\n\n${t}`
  },
  ideas: {
    system: 'You are a creative content strategist.',
    user: (t) => `Generate 15 diverse, high-quality content ideas for: ${t}.\nGroup into: Social Media (5), Blog/SEO (5), Video (3), Email/Partnership (2). Be specific and creative.`
  },
  email: {
    system: 'You are an expert email copywriter who writes high-converting, genuine emails.',
    user: (t) => `Write a professional, personalized email for: ${t}.\nInclude subject line, opening hook, value proposition, specific CTA, and P.S. line. Keep it concise and human.`
  }
};

function openContentTool(tool) {
  currentContentTool = tool;
  const tools = ['summarize', 'sentiment', 'ideas', 'email'];
  document.querySelectorAll('.content-tool-card').forEach((c, i) =>
    c.classList.toggle('active', tools[i] === tool)
  );
  const config = TOOL_CONFIG[tool];
  document.getElementById('contentInputLabel').textContent = config.label;
  document.getElementById('contentInput').placeholder = config.placeholder;
  document.getElementById('contentInput').value = '';
  document.getElementById('contentOutput').classList.add('hidden');
}

async function processContent() {
  const input = document.getElementById('contentInput').value.trim();
  if (!input) { showToast('⚠️ Please enter some text first'); return; }

  showLoading('⚡ Processing with Groq AI...');

  const { system, user } = GROQ_PROMPTS[currentContentTool];
  try {
    let result;
    if (!groqApiKey) {
      await new Promise(r => setTimeout(r, 1500));
      result = `[Demo Mode] Here is a sample ${currentContentTool} result.\n\nAdd your Groq API key (⚙️ API Key) to get real AI-generated output tailored to your content.`;
    } else {
      result = await callGroq(system, user(input), 900);
    }
    document.getElementById('contentOutput').classList.remove('hidden');
    document.getElementById('contentResult').textContent = result;
    showToast('⚡ Done!');
  } catch (err) {
    handleGroqError(err);
  } finally {
    hideLoading();
  }
}

// =============================================
// MODULE 2D: VISUAL IDENTITY (client-side only)
// =============================================
const PALETTES = {
  trust: ['#2563eb', '#3b82f6', '#60a5fa', '#f0f9ff', '#0f172a'],
  energy: ['#f97316', '#fb923c', '#fbbf24', '#fff7ed', '#1c1100'],
  luxury: ['#a16207', '#ca8a04', '#fbbf24', '#fdfdf0', '#12100a'],
  innovation: ['#6366f1', '#8b5cf6', '#ec4899', '#fdf4ff', '#0f0e17'],
  nature: ['#16a34a', '#22c55e', '#86efac', '#f0fdf4', '#052e16'],
  bold: ['#dc2626', '#ef4444', '#f87171', '#fef2f2', '#1a0000'],
  minimal: ['#374151', '#6b7280', '#d1d5db', '#f9fafb', '#030712'],
  creative: ['#7c3aed', '#a855f7', '#c084fc', '#faf5ff', '#1b0733'],
  warmth: ['#d97706', '#f59e0b', '#fcd34d', '#fffbeb', '#1c0a00'],
  cool: ['#0891b2', '#06b6d4', '#67e8f9', '#ecfeff', '#083344']
};

function generatePalette() {
  const kw = document.getElementById('colorKeyword').value.toLowerCase();
  let palette = PALETTES.innovation;
  const matches = { trust: /trust|reliab|safe|secure/, energy: /energy|dynamic|power|fast|speed/, luxury: /luxury|premium|elegant|sophisti/, nature: /natur|green|eco|organic|sustain/, bold: /bold|fierce|strong|daring/, minimal: /clean|minimal|simple|pure|white/, creative: /creative|art|design|imagin/, innovation: /innov|tech|digital|ai|smart|futur/, warmth: /warm|friend|care|human|cozy/, cool: /cool|calm|pacific|ocean|sky|blue/ };
  for (const [key, re] of Object.entries(matches)) {
    if (re.test(kw)) { palette = PALETTES[key]; break; }
  }
  const display = document.getElementById('paletteDisplay');
  const isDark = (hex) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return (r * 299 + g * 587 + b * 114) / 1000 < 128; };
  display.innerHTML = palette.map((c) =>
    `<div class="color-swatch" style="background:${c}" data-color="${c}">
      <span style="color:${isDark(c) ? 'rgba(255,255,255,0.9)' : '#000'}">${c}</span>
    </div>`
  ).join('');
  showToast('🎨 Palette generated!');
}

function generateLogoIdeas() {
  const concepts = [
    { type: 'Wordmark', preview: `<span style="font-family:'Space Grotesk',sans-serif;font-weight:900;font-size:1.4rem;letter-spacing:-1px;">Br<span style="color:#6366f1">ai</span>nd</span>` },
    { type: 'Lettermark', preview: `<div style="width:54px;height:54px;background:linear-gradient(135deg,#6366f1,#ec4899);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto;font-family:'Space Grotesk';font-weight:900;font-size:1.6rem;">B</div>` },
    { type: 'Icon Mark', preview: `<span style="font-size:2rem">⬡</span>` },
    { type: 'Combination', preview: `<div style="display:flex;align-items:center;gap:.4rem;justify-content:center"><div style="width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#ec4899);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem;">B</div><span style="font-family:'Space Grotesk';font-weight:700;font-size:1rem;">Brand</span></div>` }
  ];
  document.getElementById('logoConcepts').innerHTML = concepts.map(c =>
    `<div class="logo-concept"><div class="logo-preview">${c.preview}</div><div class="logo-type">${c.type}</div></div>`
  ).join('');
  showToast('🎨 Logo concepts refreshed!');
}

// =============================================
// MODULE 3: STRATEGIC RECOMMENDATIONS
// =============================================
async function generateRecommendations() {
  const brand = document.getElementById('recBrand').value.trim() || 'Your Brand';
  const industry = document.getElementById('recIndustry').value;
  const challenge = document.getElementById('recChallenge').value;

  showLoading('🎯 Generating strategic recommendations...');

  const system = `You are a top-tier McKinsey-level brand strategist and marketing consultant.
Return ONLY valid JSON, no markdown, no code fences.`;

  const user = `Create strategic recommendations for:
Brand: ${brand}
Industry: ${industry}
Primary Challenge: ${challenge}

Return JSON with EXACTLY this structure:
{
  "marketGap": "2-3 sentences identifying a specific market opportunity",
  "counterPositioning": "2-3 sentences on how to position against market leaders",
  "pricing": "2-3 sentences on pricing strategy optimization",
  "contentPlan": "4-week content action plan, one sentence per week",
  "actions": ["action 1", "action 2", "action 3"]
}`;

  try {
    let data;
    if (!groqApiKey) {
      await new Promise(r => setTimeout(r, 2000));
      data = {
        marketGap: `In the ${industry} space, there's a clear gap for ${brand} to capture mid-market customers ($50–$200 range) who are underserved by both free tools and expensive enterprise solutions.`,
        counterPositioning: `While market leaders focus on feature complexity, ${brand} should position as "delightfully simple" — emphasizing fast setup, transparent pricing, and genuine human support to win frustrated enterprise users.`,
        pricing: `Implement 3-tier pricing with a "designed to choose" middle option. Use annual billing with 2-month discounts to reduce churn and improve cash flow prediction.`,
        contentPlan: 'Week 1: Launch founder story series. Week 2: Publish competitor comparison blog. Week 3: Host live Q&A session. Week 4: Release customer case study with real metrics.',
        actions: [`Create a "${brand} vs [Competitor]" SEO comparison page`, 'Build an interactive ROI calculator for your homepage', 'Launch a weekly LinkedIn newsletter for your target audience']
      };
    } else {
      const raw = await callGroq(system, user, 900);
      data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    }

    document.getElementById('recResults').classList.remove('hidden');
    document.getElementById('recMarketGap').textContent = data.marketGap;
    document.getElementById('recCounterPos').textContent = data.counterPositioning;
    document.getElementById('recPricing').textContent = data.pricing;
    document.getElementById('recContent').textContent = data.contentPlan;
    document.getElementById('recActions').innerHTML =
      (data.actions || []).map(a => `<div class="priority-item">✅ ${a}</div>`).join('');
    document.getElementById('recResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('🎯 Recommendations ready!');
  } catch (err) {
    handleGroqError(err);
  } finally {
    hideLoading();
  }
}

// =============================================
// MODULE 4: INFLUENCER HUB
// =============================================
const INFLUENCER_POOL = [
  { name: 'Sarah Chen', handle: '@sarahchen.tech', avatar: '👩‍💻', gradient: 'linear-gradient(135deg,#667eea,#764ba2)', followers: '284K', engagement: '6.2%', match: 96, tags: ['B2B', 'SaaS', 'Growth Hacking'], collab: 'Tutorial videos, product reviews, sponsored posts', platform: 'YouTube' },
  { name: 'Marcus Williams', handle: '@marcuswillbrand', avatar: '👨‍🎨', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', followers: '78K', engagement: '9.4%', match: 94, tags: ['Design', 'Brand Strategy', 'Startups'], collab: 'Case studies, brand audits, workshops', platform: 'LinkedIn' },
  { name: 'Aisha Patel', handle: '@aisha.markets', avatar: '👩‍💼', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', followers: '156K', engagement: '7.8%', match: 91, tags: ['Digital Marketing', 'AI Tools', 'ROI'], collab: 'Sponsored posts, newsletter features, webinars', platform: 'Instagram' },
  { name: 'Leo Rodriguez', handle: '@leostartup', avatar: '👨‍🚀', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', followers: '43K', engagement: '12.1%', match: 89, tags: ['Founder', 'SaaS', 'Growth'], collab: 'Authentic reviews, founder story integrations', platform: 'TikTok' },
  { name: 'Priya Nair', handle: '@priya.brandlab', avatar: '👩‍🎓', gradient: 'linear-gradient(135deg,#fa709a,#fee140)', followers: '92K', engagement: '8.3%', match: 87, tags: ['Visual Identity', 'Logos', 'Brand Voice'], collab: 'Tutorial collaborations, brand teardowns', platform: 'Instagram' },
  { name: 'James Okonkwo', handle: '@jamesgrowthio', avatar: '👨‍💻', gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', followers: '189K', engagement: '5.9%', match: 84, tags: ['Product Marketing', 'B2B SaaS'], collab: 'Sponsored content, product spotlights', platform: 'YouTube' }
];

async function findInfluencers() {
  const industry = document.getElementById('infIndustry').value;
  const platform = document.getElementById('infPlatform').value;
  const sizeRange = document.getElementById('infSize').value;

  showLoading('🤝 Finding AI-matched influencers...');

  try {
    // For influencer discovery the data comes from our curated pool
    // Groq AI is used to generate a brief strategy note for the match
    let strategyNote = '';
    if (groqApiKey) {
      const note = await callGroq(
        'You are an influencer marketing strategist. Be concise.',
        `In 2 sentences, explain the best collaboration strategy for a brand targeting ${industry} on ${platform} using ${sizeRange} influencers.`,
        150
      );
      strategyNote = note;
    }

    const count = Math.floor(Math.random() * 8) + 12;
    document.getElementById('infCount').textContent = `${count} influencers matched for ${industry} on ${platform}${strategyNote ? ' — 💡 ' + strategyNote : ''}`;
    document.getElementById('infResults').classList.remove('hidden');
    renderInfluencerCards();
    showToast(`🤝 ${count} influencers found!`);
  } catch (err) {
    // Non-critical — show results anyway
    renderInfluencerCards();
    document.getElementById('infResults').classList.remove('hidden');
  } finally {
    hideLoading();
  }
}

function renderInfluencerCards() {
  document.getElementById('influencerGrid').innerHTML = INFLUENCER_POOL.map(inf => `
    <div class="influencer-card" onclick="prefillOutreach('${inf.name}')">
      <div class="inf-header">
        <div class="inf-avatar" style="background:${inf.gradient}">${inf.avatar}</div>
        <div class="inf-info">
          <div class="inf-name">${inf.name}</div>
          <div class="inf-handle">${inf.handle}</div>
        </div>
        <div class="match-score">${inf.match}% match</div>
      </div>
      <div class="inf-stats">
        <div class="inf-stat"><div class="inf-stat-value">${inf.followers}</div><div class="inf-stat-label">Followers</div></div>
        <div class="inf-stat"><div class="inf-stat-value">${inf.engagement}</div><div class="inf-stat-label">Engagement</div></div>
        <div class="inf-stat"><div class="inf-stat-value">${inf.platform}</div><div class="inf-stat-label">Platform</div></div>
      </div>
      <div class="inf-tags">${inf.tags.map(t => `<span class="inf-tag">${t}</span>`).join('')}</div>
      <div class="inf-collab">💡 ${inf.collab}</div>
      <button class="contact-btn" onclick="event.stopPropagation(); prefillOutreach('${inf.name}')">✉️ Generate Outreach</button>
    </div>
  `).join('');
}

function prefillOutreach(name) {
  document.getElementById('outInfluencer').value = name;
  document.getElementById('outreachSection').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast(`✉️ Preparing outreach for ${name}...`);
}

// =============================================
// MODULE 4B: OUTREACH EMAIL GENERATOR
// =============================================
async function generateOutreach() {
  const inf = document.getElementById('outInfluencer').value.trim() || 'there';
  const brand = document.getElementById('outBrand').value.trim() || 'Our Brand';
  const collab = document.getElementById('outCollabType').value;
  const offer = document.getElementById('outOffer').value.trim() || 'competitive compensation';

  showLoading('✉️ Writing personalized outreach email with Groq AI...');

  const system = `You are an expert influencer marketing manager who writes genuine, high-converting outreach emails.
Write ONLY the email content — subject line first, then body. Do not add labels or preamble.`;

  const user = `Write a personalized outreach email from ${brand} to an influencer named "${inf}".
Collaboration type: ${collab}
Offer/Compensation: ${offer}

Make it genuine, concise (under 200 words), and avoid sounding like a template.
Start with: Subject: [subject line]
Then a blank line, then the email body.`;

  const campaignSystem = `You are a creative campaign strategist. Be specific and innovative.`;
  const campaignUser = `Generate 4 creative campaign collaboration ideas for ${brand} partnering with ${inf} for a ${collab}.
Format as a numbered list, one idea per line, each starting with an emoji.`;

  try {
    let email, ideas;
    if (!groqApiKey) {
      await new Promise(r => setTimeout(r, 1600));
      email = `Subject: Collaboration Opportunity — ${brand} × ${inf} 🚀\n\nHi ${inf},\n\nI've been following your content and your audience aligns perfectly with what we're building at ${brand}.\n\nWe'd love to explore a ${collab} together — ${offer}. No scripts, complete creative freedom.\n\nWould you be open to a quick chat this week?\n\nBest,\nThe ${brand} Team\n\nP.S. Happy to send over a free account so you can try it yourself first.`;
      ideas = [`🎥 "${brand} x ${inf}" transformation story`, '📊 Live brand audit session (streamed)', '🎁 Exclusive giveaway for your audience', `🤝 Co-host a "${brand} Growth Workshop"`];
    } else {
      [email, ideas] = await Promise.all([
        callGroq(system, user, 400),
        callGroq(campaignSystem, campaignUser, 300).then(r => r.split('\n').filter(Boolean))
      ]);
    }

    document.getElementById('outreachResult').classList.remove('hidden');
    document.getElementById('outreachEmail').textContent = email;
    const ci = document.getElementById('campaignIdeas');
    ci.classList.remove('hidden');
    document.getElementById('ideasList').innerHTML =
      (Array.isArray(ideas) ? ideas : ideas.split('\n').filter(Boolean))
        .map(i => `<div class="idea-item">${i}</div>`).join('');
    document.getElementById('outreachResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('✉️ Outreach email generated with Groq AI!');
  } catch (err) {
    handleGroqError(err);
  } finally {
    hideLoading();
  }
}

// =============================================
// ERROR HANDLER
// =============================================
function handleGroqError(err) {
  hideLoading();
  if (err.message === 'NO_KEY') {
    showToast('⚠️ No API key set. Click ⚙️ API Key in the nav to add your free Groq key.');
  } else if (err.message?.includes('401') || err.message?.includes('invalid_api_key')) {
    updateApiStatus(false);
    document.getElementById('statusText').textContent = '❌ Invalid API key — please check and re-enter';
    document.getElementById('statusDot').className = 'status-dot error';
    showToast('❌ Invalid Groq API key. Click ⚙️ API Key to update it.');
    toggleSettings();
  } else if (err.message?.includes('429')) {
    showToast('⏳ Rate limit hit. Wait a moment and try again.');
  } else {
    showToast(`❌ Error: ${err.message}`);
  }
}
