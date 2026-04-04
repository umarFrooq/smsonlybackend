const csv = require("csvtojson");
const Category = require("./category.model");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { categorySlugUpdater } = require("./category.service.js")
const fs = require("fs");

const createBulkCategory = async (file) => {
  let csvFilePath = "";
  if (file && file.path) csvFilePath = file.path;
  else
    return {
      status: 400,
      message: "CSV not found",
      isSuccess: false,
      data: [],
    };

    return await csv()
      .on("header", (header) => {
        const headers = [
          'Cat1','Cat2','Cat3'
        ]
        const _checkHeader = checkHeaders(headers, header)
        if (!_checkHeader) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Csv file not matched with template");
          // return { status: 400, message: "Csv file not matched with template", data: [], isSuccess: false };
        }
        //header=> [header1, header2, header3]
      })
      .fromFile(csvFilePath)
      .then(async (jsonObj) => {
        const categMap = new Map();
        let temCategories = [];
        for (let j = 0; j < jsonObj.length; j++) {
          let element = jsonObj[j];

          let cat2Rep = "";
          let cat1Rep = "";
          let cat3Rep = "";
          let cat1;
          let cat2;
          let cat3;
          if (element && element.Cat1) {
            cat1Rep = element.Cat1 && element.Cat1.replace(/:[a-zA-Z]+/, "");
          }
          if (element && element.Cat2) {
            cat2Rep = element.Cat2 && element.Cat2.replace(/:[a-zA-Z]+/, "");
          }
          if (element && element.Cat3) {
            cat3Rep = element.Cat3 && element.Cat3.replace(/:[a-zA-Z]+/, "");
          }
          if (cat1Rep) {
            const getCat = categMap.get(cat1Rep);
            if (!getCat) {
              cat1 = await Category.findOne({ name: cat1Rep });
              if (!cat1) {
                cat1 = new Category({
                  name: cat1Rep,
                });
                temCategories.push(cat1);
              }
              categMap.set(cat1Rep, cat1);
            } else cat1 = getCat

          }
          if (cat2Rep) {
            const getCat = categMap.get(cat2Rep);
            if (!getCat) {
              cat2 = await Category.findOne({ name: cat2Rep, mainCategory: cat1._id });
              if (!cat2) {
                cat2 = new Category({
                  name: cat2Rep,
                  mainCategory: cat1._id,
                  type: "sub",
                });
                temCategories.push(cat2);
              }
              categMap.set(cat2Rep, cat2);
            } else cat2 = getCat
          }
          if (cat3Rep) {
            const getCat = categMap.get(cat3Rep);
            if (!getCat) {
              cat3 = await Category.findOne({ name: cat3Rep, mainCategory: cat2._id });
              if (!cat3) {
                cat3 = new Category({
                  name: cat3Rep,
                  mainCategory: cat2._id,
                  type: "sub",
                });
                temCategories.push(cat3);
              }
              categMap.set(cat3Rep, cat3);
            } else cat3 = getCat
          }

        }
        if (temCategories && temCategories.length > 0) {
          let tempCatIds = temCategories.map((cat) => cat._id);
          await Category.insertMany(temCategories);
          categorySlugUpdater(tempCatIds);
        }
        if (fs.existsSync(csvFilePath))
            fs.unlinkSync(csvFilePath);
        return {
          status: 200,
          isSuccess: true,
          message: "bulk category created successfully",
        }

      }).catch((err) => {
        throw err
      });
}

function checkHeaders(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.every((val, index) => b.includes(val));
}

let slugGenerater = (name) => {
  let slug = name
    .toLowerCase()
    .trim()
    .split(" ")
    .join("-")
    .split("&")
    .join("and");
  return slug;
};

module.exports = {
  createBulkCategory,
};
