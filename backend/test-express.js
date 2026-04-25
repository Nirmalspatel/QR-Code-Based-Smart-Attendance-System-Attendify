import express from 'express';
import adminRoutes from './routes/adminRoutes.js';
import mongoose from 'mongoose';
import JWT from './middleware/JWT.js';

// mock auth
JWT.verifyToken = (req, res, next) => next();

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/attendance');
  const server = app.listen(5052, async () => {
    console.log('Test server up on 5052');
    
    // Create a stream to delete
    const root = await mongoose.model('academicstructure').findOne();
    root.streams.push({ name: 'Test12345', courses: [] });
    await root.save();
    const sid = root.streams[root.streams.length - 1]._id.toString();
    
    const resp = await fetch(`http://localhost:5052/admin/stream/${sid}`, { method: 'DELETE' });
    const data = await resp.json();
    console.log('Status:', resp.status, data);
    
    server.close();
    mongoose.disconnect();
  });
}
test();