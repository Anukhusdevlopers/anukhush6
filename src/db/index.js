const mongoose = require("mongoose");


mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log('Database Connected successfully!');
}).catch((err) => {
    console.log(err)
    console.log("Database not connected.");
});

