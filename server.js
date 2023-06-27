const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const dotenv = require('dotenv');
dotenv.config();

app.use(express.static(path.join(__dirname, "Public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());



const usersDbConnection = mongoose.createConnection(process.env.USERS_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const routesDbConnection = mongoose.createConnection(process.env.ROUTES_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const plansDbConnection = mongoose.createConnection(process.env.PLANS_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messageDbConnection = mongoose.createConnection(process.env.MESS_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});







// create data Schema
const studentSchema = {
  fullName: String,
  email: String,
  userName: String,
  password: String,
  box: Boolean,
};

const guestSchema = {
  fullName: String,
  email: String,
  userName: String,
  password: String,
  box: Boolean,
};

const adminSchema = {
  fullName: String,
  email: String,
  password: String,
  box: Boolean,
};

const routeSchema = new mongoose.Schema({
  fromLotNum: Number,
  toLotNum: Number,
  fromLotCo: String,
  toLotCo: String,
  checkpoints: [String], // Changed from [[String]] to [String]
  times: [String], // Changed from [[String]] to [String]
});

const planSchema = {
  duration: String,
  price: Number,
};

const messageSchema = new mongoose.Schema({
  content: String,
  timestamp: Date,
});


const Route = routesDbConnection.model("Route", routeSchema);
const Plan = plansDbConnection.model("Plan", planSchema);
const Admin = usersDbConnection.model("Admin", adminSchema);
const Guest = usersDbConnection.model("Guest", guestSchema);
const Student = usersDbConnection.model("Student", studentSchema);
const Message = messageDbConnection.model("Message", messageSchema);

app.post('/api/messages', async (req, res) => {
  try {
    const { sender, content } = req.body;
    const newMessage = new Message({ sender, content, timestamp: new Date() });
    await newMessage.save();
    res.status(201).send('Message created successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating message');
  }
});





app.get('/api/plans', async (req, res) => {
  try {
    const plans = await Plan.find(); // Fetch plans from the database
    console.log('Fetched plans:', plans); // Log the fetched plans data
    res.json(plans); // Send the plans data as a JSON response
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching plans data');
  }
});

app.put('/api/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, price } = req.body;
    await Plan.updateOne({ _id: id }, { duration, price });
    res.status(200).send('Plan updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating plan');
  }
});

app.delete('/api/plans/:id', async (req, res) => {
  try {
      const { id } = req.params;
      await Plan.deleteOne({ _id: id });
      res.status(200).send('Plan deleted successfully');
  } catch (error) {
      console.error(error);
      res.status(500).send('Error deleting plan');
  }
});

app.post('/api/plans', async (req, res) => {
  try {
      const { duration, price } = req.body;
      const newPlan = new Plan({ duration, price });
      await newPlan.save();
      res.status(201).send('Plan created successfully');
  } catch (error) {
      console.error(error);
      res.status(500).send('Error creating plan');
  }
});

  

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/Index.html");
});

app.get("/signup", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Register/SignUpPage.html");
});

app.post("/", function (req, res) {
    if (req.body.email.toLowerCase().endsWith("@montclair.edu")) {
      bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
          console.log(err);
        } else {
          let newStudent = new Student({
            fullName: req.body.fullName,
            email: req.body.email.toLowerCase(),
            userName: req.body.userName,
            password: hash,
            box: req.body.box === "terms-checked",
          });
          newStudent.save();
          res.redirect("/");
        }
      });
    } else {
      res.send(
        'You must use a Montclair University Email to sign up. <a href="/signup">Go back to sign up</a>'
      );
    }
  });
  
  app.post("/guest-signup", function (req, res) {
      bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
          console.log(err);
        } else {
          let newGuest = new Guest({
            fullName: req.body.fullName,
            email: req.body.email.toLowerCase(),
            userName: req.body.userName,
            password: hash,
            box: req.body.box === "terms-checked",
          });
          newGuest.save();
          res.redirect("/");
        }
      });
    });
  


app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Register/LoginPage.html");
});

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.post("/login", async function (req, res) {
  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  try {
    const foundStudent = await Student.findOne({ email: email });
    const foundGuest = await Guest.findOne({ email: email });
    const foundAdmin = await Admin.findOne({ email: email });

    if (foundStudent || foundGuest || foundAdmin) {
      const foundUser = foundStudent || foundGuest || foundAdmin;
      bcrypt.compare(password, foundUser.password, function (err, result) {
        if (result === true) {
          res.cookie("name", foundUser.fullName);
          if (foundAdmin) {
            res.redirect("/admin"); // Redirect admins to the admin page
          } else {
            res.redirect("/user"); // Redirect non-admins to the bank page
          }
        } else {
          res.redirect("/login?error=Incorrect%20password!");
        }
      });
    } else {
      res.redirect("/login?error=No%20user%20found%20with%20this%20email!");
    }
  } catch (err) {
    console.log(err);
  }
});

  
app.get("/routeEditor", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Admin/Route.html");
});

app.get("/GuestSignup", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Register/GuestSignup.html");
});

app.use(express.static(__dirname + "/static"));

app.get("/user", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/User/userHome.html");
});


app.get("/admin", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Admin/AdminHome.html");
});

app.get("/plans", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Admin/plan.html");
});

app.get("/driver", function (req, res) {
  res.sendFile(__dirname + "/Public/Pages/Admin/AdminHome.html");
});

app.put('/update-route/:id', async function(req, res) {
  const routeId = req.params.id;
  const updatedValues = req.body;

  try {
    const updatedRoute = await Route.findByIdAndUpdate(routeId, updatedValues, { new: true });
    res.status(200).json(updatedRoute);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating route');
  }
});

app.delete('/delete-route/:id', async function(req, res) {
  const routeId = req.params.id;

  try {
    await Route.findByIdAndDelete(routeId);
    res.status(200).send('Route successfully deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting route');
  }
});


app.post("/add-route", async function (req, res) {
  try {
    const checkpointInputs = req.body.checkpointInputs;
    const timeInputs = req.body.timeInputs; // Get the timeInputs from the request body

    const newRoute = new Route({
      fromLotNum: req.body.fromLotNum,
      toLotNum: req.body.toLotNum,
      fromLotCo: req.body.fromLotCo,
      toLotCo: req.body.toLotCo,
      checkpoints: checkpointInputs, // Removed the array brackets
      times: timeInputs, // Add the times property here
    });

    await newRoute.save();
    res.status(201).send("Route successfully added");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding route");
  }
});


app.get("/routes", async function (req, res) {
  try {
    const routes = await Route.find();
    res.status(200).json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving routes");
  }
  

});



app.listen(3000, async function () {
  console.log("server is running on 3000");
  const open = await import("open");
  await open.default("http://localhost:3000");
});