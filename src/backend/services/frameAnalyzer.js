/**
 * Frame Analyzer Service
 * 
 * AI-powered analysis and generation for frames:
 * 1. analyzeSketch - Extract technical parameters from a sketch/reference image
 * 2. generateSketchFromText - Generate a sketch image from text description
 */

import config from '../config.js';
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
Free text: Describe the specific pose in detail

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
    "poseDescription": "Model standing with arms relaxed..."
  }
}

Use ONLY the allowed values listed above for enum fields. Be precise based on what you see.`;

const GENERATE_SKETCH_PROMPT = `Create a simple, clean fashion sketch showing:

{description}

Technical specifications:
- Shot size: {shotSize}
- Camera angle: {cameraAngle}
- Pose: {poseType}
- Composition: {composition}

Style: Clean line drawing, fashion illustration style, minimal shading, focus on pose and composition. White background. No color, just black lines on white.`;

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
// GENERATE SKETCH (text -> image)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a sketch image from text description
 * 
 * @param {string} description - Text description of the shot
 * @param {Object} technical - Technical parameters
 * @returns {Promise<Object>} - Generated sketch data
 */
export async function generateSketchFromText(description, technical = {}) {
  const apiKey = config.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!description) {
    throw new Error('Description is required');
  }

  // Merge with defaults
  const tech = {
    ...DEFAULT_TECHNICAL,
    ...technical
  };

  // Build prompt
  const prompt = GENERATE_SKETCH_PROMPT
    .replace('{description}', description)
    .replace('{shotSize}', tech.shotSize.replace(/_/g, ' '))
    .replace('{cameraAngle}', tech.cameraAngle.replace(/_/g, ' '))
    .replace('{poseType}', tech.poseType.replace(/_/g, ' '))
    .replace('{composition}', tech.composition.replace(/_/g, ' '));

  console.log('[FrameAnalyzer] Generating sketch from description...');

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FrameAnalyzer] DALL-E error:', errorText);
    throw new Error(`DALL-E API error: ${response.status}`);
  }

  const data = await response.json();
  const imageData = data.data?.[0];

  if (!imageData) {
    throw new Error('No image generated');
  }

  console.log('[FrameAnalyzer] Sketch generated successfully');

  return {
    image: {
      mimeType: 'image/png',
      base64: imageData.b64_json
    },
    revisedPrompt: imageData.revised_prompt || prompt,
    technical: tech
  };
}

