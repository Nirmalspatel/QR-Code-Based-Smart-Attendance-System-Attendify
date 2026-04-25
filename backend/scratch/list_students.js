import mongoose from 'mongoose';
import { Student } from '../model/Student.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB = process.env.MONGODB || 'mongodb://127.0.0.1:27017/atendo';

async function check() {
  try {
    await mongoose.connect(MONGODB);
    const students = await Student.find({}, { password: 0 });
    console.log('---STUDENT_LIST_START---');
    students.forEach(s => {
      console.log(`Name: ${s.name}, Email: ${s.email}, Group: ${s.streamName}/${s.courseName}/${s.division}`);
    });
    console.log('---STUDENT_LIST_END---');
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
