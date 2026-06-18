import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const getModel = () =>
  genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

// ── Generic text generation ──────────────────────────────────
export const generateText = async (prompt) => {
  const model  = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ── Summary Generation ────────────────────────────────────────
export const generateSummary = async ({ text, type, mode }) => {
  const modeInstructions = {
    easy  : 'Use simple language suitable for beginners. Avoid jargon.',
    exam  : 'Focus on key concepts, definitions, and facts likely to appear in exams.',
    quick : 'Be extremely concise. Only the most critical information.',
  };

  const typePrompts = {
    short   : `Generate a SHORT summary (2-3 paragraphs) of the following content.\n${modeInstructions[mode]}`,
    detailed: `Generate a DETAILED, comprehensive summary covering all major topics.\n${modeInstructions[mode]}`,
    bullet  : `Generate a BULLET POINT summary with clear headings and 5-8 key points per section.\n${modeInstructions[mode]}`,
    chapter : `Break down the content into logical CHAPTERS/SECTIONS and summarize each one separately.\n${modeInstructions[mode]}`,
    concepts: `Extract and explain the KEY CONCEPTS, terms, and definitions from this content.\nFormat as: **Term**: Explanation\n${modeInstructions[mode]}`,
  };

  const prompt = `${typePrompts[type] || typePrompts.short}

Content:
"""
${text.slice(0, 12000)}
"""

Respond in Markdown format.`;

  return generateText(prompt);
};

// ── Flashcard Generation ──────────────────────────────────────
export const generateFlashcards = async ({ text, count = 15 }) => {
  const prompt = `Generate exactly ${count} high-quality flashcards from the following content.

Return ONLY a valid JSON array in this exact format (no markdown, no extra text):
[
  {
    "front": "Question or term here",
    "back": "Answer or definition here"
  }
]

Content:
"""
${text.slice(0, 10000)}
"""`;

  const raw     = await generateText(prompt);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ── MCQ Generation ────────────────────────────────────────────
export const generateMCQs = async ({ text, count = 10, difficulty = 'medium' }) => {
  const diffMap = {
    easy  : 'simple, factual questions testing basic recall',
    medium: 'questions requiring understanding of concepts',
    hard  : 'complex, analytical questions requiring deep understanding',
  };

  const prompt = `Generate exactly ${count} multiple-choice questions (${diffMap[difficulty]}) from the following content.

Return ONLY a valid JSON array in this exact format (no markdown, no extra text):
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

correct_index is 0-based (0=A, 1=B, 2=C, 3=D).

Content:
"""
${text.slice(0, 10000)}
"""`;

  const raw     = await generateText(prompt);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ── Chat / RAG ────────────────────────────────────────────────
export const chatWithNotes = async ({ question, noteText, chatHistory = [] }) => {
  const history = chatHistory
    .slice(-6) // last 3 exchanges for context
    .map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a helpful AI study assistant. Answer questions ONLY based on the provided notes.
If the answer cannot be found in the notes, say: "I couldn't find information about this in your notes."
Always be educational, clear, and encouraging.

Notes:
"""
${noteText.slice(0, 12000)}
"""

${history ? `Previous conversation:\n${history}\n` : ''}
Student: ${question}
Assistant:`;

  const answer = await generateText(prompt);

  // Extract source excerpts (simple keyword matching)
  const keywords = question.toLowerCase().split(' ').filter(w => w.length > 4);
  const sentences = noteText.split(/[.!?]/).filter(s => s.trim().length > 20);
  const sources = sentences
    .filter(s => keywords.some(k => s.toLowerCase().includes(k)))
    .slice(0, 3)
    .map(s => ({ excerpt: s.trim() }));

  return { answer, sources };
};

// ── Smart Study Tools ─────────────────────────────────────────
export const extractImportantTopics = async (text) => {
  const prompt = `Analyze this content and extract:
1. Top 10 Most Important Topics
2. Key Definitions (term: definition format)
3. Likely Exam Questions (5 questions)
4. Key Formulas or Rules (if any)

Format your response in clear Markdown sections.

Content:
"""
${text.slice(0, 12000)}
"""`;

  return generateText(prompt);
};

export const explainLikeIm5 = async ({ text, topic }) => {
  const prompt = `Explain "${topic || 'this content'}" from the following notes in the simplest possible way.
Use analogies, simple words, and examples a 10-year-old could understand.

Content:
"""
${text.slice(0, 6000)}
"""`;

  return generateText(prompt);
};
