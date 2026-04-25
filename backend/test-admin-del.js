import mongoose from "mongoose";
import { AcademicStructure } from "./model/AcademicStructure.js";
import { Teacher } from "./model/Teacher.js";

async function testDelete() {
  await mongoose.connect("mongodb://127.0.0.1:27017/attendance"); // adjust db name if needed, check app.js
  
  // Add a stream
  let root = await AcademicStructure.findOne();
  if (!root) {
    root = new AcademicStructure({ streams: [] });
  }
  root.streams.push({ name: "stream1", courses: [{ name: "course1" }] });
  await root.save();
  const stream = root.streams[root.streams.length - 1]; // get the one we just added
  const course = stream.courses[0];
  
  try {
    const streamId = stream._id.toString();
    const courseId = course._id.toString();
    
    console.log("Before pull");
    await Teacher.updateMany({}, {
      $pull: { allowedAccess: { courseId: courseId } }
    });
    console.log("UpdateMany success");
    
    // Now delete course
    const s = root.streams.id(streamId);
    const c = s.courses.id(courseId);
    c.deleteOne();
    await root.save();
    console.log("Course deleted successfully. Remaining courses in memory:", s.courses.length);
    
    const root2 = await AcademicStructure.findOne();
    console.log("Remaining courses in DB:", root2.streams.id(streamId).courses.length);
  } catch (err) {
    console.error("Error DeleteCourse:", err);
  }
  
  await mongoose.disconnect();
}
testDelete();