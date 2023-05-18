const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.get("/", (req, res) => {
  res.send("edu-toy server is running...");
});

// mongodb setup
const uri = process.env.DB_CONNECTION_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// authGuard
const authGuard = (req, res, next) => {
  console.log("i am guard");

  // check authorization
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "authorization failed authorization" });
  }

  // verify token
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET_KEY, (error, decode) => {
    if (error) {
      return res
        .status(402)
        .send({ error: true, message: "authorization failed verify token" });
    }

    // set data to body and got next
    req.decode = decode;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // edu toy server routes start

    const toysCollection = client.db("eduToyDB").collection("toys");

    // make jwt token
    app.post("/jwt", (req, res) => {
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // add a toy
    app.post("/toys", async (req, res) => {
      const toy = req.body;
      const result = await toysCollection.insertOne(toy);

      res.send(result);
    });

    // get all toys
    app.get("/toys", async (req, res) => {
      const toys = await toysCollection.find().toArray();

      res.send(toys);
    });

    // get a individual toy
    app.get("/toys/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const targetToy = await toysCollection.findOne(query);

      res.send(targetToy);
    });

    // get individual user toy
    app.get("/my-toys", authGuard, async (req, res) => {
      console.log("i am back", req.decode);
      const userEmail = req.query.email;

      // verify email
      if (req.decode.email !== userEmail) {
        return res.status(403).send({
          error: true,
          message: "authorization filed email not match",
        });
      }

      const userToys = await toysCollection
        .find({ email: userEmail })
        .toArray();

      res.send(userToys);
    });

    // get a individual toy by user email
    app.get("/my-toys/:id", async (req, res) => {
      const userEmail = req.query.email;

      console.log(req.params.id, req.query.email);

      const query = { _id: new ObjectId(req.params.id) };
      const targetToy = await toysCollection.findOne(query);

      res.send(targetToy);
    });

    // edu toy server routes end

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`edu toy server is running on port ${port}`);
});
