// Test if pdf-parse is working correctly
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');

console.log('Testing pdf-parse module...');
console.log('pdf-parse module type:', typeof pdfParseModule);
console.log('Has PDFParse?', pdfParseModule.PDFParse ? 'Yes' : 'No');

// Actually, pdf-parse should be callable directly, let me check if it's a function
console.log('Is pdfParseModule callable?', typeof pdfParseModule === 'function');

// Create a minimal PDF buffer for testing
// This is a minimal valid PDF file
const minimalPDF = Buffer.from(`%PDF-1.0
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Resume) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF`, 'utf-8');

async function testPDFParse() {
  try {
    console.log('\n📄 Testing with minimal PDF buffer...');
    console.log('Buffer length:', minimalPDF.length);
    
    const result = await pdfParseModule(minimalPDF);
    
    console.log('✅ PDF parse successful!');
    console.log('Extracted text:', result.text);
    console.log('Number of pages:', result.numpages);
    console.log('Info:', result.info);
    
  } catch (error) {
    console.error('❌ PDF parse failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPDFParse();
