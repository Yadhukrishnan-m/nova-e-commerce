const multer=require('multer');
const path=require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/productImages'); 
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);// to get the extenssion 

        const randomDigit = Math.floor(Math.random() * 10);
        cb(null, Date.now() + randomDigit + ext); //give unique file name
    }
});

const upload = multer({ storage });

module.exports = upload;