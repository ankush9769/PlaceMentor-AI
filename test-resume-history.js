// Test script for resume analysis history functionality
import fetch from 'node-fetch';

// Mock user token (you'll need to get a real token from signup/signin)
const TEST_TOKEN = 'your-jwt-token-here';

async function testResumeHistory() {
  console.log('🧪 Testing Resume Analysis History...\n');

  // Test 1: Analyze a resume (this will save to history)
  console.log('1️⃣ Testing resume analysis (saves to history)');
  try {
    const response = await fetch('http://localhost:3001/api/resume/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        resumeText: `John Doe
Software Engineer
Email: john@example.com

EXPERIENCE
Senior Developer at Tech Corp (2020-2023)
- Built web applications using React and Node.js
- Led team of 5 developers
- Improved performance by 40%

EDUCATION
BS Computer Science, University (2018)

SKILLS
JavaScript, React, Node.js, Python`,
        targetRole: 'Senior Software Engineer',
        fileName: 'john_doe_resume.pdf'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Resume analyzed successfully');
      console.log('📊 Overall Score:', data.overallScore);
      console.log('🔍 Analysis ID:', data.analysisId);
      console.log('💪 Strengths:', data.strengths?.length || 0);
      console.log('⚠️ Weaknesses:', data.weaknesses?.length || 0);
    } else {
      console.log('❌ Analysis failed:', data.message);
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test 2: Get resume analysis history
  console.log('2️⃣ Testing resume analysis history');
  try {
    const response = await fetch('http://localhost:3001/api/resume/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ History retrieved successfully');
      console.log('📈 Total analyses:', data.analyses?.length || 0);
      
      if (data.analyses && data.analyses.length > 0) {
        console.log('\n📋 Recent analyses:');
        data.analyses.slice(0, 3).forEach((analysis, index) => {
          console.log(`${index + 1}. ${analysis.fileName}`);
          console.log(`   📊 Score: ${analysis.overallScore}/10`);
          console.log(`   🎯 Role: ${analysis.targetRole}`);
          console.log(`   📅 Date: ${new Date(analysis.analyzedAt).toLocaleDateString()}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ History failed:', data.message);
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test 3: Get specific analysis details
  console.log('3️⃣ Testing specific analysis details');
  console.log('ℹ️ This test requires a valid analysis ID from step 1');
}

// Instructions for running the test
console.log('📋 Resume History Test Instructions:');
console.log('1. Start the server: node server/index.js');
console.log('2. Sign up/sign in to get a JWT token');
console.log('3. Replace TEST_TOKEN with your actual token');
console.log('4. Run this test: node test-resume-history.js');
console.log('');

// Uncomment the line below after setting up the token
// testResumeHistory();