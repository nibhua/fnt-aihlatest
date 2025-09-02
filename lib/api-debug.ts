// lib/api-debug.ts
// Debug utility to check API responses

// Use environment variable for API base URL to call backend directly
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export async function debugApiResponse(endpoint: string, options: RequestInit = {}) {
  console.log(`🔍 Debugging API call to: ${API_BASE}${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📡 Raw response text:`, responseText);
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log(`📡 Parsed JSON:`, jsonData);
      
      // Check if it looks like a log entry
      if (responseText.includes('PERFORMANCE') || responseText.includes('REQUEST') || responseText.includes('RESPONSE')) {
        console.warn(`⚠️  WARNING: Response looks like a log entry!`);
        console.warn(`   This might indicate the frontend is receiving backend logs instead of API responses.`);
      }
      
      return jsonData;
    } catch (parseError) {
      console.log(`📡 Response is not valid JSON:`, parseError);
      return responseText;
    }
    
  } catch (error) {
    console.error(`❌ API call failed:`, error);
    throw error;
  }
}

export async function testBackendHealth() {
  console.log('🏥 Testing backend health...');
  return debugApiResponse('/');
}

export async function testChatSession() {
  console.log('💬 Testing chat session creation...');
  const formData = new FormData();
  formData.append('collection_id', 'test');
  
  return debugApiResponse('/chat/sessions', {
    method: 'POST',
    body: formData,
  });
}

export async function testBuildCollection() {
  console.log('📚 Testing collection build...');
  const formData = new FormData();
  formData.append('files', new Blob(['fake pdf content'], { type: 'application/pdf' }), 'test.pdf');
  
  return debugApiResponse('/collections/build', {
    method: 'POST',
    body: formData,
  });
}

// Add this to your browser console to test:
// import { testBackendHealth, testChatSession, testBuildCollection } from './lib/api-debug';
// testBackendHealth().then(console.log);