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
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    // Use Piston API for code execution
    // Piston is a free, open-source code execution engine
    const pistonResponse = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: mapLanguageToPiston(language),
        version: '*', // Use latest version
        files: [
          {
            name: getFileName(language),
            content: code,
          },
        ],
      }),
    });

    if (!pistonResponse.ok) {
      throw new Error('Failed to execute code');
    }

    const result = await pistonResponse.json();

    // Combine stdout and stderr
    let output = '';
    if (result.run) {
      if (result.run.stdout) {
        output += result.run.stdout;
      }
      if (result.run.stderr) {
        if (output) output += '\n';
        output += result.run.stderr;
      }
      if (result.compile && result.compile.stderr) {
        if (output) output += '\n';
        output += 'Compilation Error:\n' + result.compile.stderr;
      }
    }

    // Check if there was an error
    if (result.run && result.run.code !== 0) {
      return res.status(200).json({
        output: output || 'Program exited with error',
        error: result.run.stderr || 'Execution failed',
      });
    }

    return res.status(200).json({
      output: output || 'Code executed successfully with no output.',
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to execute code',
    });
  }
}

// Map our language IDs to Piston language IDs
function mapLanguageToPiston(language) {
  const languageMap = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'c++',
    c: 'c',
    go: 'go',
    rust: 'rust',
    typescript: 'typescript',
  };
  return languageMap[language] || language;
}

// Get appropriate file name for each language
function getFileName(language) {
  const fileNameMap = {
    python: 'main.py',
    javascript: 'main.js',
    java: 'Main.java',
    cpp: 'main.cpp',
    c: 'main.c',
    go: 'main.go',
    rust: 'main.rs',
    typescript: 'main.ts',
  };
  return fileNameMap[language] || 'main.txt';
}
