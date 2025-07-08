import fetch from 'node-fetch';

async function testServer() {
  try {
    console.log('Testing server health endpoint...');
    const response = await fetch('http://localhost:5000/api/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is working! Response:', data);
    } else {
      console.log('❌ Server responded with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Error connecting to server:', error.message);
  }
}

testServer(); 