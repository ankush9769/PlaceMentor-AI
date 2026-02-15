# Face-API.js Models

This directory contains the pre-trained machine learning models required for facial expression detection.

## Required Models

The following models need to be downloaded from the face-api.js repository:

1. **tiny_face_detector_model-weights_manifest.json**
2. **tiny_face_detector_model-shard1**
3. **face_expression_model-weights_manifest.json**
4. **face_expression_model-shard1**

## Download Instructions

### Option 1: Manual Download

Download the models from the official face-api.js repository:

```
https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

Download these specific files and place them in this directory:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

### Option 2: Using PowerShell (Windows)

Run these commands from the project root directory:

```powershell
# Navigate to models directory
cd public\models

# Download TinyFaceDetector models
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json" -OutFile "tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1" -OutFile "tiny_face_detector_model-shard1"

# Download FaceExpression models
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json" -OutFile "face_expression_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1" -OutFile "face_expression_model-shard1"
```

### Option 3: Using curl (Cross-platform)

```bash
cd public/models

# Download TinyFaceDetector models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Download FaceExpression models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
```

## Verification

After downloading, your `public/models` directory should contain these 4 files:

```
public/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_expression_model-weights_manifest.json
└── face_expression_model-shard1
```

## Usage

The FacialExpressionTracker component will automatically load these models from `/models` directory when the component initializes.

## Important Notes

- These model files are required for the facial expression tracking feature to work
- The models are loaded from the public directory, so they must be accessible via HTTP
- Total size: ~1-2 MB
- Models are cached by the browser after first load
