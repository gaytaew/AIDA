/**
 * Location Generator Service
 * 
 * Uses Gemini to generate structured location data from text prompts or images.
 */

import { LOCATION_OPTIONS } from '../schema/location.js';
import config from '../config.js';
import { fetch } from 'undici';

const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

// Construct a compact representation of available options for the AI
function buildOptionsPrompt() {
  const opts = LOCATION_OPTIONS;
  
  let prompt = `You are a Location Architect AI. Your task is to analyze a user description (and optional image) and generate a structured JSON configuration for a location.\n\n`;
  
  prompt += `AVAILABLE OPTIONS (Strictly use these IDs):\n`;
  
  prompt += `SPACE TYPES: ${opts.spaceType.map(o => o.id).join(', ')}\n\n`;
  
  prompt += `INTERIOR (if spaceType=interior):\n`;
  prompt += `- Type: ${opts.interiorType.map(o => o.id).join(', ')}\n`;
  prompt += `- Style: ${opts.interiorStyle.map(o => o.id).join(', ')}\n`;
  prompt += `- Window: ${opts.windowLight.map(o => o.id).join(', ')}\n\n`;
  
  prompt += `URBAN (if spaceType=exterior_urban):\n`;
  prompt += `- Type: ${opts.urbanType.map(o => o.id).join(', ')}\n`;
  prompt += `- Architecture: ${opts.urbanArchitecture.map(o => o.id).join(', ')}\n`;
  prompt += `- Density: ${opts.urbanDensity.map(o => o.id).join(', ')}\n\n`;
  
  prompt += `NATURE (if spaceType=exterior_nature):\n`;
  prompt += `- Type: ${opts.natureType.map(o => o.id).join(', ')}\n`;
  prompt += `- Vegetation: ${opts.vegetation.map(o => o.id).join(', ')}\n`;
  prompt += `- Terrain: ${opts.terrain.map(o => o.id).join(', ')}\n\n`;
  
  prompt += `ROOFTOP (if spaceType=rooftop_terrace):\n`;
  prompt += `- Type: ${opts.rooftopType.map(o => o.id).join(', ')}\n`;
  prompt += `- View: ${opts.cityView.map(o => o.id).join(', ')}\n\n`;
  
  prompt += `TRANSPORT (if spaceType=transport):\n`;
  prompt += `- Type: ${opts.transportType.map(o => o.id).join(', ')}\n`;
  prompt += `- Style: ${opts.vehicleStyle.map(o => o.id).join(', ')}\n\n`;
  
  prompt += `STUDIO (if spaceType=studio):\n`;
  prompt += `- Backdrop: ${opts.studioBackdrop.map(o => o.id).join(', ')}\n`;
  prompt += `- Lighting: ${opts.studioLighting.map(o => o.id).join(', ')}\n\n`;

  prompt += `OUTPUT FORMAT (JSON ONLY, no markdown):\n`;
  prompt += `{
  "label": "Short catchy title (e.g. 'Industrial Loft', 'Sunny Beach')",
  "category": "One of: studio, residential, public, urban, nature, transport, abstract",
  "spaceType": "One of the IDs above",
  "description": "A rich, atmospheric visual description focusing on materials, colors, furniture, and mood. Do NOT mention weather or time of day.",
  
  // Include ONLY the object relevant to the spaceType:
  "interior": { "type": "...", "style": "...", "windowLight": "..." },
  // OR
  "urban": { "type": "...", "architecture": "...", "density": "..." },
  // OR
  "nature": { "type": "...", "vegetation": "...", "terrain": "..." },
  // ... etc
}`;

  return prompt;
}

export async function generateLocationFromPrompt(userPrompt, imageBase64 = null) {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const systemInstruction = buildOptionsPrompt();
    
    const parts = [{ text: systemInstruction }];
    
    if (userPrompt) {
      parts.push({ text: `\nUSER DESCRIPTION: "${userPrompt}"` });
    }
    
    if (imageBase64) {
      const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Clean
        }
      });
      parts.push({ text: "Analyze this image and generate the location configuration matching it." });
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(`${GEMINI_TEXT_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.find(p => p.text);

    if (!textPart) {
      throw new Error('No text in Gemini response');
    }

    let jsonStr = textPart.text;
    // Clean markdown if present (though responseMimeType: json should prevent it)
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr);
    
  } catch (err) {
    console.error('[LocationGenerator] Error:', err);
    throw new Error('Failed to generate location: ' + err.message);
  }
}
