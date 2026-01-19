import { GoogleGenAI } from "@google/genai";
import { SearchResult, Vacancy } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

export const fetchVacancies = async (existingTitles: string[] = []): Promise<SearchResult> => {
  // Use process.env.API_KEY as per guidelines. 
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Get current date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = `
  Act as a precision scraper for **College Nepal (collegenp.com/vacancy)**.
  **CURRENT DATE:** ${dateString}

  **CORE OBJECTIVE:** 
  Fetch the **LATEST** vacancy list from **collegenp.com**. The website lists vacancies in **Chronological Order** (Newest first).
  **YOU MUST PRESERVE THIS ORDER.** Start from the top of the list and go down.
  Extract **20-25** active vacancies.

  **MANDATORY SEARCH TARGETS:**
  1. **CDSC (CDS and Clearing Limited):** Look specifically for **IT Officer / Senior Officer** and Technical/Admin roles. 
  2. **NEA (Nepal Electricity Authority):** Recent notices.
  3. **Government/Banking:** Rastriya Banijya Bank, NTC, Lok Sewa.

  **DATA EXTRACTION RULES:**

  1. **CONTRACT (KARAR) DETECTION:**
     - Scan text for: "Contract", "Karar", "Temporary", "Sewakarar", "Open Competition (Karar)".
     - **IF CONTRACT:** Append **"(करार सेवा)"** to the \`title\`. (e.g., "IT Officer (करार सेवा)")

  2. **LANGUAGE (NEPALI):**
     - Description: 2 lines in **NEPALI** (नेपालीमा).
     - Summary: In Nepali.

  3. **DATES (CRITICAL FOR SORTING):**
     - **publishedDate**: Convert "Today", "2 days ago", etc., to **"YYYY-MM-DD"** format (e.g., "${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}").
     - **SORTING**: The JSON array MUST be sorted by publishedDate (Newest to Oldest).

  4. **CATEGORIZATION:**
     - Technical: IT, Engineering, Health.
     - Non-Technical: Admin, Accounting.
     - Government: CDSC, NEA, NTC, Sansthan.

  **OUTPUT JSON SCHEME:**
  {
    "vacancies": [
      {
        "title": "Job Title",
        "organization": "Org Name",
        "category": ["Technical", "Government"], 
        "level": "Level (तह)",
        "qualification": "Education",
        "eligibility": "Age",
        "publishedDate": "YYYY-MM-DD",
        "deadline": "YYYY-MM-DD", 
        "deadlineDouble": "YYYY-MM-DD", 
        "daysRemaining": "e.g. '5 days left'",
        "description": "नेपालीमा विवरण...",
        "location": "Location",
        "vacancyNumber": "Seats",
        "sourceUrl": "http..."
      }
    ],
    "summary": "Summary in Nepali..."
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const responseText = response.text || "{}";
    
    let parsedData = { vacancies: [], summary: "कुनै जानकारी प्राप्त भएन।" };
    try {
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanText;
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON parse failed", e, responseText);
    }

    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri,
        });
      }
    });

    const vacancies: Vacancy[] = (parsedData.vacancies || []).map((v: any, index: number) => {
      let finalUrl = v.sourceUrl;
      const sourcesMatch = sources.find(s => s.uri === finalUrl);
      
      if (!sourcesMatch) {
         if (sources.length > 0) finalUrl = sources[0].uri;
         else finalUrl = "https://www.collegenp.com/vacancy";
      }

      let categories: string[] = ["General"];
      if (Array.isArray(v.category)) {
        categories = v.category;
      } else if (typeof v.category === 'string') {
        categories = [v.category];
      }

      return {
        id: `vac-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        title: v.title || "Unknown Title",
        organization: v.organization || "Unspecified",
        category: categories,
        publishedDate: v.publishedDate || dateString,
        deadline: v.deadline || "हेर्नुहोस्",
        deadlineDouble: v.deadlineDouble || null,
        daysRemaining: v.daysRemaining || null,
        description: v.description || "विवरण उपलब्ध छैन।",
        location: v.location || "Nepal",
        vacancyNumber: v.vacancyNumber || "N/A",
        sourceUrl: finalUrl, 
        qualification: v.qualification || "Not specified",
        level: v.level || "Not specified",
        eligibility: v.eligibility || "Not specified"
      };
    });

    // Client-side Sorting: Force Sort by Published Date Descending (Newest First)
    vacancies.sort((a, b) => {
      const dateA = new Date(a.publishedDate);
      const dateB = new Date(b.publishedDate);
      
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();

      return timeB - timeA; // Descending
    });

    return {
      vacancies,
      rawSummary: parsedData.summary || "भर्खरैका सूचनाहरू...",
      sources,
    };

  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};