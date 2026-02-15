# Resume Upload Troubleshooting Guide

## Issue: "PARSE_ERROR" when uploading PDF resume

### Possible Causes:

1. **PDF-Parse Module Issue**: The `pdf-parse` library may not be properly installed or configured
2. **Corrupted PDF**: The PDF file might be corrupted or in an unsupported format
3. **Password-Protected PDF**: The PDF might be password-protected
4. **Image-Based PDF**: The PDF contains only images (scanned document) with no extractable text
5. **Complex PDF Format**: The PDF uses features not supported by pdf-parse

### Solutions:

#### Quick Fixes:

1. **Try a Different File Format**:
   - Convert your PDF to .docx (Word) format
   - The app supports `.pdf`, `.doc`, and `.docx` formats

2. **Re-save Your PDF**:
   - Open the PDF in Adobe Acrobat or any PDF viewer
   - Print to PDF to create a fresh, clean version
   - Try uploading the new PDF

3. **Check PDF Content**:
   - Open the PDF and try to select/copy text
   - If you can't select text, it's an image-based PDF
   - Use OCR software to convert it to a text-based PDF

4. **Use a Simpler PDF**:
   - Create a new resume using Google Docs or Microsoft Word
   - Export as PDF using built-in export features
   - These tend to create cleaner, more compatible PDFs

#### Developer Fixes:

1. **Reinstall Dependencies**:
   ```bash
   npm install pdf-parse --save
   ```

2. **Check Module Installation**:
   ```bash
   npm list pdf-parse
   ```

3. **Restart the Server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run server
   ```

4. **Enable Development Mode** to see detailed errors:
   - Set `NODE_ENV=development` in your .env file
   - Restart the server
   - Check browser console and server logs for detailed error messages

5. **Test with a Known-Good PDF**:
   - Create a simple text document
   - Save as PDF
   - Try uploading to isolate the issue

### Error Messages Explained:

- **PARSE_ERROR**: General PDF parsing failure - try solutions 1-3 above
- **EMPTY_PDF**: PDF has no extractable text - use OCR or recreate the document
- **VALIDATION_ERROR**: File format not supported or missing file
- **File size must be less than 5MB**: Compress your PDF or remove unnecessary images

### Still Having Issues?

1. Check the server console logs for detailed error messages
2. Try using a .docx file instead of PDF
3. Verify the `pdf-parse` package is installed: `npm list pdf-parse`
4. Check if there are any dependency conflicts: `npm ls`

### Backend Logs to Check:

When you upload a file, the server logs should show:
```
📥 Resume analyze endpoint called
📋 File: [your-filename.pdf]
🔍 Attempting to parse PDF, buffer length: [size]
✅ PDF parsed successfully, text length: [length]
```

If you see an error instead, note the exact error message and stack trace.
