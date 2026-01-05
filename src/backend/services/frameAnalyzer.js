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

const ANALYZE_SKETCH_PROMPT = `You are an expert fashion photography analyst. Your task is to analyze a sketch or reference image and extract technical shot parameters.

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

### 6. POSE DESCRIPTION (detailed description of the pose)
Free text: Describe the specific pose in detail. Focus ONLY on body position, limbs, posture. Do NOT describe clothing, hair, face, or any appearance details.

### 7. LABEL (short name for this shot)
A concise, descriptive name for this shot type

### 8. DESCRIPTION (full description for prompt generation)
2-3 sentences describing the shot for image generation

Return a valid JSON object:
{
  "label": "Shot name",
  "description": "Full description for prompts",
  "technical": {
    "shotSize": "medium",
    "cameraAngle": "eye_level",
    "poseType": "static",
    "composition": "rule_of_thirds",
    "focusPoint": "face",
    "poseDescription": "Standing with arms relaxed at sides, weight on left leg, slight hip tilt..."
  }
}

Use ONLY the allowed values listed above for enum fields. Be precise based on what you see.`;

// Prompt for generating schematic pose sketch
const POSE_SKETCH_PROMPT = `Generate a MINIMAL schematic pose sketch.

STYLE REQUIREMENTS:
- Simple stick figure or basic mannequin silhouette
- Black lines on pure white background
- NO face details, NO facial features
- NO hair, NO hairstyle
- NO clothing, NO accessories
- NO textures, NO shading
- Just the POSE: body position, limbs, posture
- Clean, geometric, minimal

POSE TO DRAW:
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
export async function generatePoseSketch(technical = {}) {
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

  const result = await requestGeminiImage({
    prompt,
    referenceImages: [],
    imageConfig: {
      aspectRatio: '3:4',
      imageSize: '1K'
    }
  });

  if (!result.ok) {
    console.error('[FrameAnalyzer] Gemini error:', result.error);
    throw new Error(result.error || 'Failed to generate pose sketch');
  }

  console.log('[FrameAnalyzer] Pose sketch generated successfully');

  return {
    image: {
      mimeType: result.mimeType,
      base64: result.base64
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
  console.log('[FrameAnalyzer] Step 2: Generating pose sketch...');
  let sketchResult = null;
  
  try {
    sketchResult = await generatePoseSketch(analysis.technical);
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
