import { PDFParse } from 'pdf-parse';

const cleanExtractedText = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text;

  // 1. Initial Artifact Cleaning & Normalization
  cleaned = cleaned
    // Remove page separators (e.g., "-- 1 of 2 --")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, '')
    // Remove control characters (keeping newlines/tabs)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize line breaks to \n
    .replace(/\r\n|\r/g, '\n')
    // Replace tabs with spaces
    .replace(/\t/g, ' ')
    // Collapse multiple spaces into one
    .replace(/[ ]{2,}/g, ' ');

  // 2. Intelligent Line Merging
  // Split, trim, and remove empty lines initially to simplify the loop
  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const prevLine = processedLines[processedLines.length - 1] || '';

    // -- Detection Logic --

    // Detect bullet points (standard and special chars)
    const isBulletPoint = /^[●•▪▫◦‣⁃]/.test(currentLine);

    // Detect All-Caps headers (e.g., "EXPERIENCE", "TECHNICAL SKILLS")
    // Limit length to avoid false positives on long all-caps sentences
    const isHeaderCaps =
      /^[A-Z\s&]{2,35}$/.test(currentLine) && currentLine.length < 40;

    // Detect headers ending in colon (e.g., "Languages:")
    const isHeaderColon = /:\s*$/.test(currentLine) && currentLine.length < 50;

    // Detect Date Ranges (e.g., "October 2024 – Present")
    const isDateRange = /^[A-Z][a-z]+\s+\d{4}\s*[–-]/.test(currentLine);

    // Detect Company/Location pattern (e.g., "Google (Mountain View)")
    const isCompanyLocation = /^[A-Z][A-Za-z\s&]+\([^)]+\)\s+/.test(
      currentLine,
    );

    // Always preserve the structure of the very first few lines (Name, Title)
    const isFirstLines = i < 2;

    const isNewSection =
      isBulletPoint ||
      isHeaderCaps ||
      isHeaderColon ||
      isDateRange ||
      isCompanyLocation ||
      isFirstLines;

    // -- Merge Logic --

    // We merge if:
    // 1. It's not clearly a start of a new section
    // 2. There is a previous line to merge into
    // 3. The current line is NOT a bullet point
    // 4. The previous line did NOT end in a colon (headers shouldn't absorb body text)
    const shouldMerge =
      !isNewSection &&
      prevLine.length > 0 &&
      !isBulletPoint &&
      !prevLine.endsWith(':');

    if (shouldMerge && processedLines.length > 0) {
      // Append current line to previous line with a space
      processedLines[processedLines.length - 1] = `${prevLine} ${currentLine}`;
    } else {
      // Push as a new line
      processedLines.push(currentLine);
    }
  }

  // 3. Post-Processing & Formatting
  cleaned = processedLines.join('\n');

  // Fix spacing around punctuation (e.g., "word ,word" -> "word, word")
  cleaned = cleaned
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])\s*([.,;:!?])/g, '$1 $2');

  // Fix spacing around pipes
  cleaned = cleaned.replace(/\s*\|\s*/g, ' | ');

  // Fix spacing around dashes for dates/ranges
  cleaned = cleaned.replace(/(\w)\s*-\s*(\w)/g, '$1-$2');
  cleaned = cleaned.replace(/(\d{4})\s*-\s*(\d{4})/g, '$1 - $2');

  // Restore email formats that might have been broken by punctuation logic
  cleaned = cleaned.replace(/(\S+)\s*@\s*(\S+)/g, '$1@$2');

  // Normalize all bullet points to a standard character
  cleaned = cleaned.replace(/[•▪▫◦‣⁃]/g, '●');

  // Ensure max 1 blank line between paragraphs/sections
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

const extractTextFromPDFs = async (
  buffers: (Buffer | null | undefined)[],
): Promise<string[]> => {
  const extractedTexts: string[] = [];

  if (!buffers || !Array.isArray(buffers)) {
    return extractedTexts;
  }

  for (const buffer of buffers) {
    // Skip null or undefined buffers
    if (!buffer) {
      extractedTexts.push('');
      continue;
    }

    try {
      const parser = new PDFParse(new Uint8Array(buffer));
      const result = await parser.getText();

      let plainText = '';

      // Extract plain text from the result
      if (typeof result === 'string') {
        plainText = result;
      } else if (result && typeof result === 'object') {
        // If result has a text property, use it
        if ('text' in result && typeof result.text === 'string') {
          plainText = result.text;
        } else if (
          'pages' in result &&
          Array.isArray(result.pages) &&
          result.pages.length > 0
        ) {
          // Extract text from each page using optional chaining
          plainText = result.pages
            .map((page: any) => page?.text || '')
            .filter((text: string) => text?.trim()?.length > 0)
            .join('\n\n');
        }
      }

      // Clean up the extracted text
      plainText = cleanExtractedText(plainText);

      extractedTexts.push(plainText);
    } catch (error) {
      // Handle parsing errors gracefully
      console.error('Error extracting text from PDF:', error);
      extractedTexts.push('');
    }
  }

  return extractedTexts;
};

const CandidateUtils = {
  cleanExtractedText,
  extractTextFromPDFs,
};

export default CandidateUtils;
