const mongoose = require('mongoose');

const generateRegistrationNumber = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `USER-${dateString}-${randomNumber}`;
};

const run = async () => {
  try {
    const MONGODB_URL = "mongodb+srv://umar:abc@cluster0.brxnmks.mongodb.net/test";
    await mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const userSchema = new mongoose.Schema({
      registrationNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      fullname: { type: String, required: false },
      email: {
          type: String,
          required: false,
          trim: true,
          lowercase: true,
          sparse: true,
      },
      phone: {
          type: String,
          required: false,
          sparse: true,
      },
      verificationMethod: {
          type: String,
      },
      isEmailVarified: {
          type: Boolean,
          default: false,
      },
      isPhoneVarified: {
          type: Boolean,
          default: false,
      },
      password: {
          type: String,
          required: false,
          trim: true,
          minlength: 8,
          private: true,
      },
      userType: {
          type: String,
          required: true,
      },
      role: {
          type: String,
          default: "student",
      },
      facebookId: { type: String, unique: true, sparse: true, },
      googleId: { type: String, unique: true, sparse: true, },
      defaultAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
      sellerDetail: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerDetail' },
      appleId: { type: String, unique: true, sparse: true },
      origin: {
          source: { type: String },
          version: String
      },
      refCode: { type: String },
      wallet: {
          balance: { type: Number, default: 0 },
      },
      socialShop: {
          pageId: String,
          businessId: String,
          catalogId: String
      },
      lang: { type: Object },
      status: {
          type: String,
          default: "active",
      },
       payment: [{}],
      agreement: { type: Boolean, default: false },
      cnic: { type: String, unique: true, sparse: true },
      branchId: { type: mongoose.Schema.Types.ObjectId,required:true , ref: 'Branch'},
      permanentAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
      currentAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
      section:{type:String},
      gradeId: { type: mongoose.Schema.Types.ObjectId,required:false , ref: 'Grade'},
      rollNumber: {
        type: Number,
        sparse: true,
      },
      previousSchoolName: {
        type: String,
        trim: true,
      },
      gradeInPreviousSchool: {
        type: String,
        trim: true,
      },
      migration: {
        type: Boolean,
        default: false,
      },
      schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
      },
    }, {
        timestamps: true,
        toJSON: { virtuals: true }
    });

    const User = mongoose.model('User', userSchema);

    const users = await User.find({ registrationNumber: { $exists: false } });
    console.log(`Found ${users.length} users without a registration number.`);

    for (const user of users) {
      user.registrationNumber = generateRegistrationNumber();
      await user.save();
      console.log(`Updated user ${user.email} with registration number ${user.registrationNumber}`);
    }

    console.log('Finished updating users.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

run();
