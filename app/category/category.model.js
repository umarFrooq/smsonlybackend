const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { deleteFromS3 } = require("../../config/upload-to-s3");
const { toJSON, paginate } = require("../../utils/mongoose");
const { categoryTypes, platforms, catLocation } = require("../../config/enums");
const autopopulate = require("mongoose-autopopulate");
const config = require("../../config/config");
const { getBucketUrl } = require("../../utils/helperFunctions");
const categoriesSpecsSchema = new Schema({
  productsCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  lastUpdated: { type: Date },
  updated: Boolean
})
const categorySchema = new Schema({

  name: { type: String, required: true },
  slug: { type: String },
  commission: { type: Number },
  description: { type: String },
  mainImage: { type: String },
  gallery: [{ type: String }],
  type: {
    type: String,
    enum: [categoryTypes.MAIN_CATEGORY, categoryTypes.SUB_CATEGORY],
    default: categoryTypes.MAIN_CATEGORY,
  },
  //hasChildren:{type:Boolean,default:false},
  mainCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
  //children: [{ type: Schema.Types.ObjectId, ref: 'Category'}],  
  // user:{ type: Schema.Types.ObjectId, ref: 'User'}
  attributes: [{ type: String }],
  attributeRequired: { type: Boolean, default: false },
  bannerImage: { type: String },
  wideBannerImage: { type: String },
  categorySpecs: { type: categoriesSpecsSchema },
  lang: Object,
  index: { type: Number ,default: 1000},
  featured: { type: Boolean, default: false },
  platformId: { type: String },
  platform: {
     type: String ,
    enum: [platforms.ALIEXPRESS, platforms.BAZAARGHAR],
    default: platforms.BAZAARGHAR
  }
  ,

  bannerPhone: { type: String },
  lang: Object,
  videoCount: { type: Number,default:0 },
  ae_id:[{type:String}],
  platform_specs:[{
  categoryId:{type:String},
  categoryName:{type:String},
  platform:{type:String},
 }],
  location:[{
     type: String,
     default:[catLocation.DEFAULT],
     enum : Object.values(catLocation)
     }],
  tree: { type: String },
  mappedWith: { type: Schema.Types.ObjectId, ref: 'Category' },
},

  {
    timestamps: true,
    toJSON: { virtuals: true }
  });

// categorySchema.pre("find", function (next) {
//   this.populate({
//     path: 'subCategories',
//     // Get subCategories of subCategories - populate the 'subCategories' array for every Category
//     populate: { path: 'subCategories' }
//   });

// this.populate({
//   path: 'subCategories',
//   // Get childrenCategory of childrenCategory - populate the 'childrenCategory' array for every Category
//   populate: { path: 'subCategories' }
// });



//   next();
// });
categorySchema.pre("remove", async function (next) {
  const category = this;
  //index.deleteObject(product._id)
  if (category.type === "main") {

    const subCategories = await Category.find({ mainCategory: category._id })
    // await Product.deleteMany({_id: {$in: variants}}).exec();
    let subCategoriesIds = [];
    for (i = 0; i < subCategories.length; i++) {
      subCategoriesIds.push(subCategories[i]._id.toString())
      if (subCategories[i].mainImage) {
        await deleteFromS3(subCategories[i].mainImage);
      }
      if (subCategories[i].gallery.length > 0) {
        await deleteFromS3(subCategories[i].gallery);
      }

    }
    await Category.deleteMany({ _id: { $in: subCategoriesIds } }).exec()



  }
  next();
});
// Post find hook
categorySchema.post('init', (doc) => {
  if (config.env == "production") {
    try {
      const bucketHost = getBucketUrl()
      doc.gallery = doc.gallery.map(url => {
        return url ? url.replace(bucketHost, config.aws.awsCdnHost) : url
      })
      const mainImgUrl = doc.mainImage
      doc.mainImage = mainImgUrl ? mainImgUrl.replace(bucketHost, config.aws.awsCdnHost) : mainImgUrl
      return doc
    } catch (err) {
      return doc
    }
  }
})

categorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'mainCategory',
  autopopulate: true,
  options:{sort:{index:1}}

});
categorySchema.virtual('mappedWithCategory', {
  ref: 'Category',
  localField: 'mappedWith',
  foreignField: '_id',
  autopopulate: {
    maxDepth: 1
  },
  options: {
    select: {
      name: 1,
      tree: 1,
    }
  }
});

// add plugin that converts mongoose to json
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);
categorySchema.plugin(autopopulate);
// categorySchema.plugin(mongoose_delete,{
//   overrideMethods:['count','countDocuments',  'find', 'findOne', 'findOneAndUpdate', 'update'],
//   deletedAt : true
//   });
// Create a model
const Category = mongoose.model("Category", categorySchema);



// Export the model
module.exports = Category;