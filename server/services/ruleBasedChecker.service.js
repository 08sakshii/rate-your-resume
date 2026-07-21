/**
 * Rule-based resume checker — pure logic, zero I/O, zero side effects.
 * Same input text always produces the same output object.
 */

function hasGithubLink(text) {
  return /github\.com/i.test(text);
}

function hasLinkedinLink(text) {
  return /linkedin\.com/i.test(text);
}

function hasEmail(text) {
  return /[\w.-]+@[\w.-]+\.\w{2,}/.test(text);
}

function hasPhoneNumber(text) {
  /**
   * Loose heuristic for phone-number-like sequences.
   * ACCEPTED TRADEOFF: intentionally loose — may produce false positives
   * on non-phone numeric sequences (dates, addresses). Deliberate tradeoff
   * for this project's scope rather than pulling in a full phone-parsing
   * library like libphonenumber-js.
   */
  return /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/.test(text);
}

function countBulletMetrics(text) {
  // Only counts lines that look like actual bullet points (start with
  // -, •, *, or a numbered list like "1.") AND contain a digit or %.
  // This avoids false positives from contact-info lines (phone numbers)
  // or headers that happen to contain digits — the goal is specifically
  // to proxy "quantified achievements in bullet points."
  const lines = text.split(/\r?\n|\r/);
  const bulletLinePattern = /^\s*[-•*]|^\s*\d+\./;
  return lines.filter(
    (line) => bulletLinePattern.test(line) && /\d|%/.test(line)
  ).length;
}

function findSections(text) {
  const sections = ['experience', 'education', 'projects', 'skills'];
  return sections.filter((section) => {
    const pattern = new RegExp(`\\b${section}\\b`, 'i');
    return pattern.test(text);
  });
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function runRuleBasedChecks(resumeText) {
  return {
    hasGithubLink: hasGithubLink(resumeText),
    hasLinkedinLink: hasLinkedinLink(resumeText),
    hasEmail: hasEmail(resumeText),
    hasPhoneNumber: hasPhoneNumber(resumeText),
    bulletMetricsCount: countBulletMetrics(resumeText),
    sectionsFound: findSections(resumeText),
    wordCount: countWords(resumeText),
  };
}

module.exports = {
  runRuleBasedChecks,
  hasGithubLink,
  hasLinkedinLink,
  hasEmail,
  hasPhoneNumber,
  countBulletMetrics,
  findSections,
  countWords,
};