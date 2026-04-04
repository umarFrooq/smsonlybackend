const {categories,} = require("./data/category.seed");
const {users} = require("./data/user.seed");
const { mobileProducts,
  tabletProducts,
  menFashionProducts,
  womenFashionProducts,
  healthAndBeautyProducts,
  watchesAndJeweleryProducts} = require("./data/product.seed");
const db = require("./config/mongoose");
const {connectDB} = require("./config/mongoose");
const logger = require('./config/logger');


  
const User = db.User;
const Token = db.Token;
const Product = db.Product;
const Category = db.Category;
const Cart = db.Cart;
const Package = db.Package;
const PackageItem = db.PackageItem;
const Address = db.Address;
const WishList = db.WishList;
const Review = db.Review;
connectDB()
const importData = async () => {
  try {
    await User.deleteMany()
    await Token.deleteMany()
    await Product.deleteMany()
    await Category.deleteMany()
    await Cart.deleteMany()
    await Package.deleteMany()
    await PackageItem.deleteMany()
    await Address.deleteMany()
    await WishList.deleteMany()
    await Review.deleteMany()

 

    const createdUsers = await User.insertMany(users)
    const adminUser = createdUsers[0]._id;
    const supplierUser = createdUsers[1]._id;
    const ordinaryUser = createdUsers[2]._id;
    
    const sampleCategories = categories.map((category) => {
      return { ...category, user: adminUser }
    })
    
    const createdCategories=await Category.insertMany(sampleCategories)
    const electronicDevicesCategory = createdCategories[0]._id;
    const electronicAccessoriesCategory = createdCategories[1]._id;
    const menfashionCategory = createdCategories[2]._id;
    const womenfashionCategory = createdCategories[3]._id;
    const healthAndBeautyCategory = createdCategories[4]._id;
    const watchesAndJeweleryCategory = createdCategories[5]._id;

    const mobiles = mobileProducts.map((mobile) => {
      return { ...mobile, category: electronicDevicesCategory, user: supplierUser }
    })
    const createdMobiles=await Product.insertMany(mobiles)
    
    const tablets = tabletProducts.map((tablet) => {
      return { ...tablet, category: electronicDevicesCategory, user: supplierUser }
    })
    const createdtablets=await Product.insertMany(tablets)
    
    const mFashionProducts = menFashionProducts.map((product) => {
      return { ...product, category: menfashionCategory, user: supplierUser }
    })
    const createdMenFashion=await Product.insertMany(mFashionProducts)

    const womenFashion = womenFashionProducts.map((product) => {
      return { ...product, category: womenfashionCategory, user: supplierUser }
    })
    const createdWomenFashion=await Product.insertMany(womenFashion)

    const healthAndBeauty = healthAndBeautyProducts.map((product) => {
      return { ...product, category: healthAndBeautyCategory, user: supplierUser }
    })
    const createdhealthAndBeauty=await Product.insertMany(healthAndBeauty)
    
    const watchesAndJewelery =  watchesAndJeweleryProducts.map((product) => {
      return { ...product, category: watchesAndJeweleryCategory, user: supplierUser }
    })
    const createdwatchesAndJewelery=await Product.insertMany(watchesAndJewelery)
    
    logger.info(`Data Imported!`);
   
    process.exit()
  } catch (error) {
    logger.error(`${error}`)
   // console.error(`${error}`)
    process.exit(1)
  }
}

const destroyData = async () => {
  try {
    await User.deleteMany()
    await Token.deleteMany()
    await Product.deleteMany()
    await Category.deleteMany()
    await Review.deleteMany()
 
    logger.info(`Data Imported!`);
    process.exit()
  } catch (error) {
    logger.error(`${error}`)
    process.exit(1)
  }
}

if (process.argv[2] === '-d') {
  destroyData()
} else {
  importData()
}