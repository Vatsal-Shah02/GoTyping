const mongoose = require("mongoose");
//mongodb://localhost:27017/GoTypingRegistration
mongoose.connect(process.env.mongoURI).then(()=>{
    console.log(`connection sucessful`);
}).catch((e)=>{
    console.log(e);
})