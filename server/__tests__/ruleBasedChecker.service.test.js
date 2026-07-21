const {
  runRuleBasedChecks,
  hasGithubLink,
  hasLinkedinLink,
  hasEmail,
  hasPhoneNumber,
  countBulletMetrics,
  findSections,
  countWords,
} = require('../services/ruleBasedChecker.service');

describe('hasGithubLink', () => {
  test('returns true for github.com URL on its own line', () => {
    expect(hasGithubLink('https://github.com/johndoe')).toBe(true);
  });

  test('returns true for github.com URL embedded mid-sentence', () => {
    expect(hasGithubLink('Check out my work at https://github.com/johndoe and more.')).toBe(true);
  });

  test('returns true for uppercase GITHUB.COM', () => {
    expect(hasGithubLink('GITHUB.COM/JOHNDOE')).toBe(true);
  });

  test('returns false when no github.com present', () => {
    expect(hasGithubLink('My portfolio is at example.com')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasGithubLink('')).toBe(false);
  });
});

describe('hasLinkedinLink', () => {
  test('returns true for linkedin.com URL', () => {
    expect(hasLinkedinLink('https://linkedin.com/in/johndoe')).toBe(true);
  });

  test('returns true for linkedin.com embedded mid-sentence', () => {
    expect(hasLinkedinLink('Connect with me on linkedin.com/in/johndoe today.')).toBe(true);
  });

  test('returns true for mixed case LinkedIn.Com', () => {
    expect(hasLinkedinLink('LinkedIn.Com/in/johndoe')).toBe(true);
  });

  test('returns false when no linkedin.com present', () => {
    expect(hasLinkedinLink('Find me on twitter.com/johndoe')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasLinkedinLink('')).toBe(false);
  });
});

describe('hasEmail', () => {
  test('returns true for standard email', () => {
    expect(hasEmail('john.doe@example.com')).toBe(true);
  });

  test('returns true for email with hyphen in domain', () => {
    expect(hasEmail('jane@my-domain.co.uk')).toBe(true);
  });

  test('returns true for email embedded in text', () => {
    expect(hasEmail('Contact me at john.doe@example.com for details.')).toBe(true);
  });

  test('returns false for missing TLD', () => {
    expect(hasEmail('john@example')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasEmail('')).toBe(false);
  });

  test('returns false for plain text without @', () => {
    expect(hasEmail('john.doe.example.com')).toBe(false);
  });
});

describe('hasPhoneNumber', () => {
  test('returns true for US format with dashes', () => {
    expect(hasPhoneNumber('555-123-4567')).toBe(true);
  });

  test('returns true for US format with dots', () => {
    expect(hasPhoneNumber('555.123.4567')).toBe(true);
  });

  test('returns true for US format with spaces', () => {
    expect(hasPhoneNumber('555 123 4567')).toBe(true);
  });

  test('returns true for format with parentheses around area code', () => {
    expect(hasPhoneNumber('(555) 123-4567')).toBe(true);
  });

  test('returns true for format with country code', () => {
    expect(hasPhoneNumber('+1 (555) 123-4567')).toBe(true);
  });

  test('returns true for Indian format with country code', () => {
    expect(hasPhoneNumber('+91-98765-43210')).toBe(true);
  });

  test('returns true for phone number embedded in sentence', () => {
    expect(hasPhoneNumber('Reach me at +1 555 123 4567 anytime.')).toBe(true);
  });

  test('returns true for date-like sequence (known false positive — accepted tradeoff)', () => {
    expect(hasPhoneNumber('2024-01-15')).toBe(true);
  });

  test('returns false for text with no numeric sequences', () => {
    expect(hasPhoneNumber('No phone number here')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasPhoneNumber('')).toBe(false);
  });

  test('returns false for single digit', () => {
    expect(hasPhoneNumber('7')).toBe(false);
  });
});

describe('countBulletMetrics', () => {
  test('counts bullet lines with digits', () => {
    const text = '- Increased revenue by 25%\n- Managed team of 5\n- Good communicator';
    expect(countBulletMetrics(text)).toBe(2);
  });

  test('counts bullet lines with percentage sign only', () => {
    const text = '- Reduced costs by %\n- Improved efficiency';
    expect(countBulletMetrics(text)).toBe(1);
  });

  test('returns 0 when no digits or percentages in bullets', () => {
    expect(countBulletMetrics('- Good communicator\n- Team player')).toBe(0);
  });

  test('ignores non-bullet lines even if they contain digits', () => {
    const text = 'Phone: 555-123-4567\n- Grew revenue by 20%';
    expect(countBulletMetrics(text)).toBe(1);
  });

  test('handles empty string', () => {
    expect(countBulletMetrics('')).toBe(0);
  });

  test('handles Windows-style line endings', () => {
    const text = '- Grew user base by 150%\r\n- Led team of 3\r\n- Creative thinker';
    expect(countBulletMetrics(text)).toBe(2);
  });

  test('handles old Mac-style line endings', () => {
    const text = '- Grew by 10%\r- Saved $1M\r- Problem solver';
    expect(countBulletMetrics(text)).toBe(2);
  });
});

