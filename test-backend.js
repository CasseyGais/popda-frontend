// Test koneksi backend
import api from './src/lib/api.js';

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    const response = await api.post('/login', {
      email: 'test@example.com',
      password: 'password'
    });
    console.log('Login response:', response.data);
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
  }
}

testLogin();
