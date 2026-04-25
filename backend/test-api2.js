import axios from 'axios';

async function test() {
  try {
    // We don't have a token, so we can't test it this way since JWT.verifyToken is on the route.
    // Wait, let's just look at AdminController.js
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();