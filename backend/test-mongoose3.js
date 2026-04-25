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
  await p.save();
  
  const p2 = await Parent.findById(p._id);
  console.log("After save:", p2.children.length);
  
  await mongoose.disconnect();
}
run();