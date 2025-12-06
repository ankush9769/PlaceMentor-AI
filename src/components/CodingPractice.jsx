import React, { useState } from 'react';
import '../styles/components/CodingPractice.css';

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', version: '3.10' },
  { id: 'javascript', name: 'JavaScript', icon: '📜', version: 'Node.js 18' },
  { id: 'java', name: 'Java', icon: '☕', version: 'JDK 17' },
  { id: 'cpp', name: 'C++', icon: '⚡', version: 'C++17' },
  { id: 'c', name: 'C', icon: '🔧', version: 'C11' },
  { id: 'go', name: 'Go', icon: '🔵', version: '1.20' },
  { id: 'rust', name: 'Rust', icon: '🦀', version: '1.70' },
  { id: 'typescript', name: 'TypeScript', icon: '💙', version: '5.0' },
];

const DEFAULT_CODE = {
  python: `# Write your Python code here
print("Hello, World!")

# Example: Calculate sum of two numbers
def add_numbers(a, b):
    return a + b

result = add_numbers(5, 3)
print(f"Sum: {result}")`,

  javascript: `// Write your JavaScript code here
console.log("Hello, World!");

// Example: Calculate sum of two numbers
function addNumbers(a, b) {
    return a + b;
}

const result = addNumbers(5, 3);
console.log(\`Sum: \${result}\`);`,

  java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Example: Calculate sum of two numbers
        int result = addNumbers(5, 3);
        System.out.println("Sum: " + result);
    }
    
    public static int addNumbers(int a, int b) {
        return a + b;
    }
}`,

  cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

// Example: Calculate sum of two numbers
int addNumbers(int a, int b) {
    return a + b;
}

int main() {
    cout << "Hello, World!" << endl;
    
    int result = addNumbers(5, 3);
    cout << "Sum: " << result << endl;
    
    return 0;
}`,

  c: `// Write your C code here
#include <stdio.h>

// Example: Calculate sum of two numbers
int addNumbers(int a, int b) {
    return a + b;
}

int main() {
    printf("Hello, World!\\n");
    
    int result = addNumbers(5, 3);
    printf("Sum: %d\\n", result);
    
    return 0;
}`,

  go: `// Write your Go code here
package main

import "fmt"

// Example: Calculate sum of two numbers
func addNumbers(a, b int) int {
    return a + b
}

func main() {
    fmt.Println("Hello, World!")
    
    result := addNumbers(5, 3)
    fmt.Printf("Sum: %d\\n", result)
}`,

  rust: `// Write your Rust code here
fn main() {
    println!("Hello, World!");
    
    // Example: Calculate sum of two numbers
    let result = add_numbers(5, 3);
    println!("Sum: {}", result);
}

fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}`,

  typescript: `// Write your TypeScript code here
console.log("Hello, World!");

// Example: Calculate sum of two numbers
function addNumbers(a: number, b: number): number {
    return a + b;
}

const result: number = addNumbers(5, 3);
console.log(\`Sum: \${result}\`);`,
};

const CodingPractice = ({ onBack }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setCode(DEFAULT_CODE[language.id] || '');
    setOutput('');
    setError('');
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setError('Please write some code first!');
      return;
    }

    setIsRunning(true);
    setError('');
    setOutput('Running code...');

    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage.id,
          code: code,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned invalid response. Please make sure the backend server is running.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute code');
      }

      // Check if there's an error in the response
      if (data.error) {
        setError(data.error);
        setOutput(data.output || '');
      } else {
        setOutput(data.output || 'Code executed successfully with no output.');
      }
    } catch (err) {
      console.error('Code execution error:', err);
      setError(err.message || 'An unexpected error occurred');
      setOutput('');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearCode = () => {
    setCode(DEFAULT_CODE[selectedLanguage.id] || '');
    setOutput('');
    setError('');
  };

  const handleClearOutput = () => {
    setOutput('');
    setError('');
  };

  // Language selection screen
  if (!selectedLanguage) {
    return (
      <div className="coding-practice-container">
        <button onClick={onBack} className="back-button nav-back-button">
          ← Back to Dashboard
        </button>
        <div className="coding-practice-header">
          <h1 className="coding-title">💻 Coding Practice</h1>
          <p className="coding-subtitle">Select a programming language to start coding</p>
        </div>

        <div className="language-grid">
          {LANGUAGES.map((language) => (
            <div
              key={language.id}
              className="language-card"
              onClick={() => handleLanguageSelect(language)}
            >
              <div className="language-icon">{language.icon}</div>
              <h3 className="language-name">{language.name}</h3>
              <p className="language-version">{language.version}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Code editor screen
  return (
    <div className="coding-practice-container">
      <button onClick={onBack} className="back-button nav-back-button">
        ← Back to Dashboard
      </button>
      <div className="coding-practice-header">
        <div className="header-buttons">
          <button onClick={() => setSelectedLanguage(null)} className="back-button change-lang-btn">
            🔄 Change Language
          </button>
        </div>
        <div className="header-info">
          <h1 className="coding-title">
            {selectedLanguage.icon} {selectedLanguage.name}
          </h1>
          <span className="language-badge">{selectedLanguage.version}</span>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>📝 Code Editor</h3>
            <button onClick={handleClearCode} className="clear-btn" title="Reset to default">
              🔄 Reset
            </button>
          </div>
          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Write your ${selectedLanguage.name} code here...`}
            spellCheck="false"
          />
          <div className="editor-actions">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="run-button"
            >
              {isRunning ? (
                <>
                  <span className="loading-spinner"></span>
                  Running...
                </>
              ) : (
                <>
                  ▶️ Run Code
                </>
              )}
            </button>
          </div>
        </div>

        <div className="output-panel">
          <div className="panel-header">
            <h3>📤 Output</h3>
            <button onClick={handleClearOutput} className="clear-btn" title="Clear output">
              🗑️ Clear
            </button>
          </div>
          <div className="output-content">
            {error && (
              <div className="output-error">
                <div className="error-icon">❌</div>
                <div className="error-text">
                  <strong>Error:</strong>
                  <pre>{error}</pre>
                </div>
              </div>
            )}
            {!error && output && (
              <pre className="output-text">{output}</pre>
            )}
            {!error && !output && (
              <div className="output-placeholder">
                <div className="placeholder-icon">💡</div>
                <p>Click "Run Code" to see the output here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;
