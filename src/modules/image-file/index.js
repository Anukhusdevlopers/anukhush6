const multer = require("multer");

const storage = multer.diskStorage({
    destination: './public/userImages/',
    filename: function (req, file, cb) {
        const uniqueShuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const getFileName = file.originalname.toLowerCase().replace(/ /g, '-');

        cb(null, file.fieldname + '-' + uniqueShuffix + '-' + getFileName,"/..src/images");
    },
});


const upload = multer({
  
    storage
});

module.exports = upload;