const multer = require("multer");
const path = require("path");
const express = require('express');
const ApiError = require("@/utils/ApiError");
const CSVFileUploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const distDir = "/csv";
        let csvDirectory = path.join(__dirname, distDir);
        cb(null, csvDirectory);
    },
    filename: function (req, file, cb) {
        let removeSpecialCharacters = file.originalname.toLowerCase().replace(/[^A-Z0-9.]+/ig, "-");
        cb(null, file.fieldname + "-" + Date.now() + "-" + removeSpecialCharacters);
    }
})

const csvFileFilter = (req, file, cb) => {
    console.log(file.mimetype);
    if (file.mimetype.includes('csv') || file.mimetype.includes('ms-excel'))
        cb(null, true)
    else
        cb(new ApiError(400, "Please upload CSV file."), false);

}
const CSVUpload = multer({ fileFilter: csvFileFilter, storage: CSVFileUploadStorage })
module.exports = {
    CSVUpload
    // fileUpload
};