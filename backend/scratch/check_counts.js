import mongoose from 'mongoose';
import { Student } from '../model/Student.js';
import { Teacher } from '../model/Teacher.js';
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
    const sCount = await Student.countDocuments();
    const tCount = await Teacher.countDocuments();
    console.log('---COUNTS_START---');
    console.log('Students:', sCount);
    console.log('Teachers:', tCount);
    console.log('---COUNTS_END---');
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
