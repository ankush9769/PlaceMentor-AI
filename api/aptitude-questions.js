export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topicId, topicName } = req.body;

    if (!topicId || !topicName) {
      return res.status(400).json({ error: 'Topic ID and name are required' });
    }

    // Generate 20 questions for the topic
    const questions = generateQuestions(topicId, topicName);

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Generate aptitude questions error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate questions',
    });
  }
}

function generateQuestions(topicId, topicName) {
  const questionSets = {
    'time-speed-distance': [
      {
        id: 1,
        question: 'A car travels 60 km in 1 hour. What is its speed in m/s?',
        options: ['16.67 m/s', '20 m/s', '25 m/s', '30 m/s'],
        correctAnswer: 0,
        difficulty: 'Easy',
        explanation: 'Speed = 60 km/hr = 60 × (5/18) = 16.67 m/s'
      },
      {
        id: 2,
        question: 'A train 150m long passes a pole in 15 seconds. What is the speed of the train?',
        options: ['10 m/s', '12 m/s', '15 m/s', '18 m/s'],
        correctAnswer: 0,
        difficulty: 'Easy',
        explanation: 'Speed = Distance/Time = 150/15 = 10 m/s'
      },
      {
        id: 3,
        question: 'If a person walks at 5 km/hr, how much time will he take to cover 15 km?',
        options: ['2 hours', '3 hours', '4 hours', '5 hours'],
        correctAnswer: 1,
        difficulty: 'Easy',
        explanation: 'Time = Distance/Speed = 15/5 = 3 hours'
      },
      {
        id: 4,
        question: 'A car covers a distance of 240 km in 4 hours. What is its average speed?',
        options: ['50 km/hr', '60 km/hr', '70 km/hr', '80 km/hr'],
        correctAnswer: 1,
        difficulty: 'Easy',
        explanation: 'Speed = 240/4 = 60 km/hr'
      },
      {
        id: 5,
        question: 'Two trains are moving in opposite directions at 60 km/hr and 90 km/hr. What is their relative speed?',
        options: ['30 km/hr', '75 km/hr', '150 km/hr', '180 km/hr'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'Relative speed = 60 + 90 = 150 km/hr (opposite directions)'
      },
      {
        id: 6,
        question: 'A man walks at 4 km/hr and runs at 8 km/hr. If he walks for 2 hours and runs for 1 hour, what is the total distance covered?',
        options: ['12 km', '14 km', '16 km', '18 km'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'Distance = (4×2) + (8×1) = 8 + 8 = 16 km'
      },
      {
        id: 7,
        question: 'A train 200m long crosses a platform 300m long in 25 seconds. What is the speed of the train?',
        options: ['15 m/s', '18 m/s', '20 m/s', '25 m/s'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'Total distance = 200 + 300 = 500m, Speed = 500/25 = 20 m/s'
      },
      {
        id: 8,
        question: 'A cyclist covers 20 km in 2 hours going uphill and returns in 1 hour. What is the average speed?',
        options: ['10 km/hr', '13.33 km/hr', '15 km/hr', '20 km/hr'],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: 'Total distance = 40 km, Total time = 3 hours, Average speed = 40/3 = 13.33 km/hr'
      },
      {
        id: 9,
        question: 'Two cars start from the same point at the same time in opposite directions. If their speeds are 40 km/hr and 50 km/hr, after how many hours will they be 270 km apart?',
        options: ['2 hours', '3 hours', '4 hours', '5 hours'],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: 'Relative speed = 90 km/hr, Time = 270/90 = 3 hours'
      },
      {
        id: 10,
        question: 'A person covers half the distance at 40 km/hr and the remaining half at 60 km/hr. What is the average speed?',
        options: ['48 km/hr', '50 km/hr', '52 km/hr', '55 km/hr'],
        correctAnswer: 0,
        difficulty: 'Hard',
        explanation: 'Average speed = 2xy/(x+y) = 2×40×60/(40+60) = 48 km/hr'
      },
      {
        id: 11,
        question: 'A train passes two bridges of lengths 800m and 400m in 100 seconds and 60 seconds respectively. What is the length of the train?',
        options: ['100m', '200m', '300m', '400m'],
        correctAnswer: 1,
        difficulty: 'Hard',
        explanation: 'Let train length = L. (L+800)/100 = (L+400)/60, solving gives L = 200m'
      },
      {
        id: 12,
        question: 'A boat travels 30 km upstream in 6 hours and 44 km downstream in 4 hours. What is the speed of the boat in still water?',
        options: ['8 km/hr', '9 km/hr', '10 km/hr', '11 km/hr'],
        correctAnswer: 0,
        difficulty: 'Hard',
        explanation: 'Upstream speed = 5 km/hr, Downstream speed = 11 km/hr, Boat speed = (5+11)/2 = 8 km/hr'
      },
      {
        id: 13,
        question: 'A man can row 40 km downstream in 4 hours and 16 km upstream in 4 hours. What is the speed of the stream?',
        options: ['2 km/hr', '3 km/hr', '4 km/hr', '5 km/hr'],
        correctAnswer: 1,
        difficulty: 'Hard',
        explanation: 'Downstream = 10 km/hr, Upstream = 4 km/hr, Stream speed = (10-4)/2 = 3 km/hr'
      },
      {
        id: 14,
        question: 'Two trains of equal length take 10 seconds and 15 seconds respectively to cross a pole. If they are running in the same direction, in how many seconds will the faster train cross the slower train?',
        options: ['25 seconds', '30 seconds', '35 seconds', '40 seconds'],
        correctAnswer: 1,
        difficulty: 'Hard',
        explanation: 'Let length = L. Speed1 = L/10, Speed2 = L/15. Relative speed = L/30. Time = 2L/(L/30) = 60 seconds'
      },
      {
        id: 15,
        question: 'A person travels from A to B at 40 km/hr and returns at 60 km/hr. If the total time taken is 5 hours, what is the distance between A and B?',
        options: ['100 km', '120 km', '140 km', '160 km'],
        correctAnswer: 1,
        difficulty: 'Hard',
        explanation: 'Let distance = D. D/40 + D/60 = 5, solving gives D = 120 km'
      },
      {
        id: 16,
        question: 'A train 300m long crosses a man walking at 5 km/hr in the opposite direction in 10 seconds. What is the speed of the train?',
        options: ['100 km/hr', '103 km/hr', '105 km/hr', '108 km/hr'],
        correctAnswer: 1,
        difficulty: 'Hard',
        explanation: 'Relative speed = 300/10 = 30 m/s = 108 km/hr. Train speed = 108 - 5 = 103 km/hr'
      },
      {
        id: 17,
        question: 'A car travels from A to B at 60 km/hr and returns at 40 km/hr. What is the average speed for the entire journey?',
        options: ['48 km/hr', '50 km/hr', '52 km/hr', '55 km/hr'],
        correctAnswer: 0,
        difficulty: 'Medium',
        explanation: 'Average speed = 2×60×40/(60+40) = 48 km/hr'
      },
      {
        id: 18,
        question: 'A person walks at 3/4 of his usual speed and reaches his destination 20 minutes late. What is his usual time?',
        options: ['40 minutes', '50 minutes', '60 minutes', '70 minutes'],
        correctAnswer: 2,
        difficulty: 'Hard',
        explanation: 'If usual time = T, then (4/3)T - T = 20, solving gives T = 60 minutes'
      },
      {
        id: 19,
        question: 'Two trains start from stations A and B towards each other at speeds of 50 km/hr and 60 km/hr. If the distance between A and B is 550 km, after how many hours will they meet?',
        options: ['4 hours', '5 hours', '6 hours', '7 hours'],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: 'Relative speed = 110 km/hr, Time = 550/110 = 5 hours'
      },
      {
        id: 20,
        question: 'A train running at 72 km/hr crosses a platform in 30 seconds and a man standing on the platform in 18 seconds. What is the length of the platform?',
        options: ['200m', '240m', '280m', '300m'],
        correctAnswer: 1,
        difficulty: 'Hard',
        explanation: 'Train speed = 20 m/s. Train length = 20×18 = 360m. Platform length = (20×30) - 360 = 240m'
      }
    ],
    'percentage': [
      {
        id: 1,
        question: 'What is 25% of 200?',
        options: ['25', '40', '50', '75'],
        correctAnswer: 2,
        difficulty: 'Easy',
        explanation: '25% of 200 = (25/100) × 200 = 50'
      },
      {
        id: 2,
        question: 'If 30% of a number is 60, what is the number?',
        options: ['150', '180', '200', '220'],
        correctAnswer: 2,
        difficulty: 'Easy',
        explanation: 'Let number = x. 30% of x = 60, x = 60 × (100/30) = 200'
      },
      {
        id: 3,
        question: 'A number increased by 20% becomes 240. What is the original number?',
        options: ['180', '200', '220', '240'],
        correctAnswer: 1,
        difficulty: 'Easy',
        explanation: 'Let number = x. x + 20% of x = 240, 1.2x = 240, x = 200'
      },
      {
        id: 4,
        question: 'What percentage of 80 is 20?',
        options: ['20%', '25%', '30%', '35%'],
        correctAnswer: 1,
        difficulty: 'Easy',
        explanation: 'Percentage = (20/80) × 100 = 25%'
      },
      {
        id: 5,
        question: 'If the price of a product increases from 500 to 600, what is the percentage increase?',
        options: ['15%', '18%', '20%', '25%'],
        correctAnswer: 2,
        difficulty: 'Easy',
        explanation: 'Increase = 100, Percentage = (100/500) × 100 = 20%'
      },
      {
        id: 6,
        question: 'A number is first increased by 10% and then decreased by 10%. What is the net change?',
        options: ['No change', '1% decrease', '1% increase', '2% decrease'],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: 'Net change = -10 + 10 - (10×10)/100 = -1% (decrease)'
      },
      {
        id: 7,
        question: 'If 40% of a number is 80 more than 20% of the same number, what is the number?',
        options: ['300', '350', '400', '450'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: '40% of x - 20% of x = 80, 20% of x = 80, x = 400'
      },
      {
        id: 8,
        question: 'A student scored 360 marks out of 500. What is the percentage?',
        options: ['68%', '70%', '72%', '75%'],
        correctAnswer: 2,
        difficulty: 'Easy',
        explanation: 'Percentage = (360/500) × 100 = 72%'
      },
      {
        id: 9,
        question: 'If the population of a town increases by 10% annually, what will be the population after 2 years if the current population is 10,000?',
        options: ['11,000', '12,000', '12,100', '12,200'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'After 2 years = 10000 × 1.1 × 1.1 = 12,100'
      },
      {
        id: 10,
        question: 'A shopkeeper marks his goods 40% above cost price and gives a discount of 20%. What is his profit percentage?',
        options: ['10%', '12%', '15%', '20%'],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: 'Let CP = 100. MP = 140. SP = 140 × 0.8 = 112. Profit = 12%'
      },
      {
        id: 11,
        question: 'If A is 25% more than B, then B is what percent less than A?',
        options: ['20%', '25%', '30%', '33.33%'],
        correctAnswer: 0,
        difficulty: 'Medium',
        explanation: 'If A = 125, B = 100. Difference = 25. Percentage = (25/125) × 100 = 20%'
      },
      {
        id: 12,
        question: 'A number is decreased by 20% and then increased by 20%. What is the net change?',
        options: ['No change', '2% decrease', '4% decrease', '4% increase'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'Net change = -20 + 20 - (20×20)/100 = -4% (decrease)'
      },
      {
        id: 13,
        question: 'If 60% of students passed in English and 70% passed in Math, and 50% passed in both, what percentage failed in both?',
        options: ['10%', '15%', '20%', '25%'],
        correctAnswer: 2,
        difficulty: 'Hard',
        explanation: 'Passed in at least one = 60 + 70 - 50 = 80%. Failed in both = 20%'
      },
      {
        id: 14,
        question: 'A man spends 60% of his income. If his income increases by 20% and expenditure increases by 10%, what is the percentage increase in savings?',
        options: ['30%', '35%', '40%', '45%'],
        correctAnswer: 2,
        difficulty: 'Hard',
        explanation: 'Let income = 100, savings = 40. New income = 120, new expenditure = 66, new savings = 54. Increase = 35%'
      },
      {
        id: 15,
        question: 'If the price of sugar increases by 25%, by what percentage should consumption be reduced to keep expenditure constant?',
        options: ['20%', '25%', '30%', '33.33%'],
        correctAnswer: 0,
        difficulty: 'Hard',
        explanation: 'Reduction = (25/(100+25)) × 100 = 20%'
      },
      {
        id: 16,
        question: 'A number is first increased by 50% and then decreased by 50%. What is the final value if the original number was 100?',
        options: ['50', '75', '100', '125'],
        correctAnswer: 1,
        difficulty: 'Medium',
        explanation: '100 × 1.5 × 0.5 = 75'
      },
      {
        id: 17,
        question: 'If A\'s salary is 20% less than B\'s salary, then B\'s salary is what percent more than A\'s?',
        options: ['20%', '22%', '25%', '28%'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'If B = 100, A = 80. Difference = 20. Percentage = (20/80) × 100 = 25%'
      },
      {
        id: 18,
        question: 'In an election, a candidate got 55% of votes and won by 1000 votes. What was the total number of votes?',
        options: ['8000', '9000', '10000', '11000'],
        correctAnswer: 2,
        difficulty: 'Medium',
        explanation: 'Difference = 10%. 10% = 1000, Total = 10000'
      },
      {
        id: 19,
        question: 'A number is increased by 10%, then decreased by 10%, then increased by 10%. What is the net percentage change?',
        options: ['0.9% decrease', '0.9% increase', '1% decrease', '1.1% decrease'],
        correctAnswer: 0,
        difficulty: 'Hard',
        explanation: 'Final = 100 × 1.1 × 0.9 × 1.1 = 108.9. Net change = -1.1%'
      },
      {
        id: 20,
        question: 'If 75% of a number is added to 75, the result is the number itself. What is the number?',
        options: ['200', '250', '300', '350'],
        correctAnswer: 2,
        difficulty: 'Hard',
        explanation: '0.75x + 75 = x, 0.25x = 75, x = 300'
      }
    ],
    // Add more question sets for other topics...
    'default': Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      question: `${topicName} - Question ${i + 1}: This is a sample question for ${topicName}. What is the correct answer?`,
      options: [
        'Option A - First possible answer',
        'Option B - Second possible answer',
        'Option C - Third possible answer',
        'Option D - Fourth possible answer'
      ],
      correctAnswer: Math.floor(Math.random() * 4),
      difficulty: i < 7 ? 'Easy' : i < 14 ? 'Medium' : 'Hard',
      explanation: `This is a sample explanation for question ${i + 1}. In a real implementation, this would contain the detailed solution.`
    }))
  };

  return questionSets[topicId] || questionSets['default'];
}
