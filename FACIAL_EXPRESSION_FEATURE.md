# Facial Expression Tracking Feature

## Overview
The facial expression tracking feature provides real-time emotion detection during mock interviews. It analyzes the candidate's facial expressions throughout the interview and provides a comprehensive emotion analysis report at the end.

## Implementation Details

### Components Added

#### 1. FacialExpressionTracker Component
**Location:** `src/components/FacialExpressionTracker.jsx`

**Features:**
- Real-time video capture from webcam
- Facial expression detection using face-api.js
- Detects 7 emotions: happy, sad, angry, surprised, fearful, disgusted, neutral
- Runs detection every 2 seconds during the interview
- Visual feedback with emoji icons and confidence scores
- Canvas overlay showing detection visualization

**Props:**
- `isActive` (boolean): Controls whether tracking is active
- `onEmotionDetected` (function): Callback function that receives emotion data

**Emotion Data Structure:**
```javascript
{
  emotion: 'happy',           // Dominant emotion
  confidence: 0.95,           // Confidence score (0-1)
  timestamp: '2024-01-15T...', // ISO timestamp
  allExpressions: {           // All detected emotions with scores
    happy: 0.95,
    neutral: 0.03,
    sad: 0.01,
    // ...
  }
}
```

### Integration Points

#### 2. InterviewInterface Component
**Updates:**
- Added emotion data state management
- Integrated FacialExpressionTracker component
- Stores emotion snapshots with each answer
- Passes emotion data to completion callback

**New State Variables:**
```javascript
const [emotionData, setEmotionData] = useState([]);
const [currentQuestionEmotions, setCurrentQuestionEmotions] = useState([]);
```

#### 3. ResultsSummary Component
**Updates:**
- Receives emotion data as prop
- Calculates emotion statistics (dominant emotion, breakdown, confidence)
- Displays emotion analysis section with:
  - Dominant emotion with emoji and confidence
  - Percentage breakdown of all emotions
  - Visual progress bars for each emotion
  - Emotion chips for each question showing expressions during the answer

**Emotion Statistics:**
- Dominant emotion: Most frequently detected emotion
- Breakdown: Percentage distribution of all emotions
- Confidence: Average confidence score for dominant emotion

#### 4. App Component
**Updates:**
- Added emotionData state
- Updated handleCompleteInterview to accept and store emotion data
- Passes emotion data to ResultsSummary component
- Includes emotion data in interview save API call

### Styling

#### 5. FacialExpressionTracker.css
**Location:** `src/styles/components/FacialExpressionTracker.css`

**Features:**
- Fixed position tracker in bottom-right corner
- Glassmorphism design with backdrop blur
- Mirrored video (selfie view)
- Animated status indicators
- Responsive design for mobile devices
- Dark mode support

#### 6. ResultsSummary.css
**Updates:**
- Emotion analysis section with gradient background
- Dominant emotion card with large emoji display
- Emotion breakdown with animated progress bars
- Emotion chips for question reviews
- Mobile-responsive grid layout

### Dependencies

#### face-api.js
**Version:** Latest
**Purpose:** Facial detection and expression recognition
**Models Required:**
- TinyFaceDetector: Lightweight face detection
- FaceExpressionNet: 7-emotion classification

**Model Files (in public/models/):**
1. `tiny_face_detector_model-weights_manifest.json`
2. `tiny_face_detector_model-shard1`
3. `face_expression_model-weights_manifest.json`
4. `face_expression_model-shard1`

See `public/models/README.md` for download instructions.

## User Flow

1. **Interview Start:**
   - User starts mock interview
   - FacialExpressionTracker component initializes
   - Camera permission is requested
   - Models are loaded from /models directory
   - Video stream starts in bottom-right corner

2. **During Interview:**
   - Real-time facial expression detection every 2 seconds
   - Current emotion is displayed with emoji and confidence
   - Emotion snapshots are stored with each question
   - Visual feedback shows detection is active (pulsing green dot)

3. **After Interview:**
   - Emotion data is compiled with interview results
   - ResultsSummary displays:
     - Overall interview scores
     - Dominant emotion analysis
     - Emotion breakdown chart
     - Per-question emotion chips

4. **Data Storage:**
   - Emotion data is saved to MongoDB with interview results
   - Can be retrieved for historical analysis
   - Includes timestamps for temporal analysis

## Setup Instructions

### 1. Install Dependencies
```bash
npm install face-api.js
```

