// Test script for session-based resume tracking (no authentication required)
import fetch from 'node-fetch';
import crypto from 'crypto';

// Generate a session ID for this test
const SESSION_ID = `session_${crypto.randomUUID()}`;
console.log('🔑 Using Session ID:', SESSION_ID);

async function testSessionTracking() {
  console.log('🧪 Testing Session-Based Resume Tracking...\n');

  // Test 1: Analyze first resume
  console.log('1️⃣ Analyzing first resume');
  try {
    const response1 = await fetch('http://localhost:3001/api/resume/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': SESSION_ID
      },
      body: JSON.stringify({
        resumeText: `John Doe
Software Engineer
Email: john@example.com

EXPERIENCE
Junior Developer at StartupCorp (2021-2023)
- Built web applications using React
- Worked with REST APIs
- Collaborated with team of 3

EDUCATION
BS Computer Science, University (2021)

SKILLS
JavaScript, React, HTML, CSS`,
        targetRole: 'Software Engineer',
        fileName: 'john_resume_v1.pdf'
      })
    });

    const data1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ First resume analyzed');
      console.log('📊 Score:', data1.overallScore);
      console.log('🆔 Analysis ID:', data1.analysisId);
      console.log('🔑 Session ID returned:', data1.sessionId);
    } else {
      console.log('❌ First analysis failed:', data1.message);
      return;
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
    return;
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test 2: Analyze second resume (improved version)
  console.log('2️⃣ Analyzing improved resume');
  try {
    const response2 = await fetch('http://localhost:3001/api/resume/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': SESSION_ID
      },
      body: JSON.stringify({
        resumeText: `John Doe
Senior Software Engineer
Email: john@example.com | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 3+ years developing scalable web applications.
Proven track record of improving application performance by 40% and leading cross-functional teams.

EXPERIENCE
Senior Developer at TechCorp (2023-Present)
- Led development of microservices architecture serving 100K+ users
- Improved application performance by 40% through code optimization
- Mentored 2 junior developers and conducted code reviews

Junior Developer at StartupCorp (2021-2023)
- Built 5+ web applications using React and Node.js
- Implemented REST APIs handling 10K+ daily requests
- Collaborated with cross-functional team of 8 members

EDUCATION
BS Computer Science, University (2021)
GPA: 3.8/4.0

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Git

PROJECTS
E-commerce Platform - Built full-stack application with 99.9% uptime
Task Management App - Developed React app with real-time updates`,
        targetRole: 'Senior Software Engineer',
        fileName: 'john_resume_v2_improved.pdf'
      })
    });

    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ Second resume analyzed');
      console.log('📊 Score:', data2.overallScore);
      console.log('🆔 Analysis ID:', data2.analysisId);
    } else {
      console.log('❌ Second analysis failed:', data2.message);
      return;
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
    return;
  }

  console.log('\n' + '-'.repeat(50) + '\n');

  // Test 3: Get resume history
  console.log('3️⃣ Getting resume history');
  try {
    const response3 = await fetch('http://localhost:3001/api/resume/history', {
      method: 'GET',
      headers: {
        'X-Session-ID': SESSION_ID
      }
    });

    const data3 = await response3.json();
    
    if (response3.ok) {
      console.log('✅ History retrieved successfully');
      console.log('📈 Total analyses:', data3.analyses?.length || 0);
      
      if (data3.analyses && data3.analyses.length > 0) {
        console.log('\n📋 Your resume analyses:');
        data3.analyses.forEach((analysis, index) => {
          console.log(`${index + 1}. ${analysis.fileName}`);
          console.log(`   📊 Score: ${analysis.overallScore}/10`);
          console.log(`   🎯 Role: ${analysis.targetRole}`);
          console.log(`   📅 Date: ${new Date(analysis.analyzedAt).toLocaleDateString()}`);
          console.log('');
        });

        // Test 4: Compare analyses if we have 2+
        if (data3.analyses.length >= 2) {
          console.log('4️⃣ Comparing first and latest resume');
          try {
            const compareResponse = await fetch('http://localhost:3001/api/resume/compare', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': SESSION_ID
              },
              body: JSON.stringify({
                analysisId1: data3.analyses[1].id, // Older
                analysisId2: data3.analyses[0].id  // Newer
              })
            });

            const compareData = await compareResponse.json();
            
            if (compareResponse.ok) {
              console.log('✅ Comparison completed');
              console.log('📈 Score improvement:', compareData.improvements.overallScore);
              console.log('🎯 ATS improvement:', compareData.improvements.atsScore);
              console.log('💡 Recommendations:');
              compareData.recommendations.forEach(rec => {
                console.log(`   - ${rec}`);
              });
            }
          } catch (error) {
            console.log('🚨 Comparison error:', error.message);
          }
        }
      }
    } else {
      console.log('❌ History failed:', data3.message);
    }
  } catch (error) {
    console.log('🚨 Error:', error.message);
  }
}

console.log('📋 Session-Based Resume Tracking Test');
console.log('=====================================');
console.log('This test demonstrates:');
console.log('✅ Resume analysis without authentication');
console.log('✅ Automatic history tracking using session ID');
console.log('✅ Progress comparison between resume versions');
console.log('✅ All features work without user accounts');
console.log('');
console.log('🚀 Starting test...\n');

// Run the test
testSessionTracking();