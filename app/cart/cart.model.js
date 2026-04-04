const { toJSON } = require("../../utils/mongoose");
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");
const { paymentMethods } = require("../../config/enums");
const { numberRounder } = require("../../config/components/general.methods");
const Schema = mongoose.Schema;
const en=require('../../config/locales/en')

const cartSchema = new Schema(
  {
    // items: [itemSchema],

    packages: [
      { type: Schema.Types.ObjectId, ref: "Package", autopopulate: true },
    ],

    user: {
      type: Schema.Types.ObjectId, ref: "User", unique: true,
      sparse: true, autopopulate: true,
    },
    total: {
      default: 0,
      type: Number,
    },
    subTotal: {
      default: 0,
      type: Number,
    },
    shippmentCharges: { default: 0, type: Number },
    internationalShipmentCharges:{type:Number, default:0},
    localShipmentCharges: { type: Number, default: 0 },
    wallet: { type: Boolean, default: false },
    paymentMethod: {
      type: String, enum: [
        paymentMethods.COD,
        paymentMethods.CARD,
        paymentMethods.WALLET_CARD,
        paymentMethods.COD_WALLET,
        paymentMethods.CARD_WALLET,
        paymentMethods.WALLET
      ],
      default: paymentMethods.COD
    },
    paymentTrace: {
      walletPaid : { type: Number, default: 0 },
      cardPaid : { type: Number, default: 0 }
    },
    paymentMethodTotal: { type: Number, default: 0 },
    payable: { type: Number, default: 0 },
    retailTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    adjusttedShipment: { type: Number ,default:0},
    premiumAmount: { type: Number ,default:0},
    vat: { type: Number,default:0 },
    forex: { type: Number ,default:0},
    basePrice: { type: Number ,default:0}

  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

cartSchema.pre("save", async function (next) {
  const cart = this;
  // let subTotal = 0;
  cart.shippmentCharges = cart.packages
    .map((_package) =>
      _package.shippmentCharges
    )
    .reduce((acc, next) => acc + next, 0);
  cart.internationalShipmentCharges = cart.packages
    .map((_package) =>
      _package.internationalShipmentCharges
    )
    .reduce((acc, next) => acc + next, 0);
  cart.localShipmentCharges = cart.packages
    .map((_package) =>
      _package.localShipmentCharges
    )
    .reduce((acc, next) => acc + next, 0);
  cart.total = cart.packages
    .map((_package) =>
      _package.subTotal + _package.shippmentCharges
    )
    .reduce((acc, next) => acc + next, 0);
  cart.subTotal = cart.packages
    .map((_package) =>
      _package.subTotal
    )
    .reduce((acc, next) => acc + next, 0);
  cart.retailTotal = cart.packages
    .map((_package) =>
      _package.retailTotal
    )
    .reduce((acc, next) => acc + next, 0);
    cart.vat = cart.packages
    .map((_package) =>
      _package.vat
    )
    .reduce((acc, next) => acc + next, 0);
    cart.forex = cart.packages
    .map((_package) =>
      _package.forex
    )
    .reduce((acc, next) => acc + next, 0);
    cart.premiumAmount = cart.packages
    .map((_package) =>
      _package.premiumAmount
    )
    .reduce((acc, next) => acc + next, 0);
    cart.basePrice = cart.packages
    .map((_package) =>
      _package.basePrice
    )
    .reduce((acc, next) => acc + next, 0);
    cart.adjusttedShipment = cart.packages
    .map((_package) =>
      _package.adjusttedShipment
    )
    .reduce((acc, next) => acc + next, 0);
  cart.discount = cart.packages
    .map((_package) =>
      _package.discount
    )
    .reduce((acc, next) => acc + next, 0);
    cart.discount=numberRounder(cart.discount,2)
    cart.adjusttedShipment = numberRounder(cart.adjusttedShipment)
    cart.forex = numberRounder( cart.forex)
    cart.premiumAmount = numberRounder(cart.premiumAmount)
    cart.vat = numberRounder(cart.vat)
    cart.retailTotal = numberRounder(cart.retailTotal)
    cart.subTotal = numberRounder(cart.subTotal)
  let payable = cart.total;
  let paymentTypeTotal = 0;
  if (cart.wallet && cart.packages) {
    const walletPayment = await wallet(cart.user, cart.total);
    if (walletPayment) {
      payable = walletPayment.total;
      paymentTypeTotal = walletPayment.paymentTypeTotal;
      cart.paymentMethod = walletPayment.total === 0 ? paymentMethods.WALLET : paymentMethods.COD_WALLET;
      cart.paymentTrace = {
        walletPaid: walletPayment.paymentTypeTotal,
      };
    }
  }
  cart.payable = payable;
  cart.paymentMethodTotal = paymentTypeTotal;
  //_package.packageWeight= _package.packageItems.map(item => item.weight).reduce((acc, next) => acc + next);


  next();
});
// Hooks for update cart and its packages
cartSchema.pre("findOneAndUpdate", async function (next) {
  const schema = this;
  const docToUpdate = await this.model.findOne(this.getQuery());
  const newUpdate = schema._update;
  let shippmentCharges = docToUpdate.packages
    .map((_package) =>
      _package.shippmentCharges
    )
    .reduce((acc, next) => acc + next, 0);
  let payable = docToUpdate.packages
    .map((_package) =>
      _package.subTotal + _package.shippmentCharges
    )
    .reduce((acc, next) => acc + next, 0);
  let total = payable;
  let retailTotal = docToUpdate.packages
    .map((_package) =>
      _package.retailTotal
    )
    .reduce((acc, next) => acc + next, 0);
  // console.log(docToUpdate.packages)
  let discount = docToUpdate.packages
    .map((_package) =>
      _package.discount
    )
    .reduce((acc, next) => acc + next, 0);
    discount=numberRounder(discount,2)
  let subTotal = docToUpdate.packages
    .map((_package) =>
      _package.subTotal
    )
    .reduce((acc, next) => acc + next, 0);
    let adjusttedShipment = docToUpdate.packages
    .map((_package) =>
      _package.adjusttedShipment
    )
    .reduce((acc, next) => acc + next, 0);
    let forex = docToUpdate.packages
    .map((_package) =>
      _package.forex
    )
    .reduce((acc, next) => acc + next, 0);
    let premiumAmount = docToUpdate.packages
    .map((_package) =>
      _package.premiumAmount
    )
    .reduce((acc, next) => acc + next, 0);
    let vat = docToUpdate.packages
    .map((_package) =>
      _package.vat
    )
    .reduce((acc, next) => acc + next, 0);
    
  // let payable = total;
  // calculation of wallet payment
  adjusttedShipment = numberRounder(adjusttedShipment)
  forex = numberRounder( forex)
  premiumAmount = numberRounder(premiumAmount)
  vat = numberRounder(vat)
  let paymentTypeTotal = 0;
  if (docToUpdate && docToUpdate.packages) {
    if ((newUpdate && newUpdate.wallet)) {
      console.log(this.getQuery())
      const walletPayment = await wallet(this.getQuery().user, payable);
      if (walletPayment) {
        payable = walletPayment.total;
        paymentTypeTotal = walletPayment.paymentTypeTotal;
        this._update.paymentMethod = walletPayment.total === 0 ? paymentMethods.WALLET : paymentMethods.COD_WALLET;
        let paymentTrace = {
          walletPaid : walletPayment.paymentTypeTotal
        }    
        this._update.paymentTrace = paymentTrace;
      }
    } else if (newUpdate && !newUpdate.wallet && !newUpdate.paymentMethod) {
      payable = payable;
      paymentTypeTotal = 0;
      this._update.wallet = false;
      this._update.paymentMethod = paymentMethods.COD;
      this._update.paymentTrace = {
        walletPaid : 0
      };
    }
  }
  this._update.paymentMethodTotal = paymentTypeTotal;
  this._update.payable = payable;
  this._update.subTotal = subTotal;
  this._update.shippmentCharges = shippmentCharges;
  this._update.total = total;
  this._update.discount = discount;
  this._update.retailTotal = retailTotal;
  this._update.adjusttedShipment = adjusttedShipment;
  this._update.forex = forex;
  this._update.premiumAmount = premiumAmount;
  this._update.vat = vat;
  next();
});

// payment method wallet transaction

const wallet = async (userId, total) => {
  const userModel = require("../user/user.model");
  const ApiError = require("../../utils/ApiError");
  let paymentTypeTotal = 0;
  const user = await userModel.findById(userId);
  if (user && user.wallet && user.wallet.balance > 0) {
    if (user.wallet.balance < total) {
      paymentTypeTotal = user.wallet.balance;
      total = total - user.wallet.balance;
    }
    else if (user.wallet.balance >= total) {
      paymentTypeTotal = total;
      total = 0;

    }
    return { paymentTypeTotal, total };
  } else throw new ApiError(400, 'CART_MODULE.NOT_ENOUGH_BALANCE_CHANGE_PAYMENT_METHOD')
}
cartSchema.virtual("cartPackages", {
  ref: "Package",
  localField: "_id",
  foreignField: "cart",
  justOne: false,
  options: { where: { inCart: false } },
  autopopulate: true,
});

// add plugin that converts mongoose to json
cartSchema.plugin(toJSON);
cartSchema.plugin(autopopulate);

//const ItemSchema = mongoose.model('ItemSchema', itemSchema);
const Cart = mongoose.model("Cart", cartSchema);
//const Package = mongoose.model('Package', packageSchema);
//module.exports = ItemSchema;
module.exports = Cart;
//module.exports = Package;

// cartSchema.pre("save", function (next) {
//     const cart = this;
//     cart.populate({
//         path: 'packages',
//         // Get subCategories of subCategories - populate the 'subCategories' array for every Category
//         populate: { path: 'packageItems', model: 'PackageItem'}
//       })
//     next();
//   });

//   cartSchema.virtual('Packages', {
//   ref: 'Package',
//   foreignField: 'cart',
//   localField: '_id',

// });

// let itemSchema = new Schema({
//     product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Product",
//     },
//     quantity: {
//         type: Number,
//         required: true,
//         min: [1, 'Quantity can not be less then 1.']
//      },
//     // price: {
//     //     type: String,

//     // },
//     // total: {
//     //     type: String,

//     // }
// }, {
//     timestamps: true,
//     toJSON: { virtuals: true }
// })
// itemSchema.plugin(toJSON);

// let packageSchema = new Schema({
//     seller: { type: Schema.Types.ObjectId, ref: 'User'},

//     items: [itemSchema],
//     shippmentCharges: {
//         type: String,

//     },
//     subTotal: {
//         type: String,

//     }
// }, {
//     timestamps: true,
//     toJSON: { virtuals: true }
// })
// packageSchema.plugin(toJSON);
// cartSchema.pre("save", async function (next) {
//     const cart = this;
//     cart.
//    populate('user' ).populate('packages' ).execPopulate();
//     //item.total = product.price * quantity;
//     console.log("from model middleware"+cart)
//       //product.price=product.regularPrice;

//     next();
//   });
