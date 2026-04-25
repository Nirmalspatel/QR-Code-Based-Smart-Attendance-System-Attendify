import mongoose from "mongoose";
const schema = mongoose.Schema;

const userSchema = new schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    pno: { type: String, required: true },
    password: { type: String, required: true }, // Password save as hash
    profileImage: { type: String, default: "" },
    // Admin grants teacher access to specific stream+course combinations
    allowedAccess: [
      {
        streamId: { type: schema.Types.ObjectId },
        streamName: { type: String },
        courseId: { type: schema.Types.ObjectId },
        courseName: { type: String },
        semesterId: { type: schema.Types.ObjectId },
        semesterName: { type: String },
      },
    ],
    subjects: [
      {
        name: { type: String, required: true },
        code: { type: String, default: "" },
        sessions: [
          {
            session_id: { type: String, required: true },
            date: { type: String, required: true },
            time: { type: String, required: true },
            name: { type: String, required: true },
            duration: { type: String, required: true },
            location: { type: String, required: true },
            radius: { type: String, required: true },
            isExpired: { type: Boolean, default: false },
            streamId: { type: schema.Types.ObjectId, default: null },
            streamName: { type: String, default: "" },
            courseId: { type: schema.Types.ObjectId, default: null },
            courseName: { type: String, default: "" },
            semesterId: { type: schema.Types.ObjectId, default: null },
            semesterName: { type: String, default: "" },
            divisions: [{ type: String }],
            attendance: [
              {
                regno: { type: String, required: true },
                student_name: { type: String },
                image: { type: String, required: true },
                IP: { type: String, required: true },
                date: { type: String, required: true },
                student_email: { type: String, required: true },
                Location: { type: String, required: true },
                distance: { type: String, required: true },
              },
            ],
          },
        ],
      },
    ],
    sessions: [
      {
        session_id: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        name: { type: String, required: true },
        duration: { type: String, required: true },
        location: { type: String, required: true },
        radius: { type: String, required: true },
        isExpired: { type: Boolean, default: false },
        streamId: { type: schema.Types.ObjectId, default: null },
        streamName: { type: String, default: "" },
        courseId: { type: schema.Types.ObjectId, default: null },
        courseName: { type: String, default: "" },
        semesterId: { type: schema.Types.ObjectId, default: null },
        semesterName: { type: String, default: "" },
        divisions: [{ type: String }],
        attendance: [
          {
            regno: { type: String, required: true },
            student_name: { type: String },
            image: { type: String, required: true },
            IP: { type: String, required: true },
            date: { type: String, required: true },
            student_email: { type: String, required: true },
            Location: { type: String, required: true },
            distance: { type: String, required: true },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("teacher", userSchema);
