import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to execute generateContent with automatic retry and model fallback
async function generateContentWithRetry(params: any, maxRetries = 1) {
  let lastError: any;
  const preferredModel = params.model || 'gemini-3.1-flash-lite';
  const modelsToTry = Array.from(new Set([preferredModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest']));

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || '') + JSON.stringify(err || {});
        const isQuotaExhausted =
          err?.status === 429 ||
          errStr.includes('429') ||
          errStr.includes('Quota exceeded') ||
          errStr.includes('RESOURCE_EXHAUSTED');

        const isTransient503 =
          err?.status === 503 ||
          err?.error?.code === 503 ||
          err?.code === 503 ||
          errStr.includes('503') ||
          errStr.includes('high demand') ||
          errStr.includes('UNAVAILABLE');

        // If quota is exhausted on this model, immediately switch to the next model
        if (isQuotaExhausted) {
          console.warn(`Model ${currentModel} reached quota limit. Switching immediately to alternate model...`);
          break;
        }

        // If transient 503, retry once briefly
        if (isTransient503 && attempt < maxRetries) {
          console.warn(`Gemini call (${currentModel}) attempt ${attempt + 1} hit temporary spike. Retrying in 600ms...`);
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }

        // Otherwise try next model in fallback list
        break;
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON payload parser with generous limit for document base64 payloads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      service: 'Resume Match AI Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Document parsing endpoint for PDF, DOCX, TXT
  app.post('/api/parse-document', async (req, res): Promise<any> => {
    try {
      const { base64, filename, mimeType } = req.body;

      if (!base64 || typeof base64 !== 'string') {
        return res.status(400).json({ error: 'Missing base64 document content' });
      }

      const buffer = Buffer.from(base64, 'base64');
      const cleanFilename = (filename || 'document').toLowerCase();
      let extractedText = '';

      if (cleanFilename.endsWith('.txt') || mimeType === 'text/plain') {
        extractedText = buffer.toString('utf-8');
      } else if (
        cleanFilename.endsWith('.docx') ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } else if (cleanFilename.endsWith('.pdf') || mimeType === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        extractedText = textResult.text || '';
        await parser.destroy();
      } else {
        // Fallback: try UTF-8 string decoding
        extractedText = buffer.toString('utf-8');
      }

      // Clean up multiple excessive linebreaks
      const cleaned = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!cleaned) {
        return res.status(422).json({
          error: 'Could not extract readable text from this document. Please copy and paste your resume text instead.',
        });
      }

      const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

      return res.json({
        text: cleaned,
        filename: filename || 'resume',
        charCount: cleaned.length,
        wordCount,
      });
    } catch (err: any) {
      console.error('Document parsing error:', err);
      return res.status(500).json({
        error: `Failed to parse document: ${err.message || 'Unknown file format error'}. Please paste text directly.`,
      });
    }
  });

  // Resume analysis endpoint using Gemini API
  app.post('/api/analyze-resume', async (req, res): Promise<any> => {
    try {
      const { resumeText, jobDescription } = req.body;

      if (!resumeText || !resumeText.trim()) {
        return res.status(400).json({ error: 'Resume text is required.' });
      }

      if (!jobDescription || !jobDescription.trim()) {
        return res.status(400).json({ error: 'Job description is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Gemini API key is not configured in the server environment. Please set GEMINI_API_KEY.',
        });
      }

      const prompt = `Analyze this candidate's resume against the targeted job description.

=== CANDIDATE RESUME ===
${resumeText.trim()}

=== TARGET JOB DESCRIPTION ===
${jobDescription.trim()}

Perform an exhaustive, objective technical recruitment and ATS alignment evaluation.
Strict rules:
1. Never invent or hallucinate experience, skills, metrics, or achievements.
2. In bullets_to_rewrite, improve existing bullets by rephrasing with strong action verbs and ATS keywords found in the job description.
3. Where quantifiable impact is missing, explicitly flag with "[add metric]" (e.g. "Optimized database queries by [add metric]%, reducing latency").
4. Provide exactly 5 prioritized changes in top_5_changes.
5. In tailored_resume_text, return the full complete tailored resume formatted cleanly as plain text, applying the improved bullets and natural keyword alignments while strictly preserving genuine candidate history without making up metrics.
6. Provide score_breakdown across 5 dimensions (keywords_match, skills_match, experience_relevance, formatting_readiness, bullet_impact, each 0-100).
7. For missing_keywords_with_priority, categorize each missing requirement with priority: 'High', 'Medium', or 'Low' and explain why.
8. Extract or guess the target job title in job_title_guess (e.g. Senior Frontend Engineer).
9. In ats_formatting_tips, provide 3-4 specific ATS parser optimization tips.`;

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: `You are an expert technical recruiter and ATS specialist.
Strict rule: never invent experience, skills, metrics or achievements. Improved bullets may only rephrase or reorder what is already in the resume, and must flag with "[add metric]" where a number would help.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match_score: {
                type: Type.INTEGER,
                description: 'Match score between 0 and 100 based on ATS keyword alignment and qualifications match.',
              },
              score_explanation: {
                type: Type.STRING,
                description: 'A 2-3 sentence explanation of why this score was given.',
              },
              job_title_guess: {
                type: Type.STRING,
                description: 'Target job title identified from the job description.',
              },
              score_breakdown: {
                type: Type.OBJECT,
                properties: {
                  keywords_match: { type: Type.INTEGER },
                  skills_match: { type: Type.INTEGER },
                  experience_relevance: { type: Type.INTEGER },
                  formatting_readiness: { type: Type.INTEGER },
                  bullet_impact: { type: Type.INTEGER },
                },
                required: ['keywords_match', 'skills_match', 'experience_relevance', 'formatting_readiness', 'bullet_impact'],
              },
              matching_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Skills, qualifications, and tools present in both the resume and the job description.',
              },
              missing_keywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Critical keywords, technologies, and requirements from the job description missing or under-emphasized in the resume, ordered strictly by importance to the role.',
              },
              missing_keywords_with_priority: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['keyword', 'priority'],
                },
              },
              bullets_to_rewrite: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: {
                      type: Type.STRING,
                      description: 'Original bullet point excerpted from the resume.',
                    },
                    improved: {
                      type: Type.STRING,
                      description: 'Improved version rephrased with action verbs, relevant ATS terms, and "[add metric]" markers where numerical data would help. Strictly no invented achievements.',
                    },
                    reason: {
                      type: Type.STRING,
                      description: 'Recruiter explanation for why this rewrite enhances ATS parseability and hiring manager impact.',
                    },
                  },
                  required: ['original', 'improved', 'reason'],
                },
                description: 'List of resume bullet points rewritten for maximum impact.',
              },
              top_5_changes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Top 5 high-impact, actionable changes the candidate should make to tailor this resume.',
              },
              pre_apply_checklist: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'A concise checklist of actionable items before submitting the application.',
              },
              ats_formatting_tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              tailored_resume_text: {
                type: Type.STRING,
                description: 'Complete tailored resume text with rewritten bullets applied, formatted for export as a .txt file.',
              },
            },
            required: [
              'match_score',
              'score_explanation',
              'matching_skills',
              'missing_keywords',
              'bullets_to_rewrite',
              'top_5_changes',
              'pre_apply_checklist',
              'tailored_resume_text',
            ],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini returned an empty response.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(rawText.trim());
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON output:', rawText);
        return res.status(500).json({
          error: 'Failed to parse AI recruitment analysis into structured JSON. Please try again.',
          raw: rawText,
        });
      }

      // Clamp match score between 0 and 100
      if (typeof parsedData.match_score === 'number') {
        parsedData.match_score = Math.max(0, Math.min(100, Math.round(parsedData.match_score)));
      } else {
        parsedData.match_score = 65;
      }

      // Ensure score_breakdown exists with sensible defaults if missing
      const s = parsedData.match_score;
      if (!parsedData.score_breakdown) {
        parsedData.score_breakdown = {
          keywords_match: Math.max(20, Math.min(100, Math.round(s * 0.95))),
          skills_match: Math.max(25, Math.min(100, Math.round(s * 1.05))),
          experience_relevance: Math.max(20, Math.min(100, Math.round(s * 0.9))),
          formatting_readiness: Math.max(50, Math.min(100, Math.round(s * 0.85 + 15))),
          bullet_impact: Math.max(30, Math.min(100, Math.round(s * 0.8 + 10))),
        };
      }

      // Ensure missing_keywords_with_priority exists
      if (!parsedData.missing_keywords_with_priority && Array.isArray(parsedData.missing_keywords)) {
        parsedData.missing_keywords_with_priority = parsedData.missing_keywords.map((kw: string, i: number) => ({
          keyword: kw,
          priority: i < 3 ? 'High' : i < 6 ? 'Medium' : 'Low',
          reason: `Important requirement identified in role qualifications`,
        }));
      }

      // Ensure ats_formatting_tips exists
      if (!parsedData.ats_formatting_tips || parsedData.ats_formatting_tips.length === 0) {
        parsedData.ats_formatting_tips = [
          'Use clear, standard header titles (e.g. "Work Experience", "Education", "Skills") for seamless parser detection.',
          'Consistently format dates as MM/YYYY to avoid tenure calculation penalties in Taleo and Workday.',
          'Incorporate exact job description keywords naturally within bullet points rather than dumping a raw list.',
          'Keep single-column typography with clean bullet points and avoid multi-column tables or text boxes.',
        ];
      }

      // Ensure job_title_guess
      if (!parsedData.job_title_guess) {
        const firstLine = (jobDescription || '').split('\n')[0] || 'Target Role';
        parsedData.job_title_guess = firstLine.slice(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Software Engineer';
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Analysis error:', err);
      const errorMessage = err?.message || 'Unexpected error occurred during resume analysis';
      return res.status(500).json({
        error: `Resume analysis error: ${errorMessage}`,
      });
    }
  });

  // Dedicated Tailored Cover Letter Generator Endpoint
  app.post('/api/generate-cover-letter', async (req, res): Promise<any> => {
    try {
      const { resumeText, jobDescription, tone = 'Professional' } = req.body;

      if (!resumeText || !resumeText.trim()) {
        return res.status(400).json({ error: 'Resume text is required.' });
      }
      if (!jobDescription || !jobDescription.trim()) {
        return res.status(400).json({ error: 'Job description is required.' });
      }

      const prompt = `Write an exceptional, compelling, and customized Cover Letter connecting this candidate's verified background directly to the employer's job description.

Candidate Resume:
${resumeText.trim()}

Target Job Description:
${jobDescription.trim()}

Tone: ${tone} (Options: Professional, Confident, Friendly)

Strict Rules:
1. Never fabricate achievements, companies, or degrees. Only draw from the real resume text.
2. Directly bridge candidate's strongest achievements to the employer's top pain points mentioned in the job description.
3. Keep the letter concise, punchy (approx 250-380 words), structured with an opening hook, 2 impact-focused body paragraphs, and a confident closing call to action.
4. Flag with [add specific metric] where candidate should insert verified numbers if missing.
5. Format cleanly with standard business letter layout.`;

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: `You are an executive career coach and elite recruiter crafting winning cover letters that bypass gatekeepers. Tone: ${tone}. Authentic, metric-driven, zero fluff.`,
        },
      });

      const coverLetter = response.text || '';
      const wordCount = coverLetter.split(/\s+/).filter(Boolean).length;

      return res.json({
        success: true,
        coverLetter: coverLetter.trim(),
        wordCount,
        tone,
      });
    } catch (err: any) {
      console.error('Cover letter generation error:', err);
      return res.status(500).json({
        error: `Failed to generate cover letter: ${err?.message || 'Unknown error'}`,
      });
    }
  });

  // Dedicated Tailored Resume Generator / Regenerator Endpoint
  app.post('/api/tailor-resume', async (req, res): Promise<any> => {
    try {
      const { resumeText, jobDescription, instructions } = req.body;

      if (!resumeText || !resumeText.trim()) {
        return res.status(400).json({ error: 'Resume text is required.' });
      }

      const prompt = `Rewrite and tailor this candidate's resume for this job description:
Candidate Resume:
${resumeText.trim()}

Target Job Description:
${jobDescription ? jobDescription.trim() : 'Standard technical role'}

${instructions ? `User refinement instructions: ${instructions}` : ''}

Strict Rules:
- Never hallucinate jobs or skills.
- Improve bullets by rephrasing with strong action verbs and ATS keywords.
- Flag missing numbers with "[add metric]".
- Return the full resume formatted as clean plain text ready for ATS upload.`;

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert technical resume writer. Rephrase and optimize genuine candidate experience without inventing skills or metrics.',
        },
      });

      return res.json({
        success: true,
        tailoredResumeText: (response.text || '').trim(),
      });
    } catch (err: any) {
      console.error('Tailor resume error:', err);
      return res.status(500).json({
        error: `Failed to tailor resume: ${err?.message || 'Unknown error'}`,
      });
    }
  });

  // ATS Parser Simulation endpoint
  app.post('/api/simulate-ats', async (req, res): Promise<any> => {
    try {
      const { tailoredResumeText, jobDescription } = req.body;

      if (!tailoredResumeText || !tailoredResumeText.trim()) {
        return res.status(400).json({ error: 'Tailored resume text is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Gemini API key is not configured.',
        });
      }

      const prompt = `Simulate an enterprise Applicant Tracking System (ATS) parser (Workday, Taleo, Greenhouse, iCIMS, Lever) evaluating this resume.

=== RESUME TO SIMULATE PARSING ON ===
${tailoredResumeText.trim()}

=== TARGET JOB DESCRIPTION ===
${(jobDescription || '').trim()}

Analyze this resume for real ATS mechanical parsing issues:
1. Keyword density warnings: Calculate keyword frequency and density. Flag terms that are dangerously over-repeated (keyword stuffing > 3.5%) or key required terms that are under-represented (< 0.8%).
2. Date format issues: Check if dates use inconsistent formats, year-only formats (which prevent ATS from calculating exact months of experience), or ambiguous separators.
3. Section parsing: Verify if standard header keywords (Summary, Experience, Education, Skills) are present and clearly delineated or if unconventional headers might confuse parsers.
4. Parsing vulnerabilities: Check for special characters, tables/column formatting risks, and contact info extraction.
5. Specific adjustments: Suggest actionable, concrete mitigations to reach 100% parser reliability.`;

      const response = await generateContentWithRetry({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction: `You are an enterprise ATS Parser Engine Simulator (reproducing Taleo, Workday, Greenhouse, iCIMS parser logic).
Evaluate the resume for parsing compliance, date formatting consistency, section detection, keyword density/stuffing risks, and actionable mitigations.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              parser_score: {
                type: Type.INTEGER,
                description: 'Overall ATS parser compliance score from 0 to 100.',
              },
              risk_level: {
                type: Type.STRING,
                description: 'Overall parsing risk level: "low", "medium", or "high".',
              },
              parsed_sections_found: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Standard resume sections successfully recognized by the simulated parser.',
              },
              parsed_sections_missing: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Standard resume sections that were missing or not clearly detected.',
              },
              date_format_status: {
                type: Type.STRING,
                description: '"standardized", "inconsistent", or "warning".',
              },
              date_format_details: {
                type: Type.STRING,
                description: 'Specific analysis of date formats found and how ATS algorithms interpret candidate tenure.',
              },
              keyword_density_warnings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    density: { type: Type.NUMBER, description: 'Percentage density e.g. 2.4' },
                    status: { type: Type.STRING, description: '"optimal", "stuffed", or "sparse"' },
                    recommendation: { type: Type.STRING },
                  },
                  required: ['keyword', 'count', 'density', 'status', 'recommendation'],
                },
                description: 'Keyword density and frequency analysis.',
              },
              formatting_issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: '"formatting", "dates", "sections", "layout", or "contact_info"' },
                    severity: { type: Type.STRING, description: '"low", "medium", or "high"' },
                    issue: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                  },
                  required: ['category', 'severity', 'issue', 'recommendation'],
                },
                description: 'Specific parsing vulnerabilities detected.',
              },
              specific_mitigation_steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Concrete step-by-step recommendations to fix all identified ATS parsing risks.',
              },
            },
            required: [
              'parser_score',
              'risk_level',
              'parsed_sections_found',
              'parsed_sections_missing',
              'date_format_status',
              'date_format_details',
              'keyword_density_warnings',
              'formatting_issues',
              'specific_mitigation_steps',
            ],
          },
        },
      });

      const raw = response.text;
      if (!raw) {
        throw new Error('Empty response from ATS simulation.');
      }

      const reportData = JSON.parse(raw.trim());
      return res.json({
        success: true,
        report: reportData,
      });
    } catch (err: any) {
      console.warn('AI ATS simulation encountered error, generating rule-based ATS audit fallback:', err?.message);

      // Heuristic fallback ATS simulation
      const text = String(req.body.tailoredResumeText || '');
      const lower = text.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      const totalWords = Math.max(1, words.length);

      // Check standard sections
      const sections = [
        { name: 'Professional Summary', keys: ['summary', 'profile', 'objective'] },
        { name: 'Work Experience', keys: ['experience', 'employment', 'history', 'work'] },
        { name: 'Technical Skills', keys: ['skills', 'technologies', 'competencies'] },
        { name: 'Education', keys: ['education', 'degree', 'university', 'college'] },
      ];
      const foundSections = sections.filter((s) => s.keys.some((k) => lower.includes(k))).map((s) => s.name);
      const missingSections = sections.filter((s) => !s.keys.some((k) => lower.includes(k))).map((s) => s.name);

      // Check dates
      const hasMonthDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{4})/i.test(text);
      const hasYearOnly = /\b(19|20)\d{2}\s*[-–—]\s*(19|20|\bpresent\b)/i.test(text);

      let dateFormatStatus = 'standardized';
      let dateFormatDetails = 'Dates appear standardized with consistent timeframes.';
      if (hasYearOnly && !hasMonthDate) {
        dateFormatStatus = 'warning';
        dateFormatDetails = 'Year-only dates detected without specific months. Enterprise ATS parsers (Workday, Taleo) calculate candidate experience duration using months; omitting months can lead to under-counting tenure.';
      }

      // Keyword density calculation from job description
      const jobWords = String(req.body.jobDescription || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !['with', 'have', 'from', 'this', 'that', 'your', 'will', 'about', 'role', 'team', 'work', 'years'].includes(w));

      const uniqueKeywords = Array.from(new Set(jobWords)).slice(0, 5);
      const keywordWarnings = uniqueKeywords.map((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const count = (text.match(regex) || []).length;
        const density = parseFloat(((count / totalWords) * 100).toFixed(1));
        let status: 'optimal' | 'stuffed' | 'sparse' = 'optimal';
        let recommendation = `Frequency (${count}x) is well-balanced within the resume narrative.`;
        if (density > 3.5) {
          status = 'stuffed';
          recommendation = `Keyword '${kw}' appears ${count}x (${density}% density). Reduce repetition to avoid triggering spam filters.`;
        } else if (count === 0) {
          status = 'sparse';
          recommendation = `Important target keyword '${kw}' is absent. Consider integrating into relevant project bullets.`;
        }
        return { keyword: kw, count, density, status, recommendation };
      });

      const fallbackReport = {
        parser_score: missingSections.length === 0 && dateFormatStatus === 'standardized' ? 92 : 78,
        risk_level: missingSections.length > 0 || dateFormatStatus === 'warning' ? 'medium' : 'low',
        parsed_sections_found: foundSections,
        parsed_sections_missing: missingSections,
        date_format_status: dateFormatStatus,
        date_format_details: dateFormatDetails,
        keyword_density_warnings: keywordWarnings,
        formatting_issues: [
          ...(dateFormatStatus === 'warning'
            ? [{
                category: 'dates',
                severity: 'medium',
                issue: 'Year-only date ranges detected',
                recommendation: 'Update dates to Month YYYY (e.g. 03/2022 - Present) to ensure ATS tenure calculations are exact.',
              }]
            : []),
          ...(!lower.includes('@')
            ? [{
                category: 'contact_info',
                severity: 'high',
                issue: 'Email address not clearly detected in resume header',
                recommendation: 'Place your professional email address prominently at the very top of your document.',
              }]
            : []),
        ],
        specific_mitigation_steps: [
          'Ensure standard ASCII bullet characters (• or -) are used throughout experience sections.',
          'Verify all job titles, company names, and dates are placed on clean individual lines.',
          'Include standard contact header (Email, Phone, Location, LinkedIn) at the very top.',
          'Review keyword density to ensure target terms are woven organically into accomplishments.',
        ],
      };

      return res.json({
        success: true,
        report: fallbackReport,
      });
    }
  });

  // Serve static files in production or hook Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Resume Match AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
