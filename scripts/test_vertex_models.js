import { GoogleAuth } from 'google-auth-library';
import { fetch } from 'undici';
import config from '../src/backend/config.js';

// Load env
import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = config.VERTEX_PROJECT_ID;
const LOCATION = config.VERTEX_LOCATION || 'us-central1';

if (!PROJECT_ID) {
    console.error('❌ VERTEX_PROJECT_ID missing in .env');
    process.exit(1);
}

const MODELS_TO_TEST = [
    'gemini-3-pro-image-preview', // Requested by user (likely fail)
    'gemini-2.0-flash-exp',       // Known working
    'gemini-1.5-pro-002',       // Valid text model, likely fail image gen
    'google/gemini-2.0-flash-exp' // Alternative ID format
];

async function getAccessToken() {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    return await auth.getAccessToken();
}

async function testModel(modelId) {
    console.log(`\n🧪 Testing model: ${modelId}...`);
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelId}:generateContent`;

    const body = {
        contents: [{
            role: 'user',
            parts: [{ text: "Draw a small red circle" }]
        }],
        generationConfig: {
            responseModalities: ['Image'],
            imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
        }
    };

    try {
        const token = await getAccessToken();
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text();
            console.log(`❌ FAILED (${res.status}): ${txt.slice(0, 200)}`);
            return false;
        }

        const data = await res.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            console.log(`✅ SUCCESS! Generated image.`);
            return true;
        } else {
            console.log(`⚠️ OK Response but no image?`, JSON.stringify(data).slice(0, 200));
            return false;
        }

    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log(`Starting Vertex AI Diagnostics for Project: ${PROJECT_ID}`);

    for (const model of MODELS_TO_TEST) {
        await testModel(model);
    }
}

run();
