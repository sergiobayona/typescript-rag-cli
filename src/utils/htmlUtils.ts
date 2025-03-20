// src/utils/htmlUtils.ts
/**
 * Utility functions for processing HTML content
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
   * Strips HTML tags from content
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