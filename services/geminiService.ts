
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, GradeLevel, TextbookVersion, Question, DiagnosticReport, StudyPlan, Answer } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Complex academic reasoning and test paper analysis benefit from gemini-3.1-pro-preview
const MODEL_NAME = "gemini-3.1-pro-preview";

// --- Schemas ---

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER },
      text: { type: Type.STRING },
      type: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      topic: { type: Type.STRING },
    },
    required: ['id', 'text', 'type', 'topic'],
  },
};

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER },
    summary: {
      type: Type.OBJECT,
      properties: {
        overview: { type: Type.STRING, description: "整体表现综述 (General assessment)" },
        knowledgeAnalysis: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of 3-5 specific points analyzing knowledge depth and breadth." 
        },
        suggestions: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "List of 3-5 actionable high-level advice." 
        }
      },
      required: ['overview', 'knowledgeAnalysis', 'suggestions']
    },
    topicBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          score: { type: Type.INTEGER },
          status: { type: Type.STRING },
          feedback: { type: Type.STRING },
        },
        required: ['topic', 'score', 'status', 'feedback'],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    radarData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          A: { type: Type.INTEGER },
          fullMark: { type: Type.INTEGER },
        },
        required: ['subject', 'A', 'fullMark'],
      },
      description: "Data for a radar chart. 'subject' is the dimension (e.g. Concept, Calculation, Logic), 'A' is score, 'fullMark' is 100."
    }
  },
  required: ['overallScore', 'summary', 'topicBreakdown', 'strengths', 'weaknesses', 'radarData'],
};

const planSchema = {
  type: Type.OBJECT,
  properties: {
    weeklyGoal: { type: Type.STRING },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          focusTopic: { type: Type.STRING },
          activity: { type: Type.STRING, description: "Highly specific action. E.g., 'Watch video on [Topic]', 'Solve 3 [Topic] problems'." },
          durationMinutes: { type: Type.INTEGER },
          priority: { type: Type.STRING },
          practiceExercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The question content" },
                type: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 options if multiple_choice, empty if short_answer" },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING, description: "Brief explanation of the solution" }
              },
              required: ['text', 'type', 'correctAnswer', 'explanation']
            },
            description: "3 specific practice questions directly related to today's focus topic."
          }
        },
        required: ['day', 'focusTopic', 'activity', 'durationMinutes', 'priority', 'practiceExercises'],
      },
    }
  },
  required: ['weeklyGoal', 'schedule'],
};

// --- API Calls ---

export const generateQuestions = async (subject: Subject, grade: GradeLevel, version: TextbookVersion): Promise<Question[]> => {
  const prompt = `
    You are an expert tutor for Chinese students.
    Generate 5 diagnostic questions for a ${grade} student in ${subject}.
    Target the specific curriculum standards of the ${version} (textbook version).
    The questions should cover different core topics relevant to that grade level and textbook to assess their proficiency.
    Mix multiple choice (provide 4 options) and short answer questions.
    Ensure the questions vary in difficulty.
    
    IMPORTANT: All content, including questions, options, and TOPIC NAMES, MUST be in Simplified Chinese. 
    DO NOT include English translations or parentheses for topics.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Question[];
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Error generating questions:", error);
    return [
      { id: 1, text: "题目生成失败，请检查配置。", type: "short_answer", topic: "系统错误" }
    ];
  }
};

export const analyzePerformance = async (
  subject: Subject, 
  grade: GradeLevel, 
  version: TextbookVersion,
  questions: Question[], 
  answers: Answer[]
): Promise<DiagnosticReport> => {
  
  const qaPairs = questions.map(q => {
    const ans = answers.find(a => a.questionId === q.id);
    return `Question [${q.topic}]: ${q.text}\nStudent Answer: ${ans?.userResponse || "No answer"}`;
  }).join("\n---\n");

  const prompt = `
    Analyze the following academic diagnostic test for a ${grade} student in ${subject} using the ${version} curriculum standards.
    
    Data:
    ${qaPairs}

    Task:
    1. Grade the answers accurately.
    2. Identify specific knowledge points (topics) and assign a mastery score (0-100). 
       Ensure topics align with ${version} terminology where possible.
    3. Determine strengths and weaknesses.
    4. Provide dimensions for a radar chart (e.g., '概念理解', '计算能力', '应用能力', '逻辑推理') with scores out of 100.
    5. Provide a STRUCTURED summary in Simplified Chinese containing:
       - Overview: A concise paragraph on general performance.
       - Knowledge Analysis: A list of 3-5 distinct bullet points analyzing specific knowledge gaps or mastery.
       - Suggestions: A list of 3-5 specific, actionable high-level recommendations.
    
    CRITICAL OUTPUT RULES:
    1. All text fields in the output JSON MUST be in Simplified Chinese.
    2. For 'topic' and 'subject' fields: Output PURE Chinese only. DO NOT include English translations in brackets or parentheses.
    3. Ensure 'topic' names are concise.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: reportSchema,
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as DiagnosticReport;
  }
  throw new Error("Failed to generate report");
};

export const analyzePaper = async (
  subject: Subject,
  grade: GradeLevel,
  version: TextbookVersion,
  imagesBase64: string[]
): Promise<DiagnosticReport> => {
  const imageParts = imagesBase64.map(imageBase64 => {
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let data = imageBase64;
    if (matches) {
      mimeType = matches[1];
      data = matches[2];
    }
    return { inlineData: { mimeType, data } };
  });

  const prompt = `
    Analyze the attached ${imagesBase64.length} images of a test paper or homework completed by a ${grade} student in ${subject} (${version} curriculum).
    
    Task:
    1. Identify all questions and the student's handwritten answers across all images.
    2. Assess the overall correctness and common error types.
    3. Estimate mastery of related topics (0-100) based on all provided evidence.
    4. Determine strengths and weaknesses.
    5. Provide dimensions for a radar chart with scores out of 100.
    6. Provide a STRUCTURED summary in Simplified Chinese.
    
    CRITICAL OUTPUT RULES:
    1. Output strictly in JSON matching the defined schema.
    2. All text fields MUST be in Simplified Chinese.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        ...imageParts,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: reportSchema,
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as DiagnosticReport;
  }
  throw new Error("Failed to analyze paper");
};

export const createStudyPlan = async (
  subject: Subject, 
  version: TextbookVersion,
  report: DiagnosticReport
): Promise<StudyPlan> => {
  const summaryText = `${report.summary.overview}\n${report.summary.knowledgeAnalysis.join('\n')}`;
  const weakTopics = report.weaknesses.join(", ");
  
  const prompt = `
    Based on the following diagnostic report for ${subject}, create a 1-week remedial study plan.
    The student uses the ${version} textbook.
    Focus heavily on: ${weakTopics}.
    
    Report Summary: ${summaryText}
    
    Tasks:
    1. Create a weekly schedule with HIGHLY SPECIFIC actionable tasks.
    2. For EACH daily task, generate 3 SPECIFIC practice exercises.

    Output strictly in JSON.
    All text fields MUST be in Simplified Chinese.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: planSchema,
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as StudyPlan;
  }
  throw new Error("Failed to generate plan");
};
