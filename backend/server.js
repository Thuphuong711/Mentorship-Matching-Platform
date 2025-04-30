const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const initDB = require("./config/db_config"); // connect to the database
const cors = require("cors");
const multer = require("multer");
const upload = multer();
const imagekit = require("./config/imagekit_config");
const checkAuth = require("./middleware/checkAuth"); // import the authentication middleware
const searchQueryBuilder = require("./searchQueryBuilder"); // import the search query builder
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static(path.join(__dirname, "../frontend"))); // Serve frontend files from the frontend directory
app.use(cors());

(async () => {
  const db = await initDB(); // initialize the database connection
  app.locals.db = db;

  app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }
    // prevent SQL injection
    const checkQuery = "SELECT * FROM user WHERE email = ?";
    try {
      const [existing] = await db.execute(checkQuery, [email]); // check if email already exists
      if (existing.length > 0) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      const insertQuery = "INSERT INTO user(email,password) VALUES(?, ?)";
      await db.execute(insertQuery, [email, hashedPassword]); // insert new user into the database
      const token = jwt.sign(
        {
          email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      ); // create JWT token
      res.status(201).json({
        message: "User registered successfully",
        token,
      }); // send response to the client
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }
    const q = "SELECT * FROM user WHERE email = ?"; // handle SQL injection
    try {
      const [result] = await db.execute(q, [email]); // check if email exists
      const user = result[0]; // get the first user from the result
      if (!user) {
        return res.status(400).json({
          message: "Invalid email or password. Cannot find user",
        });
      }
      const isMatch = bcrypt.compareSync(password, user.password); // compare password with hashed password
      if (!isMatch) {
        return res.status(400).json({
          message: "Password does not match",
        });
      }

      //JWT authorization
      const token = jwt.sign(
        {
          email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      ); // create JWT token

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          userId: user.userId, // for usage in mentorship request in discovery page
          name: user.name, // to dynamically render the name in the home page
          role: user.role, // for usage in mentorship request in discovery page
        },
      }); // send response to the client
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  app.post(
    "/uploadProfileImage",
    checkAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        const file = req.file;
        if (!file) {
          return res.status(400).json({
            message: "No file uploaded",
          });
        }

        const uploadResponse = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "profile-images",
        });
        res.status(200).json({
          url: uploadResponse.url,
        });
      } catch (err) {
        console.error("Error uploading file:", err);
        res.status(500).json({
          message: "Failed to upload profile image",
        });
      }
    }
  );

  app.post("/profile", checkAuth, async (req, res) => {
    const {
      name,
      dob,
      gender,
      role,
      skills,
      interests,
      bio,
      profileImageUrl,
      email,
    } = req.body;
    //require fields
    if (!email || !name || !dob || !gender || !role) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const q =
      "UPDATE user SET name=?, dob=?, gender=?, role=?, skills=?, interests=?, bio=?, profileImageUrl=? WHERE email = ?";

    try {
      // convert skills and interests array to strings to store in the database
      const skillsString = skills.join(",");
      const interestsString = interests.join(",");

      const [result] = await db.execute(q, [
        name,
        dob,
        gender,
        role,
        skillsString,
        interestsString,
        bio,
        profileImageUrl,
        email,
      ]);

      res.status(201).json({
        message: "Profile updated successfully",
      }); // send response to the client
    } catch (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  app.get("/profile", checkAuth, async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
      const q = "SELECT * FROM user WHERE email = ?";
      const [rows] = await req.app.locals.db.execute(q, [email]);

      if (rows.length === 0)
        return res.status(404).json({ message: "Profile not found" });

      res.json(rows[0]);
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // endpoint for searching users
  app.post("/discovery/search-users", checkAuth, async (req, res) => {
    const { basicFilters, advancedFilters } = req.body;

    try {
      const { query, queryParams } = searchQueryBuilder(
        basicFilters,
        advancedFilters
      ); // call the search query builder function to get the query and query parameters
      console.log("Query:", query);
      console.log("Query Params:", queryParams);

      const [rows] = await db.execute(query, queryParams); // execute the query with the parameters
      const users = rows.map((user) => ({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        gender: user.gender,
        skills: user.skills,
        interests: user.interests,
        profileImageUrl: user.profileImageUrl,
        bio: user.bio,
      }));
      res.status(200).json(users);
    } catch (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  //endpoint for sending mentorship request
  app.post("/discovery/mentorship-request", checkAuth, async (req, res) => {
    const { from_user, to_user } = req.body;

    if (!from_user || !to_user) {
      console.log("From user:", from_user);
      console.log("To user:", to_user);

      return res.status(400).json({
        message: "Cannot send request to yourself",
      });
    }

    try {
      const [existingRequest] = await db.execute(
        `SELECT * FROM mentorship_requests
                WHERE from_user = ? AND to_user = ?
                ORDER BY created_at DESC LIMIT 1`,
        [from_user, to_user]
      );

      if (existingRequest.length > 0) {
        const existing = existingRequest[0];

        if (existing.status === "pending" || existing.status === "accepted") {
          return res.status(409).json({
            message: "Request already sent",
          });
        }

        if (existing.status == "request") {
          if (existing.rejected_count > 3) {
            return res.status(403).json({
              message:
                "You cannot send more requests to this user (limit reached)",
            });
          }
        }
      }
      //Now allow sending request

      // no more blocking case, insert new request
      db.execute(
        `INSERT INTO mentorship_requests (from_user, to_user, status, rejected_count) VALUES (?, ?, 'pending', 0)`,
        [from_user, to_user]
      );

      res.status(201).json({
        message: "Mentorship request sent successfully",
      });
    } catch (err) {
      console.error("Error sending mentorship request:", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  
  // endpoint for getting all the mentorship requests for a user
  app.get("/home/mentorship-requests/:userId", checkAuth, async (req, res) => {
    const { userId } = req.params;
    try {
      const query = `
            SELECT r.id, r.from_user, u1.name AS from_user_name, 
            r.to_user, u2.name AS to_user_name, r.status, r.rejected_count
            FROM mentorship_requests r
            JOIN user u1 ON r.from_user = u1.userId
            JOIN user u2 ON r.to_user = u2.userId
            WHERE r.from_user = ? OR r.to_user = ?
            `;
      const [rows] = await db.execute(query, [userId, userId]);
      res.json(rows);
    } catch (err) {
      console.error("Error fetching mentorship requests:", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  });

  app.put(
    "/home/mentorship-requests/:id/status",
    checkAuth,
    async (req, res) => {
      const { id } = req.params;
      const { status } = req.body; // status can be 'accepted' or 'declined'

      if (!status) {
        return res.status(400).json({
          message: "Status is required",
        });
      }

      try {
        await db.execute(
          `UPDATE mentorship_requests SET status = ? WHERE id = ?`,
          [status, id]
        );
        res.json({ message: `Mentorship request ${status} successfully` });
      } catch (error) {
        console.error("Error updating mentorship request:", error);
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  );

  //Cancel mentorship request
  app.delete(
    "/home/mentorship-requests/:id/cancel",
    checkAuth,
    async (req, res) => {
      const { id } = req.params;
      try {
        await db.execute(`DELETE FROM mentorship_requests WHERE id = ?`, [id]);
        res.json({ message: `Mentorship request cancelled successfully` });
      } catch (error) {
        console.error("Error cancelling mentorship request:", error);
        return res.status(500).json({
          message: "Internal server error",
        });
      }
    }
  );

  app.use((req, res) => {
    res
      .status(404)
      .sendFile(path.resolve(__dirname, "../frontend/notFound.html"));
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();
