import { isHtml, stripHtml } from '../utils/htmlUtils';

describe('HTML Utilities', () => {
  describe('isHtml', () => {
    test('should detect HTML content', () => {
      const htmlContent = '<html><body><h1>Test</h1><p>This is HTML</p></body></html>';
      expect(isHtml(htmlContent)).toBe(true);
    });

    test('should detect partial HTML content', () => {
      const partialHtml = 'Some text with <div>embedded tags</div> in it';
      expect(isHtml(partialHtml)).toBe(true);
    });

    test('should detect HTML doctype', () => {
      const doctype = '<!DOCTYPE html><html><body>Content</body></html>';
      expect(isHtml(doctype)).toBe(true);
    });

    test('should not detect plain text as HTML', () => {
      const plainText = 'This is just plain text with no tags.';
      expect(isHtml(plainText)).toBe(false);
    });

    test('should not detect text with angle brackets as HTML', () => {
      const mathText = 'If x < 10 and y > 20 then proceed';
      expect(isHtml(mathText)).toBe(false);
    });
  });

  describe('stripHtml', () => {
    test('should strip HTML tags', () => {
      const html = '<html><body><h1>Test Heading</h1><p>Test paragraph</p></body></html>';
      const expected = 'Test Heading Test paragraph';
      expect(stripHtml(html)).toBe(expected);
    });

    test('should handle HTML entities', () => {
      const html = '<p>This &amp; that with &quot;quotes&quot; and &lt;tags&gt;</p>';
      const expected = 'This & that with "quotes" and <tags>';
      expect(stripHtml(html)).toBe(expected);
    });

    test('should remove script and style tags completely', () => {
      const html = '<html><head><style>body { color: red; }</style></head>' +
                  '<body><h1>Heading</h1><script>alert("hello");</script></body></html>';
      const expected = 'Heading';
      expect(stripHtml(html)).toBe(expected);
    });

    test('should maintain paragraphs', () => {
      const html = '<p>Paragraph 1</p><p>Paragraph 2</p>';
      const result = stripHtml(html);
      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
    });

    test('should return original text for non-HTML content', () => {
      const plainText = 'Just plain text, no HTML here.';
      expect(stripHtml(plainText)).toBe(plainText);
    });
  });
});
