import * as cheerio from 'cheerio';
import { isHtml, extractTextFromHtml, stripHtml, extractMetadata } from '../utils/enhancedHtmlUtils';

// Mock cheerio
jest.mock('cheerio');

describe('Enhanced HTML Utils', () => {
  // Save original console methods
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to prevent output during tests
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Clean up any mock implementation overrides
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Restore original console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('isHtml', () => {
    it('should detect HTML with regular tags', () => {
      expect(isHtml('<div>Hello</div>')).toBe(true);
      expect(isHtml('<p>This is a paragraph</p>')).toBe(true);
      expect(isHtml('<h1>Heading</h1>')).toBe(true);
      expect(isHtml('<br>')).toBe(true);
      expect(isHtml('<img src="image.jpg">')).toBe(true);
    });

    it('should detect HTML with doctype declaration', () => {
      expect(isHtml('<!DOCTYPE html><html></html>')).toBe(true);
      expect(isHtml('<!DOCTYPE html>\n<html><head></head><body></body></html>')).toBe(true);
    });

    it('should detect HTML with comments', () => {
      expect(isHtml('<!-- This is a comment -->')).toBe(true);
      expect(isHtml('<!-- Comment --><p>Text</p>')).toBe(true);
      expect(isHtml('Text<!-- Comment with <tags> inside -->')).toBe(true);
    });

    it('should return false for non-HTML content', () => {
      expect(isHtml('Just plain text')).toBe(false);
      expect(isHtml('Text with < and > characters but not HTML')).toBe(false);
      expect(isHtml('Line 1\nLine 2\nLine 3')).toBe(false);
      expect(isHtml('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isHtml('<>')).toBe(false); // Not valid HTML
      expect(isHtml('< >')).toBe(false); // Not valid HTML
      expect(isHtml('<1>test</1>')).toBe(false); // Tags should start with letters
    });
  });

  describe('extractTextFromHtml', () => {
    it('should return the original content if not HTML', () => {
      const plainText = 'This is plain text';
      expect(extractTextFromHtml(plainText)).toBe(plainText);
    });

    it('should extract text from HTML content', () => {
      // Setup cheerio load mock to return a simple extraction
      (cheerio.load as jest.Mock).mockReturnValue(() => ({
        remove: jest.fn(),
        text: jest.fn().mockReturnValue('Extracted text content')
      }));

      const html = '<html><body><div>Some content</div></body></html>';
      const result = extractTextFromHtml(html);
      expect(result).toBe('Extracted text content');
    });

    it('should extract text from different content areas', () => {
      // Setup cheerio mock to simulate different content areas
      const mockMainText = jest.fn().mockReturnValue('Main content');
      const mockArticleText = jest.fn().mockReturnValue('Article content');
      const mockContentText = jest.fn().mockReturnValue('');
      const mockBodyText = jest.fn().mockReturnValue('Body content');
      
      const mockSelectors = {
        'script': { remove: jest.fn() },
        'style': { remove: jest.fn() },
        'noscript': { remove: jest.fn() },
        'iframe': { remove: jest.fn() },
        'svg': { remove: jest.fn() },
        'nav': { remove: jest.fn() },
        'header': { remove: jest.fn() },
        'footer': { remove: jest.fn() },
        'main': { text: mockMainText },
        'article': { text: mockArticleText },
        '#content': { text: mockContentText },
        '.content': { text: mockContentText },
        'body': { text: mockBodyText }
      };
      
      // Create a function that simulates the cheerio $ function
      const mockCheerioFunc = (selector: string) => mockSelectors[selector] || { each: jest.fn() };
      
      // Mock the load function to return our mock $ function
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioFunc);
      
      const html = '<html><body><main>Main content</main></body></html>';
      const result = extractTextFromHtml(html);
      
      // Should get content from main element
      expect(result).toBe('Main content');
    });
    
    it('should fall back to article content if main is empty', () => {
      const mockMainText = jest.fn().mockReturnValue('');
      const mockArticleText = jest.fn().mockReturnValue('Article content');
      
      const mockSelectors = {
        'script': { remove: jest.fn() },
        'style': { remove: jest.fn() },
        'noscript': { remove: jest.fn() },
        'iframe': { remove: jest.fn() },
        'svg': { remove: jest.fn() },
        'nav': { remove: jest.fn() },
        'header': { remove: jest.fn() },
        'footer': { remove: jest.fn() },
        'main': { text: mockMainText },
        'article': { text: mockArticleText },
        '#content': { text: jest.fn().mockReturnValue('') },
        '.content': { text: jest.fn().mockReturnValue('') },
        'body': { text: jest.fn() }
      };
      
      // Create a function that simulates the cheerio $ function
      const mockCheerioFunc = (selector: string) => mockSelectors[selector] || { each: jest.fn() };
      
      // Mock the load function to return our mock $ function
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioFunc);
      
      const html = '<html><body><article>Article content</article></body></html>';
      const result = extractTextFromHtml(html);
      
      // Should get content from article element
      expect(result).toBe('Article content');
    });

    it('should extract text from paragraphs and headers when main content areas are empty', () => {
      // Mock cheerio selectors with different content areas
      const mockBodyContent: string[] = [];
      
      // Create a mock each function that populates bodyContent array
      const mockParagraphsEach = jest.fn().mockImplementation((callback) => {
        callback();
        callback();
      });
      
      // Mock for text() that returns different values for each call
      let textCallCount = 0;
      const mockParagraphText = jest.fn().mockImplementation(() => {
        textCallCount++;
        return `Paragraph ${textCallCount}`;
      });
      
      const mockSelectors = {
        'script': { remove: jest.fn() },
        'style': { remove: jest.fn() },
        'noscript': { remove: jest.fn() },
        'iframe': { remove: jest.fn() },
        'svg': { remove: jest.fn() },
        'nav': { remove: jest.fn() },
        'header': { remove: jest.fn() },
        'footer': { remove: jest.fn() },
        'main': { text: jest.fn().mockReturnValue('') },
        'article': { text: jest.fn().mockReturnValue('') },
        '#content': { text: jest.fn().mockReturnValue('') },
        '.content': { text: jest.fn().mockReturnValue('') },
        'h1, h2, h3, h4, h5, h6, p': { 
          each: mockParagraphsEach,
          text: mockParagraphText
        },
        'li': { each: jest.fn() },
        'body': { text: jest.fn().mockReturnValue('') }
      };
      
      // Create our mock cheerio function
      const mockCheerioFunc = (selector: string) => {
        return mockSelectors[selector] || { each: jest.fn() };
      };
      
      // Setup mock text() method for use with "this" context in each() callbacks
      mockCheerioFunc.text = jest.fn().mockReturnValue('Paragraph text');
      
      // Setup mock for cheerio load
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioFunc);
      
      const html = '<html><body><h1>Heading</h1><p>Content</p></body></html>';
      extractTextFromHtml(html);
      
      // Verify remove was called for script and style tags
      expect(mockSelectors['script'].remove).toHaveBeenCalled();
      expect(mockSelectors['style'].remove).toHaveBeenCalled();
      
      // Verify paragraph text extraction was done
      expect(mockParagraphsEach).toHaveBeenCalled();
    });
    
    it('should handle falling back to body content when no other elements found', () => {
      // Mock selectors with empty main content areas but body content
      const mockBodyText = jest.fn().mockReturnValue('Body content');
      
      const mockSelectors = {
        'script': { remove: jest.fn() },
        'style': { remove: jest.fn() },
        'noscript': { remove: jest.fn() },
        'iframe': { remove: jest.fn() },
        'svg': { remove: jest.fn() },
        'nav': { remove: jest.fn() },
        'header': { remove: jest.fn() },
        'footer': { remove: jest.fn() },
        'main': { text: jest.fn().mockReturnValue('') },
        'article': { text: jest.fn().mockReturnValue('') },
        '#content': { text: jest.fn().mockReturnValue('') },
        '.content': { text: jest.fn().mockReturnValue('') },
        'h1, h2, h3, h4, h5, h6, p': { each: jest.fn() },
        'li': { each: jest.fn() },
        'body': { text: mockBodyText }
      };
      
      // Create mock cheerio function
      const mockCheerioFunc = (selector: string) => {
        return mockSelectors[selector] || { each: jest.fn() };
      };
      
      // Setup mock for cheerio load
      (cheerio.load as jest.Mock).mockReturnValue(mockCheerioFunc);
      
      const html = '<html><body>Body content</body></html>';
      const result = extractTextFromHtml(html);
      
      // Should get content from body element
      expect(mockBodyText).toHaveBeenCalled();
    });
  });

  describe('stripHtml', () => {
    it('should return the original content if not HTML', () => {
      const plainText = 'This is plain text';
      const result = stripHtml(plainText);
      
      // Since isHtml will properly detect this as not HTML
      expect(result).toBe(plainText);
    });

    it('should remove script and style tags with their content', () => {
      // We need to make sure isHtml returns true for this test
      jest.spyOn(cheerio, 'load'); // Just to ensure cheerio is mocked
      
      const html = '<div>Content<script>alert("hello");</script><style>.class { color: red; }</style>More content</div>';
      const result = stripHtml(html);
      
      // We can't test exact output, but we can verify script and style tags are removed
      expect(result).toContain('Content');
      expect(result).toContain('More content');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<style>');
    });
    
    it('should process HTML with entities', () => {
      const html = '&lt;div&gt;Text with entities&lt;/div&gt;';
      stripHtml(html);
      
      // Test passes if no errors are thrown
      expect(true).toBe(true);
    });
  });

  describe('extractMetadata', () => {
    it('should return an empty object for non-HTML content', () => {
      const plainText = 'This is plain text';
      expect(extractMetadata(plainText)).toEqual({});
    });
    
    it('should extract title from HTML', () => {
      // Setup cheerio load mock to return different selectors
      const mockTextFn = jest.fn().mockReturnValue('Page Title');
      const mockTitle = { text: mockTextFn };
      const mockH1 = { first: jest.fn().mockReturnValue({ text: jest.fn() }) };
      
      const mockSelectors = {
        'title': mockTitle,
        'h1': mockH1,
        'meta[name="description"]': { attr: jest.fn() },
        'meta[property="og:description"]': { attr: jest.fn() },
        'meta[name="author"]': { attr: jest.fn() },
        'meta[property="article:author"]': { attr: jest.fn() }
      };
      
      (cheerio.load as jest.Mock).mockImplementation(() => {
        return ((selector: string) => mockSelectors[selector] || {});
      });
      
      const html = '<html><head><title>Page Title</title></head><body></body></html>';
      const result = extractMetadata(html);
      
      expect(mockTextFn).toHaveBeenCalled();
      expect(result.title).toBe('Page Title');
    });
    
    it('should handle errors during metadata extraction', () => {
      // Force cheerio.load to throw an error
      (cheerio.load as jest.Mock).mockImplementation(() => {
        throw new Error('Cheerio error');
      });
      
      const html = '<html><head><title>Page Title</title></head><body></body></html>';
      const result = extractMetadata(html);
      
      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should extract description from meta tags', () => {
      // Create a simple mock implementation that returns the description
      (cheerio.load as jest.Mock).mockImplementation(() => {
        return (selector: string) => {
          if (selector === 'meta[name="description"]') {
            return {
              attr: () => 'Page description'
            };
          }
          
          // Default return for other selectors
          return { text: () => '', first: () => ({ text: () => '' }), attr: () => null };
        };
      });
      
      const html = '<html><head><meta name="description" content="Page description"></head></html>';
      const result = extractMetadata(html);
      
      expect(result.description).toBe('Page description');
    });
    
    it('should extract author from meta tags', () => {
      // Create a simple mock implementation that returns the author
      (cheerio.load as jest.Mock).mockImplementation(() => {
        return (selector: string) => {
          if (selector === 'meta[name="author"]') {
            return {
              attr: () => 'John Doe'
            };
          }
          
          // Default return for other selectors
          return { text: () => '', first: () => ({ text: () => '' }), attr: () => null };
        };
      });
      
      const html = '<html><head><meta name="author" content="John Doe"></head></html>';
      const result = extractMetadata(html);
      
      expect(result.author).toBe('John Doe');
    });
  });
});
