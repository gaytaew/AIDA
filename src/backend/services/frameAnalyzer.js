/**
 * Frame Analyzer Service
 * 
 * AI-powered analysis and generation for frames:
 * 1. analyzeSketch - Extract technical parameters from a sketch/reference image
 * 2. generatePoseSketch - Generate a schematic pose sketch (stick figure style)
 * 3. analyzeAndGenerateSketch - Full pipeline: analyze + generate sketch
 */

import config from '../config.js';
import { requestGeminiImage } from '../providers/geminiClient.js';
import { convertToJpeg } from '../utils/imageConverter.js';
import {
  SHOT_SIZE_OPTIONS,
  CAMERA_ANGLE_OPTIONS,
  POSE_TYPE_OPTIONS,
  COMPOSITION_OPTIONS,
  DEFAULT_TECHNICAL
} from '../schema/frame.js';

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

const ANALYZE_SKETCH_PROMPT = `You are an expert fashion photography analyst. Your task is to analyze a sketch or reference image and extract ONLY technical shot parameters.

CRITICAL RULES:
- Extract ONLY: pose, camera angle, shot size, composition, body position
- Do NOT mention: location, background, environment, props, weather, setting
- Do NOT describe: clothing, hair, face details, accessories
- The frame should be UNIVERSAL - applicable to ANY location
- Ignore any background/environment in the reference image

Analyze the image and determine:

### 1. SHOT SIZE (how much of the subject is visible)
Options: ${SHOT_SIZE_OPTIONS.join(', ')}

### 2. CAMERA ANGLE (camera position relative to subject)
Options: ${CAMERA_ANGLE_OPTIONS.join(', ')}

### 3. POSE TYPE (what the subject is doing)
Options: ${POSE_TYPE_OPTIONS.join(', ')}

### 4. COMPOSITION (how the frame is arranged)
Options: ${COMPOSITION_OPTIONS.join(', ')}

### 5. FOCUS POINT (what part of the subject should be in focus)
Free text: e.g., "face", "hands", "full figure", "eyes"

### 6. POSE DESCRIPTION (detailed description of the pose ONLY)
Free text: Describe the specific pose in detail. Focus ONLY on:
- Body position (standing, sitting, leaning, etc.)
- Limb placement (arms, legs, hands position)
- Posture and weight distribution
- Head tilt and gaze direction
Do NOT mention location, background, clothing, hair, or appearance!

### 7. LABEL (short name for this shot)
A concise name for this POSE type (e.g., "Seated Relaxed", "Dynamic Walk", "Three-Quarter Turn")
Do NOT include location in the label!

### 8. DESCRIPTION (description for prompt generation)
2-3 sentences describing the shot. Focus ONLY on:
- Camera framing and angle
- Subject's pose and body language
- Composition
Do NOT mention any location, background, or environment!

Return a valid JSON object:
{
  "label": "Pose name (no location)",
  "description": "Description focusing on pose and camera, no location",
  "technical": {
    "shotSize": "medium",
    "cameraAngle": "eye_level",
    "poseType": "static",
    "composition": "rule_of_thirds",
    "focusPoint": "face",
    "poseDescription": "Sitting with legs dangling, slight forward lean, arms resting on support..."
  }
}

Use ONLY the allowed values listed above for enum fields. Be precise based on what you see.`;

// Prompt for generating schematic pose sketch
const POSE_SKETCH_PROMPT = `Generate a CONTOUR ANATOMICAL POSE SKETCH that EXACTLY matches the reference image pose.

CRITICAL: COPY THE EXACT POSE FROM THE REFERENCE!
- Match the EXACT angle of every limb (arms, legs)
- Match the EXACT tilt of the head
- Match the EXACT twist of the torso
- Match the EXACT weight distribution
- Match the EXACT position (sitting, standing, leaning, etc.)
- If model is sitting on something, draw a schematic outline of that object

STYLE REQUIREMENTS (STRICT):
- **Pencil/line drawing technique** — thin contour lines, like a fashion illustration sketch
- **Monochrome** — black/grey lines on pure white background
- **Light hatching** for volume (not solid fill) — subtle cross-hatching on body forms
- **Anatomical silhouette** — proportional human figure, NOT a stick figure
- **NO face** — head as a smooth oval form, NO facial features, NO eyes, NO mouth
- **NO hair** — bald head, no hairstyle
- **NO clothing** — nude silhouette (like an artist's mannequin or anatomy reference)
- **NO accessories** — no jewelry, no props in hands
- **Visible body forms** — muscles/curves implied but not detailed
- **Clear body position** — arms, legs, torso, head tilt clearly readable
- **Minimal background** — white or with a simple floor/horizon line
- **Schematic props if needed** — chair, railing, bench shown as simple geometric contours

The result should look like a professional fashion artist's pose reference sketch — elegant, minimal, anatomically correct but abstract.

POSE TO REPLICATE EXACTLY:
{poseDescription}

SHOT FRAMING:
- Shot size: {shotSize}
- Camera angle: {cameraAngle}

OUTPUT: A simple stick figure or mannequin silhouette showing ONLY the pose. Think of it like a pose reference for artists - just the skeleton/structure.`;

// ═══════════════════════════════════════════════════════════════
// ANALYZE SKETCH (image -> parameters)
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze a sketch/reference image and extract frame parameters
 * 
 * @param {{mimeType: string, base64: string}} image - The image to analyze
 * @param {string} notes - Optional user notes
 * @returns {Promise<Object>} - Extracted frame parameters
 */
