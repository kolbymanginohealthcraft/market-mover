// Test script to check policy content
const testPolicyContent = async () => {
  try {
    console.log('Testing policy content loading...');
    
    const response = await fetch('/api/policies/policies/terms/latest');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Policy data:', data);
      console.log('Content length:', data.policy?.content?.length || 0);
      console.log('Content preview:', data.policy?.content?.substring(0, 200) + '...');
    } else {
      console.error('Failed to load policy');
    }
  } catch (error) {
    console.error('Error testing policy content:', error);
  }
};

// Run the test
testPolicyContent(); 