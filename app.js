const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();


const app = express();
app.use(bodyParser.json({ limit: '4.5mb' }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });
const transporter = nodemailer.createTransport({
  service: 'gmail', // Gmail SMTP
  auth: {
    user: 'inquiry.ihds@gmail.com',         // Replace with your Gmail address
    pass: 'qlvcofrqeflishvd',            // Replace with the generated App Password or your Gmail password
  },
});


mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const imageSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    image: String
});

const Image = mongoose.model('Image', imageSchema);
 

app.get('/',(req,res)=>{
 
   res.json({message:"hello All Good 👍"});

});


app.get('/api/kitchen', async (req, res) => {
  try {
    const kitchenItems = await Image.find({ category: 'kitchen' });
    res.json(kitchenItems);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/IhdUploadImg', async (req, res) => {
    const { name, description, category, image } = req.body;

    const newImage = new Image({
        name,
        description,    
        category,
        image
    });

    await newImage.save();
    res.send('Image uploaded successfully');
});

app.get('/images/:category', async (req, res) => {
    const { category } = req.params;
    const images = await Image.find({ category });
    res.json(images);
});



app.put('/IhdUploadImg/:id', async (req, res) => {
    const { description } = req.body;
  
    try {
      const updatedImage = await Image.findByIdAndUpdate(req.params.id, { description }, { new: true });
      if (!updatedImage) return res.status(404).json({ message: 'Image not found' });
      res.json(updatedImage);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  
  app.delete('/delete/:id', async (req, res) => {
    try {
      const deletedImage = await Image.findByIdAndDelete(req.params.id);
      if (!deletedImage) return res.status(404).json({ message: 'Image not found' });
      res.json({ message: 'Image deleted' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    } 
  });



app.post('/send-email', upload.single('media'), (req, res) => {
  const { user_name, user_email, number, user_location, looks } = req.body;
  console.log(user_name);
  console.log(user_email);

  const mailOptions = {
    from: `"${user_name}" <${user_email}>`, // Sender's email
    to: 'official.prajwalpal@gmail.com',                     // Recipient email
    subject: 'New Consultation Request',
    text: `Name: ${user_name}\nEmail: ${user_email}\nPhone: ${number}\nLocation: ${user_location}\nRequirements: ${looks}`,
    attachments: req.file
      ? [
          {
            filename: req.file.originalname,
            content: req.file.buffer,
          },
        ]
      : [],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  });
});

const port=process.env.PORT||5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
