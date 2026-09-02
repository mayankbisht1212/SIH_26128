import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const imagePath = path.resolve(process.cwd(), "trial_image.jpeg");

const formData = new FormData();

formData.append(
  "file",
  fs.createReadStream(imagePath)
);
async function  main(){
const response = await axios.post(
  "http://localhost:5001/predict",
  formData,
  {
    headers: {
      ...formData.getHeaders(),
    },
  }
);
console.log(response.data);
}