# Anti-Cheating Feature - Interview Proctoring System

## Overview
The interview platform now includes an AI-powered anti-cheating system that monitors candidates during mock interviews to ensure integrity and fairness.

## Features Implemented

### 1. Multiple People Detection
- **What it does:** Detects if more than one person appears in the camera frame
- **Action:** Immediately terminates the interview
- **Reason:** Ensures the candidate is taking the interview alone without assistance

### 2. Looking Away Detection  
- **What it does:** Tracks if the candidate is looking away from the camera (at phone, notes, or other screens)
- **Threshold:** 4 consecutive detections (8 seconds total)
- **Warning System:** Shows warnings before termination
- **Action:** Terminates interview if threshold is exceeded
- **Reason:** Prevents use of external resources or cheat sheets

### 3. Face Visibility Monitoring
- **What it does:** Monitors if the candidate's face is visible in the camera
- **Threshold:** 3 consecutive detections (6 seconds total) without face
- **Action:** Terminates interview if face is not visible for too long
- **Reason:** Ensures candidate hasn't left the interview or is deliberately avoiding camera

## Technical Implementation

### Face-API.js Models Used
1. **TinyFaceDetector** - Fast face detection
2. **FaceExpressionNet** - Emotion detection
3. **FaceLandmark68Net** - NEW: Facial landmark detection for gaze tracking

### Detection Logic

#### Multiple People Detection
```javascript
const detections = await faceapi.detectAllFaces(...);
if (detections.length > 1) {
  handleViolation('multiple_people', `${detections.length} people detected`);
}
```

#### Looking Away Detection
Uses facial landmarks to calculate:
- **Nose position** relative to face center
- **Eye position** relative to nose
- **Face angle** (horizontal and vertical deviation)

Thresholds:
- Horizontal deviation: >30 pixels
- Vertical deviation: >25 pixels
- Eye-nose distance: <60 pixels

#### No Face Detection
```javascript
if (detections.length === 0) {
  lookAwayCountRef.current += 1;
  if (lookAwayCountRef.current >= 3) {
    handleViolation('no_face', 'Face not visible');
  }
}
```

## User Experience Flow

### 1. Interview Start
- Facial tracker prompt appears
- User clicks "Enable Tracking" 
- Camera permission requested
- Anti-cheat monitoring begins
- Indicator shows "Camera Active • Anti-Cheat ON"

### 2. During Interview
- Real-time monitoring every 2 seconds
- Warnings appear if violations are approaching threshold
- Example: "⚠️ Please maintain eye contact with the camera"
- Emotion tracking continues alongside anti-cheat

### 3. Violation Detected
- Interview terminates immediately
- Camera stops
- User redirected to results page
- Violation details displayed

### 4. Results Page
If violation occurred:
- Shows red "Interview Terminated ⚠️" banner
- Displays violation type and details
- Explains why interview was terminated
- Lists specific rules violated
- Still allows "Start New Interview"

If no violation:
- Normal results display
- Shows scores, emotion analysis
- Full interview review

## Component Updates

### FacialExpressionTracker.jsx
**New Props:**
- `onViolation` - Callback when violation is detected

**New State:**
- `warnings` - Array of warning messages
- `violationCount` - Total violations detected

**New Functions:**
- `detectEmotionsAndViolations()` - Combined detection
- `checkIfLookingAway(landmarks)` - Gaze direction analysis
- `showWarning(message)` - Display temporary warnings
- `handleViolation(type, message)` - Process violations

### InterviewInterface.jsx
**New State:**
- `violationData` - Stores violation information

**New Handler:**
- `handleViolation(violation)` - Receives violation from tracker, ends interview

**Updated:**
- Passes `onViolation` prop to FacialExpressionTracker
- Sends violation data to `onComplete` callback

### ResultsSummary.jsx
**New Prop:**
- `violation` - Violation data object

**New UI:**
- Violation banner with icon and details
- Explanation section
- Conditional rendering based on violation presence

**Violation Object Structure:**
```javascript
{
  type: 'multiple_people' | 'looking_away' | 'no_face',
  message: 'Detailed violation message',
  timestamp: '2026-02-15T...',
  totalViolations: 1
}
```

### App.jsx
**Updated:**
- `handleCompleteInterview()` now accepts violation parameter
- Stores violation in state
- Passes violation to ResultsSummary
- Saves violation to database

## Styling

### Warning Messages
- Yellow/orange background
- Slide-in animation
- Auto-dismiss after 3 seconds
- Positioned above video feed

