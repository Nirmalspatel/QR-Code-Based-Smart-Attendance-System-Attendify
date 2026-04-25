import mongoose from 'mongoose';
import AdminController from './controllers/AdminController.js';
import { AcademicStructure } from './model/AcademicStructure.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/attendance'); // make sure name is right

  let root = await AcademicStructure.findOne();
  if (!root) {
    root = new AcademicStructure({ streams: [] });
  }
  root.streams.push({ name: 'DelTestStream', courses: [] });
  await root.save();
  const sid = root.streams[root.streams.length - 1]._id.toString();

  const req = {
    params: { streamId: sid }
  };
  const res = {
    status: function(code) { this.code = code; return this; },
    json: function(data) { console.log('Response:', this.code, data); }
  };

  console.log('Testing DeleteStream...');
  await AdminController.DeleteStream(req, res);

  mongoose.disconnect();
}
run();