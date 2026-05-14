import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

async function testConnection() {
  console.log('Testing connection to backend at:', API_URL);
  try {
    const response = await axios.get(`${API_URL}/../../health`);
    console.log('✅ Connection to Backend Health Check successful!');
    console.log('Response:', response.data);
    
    // Try to list meals (public endpoint if not protected, or just check if it responds)
    try {
        const mealsResponse = await axios.get(`${API_URL}/meals`);
        console.log('✅ Fetching meals responded (might be 401 but connection is alive)');
    } catch (e: any) {
        if (e.response && e.response.status === 401) {
            console.log('✅ Connection alive (Received 401 Unauthorized as expected)');
        } else {
            console.error('❌ Error fetching meals:', e.message);
        }
    }

  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testConnection();