describe('findSections', () => {
  test('finds all four sections when present', () => {
    const text = 'Experience\nEducation\nProjects\nSkills';
    expect(findSections(text)).toEqual(['experience', 'education', 'projects', 'skills']);
  });

  test('finds sections case-insensitively', () => {
    const text = 'EXPERIENCE\neducation\nPrOjEcTs\nSKILLS';
    expect(findSections(text)).toEqual(['experience', 'education', 'projects', 'skills']);
  });

  test('does not match partial words (e.g., "experiences")', () => {
    const text = 'My experiences include...';
    expect(findSections(text)).toEqual([]);
  });

  test('does not match "skillset" as "skills"', () => {
    const text = 'My skillset includes Python';
    expect(findSections(text)).toEqual([]);
  });

  test('returns empty array for empty string', () => {
    expect(findSections('')).toEqual([]);
  });

  test('finds only present sections', () => {
    const text = 'Some intro\n\nExperience\nWork details\n\nEducation\nSchool details';
    expect(findSections(text)).toEqual(['experience', 'education']);
  });
});

describe('countWords', () => {
  test('counts words in normal text', () => {
    expect(countWords('The quick brown fox')).toBe(4);
  });

  test('handles extra whitespace', () => {
    expect(countWords('  The   quick   brown  fox  ')).toBe(4);
  });

  test('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  test('returns 0 for whitespace-only string', () => {
    expect(countWords('   \t\n  ')).toBe(0);
  });

  test('counts single word', () => {
    expect(countWords('Hello')).toBe(1);
  });
});

describe('runRuleBasedChecks — full composition', () => {
  const sampleResume = `
John Doe
john.doe@example.com
+1 (555) 123-4567
https://github.com/johndoe
https://linkedin.com/in/johndoe

Experience
Software Engineer at TechCorp
- Increased revenue by 25%
- Managed team of 5 engineers
- Reduced latency by 40%

Education
B.S. Computer Science, State University

Projects
- Built a real-time chat app using Node.js
- Open-source contributor to 3 libraries

Skills
JavaScript, Python, React, Node.js
`;

  test('returns correct structured output for realistic resume text', () => {
    const result = runRuleBasedChecks(sampleResume);

    expect(result.hasGithubLink).toBe(true);
    expect(result.hasLinkedinLink).toBe(true);
    expect(result.hasEmail).toBe(true);
    expect(result.hasPhoneNumber).toBe(true);
    expect(result.sectionsFound).toEqual(['experience', 'education', 'projects', 'skills']);
    expect(result.wordCount).toBeGreaterThan(0);
  });

  test('bulletMetricsCount counts quantified bullet lines', () => {
    const result = runRuleBasedChecks(sampleResume);
    // 4 bullet lines contain digits/%: "25%", "team of 5", "40%", "3 libraries"
    // (the phone number line is correctly excluded — it's not a bullet)
    expect(result.bulletMetricsCount).toBe(4);
  });

  test('wordCount is accurate for sample resume', () => {
    const result = runRuleBasedChecks(sampleResume);
    expect(result.wordCount).toBeGreaterThan(30);
    expect(result.wordCount).toBeLessThan(60);
  });

  test('returns all false and empty for empty string', () => {
    const result = runRuleBasedChecks('');
    expect(result).toEqual({
      hasGithubLink: false,
      hasLinkedinLink: false,
      hasEmail: false,
      hasPhoneNumber: false,
      bulletMetricsCount: 0,
      sectionsFound: [],
      wordCount: 0,
    });
  });

  test('returns all false and empty for generic non-resume text', () => {
    const result = runRuleBasedChecks('Hello world this is just plain text.');
    expect(result).toEqual({
      hasGithubLink: false,
      hasLinkedinLink: false,
      hasEmail: false,
      hasPhoneNumber: false,
      bulletMetricsCount: 0,
      sectionsFound: [],
      wordCount: 7,
    });
  });
});