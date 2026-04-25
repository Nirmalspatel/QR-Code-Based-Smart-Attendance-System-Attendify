import mongoose from 'mongoose';
import { Teacher } from './model/Teacher.js';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/attendance'); // update with db name
  try {
    await Teacher.updateMany({}, {
      $pull: { allowedAccess: { courseId: '65f9cdabcdef123456789012' } }
    });
    console.log('Success');
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit();
}
test();