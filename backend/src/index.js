import 'dotenv/config';
import connectDB from "./db/index.js";
import { app } from './app.js';

app.on('error', (err) => {
    console.error('Server error', err);
    process.exit(1); // Exit the process with an error
})

connectDB()
.then(() => {
    app.listen(process.env.PORT, '0.0.0.0', ()=> {
        console.log(`Server running on port: ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MongoDB connection failed!!", err)
})