const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors())
app.use(express.json())


// routes
app.get("/", (req, res) => {
    res.send("edu-toy server is running...")
})







app.listen(port, () => {
    console.log(`edu toy server is running on port ${port}`);
})


