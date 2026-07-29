const { z } = require('zod');

const geminiAnalysisSchema = z.object({
  summary: z.string(),
  score: z.number().min(0).max(100),
});

module.exports = {
  geminiAnalysisSchema,
};
