import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import '../styles/components/FacialExpressionTracker.css';
import '../styles/components/FacialExpressionTracker.css';

const FacialExpressionTracker = ({ isActive, onEmotionDetected, onViolation }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [error, setError] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [warnings, setWarnings] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const detectionIntervalRef = useRef(null);
  const consecutiveViolationsRef = useRef(0);
  const lookAwayCountRef = useRef(0);
  const totalWarningsRef = useRef(0); // Track total warnings across all types
  const multiplePersonCountRef = useRef(0); // Track consecutive multiple people detections

  const handleDismiss = () => {
    stopCamera();
    setIsDismissed(true);
  };

  const handleEnableTracking = () => {
    setShowPrompt(false);
    setError(null); // Reset error state
    startCamera();
  };

  const handleSkipTracking = () => {
    setShowPrompt(false);
    setIsDismissed(true);
  };

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'; // We'll need to add models to public folder
        
        // Load required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        
        console.log('✅ Face API models loaded (including anti-cheating detection)');
        setModelsLoaded(true);
      } catch (err) {
        console.error('❌ Error loading face-api models:', err);
        setError('Failed to load face detection models');
      }
    };

    loadModels();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      console.log('📹 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setError(null);
        console.log('📹 Camera started successfully');
        startDetection();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      let errorMessage = 'Could not access camera. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Click the camera icon in your browser address bar to allow access, then try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.';
      } else {
        errorMessage += 'Please check your camera settings and try again.';
      }
      
      setError(errorMessage);
      setShowPrompt(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const startDetection = () => {
    console.log('🎯 Starting detection interval...');
    // Run detection every 2 seconds
    detectionIntervalRef.current = setInterval(async () => {
      console.log('⏰ Detection interval tick');
      if (videoRef.current && canvasRef.current) {
        console.log('✅ Video and canvas ready, running detection...');
        await detectEmotionsAndViolations();
      } else {
        console.log('❌ Video or canvas not ready:', { video: !!videoRef.current, canvas: !!canvasRef.current });
      }
    }, 2000);
    console.log('🎯 Detection interval started');
  };

  const detectEmotionsAndViolations = async () => {
    console.log('🔄 detectEmotionsAndViolations called');
    try {
      console.log('🔍 Starting face detection...');
      // Detect ALL faces in the frame
      // IMPORTANT: withFaceLandmarks() must come BEFORE withFaceExpressions()
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      console.log('🔍 Detection complete! Faces found:', detections.length);

      // Check for multiple people
      if (detections.length > 1) {
        console.log('🚨 Multiple people detected!');
        multiplePersonCountRef.current += 1;
        
        // Require 2 consecutive detections (4 seconds) before warning/termination
        if (multiplePersonCountRef.current >= 2) {
          if (totalWarningsRef.current < 3) {
            totalWarningsRef.current += 1;
            showWarning(`Warning ${totalWarningsRef.current}/3: Multiple people detected in frame. Please ensure you are alone.`);
            console.log(`⚠️ Warning ${totalWarningsRef.current}/3 shown`);
          } else {
            handleViolation('multiple_people', `${detections.length} people detected in frame`);
          }
        }
        return;
      }
      
      // Reset multiple person counter if only one or no person detected
      multiplePersonCountRef.current = 0;

      // No face detected
      if (detections.length === 0) {
        lookAwayCountRef.current += 1;
        console.log('❌ No face detected. Count:', lookAwayCountRef.current);
        
        if (lookAwayCountRef.current >= 3) { // 3 consecutive times (6 seconds)
          if (totalWarningsRef.current < 3) {
            totalWarningsRef.current += 1;
            showWarning(`Warning ${totalWarningsRef.current}/3: Face not visible. Please stay in frame.`);
            console.log(`⚠️ Warning ${totalWarningsRef.current}/3 shown`);
            lookAwayCountRef.current = 0; // Reset after warning
          } else {
            handleViolation('no_face', 'Face not visible in camera');
          }
        }
        return;
      }

      // Reset look away counter if face is detected
      lookAwayCountRef.current = 0;

      const detection = detections[0];
      const landmarks = detection.landmarks;
      
      console.log('✅ Face detected with landmarks:', landmarks ? 'Yes' : 'No');
      
      // Check if looking away (using face angle estimation)
      if (landmarks) {
        const isLookingAway = checkIfLookingAway(landmarks);
        console.log('Looking away?', isLookingAway, '| Violation count:', consecutiveViolationsRef.current);
        
        if (isLookingAway) {
          consecutiveViolationsRef.current += 1;
          console.log('⚠️ Looking away! Count now:', consecutiveViolationsRef.current);
          
          if (consecutiveViolationsRef.current >= 6) { // 6 consecutive times (12 seconds)
            if (totalWarningsRef.current < 3) {
              totalWarningsRef.current += 1;
              showWarning(`Warning ${totalWarningsRef.current}/3: Looking away detected. Please focus on the camera.`);
              console.log(`⚠️ Warning ${totalWarningsRef.current}/3 shown`);
              consecutiveViolationsRef.current = 0; // Reset after warning
            } else {
              console.log('🚨 TERMINATING - 3 warnings exceeded!');
              handleViolation('looking_away', 'Sustained attention away from camera detected');
            }
          }
          return;
        }
      }

      // Reset consecutive violations if looking at camera
      console.log('👁️ Looking at camera - resetting violation count');
      consecutiveViolationsRef.current = 0;

      const expressions = detection.expressions;
      
      // Get dominant emotion
      const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );

      const emotionData = {
        emotion: dominantEmotion,
        confidence: expressions[dominantEmotion],
        timestamp: new Date().toISOString(),
        allExpressions: expressions,
      };

      setCurrentEmotion(emotionData);
      
      // Send emotion data to parent component
      if (onEmotionDetected) {
        onEmotionDetected(emotionData);
      }

      // Draw detection on canvas (optional visualization)
      if (canvasRef.current) {
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } catch (err) {
      console.error('❌ DETECTION ERROR:', err);
      console.error('Error details:', { message: err.message, stack: err.stack });
    }
  };

  const checkIfLookingAway = (landmarks) => {
    // Get key facial landmarks
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jawline = landmarks.getJawOutline();

    // Calculate face center
    const faceCenter = {
      x: (jawline[0].x + jawline[16].x) / 2,
      y: (jawline[0].y + jawline[16].y) / 2,
    };

    // Calculate nose position relative to face center
    const noseCenter = nose[3]; // Tip of nose
    const noseDeltaX = Math.abs(noseCenter.x - faceCenter.x);
    const noseDeltaY = Math.abs(noseCenter.y - faceCenter.y);

    // Calculate eye positions
    const leftEyeCenter = { x: (leftEye[0].x + leftEye[3].x) / 2, y: (leftEye[0].y + leftEye[3].y) / 2 };
    const rightEyeCenter = { x: (rightEye[0].x + rightEye[3].x) / 2, y: (rightEye[0].y + rightEye[3].y) / 2 };
    const eyesCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const eyesCenterY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    
    // Distance between eyes and nose (horizontal)
    const eyeNoseDeltaX = Math.abs(noseCenter.x - eyesCenterX);

    // Realistic thresholds - allow reading screen while catching extreme head turns
    const horizontalThreshold = 45; // Allow natural left/right movement for screen reading
    const verticalThreshold = 50; // Allow looking down at screen/questions
    const eyeNoseHorizontalThreshold = 40; // Detect significant head rotation

    // Debug logging
    console.log('👁️ Gaze Detection:', {
      noseDeltaX: noseDeltaX.toFixed(1),
      noseDeltaY: noseDeltaY.toFixed(1),
      eyeNoseDeltaX: eyeNoseDeltaX.toFixed(1),
      horizontalThreshold,
      verticalThreshold
    });

    // Check if face is turned significantly
    const isLookingAway = (
      noseDeltaX > horizontalThreshold ||
      noseDeltaY > verticalThreshold ||
      eyeNoseDeltaX > eyeNoseHorizontalThreshold
    );

    if (isLookingAway) {
      console.log('⚠️ Looking away detected!');
    }

    return isLookingAway;
  };

  const showWarning = (message) => {
    setWarnings((prev) => {
      const newWarnings = [...prev, { message, timestamp: Date.now() }];
      // Keep only last 5 warnings
      return newWarnings.slice(-5);
    });
    
    // Update violation count state for UI display
    setViolationCount(totalWarningsRef.current);
    
    // Auto-remove warning after 5 seconds
    setTimeout(() => {
      setWarnings((prev) => prev.filter((w) => Date.now() - w.timestamp < 5000));
    }, 5000);
  };

  const handleViolation = (type, message) => {
    console.warn(`🚨 Violation detected: ${type} - ${message}`);
    
    setViolationCount((prev) => prev + 1);
    
    // Trigger immediate interview termination
    if (onViolation) {
      onViolation({
        type,
        message,
        timestamp: new Date().toISOString(),
        totalViolations: violationCount + 1,
      });
    }
    
    // Stop tracking
    stopCamera();
    setIsDismissed(true);
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprised: '😲',
      fearful: '😨',
      disgusted: '😖',
      neutral: '😐',
    };
    return icons[emotion] || '😐';
  };

  if (!isActive || isDismissed) {
    return null;
  }

  if (!modelsLoaded) {
    return (
      <div className="expression-tracker loading">
        <button className="tracker-close" onClick={handleDismiss} title="Close tracker">×</button>
        <div className="loading-spinner"></div>
        <p>Loading expression detection...</p>
      </div>
    );
  }

  if (showPrompt) {
    return (
      <div className="expression-tracker prompt">
        <button className="tracker-close" onClick={handleSkipTracking} title="Close tracker">×</button>
        <div className="tracker-prompt-content">
          <div className="prompt-icon">📹</div>
          <h3 className="prompt-title">Enable Facial Expression Tracking?</h3>
          <p className="prompt-description">
            Track your facial expressions during the interview to receive detailed emotion analysis in your results.
          </p>
          <div className="prompt-buttons">
            <button className="enable-button" onClick={handleEnableTracking}>
              Enable Tracking
            </button>
            <button className="skip-button" onClick={handleSkipTracking}>
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expression-tracker error">
        <button className="tracker-close" onClick={handleDismiss} title="Close tracker">×</button>
        <div className="error-icon">⚠️</div>
        <p className="error-message">Camera Access Blocked</p>
        <div className="error-steps">
          <p className="error-step"><strong>Step 1:</strong> Click the 🎥 camera icon in your browser's address bar</p>
          <p className="error-step"><strong>Step 2:</strong> Change setting to "Allow" and close the popup</p>
          <p className="error-step"><strong>Step 3:</strong> Refresh the page (F5) to restart the interview</p>
        </div>
        <p className="error-help">
          Or continue the interview without facial tracking.
        </p>
        <div className="error-buttons">
          <button className="refresh-button" onClick={() => window.location.reload()}>
            🔄 Refresh Page
          </button>
          <button className="dismiss-button" onClick={handleDismiss}>
            Continue Without Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="expression-tracker">
      <button className="tracker-close" onClick={handleDismiss} title="Close tracker">×</button>
      
      {warnings.length > 0 && (
        <div className="warnings-container">
          {warnings.map((warning, idx) => (
            <div key={idx} className="warning-message">
              ⚠️ {warning.message}
            </div>
          ))}
        </div>
      )}
      
      {violationCount > 0 && violationCount < 3 && (
        <div className="warning-counter-badge">
          ⚠️ Warnings: {violationCount}/3
        </div>
      )}
      
      <div className="video-container">
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="detection-canvas" />
        
        {isCameraActive && (
          <div className="camera-indicator">
            <span className="camera-dot"></span>
            <span>Camera Active • Anti-Cheat ON</span>
          </div>
        )}
      </div>

      {currentEmotion && (
        <div className="current-emotion">
          <div className="emotion-icon">{getEmotionIcon(currentEmotion.emotion)}</div>
          <div className="emotion-info">
            <div className="emotion-name">{currentEmotion.emotion}</div>
            <div className="emotion-confidence">
              {(currentEmotion.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacialExpressionTracker;
