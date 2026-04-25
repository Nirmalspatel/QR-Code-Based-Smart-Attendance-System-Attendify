import mongoose from "mongoose";
const schema = mongoose.Schema;

const userSchema = new schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    pno: { type: String, required: true },
    regno: { type: String, required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "" },
    // Academic grouping (set at signup, updatable from Profile)
    streamId: { type: schema.Types.ObjectId, default: null },
    streamName: { type: String, default: "" },
    courseId: { type: schema.Types.ObjectId, default: null },
    courseName: { type: String, default: "" },
    semesterId: { type: schema.Types.ObjectId, default: null },
    semesterName: { type: String, default: "" },
    division: { type: String, default: "" },
    sessions: [
      {
        session_id: { type: String, required: true },
        subjectName: { type: String, default: "General" },
        date: { type: String, required: true },
        time: { type: String, required: true },
        name: { type: String, required: true },
        duration: { type: String, required: true },
        distance: { type: String, required: true },
        radius: { type: String, required: true },
        student_location: { type: String, required: true },
        image: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Student = mongoose.model("student", userSchema);

