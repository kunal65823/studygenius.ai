import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth  from 'mammoth';

export const extractText = async (buffer, mimeType) => {
  let text      = '';
  let pageCount = null;

  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    text      = data.text;
    pageCount = data.numpages;

  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;

  } else if (mimeType === 'text/plain') {
    text = buffer.toString('utf-8');

  } else {
    // PPTX and others - extract readable text from XML
    const raw = buffer.toString('utf-8');
    text = raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  // Clean up text
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, pageCount, wordCount };
};