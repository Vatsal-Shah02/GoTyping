const mongoose = require("mongoose");
//mongodb://localhost:27017/GoTypingRegistration
mongoose.connect("mongodb+srv://user:HCCRlKi19rbNsx1C@cluster0.w0umsg9.mongodb.net/test").then(()=>{
    console.log(`connection sucessful`);
}).catch((e)=>{
    console.log(e);
})