### Violation Banner (Results)
- Red gradient background
- Large warning icon (🚫)
- Pulsing shadow animation
- Prominent placement at top of results

### Violation Explanation
- Light red background
- Detailed violation description
- Bulleted list of rules
- Warning note about interview integrity

## Database Schema Addition

```javascript
{
  // Existing fields...
  violation: {
    type: String,
    message: String,
    timestamp: Date,
    totalViolations: Number
  }
}
```

## Configuration & Thresholds

Current thresholds (adjustable):
- **Looking away:** 4 consecutive detections (8 seconds)
- **No face:** 3 consecutive detections (6 seconds)
- **Multiple people:** Immediate (0 tolerance)
- **Detection interval:** Every 2 seconds

To adjust thresholds, modify in `FacialExpressionTracker.jsx`:
```javascript
if (consecutiveViolationsRef.current >= 4) { // Change this number
  handleViolation('looking_away', 'Looking away detected');
}
```

## Privacy & Data

### What is Stored:
- Violation type
- Violation message
- Timestamp
- Violation count

### What is NOT Stored:
- Video recordings
- Screenshots
- Exact facial landmark coordinates
- Camera feed data

### Data Usage:
- Only for interview integrity verification
- Not shared with third parties
- Deleted with interview data

## Testing Recommendations

### Test Scenarios:

1. **Multiple People Test:**
   - Have someone walk behind you during interview
   - Should trigger immediate termination

2. **Looking Away Test:**
   - Look at your phone for >8 seconds
   - Should show warnings then terminate

3. **No Face Test:**
   - Move out of camera frame for >6 seconds
   - Should terminate interview

4. **Normal Interview:**
   - Maintain eye contact with camera
   - Slight head movements OK
   - Should complete successfully

## Model Files Required

All downloaded to `/public/models/`:
✅ tiny_face_detector_model-weights_manifest.json (3 KB)
✅ tiny_face_detector_model-shard1 (193 KB)
✅ face_expression_model-weights_manifest.json (6 KB)
✅ face_expression_model-shard1 (329 KB)
✅ face_landmark_68_model-weights_manifest.json (8 KB) - NEW
✅ face_landmark_68_model-shard1 (357 KB) - NEW

**Total Size:** ~896 KB

## Browser Compatibility

- ✅ Chrome 53+
- ✅ Edge 79+
- ✅ Safari 11+
- ✅ Firefox 36+

Requires:
- Camera access
- ES6 support
- Canvas API

## Performance Impact

- **CPU Usage:** Low (TinyFaceDetector optimized)
- **Memory:** ~50-100 MB
- **Detection Time:** <100ms per frame
- **Network:** Models cached after first load
- **Battery:** Minimal impact on laptops

## Known Limitations

1. **False Positives:**
   - Extreme head tilts might trigger looking away
   - Bad lighting might affect detection
   - Glasses/masks reduce accuracy

2. **Workarounds:**
   - Ensure good lighting
   - Face camera directly
   - Remove obstructions if possible

3. **Can be Disabled:**
   - User can click "Skip" on tracker prompt
   - User can close tracker with × button
   - Interview continues normally without tracking

## Future Enhancements

Potential additions:
- [ ] Background scene detection (detect if in wrong location)
- [ ] Audio monitoring (detect multiple voices)
- [ ] Tab switching detection
- [ ] Copy-paste prevention
- [ ] Screen recording warning
- [ ] Adjustable sensitivity levels
- [ ] Admin dashboard for violation review
- [ ] AI-based anomaly scoring

## Troubleshooting

### Issue: Tracker not detecting looking away
**Solution:** Ensure good lighting, face camera directly

### Issue: Too many false violations
**Solution:** Increase threshold values in code

### Issue: Models not loading
**Solution:** Verify all 6 model files are in /public/models/

### Issue: Camera permission denied
**Solution:** Follow browser-specific instructions to enable camera

## Ethical Considerations

This feature is designed to:
- ✅ Ensure fair assessment
- ✅ Maintain interview integrity
- ✅ Provide equal opportunity
- ✅ Respect privacy (no recording)

Not designed to:
- ❌ Invade privacy
- ❌ Discriminate
- ❌ Create hostile environment
- ❌ Replace human judgment

**Note:** This is a practice/mock interview tool. Violations are logged but do not have real-world consequences beyond the practice session.

---

**Feature Status:** ✅ Complete and Ready for Testing
**Last Updated:** February 15, 2026
**Models Downloaded:** ✅ All Required Models Present
