import axios from 'axios';

const BASE_URL = 'http://localhost:5051';

async function testEndpoints() {
  console.log('--- Testing Backend Endpoints ---');

  try {
    // 1. Test Signup (Student)
    console.log('\nTesting /users/signup (Student)...');
    const studentData = {
      name: 'Test Student',
      email: 'student@test.com',
      pno: '1234567890',
      dob: '2000-01-01',
      password: 'hashed_password', // Mocking hashed password
      type: 'student'
    };
    try {
      const signupRes = await axios.post(`${BASE_URL}/users/signup`, studentData);
      console.log('Signup Success:', signupRes.status);
    } catch (err) {
      console.log('Signup Result:', err.response?.data?.message || err.message);
    }

    // 2. Test Login
    console.log('\nTesting /users/signin...');
    const loginRes = await axios.post(`${BASE_URL}/users/signin`, {
      email: 'student@test.com',
      password: 'hashed_password'
    });
    console.log('Login Success:', loginRes.status);
    
    // Extract cookie from response if available
    const setCookie = loginRes.headers['set-cookie'];
    const cookieHeader = setCookie ? setCookie[0].split(';')[0] : '';
    console.log('Using Cookie:', cookieHeader ? 'Yes' : 'No');

    // 3. Test Student Sessions (Protected)
    console.log('\nTesting /sessions/getStudentSessions...');
    const sessionsRes = await axios.post(`${BASE_URL}/sessions/getStudentSessions`, {}, {
      headers: { 
        Cookie: cookieHeader 
      }
    });
    console.log('Get Student Sessions Success:', sessionsRes.status);
    console.log('Sessions:', sessionsRes.data.sessions.length);

    // 4. Test Forgot Password
    console.log('\nTesting /users/forgotpassword...');
    const forgotRes = await axios.post(`${BASE_URL}/users/forgotpassword`, {
      email: 'student@test.com',
      password: 'new_hashed_password'
    });
    console.log('Forgot Password Success:', forgotRes.status);

  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

testEndpoints();
