import { getDatabase } from '../lib/mongodb.js';
import { getUserFromRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      retryable: false 
    });
  }

  try {
    // Verify authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false
      });
    }

    const db = await getDatabase();
    const interviewsCollection = db.collection('interviews');

    // Get user's interviews
    const interviews = await interviewsCollection
      .find({ userId: user.userId })
      .sort({ completedAt: -1 })
      .limit(50)
      .toArray();

    // Format response
    const formattedInterviews = interviews.map(interview => ({
      id: interview._id.toString(),
      techStack: interview.config.techStack,
      level: interview.config.level,
      scores: interview.scores,
      questionsCount: interview.questions.length,
      answeredCount: interview.answers.filter((a) => a.evaluation).length,
      completedAt: interview.completedAt,
      createdAt: interview.createdAt
    }));

    return res.status(200).json({
      interviews: formattedInterviews
    });

  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to load interview history. Please try again.',
      retryable: true
    });
  }
}
