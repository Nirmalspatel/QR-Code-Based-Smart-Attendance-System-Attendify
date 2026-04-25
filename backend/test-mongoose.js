import mongoose from "mongoose";

const childSchema = new mongoose.Schema({ name: String });
const parentSchema = new mongoose.Schema({ children: [childSchema] });
const Parent = mongoose.model("Parent", parentSchema);

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/test_db");
  const p = new Parent({ children: [{ name: "A" }, { name: "B" }] });
  await p.save();
  const idToDel = p.children[0]._id.toString();
  
  // method 1
  p.children.pull({ _id: idToDel });
  console.log("After pull({_id}):", p.children.length); // does this work?
  
  await mongoose.disconnect();
}
run();