### 2. Download Models
Navigate to `public/models/` and run the download commands from README.md, or download manually from:
```
https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

### 3. Camera Permissions
- Users must grant camera access for tracking to work
- Browser must support getUserMedia API (Chrome, Edge, Safari, Firefox)
- HTTPS required for camera access in production

### 4. Server Configuration
No server-side changes required. All processing happens client-side using face-api.js.

## Features

### Real-Time Tracking
- ✅ Live video feed with mirrored display
- ✅ Facial detection overlay
- ✅ Current emotion display with confidence
- ✅ 2-second detection interval for performance

### Analysis & Reporting
- ✅ Dominant emotion calculation
- ✅ Percentage breakdown of all emotions
- ✅ Average confidence scores
- ✅ Per-question emotion display
- ✅ Visual progress bars
- ✅ Emoji representations

### User Experience
- ✅ Non-intrusive fixed position tracker
- ✅ Can be minimized if needed
- ✅ Smooth animations
- ✅ Loading states
- ✅ Error handling for camera issues
- ✅ Mobile responsive design

## Performance Considerations

- **Detection Interval:** 2 seconds (configurable)
- **Model Size:** ~1-2 MB total
- **Memory Usage:** Minimal (efficient TinyFaceDetector)
- **Processing:** Client-side only (no server load)
- **Browser Caching:** Models cached after first load

## Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 53+
- ✅ Edge 79+
- ✅ Safari 11+
- ✅ Firefox 36+

**Requirements:**
- getUserMedia API support
- Canvas API support
- ES6 support

## Privacy & Security

- Camera feed is processed entirely client-side
- No video data is transmitted to servers
- Only emotion statistics are stored (no images/video)
- Camera access can be revoked at any time
- Complies with browser security policies

## Future Enhancements

Potential improvements:
- [ ] Attention detection (looking away from camera)
- [ ] Confidence level trends over time
- [ ] Emotion transition graphs
- [ ] Comparison with successful interview patterns
- [ ] Customizable detection intervals
- [ ] Toggle to hide/show tracker during interview
- [ ] Export emotion timeline as CSV/JSON

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Ensure HTTPS in production
- Verify camera is not used by another app
- Try different browser

### Models Not Loading
- Verify all 4 model files are in public/models/
- Check browser console for 404 errors
- Ensure correct file names (case-sensitive)
- Clear browser cache

### Detection Not Accurate
- Ensure good lighting
- Face the camera directly
- Minimum distance: 30-100cm
- Avoid obstructions (glasses may reduce accuracy)

### Performance Issues
- Increase detection interval (default: 2 seconds)
- Close other resource-intensive apps
- Use TinyFaceDetector (already default)
- Check browser console for errors

## Technical Architecture

```
InterviewInterface
    ↓
FacialExpressionTracker
    ↓
face-api.js (TinyFaceDetector + FaceExpressionNet)
    ↓
Emotion Detection (every 2s)
    ↓
Store with Answer Data
    ↓
ResultsSummary
    ↓
Display Analysis
```

## Data Flow

```
User Face → Webcam → Video Stream → face-api.js → Emotion Detection →
Callback → State Update → Store with Answer → Save to MongoDB →
Retrieve in Results → Calculate Stats → Display Report
```

## File Changes Summary

**New Files:**
- src/components/FacialExpressionTracker.jsx
- src/styles/components/FacialExpressionTracker.css
- public/models/README.md
- FACIAL_EXPRESSION_FEATURE.md

**Modified Files:**
- src/components/InterviewInterface.jsx
- src/components/ResultsSummary.jsx
- src/App.jsx
- src/styles/components/ResultsSummary.css
- package.json (added face-api.js)

**Model Files (to download):**
- public/models/tiny_face_detector_model-weights_manifest.json
- public/models/tiny_face_detector_model-shard1
- public/models/face_expression_model-weights_manifest.json
- public/models/face_expression_model-shard1

---

## Quick Start

1. **Download Models:**
   ```bash
   cd public/models
   # Run download commands from public/models/README.md
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```

3. **Start Interview:**
   - Navigate to interview configuration
   - Start mock interview
   - Grant camera access when prompted
   - Facial tracking will start automatically

4. **View Results:**
   - Complete interview
   - See emotion analysis in results summary
   - Review per-question emotions

---

**Feature Status:** ✅ Complete and Ready for Testing
**Last Updated:** January 2024
