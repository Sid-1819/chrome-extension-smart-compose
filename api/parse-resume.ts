import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import * as pdfParse from 'pdf-parse';
// @ts-ignore - mammoth doesn't have perfect types
import mammoth from 'mammoth';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Disable body parsing to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Parse file and extract text based on file type
 */
async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    // Handle PDF files
    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      // @ts-ignore - pdf-parse types are not perfect
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    }

    // Handle DOCX files
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filePath.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    // Handle plain text files
    if (mimeType.startsWith('text/') || filePath.endsWith('.txt') || filePath.endsWith('.md')) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
  } catch (error) {
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean and format resume text using Gemini
 */
async function cleanResumeText(rawText: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a resume text extraction assistant. Clean and format the following extracted resume text. Remove any formatting artifacts, fix spacing issues, and return a clean, readable version of the resume. Keep all the important information but make it well-structured and easy to read.

Resume text:
${rawText}

Return only the cleaned resume text, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    // If Gemini fails, return the raw text
    console.error('Gemini cleaning failed:', error);
    return rawText;
  }
}

/**
 * Main handler for resume parsing
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Resume parsing API called');

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured. Please set it in Vercel environment variables.' });
  }

  console.log('API key is configured');

  try {
    console.log('Parsing form data...');

    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
        } else {
          console.log('Form parsed successfully');
          resolve([fields, files]);
        }
      });
    });

    // Get the uploaded file
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    console.log('File received:', file.originalFilename, 'Size:', file.size, 'Type:', file.mimetype);

    if (!file.filepath) {
      console.error('Invalid file upload - no filepath');
      return res.status(400).json({ error: 'Invalid file upload' });
    }

    console.log('Extracting text from file...');

    // Extract text from the file
    const extractedText = await extractTextFromFile(
      file.filepath,
      file.mimetype || ''
    );

    console.log('Text extracted, length:', extractedText.length);

    if (!extractedText.trim()) {
      console.error('No text could be extracted from the file');
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    console.log('Cleaning text with Gemini...');

    // Optionally clean the text with Gemini
    const cleanText = await cleanResumeText(extractedText);

    console.log('Text cleaned, length:', cleanText.length);

    // Clean up the uploaded file
    try {
      fs.unlinkSync(file.filepath);
      console.log('Temp file cleaned up');
    } catch (cleanupError) {
      console.error('Failed to cleanup temp file:', cleanupError);
    }

    // Return the extracted and cleaned text
    console.log('Returning success response');
    return res.status(200).json({
      success: true,
      text: cleanText,
      originalLength: extractedText.length,
      cleanedLength: cleanText.length,
      filename: file.originalFilename || 'unknown',
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Error details:', { message: errorMessage, stack: errorStack });

    return res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
  }
}
