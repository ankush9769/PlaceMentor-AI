import { getDatabase } from '../lib/mongodb.js';
import { getUserFromRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { config, questions, answers, completedAt } = req.body;

    // Validate input
    if (!config || !questions || !answers) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        retryable: false
      });
    }

    // Calculate scores
    const validAnswers = answers.filter((a) => a.evaluation !== null);
    const averageScores = validAnswers.reduce(
      (acc, answer) => {
        if (answer.evaluation) {
          acc.clarity += answer.evaluation.scores.clarity;
          acc.accuracy += answer.evaluation.scores.accuracy;
          acc.depth += answer.evaluation.scores.depth;
          acc.count += 1;
        }
        return acc;
      },
      { clarity: 0, accuracy: 0, depth: 0, count: 0 }
    );

    const avgClarity = averageScores.count > 0 ? averageScores.clarity / averageScores.count : 0;
    const avgAccuracy = averageScores.count > 0 ? averageScores.accuracy / averageScores.count : 0;
    const avgDepth = averageScores.count > 0 ? averageScores.depth / averageScores.count : 0;
    const overallScore = (avgClarity + avgAccuracy + avgDepth) / 3;

    const db = await getDatabase();
    const interviewsCollection = db.collection('interviews');

    // Save interview
    const result = await interviewsCollection.insertOne({
      userId: user.userId,
      config,
      questions,
      answers,
      scores: {
        clarity: avgClarity,
        accuracy: avgAccuracy,
        depth: avgDepth,
        overall: overallScore
      },
      completedAt: completedAt || new Date(),
      createdAt: new Date()
    });

    return res.status(201).json({
      interviewId: result.insertedId.toString(),
      message: 'Interview saved successfully'
    });

  } catch (error) {
    console.error('Save interview error:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to save interview. Please try again.',
      retryable: true
    });
  }
}