export async function analyzeSketch(image, notes = '') {
  const apiKey = config.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!image || !image.base64) {
    throw new Error('Image with base64 data is required');
  }

  const imageContent = {
    type: 'image_url',
    image_url: {
      url: `data:${image.mimeType || 'image/jpeg'};base64,${image.base64}`,
      detail: 'high'
    }
  };

  const userMessage = notes
    ? `Analyze this sketch/reference image and extract frame parameters.\n\nUser notes: ${notes}`
    : 'Analyze this sketch/reference image and extract frame parameters.';

  const messages = [
    {
      role: 'system',
      content: ANALYZE_SKETCH_PROMPT
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: userMessage },
        imageContent
      ]
    }
  ];

  console.log('[FrameAnalyzer] Analyzing sketch...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FrameAnalyzer] OpenAI error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.error('[FrameAnalyzer] Failed to parse response:', content);
    throw new Error('Failed to parse OpenAI response as JSON');
  }

  // Ensure technical has all defaults
  const result = {
    label: parsed.label || 'Analyzed Frame',
    description: parsed.description || '',
    technical: {
      ...DEFAULT_TECHNICAL,
      ...(parsed.technical || {})
    }
  };

  // Validate enum values
  if (!SHOT_SIZE_OPTIONS.includes(result.technical.shotSize)) {
    result.technical.shotSize = 'medium';
  }
  if (!CAMERA_ANGLE_OPTIONS.includes(result.technical.cameraAngle)) {
    result.technical.cameraAngle = 'eye_level';
  }
  if (!POSE_TYPE_OPTIONS.includes(result.technical.poseType)) {
    result.technical.poseType = 'static';
  }
  if (!COMPOSITION_OPTIONS.includes(result.technical.composition)) {
    result.technical.composition = 'rule_of_thirds';
  }

  console.log('[FrameAnalyzer] Analysis complete:', result.label);

  return result;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE POSE SKETCH (text -> schematic image)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a schematic pose sketch using Gemini
 * 
 * @param {Object} technical - Technical parameters with poseDescription
 * @returns {Promise<Object>} - Generated sketch data
 */
export async function generatePoseSketch(technical = {}, referenceImage = null) {
  const tech = {
    ...DEFAULT_TECHNICAL,
    ...technical
  };

  const poseDescription = tech.poseDescription || 'Standing neutral pose, arms at sides';

  // Build prompt
  const prompt = POSE_SKETCH_PROMPT
    .replace('{poseDescription}', poseDescription)
    .replace('{shotSize}', tech.shotSize.replace(/_/g, ' '))
    .replace('{cameraAngle}', tech.cameraAngle.replace(/_/g, ' '));

  console.log('[FrameAnalyzer] Generating schematic pose sketch with Gemini...');

  // Include reference image if provided
  const referenceImages = referenceImage ? [referenceImage] : [];

  const result = await requestGeminiImage({
    prompt,
    referenceImages,
    imageConfig: {
      aspectRatio: '3:4',
      imageSize: '1K'
    },
    generatorName: 'FrameAnalyzer'
  });

  if (!result.ok) {
    console.error('[FrameAnalyzer] Gemini error:', result.error);
    throw new Error(result.error || 'Failed to generate pose sketch');
  }

  console.log('[FrameAnalyzer] Pose sketch generated successfully');

  // Convert to JPEG for consistent storage
  const jpegImage = await convertToJpeg(result.base64, result.mimeType, 90);

  return {
    image: {
      mimeType: jpegImage.mimeType,
      base64: jpegImage.base64
    },
    technical: tech
  };
}

// ═══════════════════════════════════════════════════════════════
// FULL PIPELINE: ANALYZE + GENERATE SKETCH
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze reference image and generate schematic pose sketch
 * 
 * @param {{mimeType: string, base64: string}} image - The reference image
 * @param {string} notes - Optional user notes
 * @returns {Promise<Object>} - Analysis result with generated sketch
 */
export async function analyzeAndGenerateSketch(image, notes = '') {
  // Step 1: Analyze the reference image
  console.log('[FrameAnalyzer] Step 1: Analyzing reference...');
  const analysis = await analyzeSketch(image, notes);

  // Step 2: Generate schematic pose sketch based on analysis
  // Pass the original image as reference for more accurate pose replication
  console.log('[FrameAnalyzer] Step 2: Generating pose sketch with reference...');
  let sketchResult = null;

  try {
    sketchResult = await generatePoseSketch(analysis.technical, image);
  } catch (error) {
    console.error('[FrameAnalyzer] Failed to generate sketch:', error.message);
    // Continue without sketch - analysis is still valuable
  }

  return {
    ...analysis,
    generatedSketch: sketchResult?.image || null
  };
}

// ═══════════════════════════════════════════════════════════════
// GENERATE SKETCH FROM TEXT (legacy, uses Gemini now)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a sketch image from text description
 * 
 * @param {string} description - Text description of the shot
 * @param {Object} technical - Technical parameters
 * @returns {Promise<Object>} - Generated sketch data
 */
export async function generateSketchFromText(description, technical = {}) {
  if (!description) {
    throw new Error('Description is required');
  }

  // Merge with defaults
  const tech = {
    ...DEFAULT_TECHNICAL,
    ...technical,
    poseDescription: description
  };

  console.log('[FrameAnalyzer] Generating sketch from description...');

  const result = await generatePoseSketch(tech);

  return {
    ...result,
    revisedPrompt: description
  };
}
