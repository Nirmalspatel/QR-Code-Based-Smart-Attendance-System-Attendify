import mongoose from "mongoose";
const schema = mongoose.Schema;

const divisionSchema = new schema({
  name: { type: String, required: true },
});

const semesterSchema = new schema({
  name: { type: String, required: true },
  divisions: [divisionSchema],
});

const courseSchema = new schema({
  name: { type: String, required: true },
  semesters: [semesterSchema],
});

const streamSchema = new schema({
  name: { type: String, required: true },
  courses: [courseSchema],
});

// Single root document per institution
const academicStructureSchema = new schema(
  {
    streams: [streamSchema],
  },
  { timestamps: true }
);

export const AcademicStructure = mongoose.model(
  "academicstructure",
  academicStructureSchema
);
