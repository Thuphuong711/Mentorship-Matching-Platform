const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./config/db_config'); // connect to the database
const cors = require('cors');
const multer = require('multer');
const upload = multer();
const imagekit = require('./config/imagekit_config'); 

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve frontend files from the frontend directory
app.use(cors());



app.post('/register', (req,res) => {
    const {email, password } = req.body;
    if(!email || !password){
        return res.status(400).json({message: 'Email and password are required'});
    }
    // prevent SQL injection
    const q = "SELECT * FROM user WHERE email = ?";
    db.query(q, [email], (err, result) => {
        if(err) {
            console.error("Error checking email:", err);
            return res.status(500).json({message: 'Internal server error'});
        }

        if(result.length > 0){
            return res.status(400).json({message: 'Email already exists'});
        }
        // Hash the password before storing it in the database
        try{
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);
            const q = "INSERT INTO user(email,password) VALUES(?, ?)";
            db.query(q, [email,hashedPassword], (err,result) => {
                if(err){
                    console.error("Error inserting user:", err);
                    return res.status(500).json({message: 'Internal server error'});
                }
                console.log("User registered successfully:", result);
                // implement JWT token when user registers successfully
                const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: '1h'});
                return res.status(201).json({message: 'User registered successfully', token});
            })
        }  catch(err){
            console.error("Error hashing password:", err);
            return res.status(500).json({message: 'Internal server error'});
        }
    })
})

app.post('/login', (req,res) => {
    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({message: 'Please fill all required fields'});
    }
    const q = "SELECT * FROM user WHERE email = ?";
    db.query(q,[email], (err,result) => {
        if(err){
            console.error("Error checking email:", err);
            return res.status(500).json({message: 'Server error'});
        }

        const user = result[0];
    
        if(!user){
            return res.status(400).json({message: 'Invalid credentials. Cannot find user'});
        }

        try{
            const isMatch = bcrypt.compareSync(password, user.password);
            if(!isMatch) {
                return res.status(400).json({message: 'Invalid credentials. Password does not match'});
            }

            res.status(200).json({message: 'User logged in successfully'});
            //now user is authenticated and log in successfully, create a JWT token
           
        } catch(err){
            console.error("Error comparing password:", err);
            return res.status(500).json({message: 'Internal server error'});
        }
    })
})

app.post('/uploadProfileImage',upload.single('file'), async(req,res) => {
    try{
        const file = req.file;
        if(!file){
            return res.status(400).json({message: 'No file uploaded'});
        }

        const uploadResponse = await imagekit.upload({
            file: file.buffer.toString('base64'),
            fileName: file.originalname,
            folder: 'profile-images',
        });
        res.status(200).json({url: uploadResponse.url});
    } catch(err){
        console.error("Error uploading file:", err);
        res.status(500).json({message: 'Failed to upload profile image'});
    }
})

app.post('/profile', (req,res) => {
    const {name, dob, gender, role, skills, interests, bio, profileImageUrl, email} = req.body;
    //require fields
    if(!email || !name || !dob || !gender || !role){
        return res.status(400).json({message: 'Please fill all required fields'});
    }

    const q = "UPDATE user SET name=?, dob=?, gender=?, role=?, skills=?, interests=?, bio=?, profileImageUrl=? WHERE email = ?";

    // convert skills and interests array to strings to store in the database
    const skillsString = skills.join(',');
    const interestsString = interests.join(',');
    db.query(q, [name, dob, gender, role, skillsString, interestsString, bio, profileImageUrl, email], (err,result) => {
        if(err){
            console.error("Database insert error:" , err);
            return res.status(500).json({message: 'Internal server error'});
        }

        res.status(201).json({message: 'Profile created successfully'});
    })
})

app.use((req, res) => {
    res.status(404).sendFile(path.resolve(__dirname, '../frontend/notFound.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})