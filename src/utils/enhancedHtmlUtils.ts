import * as cheerio from 'cheerio';

/**
 * Enhanced HTML detection and processing using Cheerio
 * Provides better handling of complex HTML documents
 */

/**
 * Detects if the content contains HTML by checking for HTML tags
 * @param content - Text content to check
 * @returns Boolean indicating if HTML was detected
 */
export function isHtml(content: string): boolean {
  // Check for common HTML patterns - basic tags, doctype, or HTML comments
  const htmlRegex = /<\/?[a-z][\s\S]*>/i;
  const doctypeRegex = /<!DOCTYPE\s+html>/i;
  const commentRegex = /<!--[\s\S]*?-->/;
  
  return (
    htmlRegex.test(content) || 
    doctypeRegex.test(content) || 
    commentRegex.test(content)
  );
}

/**
 * Extracts readable text content from HTML using Cheerio
 * @param htmlContent - HTML content to process
 * @returns Plain text extracted from the HTML
 */
export function extractTextFromHtml(htmlContent: string): string {
  if (!isHtml(htmlContent)) {
    return htmlContent;
  }
  
  try {
    const $ = cheerio.load(htmlContent);
    
    // Remove script, style, and other non-content elements
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('svg').remove();
    $('nav').remove();
    $('header').remove();
    $('footer').remove();
    
    // Identify and prioritize main content areas
    let mainContent = $('main').text() || 
                      $('article').text() || 
                      $('#content').text() || 
                      $('.content').text();
    
    // If no main content found, extract from body
    if (!mainContent.trim()) {
      // Try to extract paragraphs and headers
      const bodyContent: string[] = [];
      
      // Get all headers and paragraphs
      $('h1, h2, h3, h4, h5, h6, p').each(function() {
        const text = $(this).text().trim();
        if (text) {
          bodyContent.push(text);
        }
      });
      
      // Get list items
      $('li').each(function() {
        const text = $(this).text().trim();
        if (text) {
          bodyContent.push(`• ${text}`);
        }
      });
      
      mainContent = bodyContent.join('\n\n');
      
      // If still no content, just get the body text
      if (!mainContent.trim()) {
        mainContent = $('body').text();
      }
    }
    
    // Clean up the extracted text
    let result = mainContent
      .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
      .replace(/\n+/g, '\n')        // Replace multiple newlines
      .replace(/\t+/g, ' ')         // Replace tabs with space
      .trim();
    
    // Improve paragraph separation
    result = result
      .replace(/\.\s+([A-Z])/g, '.\n\n$1')  // Add paragraph breaks after sentences ending with period
      .replace(/[.!?]\s+/g, match => match.replace(/\s+/, ' \n\n')); // Add newlines after sentences
    
    return result;
  } catch (error) {
    console.error('Error parsing HTML with Cheerio:', error);
    // Fallback to basic HTML stripping
    return stripHtml(htmlContent);
  }
}

/**
 * Strips HTML tags from content (basic version, used as fallback)
 * @param content - HTML content to process
 * @returns Plain text content with HTML tags removed
 */
export function stripHtml(content: string): string {
  if (!isHtml(content)) {
    return content;
  }
  
  // First remove scripts and style elements completely
  let result = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Replace HTML entities
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/&amp;/g, '&');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/&quot;/g, '"');
  result = result.replace(/&#39;/g, "'");
  
  // Remove remaining tags
  result = result.replace(/<[^>]*>/g, '');
  
  // Remove excessive whitespace
  result = result.replace(/\s+/g, ' ');
  
  // Fix spacing around list items and paragraphs
  result = result.replace(/\s*\.\s+/g, '. ');
  result = result.replace(/\s*\n\s*/g, '\n\n');
  
  return result.trim();
}

/**
 * Extract metadata from HTML document 
 * @param html - HTML content to extract metadata from
 * @returns Object with metadata properties
 */
export function extractMetadata(html: string): { title?: string; description?: string; author?: string } {
  if (!isHtml(html)) {
    return {};
  }
  
  try {
    const $ = cheerio.load(html);
    const metadata: { title?: string; description?: string; author?: string } = {};
    
    // Extract title
    metadata.title = $('title').text().trim();
    if (!metadata.title) {
      metadata.title = $('h1').first().text().trim();
    }
    
    // Extract description
    metadata.description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content');
    
    // Extract author
    metadata.author = $('meta[name="author"]').attr('content') || 
                    $('meta[property="article:author"]').attr('content');
    
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {};
  }
}