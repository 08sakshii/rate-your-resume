const { SYSTEM_PROMPT, buildUserPrompt } = require('../prompts/resumeAnalysis.prompts');

describe('resumeAnalysis prompts', () => {
  describe('SYSTEM_PROMPT', () => {
    it('is a string containing instructions to respond with JSON', () => {
      expect(typeof SYSTEM_PROMPT).toBe('string');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('json');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('summary');
      expect(SYSTEM_PROMPT.toLowerCase()).toContain('score');
    });
  });

  describe('buildUserPrompt', () => {
    it('returns a string embedding the provided resume text', () => {
      const sampleText = 'This is a sample resume content for testing purposes.';
      const result = buildUserPrompt(sampleText);
      
      expect(typeof result).toBe('string');
      expect(result).toContain(sampleText);
    });
  });
});
