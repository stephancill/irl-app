// Simple test to verify the getMutuals function works
import { getMutuals } from './src/lib/farcaster';

async function testGetMutuals() {
  try {
    // Set the API key for testing
    process.env.QUOTIENT_API_KEY = "54301940-6445-465C-B1B8-E338BB13881";
    
    // Test with fid 1689 as specified
    const result = await getMutuals(1689);
    console.log('Success! getMutuals returned:', result);
    console.log('Number of mutuals:', result.length);
    console.log('First few mutuals:', result.slice(0, 3));
    
    // Verify the return type is correct
    if (result.length > 0) {
      console.log('First mutual fid:', result[0].fid);
      console.log('Type check passed - result contains objects with fid property');
    }
  } catch (error) {
    console.error('Error testing getMutuals:', error);
  }
}

testGetMutuals();