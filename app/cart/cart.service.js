const db = require("../../config/mongoose");
const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const packageService = require("../package/package.service");
const packageItemService = require("../packageItem/packageItem.service");
const walletModel = require("../wallet/wallet.model");
const groupTrackCustomerService = require("../groupBuyCustomerTrack/groupBuyCustomerTrack.service");
const dealService = require("../deals/deals.service");
const Cart = db.Cart;
const en = require('../../config/locales/en')
//const Product = db.Product;

const Package = db.Package;
const PackageItem = db.PackageItem;
const productService = require("../product/product.service");
const groupBuyService = require("../groupBy/group_buy.service");
const { shippmentCharges } = require("../shippment/shippment.enums");
const { shippmentTypes, addressLocalTypes, verificationMethods, paymentMethods, roleTypes, productTypes, voucherTypes, platforms, regions } = require("@/config/enums");
const userService = require("../user/user.service");
// global.crypto = require('crypto');
const crypto = require('crypto');
const mongoose = require("mongoose");
const { orderTrack } = require("../order/order.service");
const { responseMethod, } = require("../../utils/generalDB.methods.js/DB.methods")
const pvService = require('../paymentVerification/pv.service')
const { settValueParser, handleSetting } = require('../setting/setting.service')
const { shippmentCalculation } = require("../aliexpress/ae.service");
const { dateValidation, calculatePercentage, numberRounder } = require('../../config/components/general.methods')
/**
 * add a product to cart
 * @param {String} userId
 * @param {Object} itemBody
 * @returns {Promise<Cart>}
 */
const addItemToCartV2 = async (userId, itemBody, user, supplier) => {
  const { getBasePricesData } = require('../product/product.service')
  console.time()
  const quantity = Number.parseInt(itemBody.quantity);
  //console.log(typeof quantity)

  const product = await productService.getProductById(itemBody.product);

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "product not found");
  }
  if (product && !product.active)
    throw new ApiError(httpStatus.NOT_FOUND, "This product is currently unavailable");
  if (supplier && supplier.role == roleTypes.SUPPLIER) {
    if (product.user.id != supplier.id)
      throw new ApiError(401, "You are not authorized to add this product.");
  }
  if (quantity > product.quantity || quantity === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "desired  quantity not available");
  }
  if (!product.user) throw new ApiError(httpStatus.BAD_REQUEST, "Product user not found");
  let priceData = Promise.all([getBasePricesData(), handleSetting({ key: "INT_CHARGES" }), handleSetting({ key: "LOCAL_CHARGES" })])
  priceData = await priceData;
  const basePriceData = priceData[0];
  const intCharge = priceData[1];
  const localCharge = priceData[2];
  let shipmentCharges = localCharge;
  if (user && user.defaultAddress && user.defaultAddress.localType == addressLocalTypes.INTERNATIONAL) {
    // newPackage._doc["shippmentCharges"] = shippmentCharges.international;
    shipmentCharges = intCharge;
  }
  if (product.user.sellerDetail.premium)
  {
    if(product.origin=="ksa")
    basePriceData.ksaPremium = product.user.sellerDetail.premiumPercentage
    if(product.origin=="pak")
      basePriceData.pakPremium = product.user.sellerDetail.premiumPercentage
  }
  // basePriceData.premiumPercentage =basePriceData.premiumPercentage+calculatePercentage(basePriceData.premiumPercentage, basePriceData.vat,100)
  if (product) {
    let productId = product.productType == productTypes.MAIN ? product.id : product.mainProduct;
    console.log(productId);
    // if (product.price<=0)
    //   throw new ApiError(400, "Product price not exists");
    if (productId) {
      const groupBuyOrderTrace = await groupBuyService.customerGroupBuyOrder(productId, {}, userId);
      if (groupBuyOrderTrace && groupBuyOrderTrace.length) {
        const traces = groupBuyOrderTrace[0];
        if (traces.buyAbleProduct >= traces.maxSubscription)
          throw new ApiError(400, "Deal maximum limit reached.");
        // traces.sumGroupBuy = traces && traces.sumGroupBuy ? tracesSumGroupBuy :
        if ((traces.sumGroupBuy + itemBody.quantity) > traces.limit) {
          const remainingItem = traces.limit - traces.sumGroupBuy;
          if (remainingItem == 0)
            throw new ApiError(400, "You have already bought maximum number of products")
          throw new ApiError(400, "You can only buy " + remainingItem + " items");
        }
      }
    }
  }
  if (!product.user) throw new ApiError(httpStatus.NOT_FOUND, "product user not found.");
  let cart = await Cart.findOne({ user: userId });
  if (!cart)
    cart = await Cart.create({ user: userId })
  console.timeEnd()
  const packageFound = cart.packages.findIndex(
    (_package) => _package && _package.seller && _package.seller.id === product.user.id
  );
  let newPack;
  let newPackItem;
  let isNewPack = false;
  const aeProduct = product.platform == platforms.ALIEXPRESS ? true : false;
  const productSpecs = await productSpecsHandler(product, quantity, aeProduct, basePriceData);
  console.log(productSpecs);
  if (!cart?.packages?.length) {
    const pack = newPackageCreation(cart, product, productSpecs, shipmentCharges);
    newPack = pack.newPack;
    newPackItem = pack.newPackItem;
    isNewPack = true;
  }
  if (cart.packages && cart.packages.length) {
    const packFound = cart.packages.findIndex(
      (_package) => _package && _package.seller && _package.seller.id === product.user.id
    );
    if (packFound !== -1) {
      newPack = cart.packages[packageFound];
      const itemFound = cart.packages[packageFound].packageItems.findIndex(
        (item) => item && item.product && item.product.id === product.id
      );
      if (itemFound !== -1) {
        newPackItem = cart.packages[packageFound].packageItems[itemFound];
        const newQuantity = quantity;
        if (product.quantity < newQuantity)
          throw new ApiError(httpStatus.BAD_REQUEST, "desire quantity is not available");
        const productSpecs = await productSpecsHandler(product, newQuantity, aeProduct, basePriceData);
        newPackItem = setPackItemsPrices(productSpecs, newPackItem)
      }
      if (itemFound === -1) {
        newPackItem = packageItemCreation(product, productSpecs, newPack.id);
        newPack.packageItems.push(newPackItem);
      }
      newPack.shippmentCharges = shipmentCharges;
    }
    if (packFound === -1) {
      const pack = newPackageCreation(cart, product, productSpecs, shipmentCharges);
      newPack = pack.newPack;
      newPackItem = pack.newPackItem;
      isNewPack = true;
    }
  }
  const newItem = await newPackItem.save();
  const package = await newPack.save();
  if (isNewPack)
    cart.packages.push(package);
  let updateCart = await cart.save();
  return await getCartByUser(user.id);
};
/**
 * add a product to cart
 * @param {String} userId
 * @param {Object} itemBody
 * @returns {Promise<Cart>}
 */
const addItemToCart = async (userId, itemBody, user, supplier) => {
  const { getBasePricesData } = require('../product/product.service')
  let basePriceData = await getBasePricesData()
  let intCharge = await handleSetting({ key: "INT_CHARGES" })
  let localCharge = await handleSetting({ key: "LOCAL_CHARGES" })
  const userService = require("../user/user.service");
  const quantity = Number.parseInt(itemBody.quantity);
  //console.log(typeof quantity)

  const product = await productService.getProductById(itemBody.product);
  if (product.user.sellerDetail.premium)
    basePriceData.premiumPercentage = product.user.sellerDetail.premiumPercentage
  // let weight = product.weight?product.weight:product.packageInfo.weight
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'PRODUCTS_NOT_FOUND');
  }
  if (product && !product.active)
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.PRODUCT_NOT_AVAILABLE');
  if (supplier && supplier.role == roleTypes.SUPPLIER) {
    if (product.user.id != supplier.id)
      throw new ApiError(401, 'CART_MODULE.YOU_ARE_NOT_AUTHORIZED');
  }
  if (quantity > product.quantity || quantity === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.DESIRED_QUANTITY_ARE_NOT_AVAILABLE');
  }

  if (product) {
    let productId = product.productType == productTypes.MAIN ? product.id : product.mainProduct;
    console.log(productId);
    // if (product.price<=0)
    //   throw new ApiError(400, "Product price not exists");
    if (productId) {
      const groupBuyOrderTrace = await groupBuyService.customerGroupBuyOrder(productId, {}, userId);
      if (groupBuyOrderTrace && groupBuyOrderTrace.length) {
        const traces = groupBuyOrderTrace[0];

        if (traces.buyAbleProduct >= traces.maxSubscription)
          throw new ApiError(400, 'CART_MODULE.MAXIMUM_LIMIT_REACHED');
        // traces.sumGroupBuy = traces && traces.sumGroupBuy ? tracesSumGroupBuy :
        if ((traces.sumGroupBuy + itemBody.quantity) > traces.limit) {
          const remainingItem = traces.limit - traces.sumGroupBuy;
          if (remainingItem == 0)
            throw new ApiError(400, 'CART_MODULE.YOU_HAVE_ALRADY_BOUGHT_MAXIMUM_PRODUCT')
          throw new ApiError(400, `${itemBody.multiLangVar}` + remainingItem + `${itemBody.multiLangVar1}`);
        }
        // if (product && productType == 'variant') {

        // }
      }
      // if (product && product.productType == productTypes.MAIN && product.groupBuy.length && product.groupBuy[0].limit < cartItem.quantity)
      //   throw new ApiError(400, `You can only buy ${product.groupBuy[0].limit} products`);
      // else if (product && product.productType == productTypes.VARIANT) {
      //   const getGroupBuy = await groupBuyService.getGroupBuyProduct({ $and: [{ $or: [{ status: groupBuyEnum.ACTIVE }, { status: groupBuyEnum.PENDING }] }, { endDate: { $gte: new Date() } }, { startDate: { $lte: new Date() } }, { productId: product.mainProduct }] })
      // }
    }
  }

  const cart = await Cart.findOne({ user: userId });

  //-------------------------Deal Validation------------------------------------------------------
  let deal = await dealService.getDealByProductId(itemBody.product);
  if (deal && deal.data) {
    _deal = deal.data;
    console.log(deal.data);
    if (_deal.limit) {
      if (quantity > _deal.limit) {
        throw new ApiError(400, "You can only buy " + _deal.limit + " items");
      }
    }
    if (_deal.minOrderAmount) {
      if (!cart || cart.total < _deal.minOrderAmount) {
        throw new ApiError(400, `You must have to buy atleast ${_deal.minOrderAmount}Rs items to avail this product`);
      }
    }
  }

  //-------------------------Deal Validation------------------------------------------------------




  // if (product.groupBuy.length > 0) {
  // let resultCustomerLimit = await groupTrackCustomerService.getTrackOFCustomerProduct(userId, product._id)
  //   let limit;
  //   product.groupBuy.map(result => {
  //     if (resultCustomerLimit.order.length > 0) {
  //       limit = result.limit - resultCustomerLimit.order[0].totalQuantity;
  //     } else {
  //       limit = result.limit;
  //     }

  //     if (itemBody.quantity > limit) {
  //       throw new ApiError(httpStatus.NOT_FOUND, "Customer Can buy 10% of product");

  //     }
  //   })


  // }
  // TODO groupbuy cart validation

  // if (product && product.groupBuyVariants && product.groupBuyVariants.length > 0) {
  //   let resultCustomerLimit = await groupTrackCustomerService.getTrackOFCustomerProduct(userId, product._id)
  //   let limit;
  //   product.groupBuyVariants.map(result => {

  //     if (resultCustomerLimit.order.length > 0) {
  //       limit = result.limit - resultCustomerLimit.order[0].totalQuantity;
  //     } else {
  //       limit = result.limit;
  //     }


  //     if (itemBody.quantity > limit) {
  //       throw new ApiError(httpStatus.NOT_FOUND, "Customer Can buy 10% of product");

  //     }
  //   })


  // }




  // if(product.variantGroupBuy!=null){
  //   if(product.variantGroupBuy==true && product.mainProduct && product.isVariable==true){
  //     let result=await groupTraceService.getGroupBuyTraceWithVariantProductId(product.id)

  //          console.log(result.data.salePrice)
  //         product.price=result.data.salePrice
  //         product.salePrice=result.data.salePrice
  //   }
  // }
  if (!product.user) throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.PRODUCT_USER_NOT_FOUND');

  const seller = await userService.getUserById(product.user.id);
  if (!seller) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SELLER_NOT_FOUND');
  }

  if (!cart) {
    const newCart = new Cart({
      user: userId,
    });

    // let nCart = await Cart.create(newCart);
    const newPackage = new Package({
      seller: seller.id,
      cart: newCart.id,
      // items: [{product: product.id,
      //   quantity: quantity,
      //   totalPrice:product.price*quantity
      // }],
    });

    // const package = await Package.create(newPackage);
    let _productPrice = 0;
    let _retailPrice = 0;
    // let _discount = 0;
    if (product.price)
      _productPrice = product.price;
    if (product.regularPrice)
      _retailPrice = product.regularPrice;
    if (!product.price && product.onSale)
      _productPrice = product.salePrice;
    else if (!product.price && !product.onSale)
      _productPrice = product.regularPrice;
    if (!product.price && !product.regularPrice && !product.salePrice)
      throw new ApiError(400, 'CART_MODULE.PRODUCT_PRICE_NOT_DEFINED')
    // _discount = _retailPrice - _productPrice;
    let weight = product.weight || product.packageInfo?.weight || 1;
    const newPackageItem = new PackageItem(setNewPackageItem(product, newPackage, _productPrice, _retailPrice, basePriceData, quantity, weight))
    // const newPackageItem = new PackageItem({
    //   _package: newPackage.id,
    //   product: product.id,
    //   quantity: quantity,
    //   // total: _productPrice * quantity,
    //   weight: weight * quantity,
    //   // retailTotal: _retailPrice * quantity,
    //   // discount: _discount * quantity

    //   // items: [{product: product.id,
    //   //   quantity: quantity,
    //   //   totalPrice:product.price*quantity
    //   // }],
    //    forex:calculatePercentage(product.total,basePriceData.forex),
    //  premiumAmount:calculatePercentage(product.total,basePriceData.premiumPercentage),
    //  adjusttedShipment:calculatePercentage(product.total,basePriceData.vat),
    // vat:calculatePercentage(product.total,basePriceData.shippment),
    // });
    // let totalAmount=(newPackageItem.forex+newPackageItem.premiumAmount+newPackageItem.vat+newPackageItem.adjusttedShipment)*newPackageItem.quantity
    // newPackageItem["total"]=  (_productPrice * newPackageItem.quantity)+totalAmount
    // newPackageItem["retailTotal"]=  (_retailPrice * newPackageItem.quantity)+totalAmount    // shippment charges calculation for AE Products
    if (product.platform == platforms.ALIEXPRESS) {
      let shippmentCharges = await shopChinaShippmentCalculation(product, quantity);
      console.log(shippmentCharges)
      newPackageItem["internationalShipmentCharges"] = shippmentCharges;
    }



    console.log(user)
    const packageItem = await PackageItem.create(newPackageItem);
    newPackage.packageItems.push(packageItem);
    if (user && user.defaultAddress && user.defaultAddress.localType == addressLocalTypes.INTERNATIONAL) {
      // newPackage._doc["shippmentCharges"] = shippmentCharges.international;
      newPackage._doc["shippmentCharges"] = intCharge;
    } else {
      newPackage._doc["shippmentCharges"] = localCharge;
    }
    if (product.platform == platforms.ALIEXPRESS) { 
      newPackage._doc["localShipmentCharges"] = 0;
    }
    const _package = await Package.create(newPackage);
    await _package.save()
    newCart.packages.push(_package);
    //console.log(newCart)
    const ncart = await Cart.create(newCart);
    //await cart.save();
    const result  = await getCartByUser(cart.user.id ,true,true)
    if(result)return result
    // return ncart;
    // return await cart.populate({path: 'packages',populate:{path: 'packageItems'}

    // })
    // return await cart.populate(['seller','packages' ,'packageItems','packageItems.product']).execPopulate();
    //  return ncart;
  }
  const packageFound = cart.packages.findIndex(
    (_package) => _package && _package.seller && _package.seller.id === product.user.id
  );

  // const packageFound = cart.packages.findIndex(
  //   (_package) => console.log(_package)
  // );

  if (packageFound !== -1) {
    const packageId = cart.packages[packageFound].id;
    console.log(packageId)
    const itemFound = cart.packages[packageFound].packageItems.findIndex(
      (item) => item && item.product && item.product.id === product.id
    );

    if (itemFound !== -1 && quantity <= 0) {
      const packageItemId =
        cart.packages[packageFound].packageItems[itemFound].id;
      // console.log(cart.packages[packageFound])
      const deletedPackageItem = cart.packages[
        packageFound
      ].packageItems.splice(itemFound, 1);
      // const packageItem= packageFound.packageItems[itemFound].splice(itemFound, 1);
      const _package = await packageService.getPackageById(packageId);
      const pItem = await packageItemService.deletePackageItem(
        packageItemId,
        packageId
      );
      if (_package.packageItems.length > 0) {
        _package.packageItems.pull(pItem);
        await _package.save();
        await cart.save();
        const result  = await getCartByUser(cart.user.id,true,true)
        if(result)return result
        // return cart;
      }
      _package.packageItems.pull(packageItem);

      const deletedPackage = await _package.remove();
      cart.packages.pull(deletedPackage);
      await cart.save();
      const result  = await getCartByUser(cart.user.id,true,true)
      if(result)return result
      // return cart;
    }
    //----------Check if product exist, just add the previous quantity with the new quantity -------
    else if (itemFound !== -1 && quantity > 0) {
      const packageItemId =
        cart.packages[packageFound].packageItems[itemFound].id;
      //const updatedQuantity = cart.packages[packageFound].packageItems[itemFound].quantity + quantity;
      if (quantity > product.quantity) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          en.responseMessages.CART_MODULE.PRODUCT_QUANTITY_IS_GREATER_THAN_AVAILABLE
        );
      }
      let _productPrice = 0;
      let _retailPrice = 0;
      if (product.price)
        _productPrice = product.price;
      if (product.regularPrice)
        _retailPrice = product.regularPrice;
      if (!product.price && product.onSale)
        _productPrice = product.salePrice;
      else if (!product.price && !product.onSale)
        _productPrice = product.regularPrice;
      if (!product.price && !product.regularPrice && !product.salePrice)
        throw new ApiError(400, 'CART_MODULE.PRODUCT_PRICE_NOT_DEFINED')
      let weight = product.weight || product.packageInfo?.weight || 1;
      const pItem = await packageItemService.updatePackageItem(packageItemId, packageItemUpdatebody(product, _productPrice, _retailPrice, quantity, weight, basePriceData));
      // const _package = await packageService.getPackageById(packageId);
      //const pItem=await packageItemService.deletePackageItem(packageItemId,packageId)

      //_package.packageItems.pull(pItem);
      const packageItem = await pItem.save();
      const updatedPackage = await packageService.getPackageById(
        packageItem._package.toString()
      );
      await updatedPackage.save();
      const updatedCart = await getCartById(updatedPackage.cart.toString());
      await updatedCart.save();
      const result  = await getCartByUser(cart.user.id,true,true)
      if(result)return result
      // return updatedCart;
    } else if (itemFound === -1 && quantity > 0) {
      let _productPrice = 0;
      let retailPrice = 0;
      if (product.price)
        _productPrice = product.price;
      if (product.regularPrice)
        retailPrice = product.regularPrice;
      if (!product.price && product.onSale)
        _productPrice = product.salePrice;
      else if (!product.price && !product.onSale)
        _productPrice = product.regularPrice;
      if (!product.price && !product.regularPrice && !product.salePrice)
        throw new ApiError(400, 'CART_MODULE.PRODUCT_PRICE_NOT_DEFINED')
      let weight = product.weight || product.packageInfo?.weight || 1;
      const newPackageItem = new PackageItem(setNewPackageItem(product, newPackage, _productPrice, _retailPrice, basePriceData, quantity, weight))
      // const newPackageItem = new PackageItem({
      //   _package: packageId,
      //   product: product.id,
      //   quantity: quantity,
      //   // total: _productPrice * quantity,
      //   weight: weight * quantity,
      //   // retailTotal: retailPrice * quantity,
      //   forex:calculatePercentage(product.total,basePriceData.forex),
      //   premiumAmount:calculatePercentage(product.total,basePriceData.premiumPercentage),
      //   adjusttedShipment:calculatePercentage(product.total,basePriceData.shipmentCharges),
      //  vat:calculatePercentage(product.total,basePriceData.vat),
      //    });
      //    let totalAmount=(newPackageItem.forex+newPackageItem.premiumAmount+newPackageItem.vat+newPackageItem.adjusttedShipment)*newPackageItem.quantity
      //    newPackageItem["total"]=  (_productPrice * newPackageItem.quantity)+totalAmount
      //    newPackageItem["retailTotal"]=  (_retailPrice * newPackageItem.quantity)+totalAmount
      if (product.platform == platforms.ALIEXPRESS) {
        let shippmentCharges = await shopChinaShippmentCalculation(product, quantity);
        console.log(shippmentCharges)
        newPackageItem["internationalShipmentCharges"] = shippmentCharges;
      }
      const pItem = await PackageItem.create(newPackageItem);
      //newPackage.packageItems.push(pItem)
      const _package = await packageService.getPackageById(packageId);
      _package.packageItems.push(pItem);
      const updatedPackage = await _package.save();

      const updatedCart = await getCartById(updatedPackage.cart.toString());

      await updatedCart.save();
      const result  = await getCartByUser(cart.user.id,true,true)
      if(result)return result
      // return updatedCart;

      // console.log(newCart)
      //const cart = await Cart.create(newCart);
      //packageFound.packageItems.push({ product: product.id,quantity: quantity})
    }

    //package e-block
  }
  const newPackage = new Package({
    seller: seller.id,
    cart: cart.id,
  });

  let _productPrice = 0;
  let _retailPrice = 0;
  if (product.price)
    _productPrice = product.price;
  if (product.regularPrice)
    _retailPrice = product.regularPrice;
  if (!product.price && product.onSale)
    _productPrice = product.salePrice;
  else if (!product.price && !product.onSale)
    _productPrice = product.regularPrice;
  if (!product.price && !product.regularPrice && !product.salePrice)
    throw new ApiError(400, "Product price is not defined.")
  let weight = product.weight || product.packageInfo?.weight || 1;
  const newPackageItem = new PackageItem(setNewPackageItem(product, newPackage, _productPrice, _retailPrice, basePriceData, quantity, weight))
  // const newPackageItem = new PackageItem({
  //   _package: newPackage.id,
  //   product: product.id,
  //   quantity: quantity,
  //   total: _productPrice * quantity,
  //   weight: weight * quantity,
  //   // retailTotal: _retailPrice * quantity,
  //   forex:calculatePercentage(_productPrice,basePriceData.forex),
  //   adjusttedShipment:calculatePercentage(_productPrice,basePriceData.shipmentCharges),
  //  vat:calculatePercentage(_productPrice,basePriceData.vat),
  //  premiumAmount:calculatePercentage(_productPrice,basePriceData.premiumPercentage),
  // });
  // let totalAmount=(newPackageItem.forex+newPackageItem.premiumAmount+newPackageItem.vat+newPackageItem.adjusttedShipment)*newPackageItem.quantity
  // newPackageItem["total"]=  (_productPrice * newPackageItem.quantity)+totalAmount
  // newPackageItem["retailTotal"]=  (_retailPrice * newPackageItem.quantity)+totalAmount


  // console.log(user)
  if (product.platform == platforms.ALIEXPRESS) {
    let shippmentCharges = await shopChinaShippmentCalculation(product, quantity);
    console.log(shippmentCharges)
    newPackageItem["internationalShipmentCharges"] = shippmentCharges;
  }
  await newPackageItem.save()
  //const packageItem = await PackageItem.create(newPackageItem);
  newPackage.packageItems.push(newPackageItem);
  if (user && user.defaultAddress && user.defaultAddress.localType == addressLocalTypes.INTERNATIONAL) {
    // newPackage._doc["shippmentCharges"] = shippmentCharges.international;
    newPackage._doc["shippmentCharges"] = intCharge;
  } else {
    newPackage._doc["shippmentCharges"] = localCharge;
  }
  if (product.platform == platforms.ALIEXPRESS) { 
    newPackage._doc["localShipmentCharges"] = 0;
  }
  await newPackage.save();
  //const _package = await Package.create(newPackage);
  // console.log(newPackage)
  cart.packages.push(newPackage);

  //const updatedCart = await cart.save();
  await cart.save();
  //console.log(updatedCart)
  //return updatedCart;
  const result = await getCartByUser(cart.user?.id,true,true)
  return result
  // return cart;
};

const addPackageToCart = async (userId, itemBody) => {

  const cart = await getCartByUser(userId,true,true);

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_NOT_FOUND');
  }
  const _package = await packageService.getPackageById(itemBody._package);

  if (!_package) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.PACKAGE_NOT_FOUND');
  }
  //_package.inCart===true;

  Object.assign(_package, { inCart: true });
  const updatedPackage = await _package.save();
  // console.log(updatedPackage);
  cart.packages.push(updatedPackage);
  await cart.save();
  return cart;
};

/**
 * Remove a product from cart
 * @param {String} itemBody
 * @param {Object} itemBody
 * @returns {Promise<Cart>}
 */
const removeItemFromCart = async (userId, itemBody) => {
  let product;
  if (itemBody.product) {
    product = await productService.getProductById(itemBody.product);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'PRODUCTS_NOT_FOUND');
    }
  }
  const _package = await packageService.getPackageById(itemBody._package);
  if (!_package)
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.PACKAGE_NOT_FOUND');
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_NOT_FOUND');
  }
  let itemFound;
  if (itemBody.product)
    itemFound = _package.packageItems.findIndex(
      (item) => item.product.id === product.id
    );
  else if (itemBody.packageItemId)
    itemFound = _package.packageItems.findIndex(
      (item) => item.id === itemBody.packageItemId
    );
  else throw new ApiError(400, 'CART_MODULE.PACKAGE_ITEM_NOT_FOUND')
  const packageFound = cart.packages.findIndex(
    (item) => item.id === _package.id
  );
  if (itemFound !== -1) {
    const packageItemId = _package.packageItems[itemFound].id;
    //console.log(packageItemId)
    //console.log(_package)
    //console.log(_package.packageItems[itemFound])
    const deletedPackageitem = await packageItemService.deletePackageItem(
      packageItemId,
      _package.id
    );
    _package.packageItems.pull(deletedPackageitem);
    // if(deletedPackageitem && packageFound !== -1) cart.packages[packageFound].packageItems.pull(deletedPackageitem);
    if (_package.packageItems.length === 0) {
      const deletedPackage = await packageService.deletePackageById(
        _package.id
      );
      // console.log(deletedPackage)

      // const updatedCart= await getCartById(_package.cart);
      //  if(!updatedCart) {
      //   throw new ApiError(httpStatus.NOT_FOUND, "cart not found");

      // }
      cart.packages.pull(deletedPackage.id);
      await cart.save();
       const result = await getCartByUser(cart.user?.id,true,true)
      return result;
    }

    await _package.save();
    if (packageFound !== -1) cart.packages[packageFound] = _package;
    //console.log(_package)

    // const updatedCart= await getCartById(_package.cart);
    //  if(!updatedCart) {
    //   throw new ApiError(httpStatus.NOT_FOUND, "cart not found");

    // }
    // await updatedCart.save()

    //  return updatedCart;

    await cart.save();
    const result = await getCartByUser(cart.user?.id,true,true)
    return result;

    // return cart;
  }

  await cart.save();
  const result = await getCartByUser(cart.user?.id,true,true)
      return result;
  // return cart;
};

const unloadPackageFromCart = async (userId, itemBody) => {
  const _package = await packageService.getPackageById(itemBody._package);
  if (!_package) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.PACKAGE_NOT_FOUND');
  }
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_NOT_FOUND');
  }

  cart.packages.pull(_package);
  //  _package.inCart===false;
  Object.assign(_package, { inCart: false });
  //console.log(_package.inCart)
  await _package.save();

  await cart.save();
  return cart;
};

const deletePackageFromCart = async (userId, itemBody) => {

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_NOT_FOUND');
  }
  const _package = await packageService.getPackageById(itemBody._package);
  if (!_package) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.PACKAGE_NOT_FOUND');
  }

  if (_package.inCart) {

    const deletedPackage = await packageService.deletePackageById(_package.id)
    cart.packages.pull(deletedPackage);

    await cart.save();
    return cart;
  }



  await packageService.deletePackageById(_package.id);
  await cart.save();
  return cart;
};

const getCartById = async (id) => {
  return Cart.findOne({ _id: id });
};

const getCartByUser = async (userId, coupon = true,isCart=false) => {
  let basePriceData = await productService.getBasePricesData()
  let priceQuery=productService.runTimePriceUpdateQuery(basePriceData,true)
  // const { premiumPercentage, forex, shipmentCharges, vat } = basePriceData;
  const productProjection = {

    'id': '$_id',
    '_id': 0,
    'shippmentCharges': 1,
    'internationalShipmentCharges': 1,
    'localShipmentCharges': 1,
    'inCart': 1,
    'subTotal': 1,
    'packageWeight': 1,
    'discount': 1,
    'retailTotal': 1,
    'cart': 1,
    'seller.id': '$seller._id',
    'seller._id': -1,
    'seller.fullname': 1,
    'seller.sellerDetail.brandName': 1,
    'seller.sellerDetail.rrp': 1,
    'seller.sellerDetail.slug': 1,
    'seller.sellerDetail.id': '$seller.sellerDetail._id',
    'seller.sellerDetail._id': -1,
    'seller.sellerDetail.lang': 1,
    'seller.sellerDetail.commission': 1,
    'packageItems': 1,
    'seller.sellerDetail.type': 1,
    "vat": 1,
    "adjusttedShipment": 1,
    "premiumAmount": 1,
    "forex": 1,
    "basePrice": 1


  }
  if (!isCart)
    productProjection["seller.email"] = 1
  const query = [
    {
      '$match': {
        'user': mongoose.Types.ObjectId(userId)
      }
    }, {
      '$lookup': {
        'from': 'packages',
        'let': {
          'package': '$packages'
        },
        'pipeline': [
          {
            '$match': {
              '$expr': {
                '$in': [
                  '$_id', '$$package'
                ]
              }
            }
          }, {
            '$lookup': {
              'from': 'users',
              'localField': 'seller',
              'foreignField': '_id',
              'as': 'seller'
            }
          }, {
            '$unwind': {
              'path': '$seller'
            }
          }, {
            '$lookup': {
              'from': 'sellerdetails',
              'localField': 'seller._id',
              'foreignField': 'seller',
              'as': 'seller.sellerDetail'
            }
          },
          {
            '$addFields': {
              sellerDetail: 'seller.sellerDetail'
            }
          },
          {
            '$unwind': {
              'path': '$seller.sellerDetail',
              'preserveNullAndEmptyArrays': true
            }
          },
          {
            '$addFields': {
              sellerDetail: '$seller.sellerDetail'
            }
          }, {
            '$lookup': {
              'from': 'packageitems',
              'let': {
                'packageItems': '$packageItems',
                'sellerDetail': "$sellerDetail"
              },
              'pipeline': [
                {
                  '$match': {
                    '$expr': {
                      '$in': [
                        '$_id', '$$packageItems'
                      ]
                    }
                  }
                }, {
                  '$lookup': {
                    'from': 'products',
                    'localField': 'product',
                    'foreignField': '_id',
                    'as': 'product'
                  }
                }, {
                  '$unwind': {
                    'path': '$product',
                    'preserveNullAndEmptyArrays': true
                  }
                },
                {
                  '$addFields': { sellerDetail: '$$sellerDetail' }
                }, 
                ...priceQuery,
                {
                  '$lookup': {
                    'from': 'products',
                    'localField': 'product.mainProduct',
                    'foreignField': '_id',
                    pipeline: [{
                      
                        $project: {
                       platformId:1 
                      }
                    }],
                    'as': 'product.main'
                  }
                }, {
                  '$unwind': {
                    'path': '$product.main',
                    'preserveNullAndEmptyArrays': true
                  }
                }, {
                  '$lookup': {
                    'from': 'users',
                    'localField': 'product.user',
                    'foreignField': '_id',
                    'as': 'product.user'
                  }
                }, {
                  '$unwind': {
                    'path': '$product.user',
                    'preserveNullAndEmptyArrays': true
                  }
                }, {
                  '$lookup': {
                    'from': 'groupbuys',
                    'let': {
                      'product': '$product._id',
                      'mainProduct': '$product.mainProduct'
                    },
                    'pipeline': [
                      {
                        '$match': {
                          '$expr': {
                            '$and': [
                              {
                                '$or': [
                                  {
                                    '$eq': [
                                      '$productId', '$$product'
                                    ]
                                  }, {
                                    '$eq': [
                                      '$productId', '$$mainProduct'
                                    ]
                                  }
                                ]
                              }, {
                                '$or': [
                                  {
                                    '$eq': [
                                      '$status', 'active'
                                    ]
                                  }, {
                                    '$eq': [
                                      '$status', 'pending'
                                    ]
                                  }
                                ]
                              }, {
                                '$gte': [
                                  '$endDate', new Date()
                                ]
                              }, {
                                '$lte': [
                                  '$startDate', new Date()
                                ]
                              }
                            ]
                          }
                        }
                      }
                    ],
                    'as': 'product.groupBuy'
                  }
                },

                // Coupon
                {
                  "$lookup": {
                    "from": "vouchers",
                    "let": {
                      "product": "$product._id",
                      "mainProduct": "$product.mainProduct"
                    },
                    "pipeline": [{
                      "$match": {
                        "$expr": {
                          "$and": [{
                            '$or': [
                              {
                                '$eq': [
                                  '$couponTypeId', '$$product'
                                ]
                              }, {
                                '$eq': [
                                  '$couponTypeId', '$$mainProduct'
                                ]
                              }
                            ]
                          }, {
                            "$or": [{
                              "$eq": ["$status", "active"]
                            }, {
                              "$eq": ["$status", "pending"]
                            }]
                          }, {
                            "$gte": ["$endDate", new Date()]
                          }, {
                            "$lte": ["$startDate", new Date()]
                          },
                          { $eq: ["$type", voucherTypes.COUPON] }
                          ]
                        }
                      }
                    }],
                    "as": "product.voucher"
                  }
                },
                {
                  $unwind: {
                    path: "$product.voucher",
                    'preserveNullAndEmptyArrays': true
                  }
                },
                // Coupon End
                {
                  '$project': {
                    'id': '$_id',
                    '_id': 0,
                    'discount': 1,
                    '_package': 1,
                    'quantity': 1,
                    'total': 1,
                    'weight': 1,
                    'retailTotal': 1,
                    'product.id': '$product._id',
                    'product.featured': 1,
                    'product.onSale': 1,
                    'product.attributes': 1,
                    'product.selectedAttributes': 1,
                    'product.productType': 1,
                    'product.productName': 1,
                    'product.regularPrice': '$regularPrice',
                    'product.salePrice': '$salePrice',
                    'product.quantity': 1,
                    'product.mainImage': 1,
                    'product.slug': 1,
                    'product.active': 1,
                    'product.price': '$price',
                    'product.description': 1,
                    "product.voucher": 1,
                    "product.weight": 1,
                    "product.sku": 1,
                    "product.lang": 1,
                    "product.platformId": 1,
                    "product.category": 1,
                    "product.currency": 1,
                    "product.origin":1,
                    "product.platform": 1,
                    'product.groupBuy': {
                      '$cond': {
                        'if': {
                          '$not': [
                            '$product._id'
                          ]
                        },
                        'then': '$$REMOVE',
                        'else': '$product.groupBuy'
                      }
                    },
                    'product.user.id': {
                      '$cond': {
                        'if': {
                          '$not': [
                            '$product._id'
                          ]
                        },
                        'then': '$$REMOVE',
                        'else': '$product.user._id'
                      }
                    },
                    "product.sku_attribute": 1,
                    "product.mainProduct": 1,
                    "product.main" : 1,
                    "vat": 1,
                    "adjusttedShipment": 1,
                    "premiumAmount": 1,
                    "forex": 1,
                    "basePrice": 1,
                  }
                }
              ],
              'as': 'packageItems'
            }
          }, {
            '$project': productProjection
          }
        ],
        'as': 'packages'
      }
    }, {
      '$lookup': {
        'from': 'users',
        'localField': 'user',
        'foreignField': '_id',
        'as': 'user'
      }
    }, {
      '$unwind': {
        'path': '$user',
        'includeArrayIndex': 'string',
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$lookup': {
        'from': 'addresses',
        'localField': 'user.defaultAddress',
        'foreignField': '_id',
        'as': 'user.defaultAddress'
      }
    }, {
      '$unwind': {
        'path': '$user.defaultAddress',
        'includeArrayIndex': 'string',
        'preserveNullAndEmptyArrays': true
      }
    },
  ]
  // //   if (coupon)
  // //     query.push({
  // // "$lookup":{
  // //   "from"
  // // }
  //     })
  query.push({
    '$project': {
      'id': '$_id',
      '_id': 0,
      'total': 1,
      'payable': 1,
      'retailTotal': 1,
      'discount': 1,
      'subTotal': 1,
      'paymentMethodTotal': 1,
      'packages': 1,
      'user.id': '$user._id',
      'user.wallet': 1,
      'user.fullname': 1,
      "user.email": 1,
      "user.phone": 1,
      'user.defaultAddress.addressType': 1,
      'user.defaultAddress.id': '$user.defaultAddress._id',
      'user.defaultAddress.localType': 1,
      'user.defaultAddress.address': 1,
      'user.defaultAddress.city': 1,
      'user.defaultAddress.city_code': 1,
      'user.defaultAddress.fullname': 1,
      'user.defaultAddress.phone': 1,
      'user.defaultAddress.province': 1,
      'user.defaultAddress.user': 1,
      'user.defaultAddress.area': 1,
      'user.defaultAddress.zipCode': 1,
      'shippmentCharges': 1,
      'wallet': 1,
      'paymentMethod': 1,
      'internationalShipmentCharges': 1,
      'localShipmentCharges': 1,
    }
  })
  const cart = await Cart.aggregate(query);
  // const cart = await Cart.findOne({ user: userId })
  // .depopulate({path: 'packages', populate: {path: 'packages'}});
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_NOT_FOUND');
  }
  if (cart)
    return cart[0];

};

const emptyCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_NOT_FOUND');
  }
  cart.packages.map((_package) => {
    PackageItem.deleteMany(_package.id);
  });

  await Package.deleteMany({ cart: cart.id }).exec();
  //    await Package.updateMany({cart:cart.id}, { inCart: false });
  if (cart.paymentTrace && Object.keys(cart.paymentTrace).length)
    cart.paymentTrace.cardPaid = 0
  cart.paymentTrace.walletPaid = 0
  cart.paymentMethod = paymentMethods.COD;
  cart.retailTotal = 0;
  cart.payable = 0;
  cart.discount = 0;
  cart.paymentMethodTotal = 0;
  cart.wallet = false;
  cart.packages = [];
  await cart.save();
  return cart;
};

const getPackagesFromCart = async (cartId) => {
  return await Cart.findOne({ _id: cartId }, { packages: 1 }, { autopopulate: false })
}
const cartInternationalShippment = async (cartId, international = false) => {
  try {
    let locaCharge = await handleSetting({ key: "LOCAL_CHARGES" })
    let intCharge = await handleSetting({ key: "INT_CHARGES" })
    let _shippmentCharges = international ? intCharge : locaCharge
    const cart = await getPackagesFromCart(cartId);
    console.log(cart);
    if (cart && cart.packages)
      await packageService.updateMultiplePackages(cart.packages, _shippmentCharges);
    else throw new ApiError(httpStatus.NOT_FOUND, 'CART_MODULE.CART_OR_PACKAGE_NOT_FOUND')
    await Cart.findOneAndUpdate({ _id: cartId }, { packages: cart.packages });
  } catch (err) {
    throw new ApiError(500, err)
  }
}
const getCartByUserId = async (user) => {
  return await Cart.findOne({ user }, { packages: 1 })
}

/**
 * Create a product
 * @param {Object} payload
 * @returns {Promise<Cart>}
 */
const adminCart = async (payload, user) => {
  if (payload && payload.phoneNumber) {
    let getUser = await userService.getUserByPhoneNumber(payload.phoneNumber);
    if (!getUser) {
      var fullname = payload.fullName ? payload.fullName : "bazzar_user" + crypto.randomBytes(5).toString('hex');
      var tempUser = { phone: payload.phoneNumber, fullname, verificationMethod: verificationMethods.SMS };
      const cartPayload = { product: payload.product, quantity: payload.quantity };
      getUser = await userService.createUserWithPhone(tempUser);
      return await addItemToCart(getUser.id, cartPayload, getUser, user);
    }
    else if (getUser) {
      const cartPayload = { product: payload.product, quantity: payload.quantity };
      return await addItemToCart(getUser.id, cartPayload, getUser, user);
    } else throw new ApiError(400, 'SOME_THING_WENT_WRONG_TRY_LATER');

  } else throw new ApiError(400, 'PHONE_NUMBER_MISSING');
}

/**
 * Remove a product from cart
 * @param {ObjectId} userId
 * @param {Object} itemBody
 * @returns {Promise<Cart>}
 */

const removeItemAdmin = async (body) => {
  if (body) {
    return await removeItemFromCart(body.userId, body)
  }
  else throw new ApiError(400, 'BODY_DATA_IS_MISSING')
}

/**
 * Empty cart
 * @param {ObjectId} userId
 * @returns {Promise<Cart>}
 */
const emptyCartAdmin = async (userId) => {
  if (userId)
    return await emptyCart(userId)
  else throw new ApiError(400, 'USER_ID_MISSING')
}

/**
 * Get User cart as admin
 * @param {ObjectId} userId
 * @returns {Promise<Cart>}
 */
const getCartAdmin = async (userId) => {
  if (userId)
    return await getCartByUser(userId,true,true)
  else throw new ApiError(400, 'USER_ID_MISSING')
}

/**
 * Get User cart as admin
 * @param {Object} body
 * @returns {Promise<Cart>}
 */
const updatePaymentMethod = async (user, body) => {
  let userId;

  if (user.role === roleTypes.ADMIN || user.role === roleTypes.SUPPLIER)
    userId = body.userId;
  else if (user.role === roleTypes.USER) {
    userId = user.id
  }
  else throw new ApiError(401, 'UNAUTHORIZED');
  //................Wallet Pin Validation..................
  let pin = body.pin || null;
  if (body.wallet && user.role !== roleTypes.ADMIN) {
    let wallet = await walletModel.findOne({ user: user.id });
    if (wallet && wallet.enabled) {
      if (!pin) {
        throw new ApiError(400, 'CART_MODULE.PLEASE_PROVIDE_PIN');
        // next();
      }
      let validPin = await wallet.isPasswordMatch(pin);
      if (!validPin) throw new ApiError(400, 'CART_MODULE.PLEASE_PROVIDE_VALID_PIN');
    }
  }
  //........................................................//
  if (userId && body)
    return await Cart.findOneAndUpdate({ user: userId }, { wallet: body.wallet }, { new: true });
  else throw new ApiError(400, 'CART_MODULE.USER_OR_BODY_DATA_IS_MISSING')
  // if (userId && body) {
  //   const cart = await getCartByUser(user.id);
  //   if (cart) {
  //     if (cart.packages && cart.packages.length > 0) {
  //       if (body.wallet) {
  //         if (!user.wallet || (user.wallet && user.wallet.balance == 0))
  //           throw new ApiError(400, "You don't have balance in your wallet, Please change your payment method.");
  //         if (user.wallet && user.wallet.balance > 0) {
  //           // cart.total = cart.total>user.wallet.balance?cart.total-user.wallet.balance:cart.total<;
  //           if (cart.total >= user.wallet.balance) {
  //             cart.total = cart.total - user.wallet.balance;
  //           } else if (cart.total < user.wallet.balance) {
  //             cart.total = user.wallet.balance - cart.total;
  //           }

  //         }
  //       } else return await Cart.findOneAndUpdate({ user: user.id }, { wallet: false, paymentMethod: paymentMethods.COD }, { new: true });
  //     } else throw new ApiError(400, "Cart is empty.")
  //   } else throw new ApiError(400, "Cart not found.")
  // }
  // else throw new ApiError(400, "UserId or body is missing.")
}


let getCartCount = async (userId) => {
  let cart = await getCartByUser(userId,true,true);
  let count = 0;
  if (cart) {
    if (cart.packages && cart.packages.length > 0) {
      cart.packages.forEach(package => {
        count += package.packageItems.length
      })
      return { status: 200, isSuccess: true, data: { count }, message: 'CART_MODULE.COUNT_IS_PROVIDED' };
    } else return { status: 400, isSuccess: true, data: { count }, message: 'NO_PACKAGE_FOUND' };
  } else return { status: 400, isSuccess: true, data: { count }, message: 'CART_MODULE.CART_NOT_FOUND' };
}


/**
 * Get User cart as admin
 * @param {Object} user
 * @param {Object} body
 * @returns {Promise<Cart>}
 */
const adminPartialPayment = async (user, body) => {
  if (body && body.userId && body.amount > 0) {

    // Add amount in wallet
    const addOn = await userService.addOnWallet(body);

    // Update payment method
    if (addOn && addOn.data) {
      return await updatePaymentMethod(user, { userId: body.userId, wallet: true });

    } else return responseMethod(400, false, 'CART_MODULE.UNABLE_TO_APPLY_ADVANCE_PAYMENT');
  } else return responseMethod(400, false, 'CART_MODULE.UNABLE_TO_APPLY_ADVANCE_PAYMENT');
}

const generatePVId = async (userId) => {

  let cart = await getCartByUser(userId, true, true);
  if (!!cart) {
    return await pvService.generatePVId(cart.id, cart.payable);
  }
  else return { status: 400, isSuccess: false, data: null, message: 'CART_MODULE.CART_NOT_FOUND' };

}


let abondonedCart = async (query) => {
  let matchFilter = {
    user: { $exists: true },
    subTotal: { $exists: true, $gt: 1 },
    ...dateFilter(query)
  };


  let result = await Cart.aggregate([
    {
      $match: matchFilter
    },
    {
      $group: {
        _id: null,
        totalAbandoned: { $sum: "$subTotal" },
        count: { $sum: 1 },
        averageAbandoned: { $avg: "$subTotal" }
      }
    }
  ]).read("secondary");;

  return result.length ? result : [{ totalAbandoned: 0, averageAbandoned: 0, count: 0 }]
}

let updateCart = async (id, body) => {
  let result = await updateCardById(id, body)
  return result
}
let updateCardById = async (id, body) => {
  try {
    let result = Cart.findByIdAndUpdate(id, body)
    return result
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST.err.message)
  }
}



const shopChinaShippmentCalculation = async (product, quantity) => {
  let platformId;
  let skuAttribute;
  if (product.productType == productTypes.MAIN) {
    platformId = product.platformId
  }
  else if (product.productType == productTypes.VARIANT) {
    let parent = await productService.getProductById(product.mainProduct);
    if (parent) {
      platformId = parent.platformId
    }
  }
  const params = {
    // product_id: "1005006177002415",
    price_currency: "SAR",
    country_code: "SA",
    // product_num: "1",
    // sku_id: "12000036143707231"
  }
  if (platformId) {
    params.product_id = platformId;
    params.sku_id = product.sku;
    params.product_num = quantity

    const result = await shippmentCalculation(params);
    if (result && result.shippment && result.shippment.shippmentCharges >= 0) {
      return result.shippment.shippmentCharges
    }
    console.log(shippmentCharges)
    console.log("done")
  }
}

let dateFilter = (query) => {
  dateValidation(query);

  const today = new Date();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);

  const oneDayLessThanToday = new Date(today);
  oneDayLessThanToday.setDate(today.getDate() - 1);

  let matchFilter = {};
  const { to, from } = query;

  if (!from && !to) {
    matchFilter.updatedAt = { $lt: twoDaysAgo };
  } else if (from && !to) {
    matchFilter.updatedAt = { $gte: from, $lt: twoDaysAgo };
  } else if (!from && to) {
    if (to.toDateString() === today.toDateString()) {

      matchFilter.updatedAt = { $lt: twoDaysAgo };
    } else if (to.toDateString() === oneDayLessThanToday.toDateString()) {
      matchFilter.updatedAt = { $lt: oneDayLessThanToday };
    } else {
      matchFilter.updatedAt = { $lte: to };
    }
  } else if (from && to) {
    if (to.toDateString() === today.toDateString()) {
      matchFilter.updatedAt = { $gte: from, $lt: twoDaysAgo };
    } else if (to.toDateString() === oneDayLessThanToday.toDateString()) {
      matchFilter.updatedAt = { $gte: from, $lt: oneDayLessThanToday };
    } else {
      matchFilter.updatedAt = { $gte: from, $lte: to };
    }
  }

  return matchFilter;
};
const productSpecsHandler = async (product, quantity, aeProduct, basePrice) => {
  let _productPrice = 0;
  let _retailPrice = 0;
  if (product.price)
    _productPrice = product.price;
  if (product.regularPrice)
    _retailPrice = product.regularPrice;
  if (!product.price && product.onSale)
    _productPrice = product.salePrice;
  else if (!product.price && !product.onSale)
    _productPrice = product.regularPrice;
  if (!product.price && !product.regularPrice && !product.salePrice)
    throw new ApiError(400, "Product price is not defined.")
  let weight = product.weight || product.packageInfo.weight || 1;
  let internationalShipmentCharges = 0
  if (aeProduct)

    internationalShipmentCharges = await shopChinaShippmentCalculation(product, quantity);
  let productSpecs = {
    quantity,
    weight,
    _productPrice,
    _retailPrice,
    internationalShipmentCharges,
    origin: product.origin,
    basePrice: _productPrice * quantity
  }
  return { ...productSpecs, ...regionPriceHandler(productSpecs, basePrice) };
}
/**
 * Creates a new PackageItem instance.
 * @param {Object} product - The product object containing the product details.
 * @param {Object} productSpecs - An object containing specifications such as quantity, price, and weight.
 * @param {ObjectId} packageId - The ID of the package to which this item belongs.
 * @returns {PackageItem} The newly created PackageItem instance with calculated total and weight.
 */
const packageItemCreation = (product, productSpecs, packageId) => {

  const newPack = new PackageItem({
    _package: packageId,
    product: product.id,

  });
  return setPackItemsPrices(productSpecs, newPack)
}

/**
 * Creates a new Package and PackageItem instance and links them together.
 * @param {Cart} cart - The cart to which the package belongs.
 * @param {Object} product - The product object containing the product details.
 * @param {Object} productSpecs - An object containing specifications such as quantity, price, and weight.
 * @returns {Object} An object with the newly created Package and PackageItem instances.
 */
const newPackageCreation = (cart, product, productSpecs, shippmentCharges) => {
  const newPack = new Package({
    seller: product.user,
    cart: cart.id,
    shippmentCharges

  });
  newPackItem = packageItemCreation(product, productSpecs, newPack.id);
  newPackItem.discount = newPackItem.retailTotal - newPackItem.total;
  newPack.packageItems.push(newPackItem);
  return { newPack, newPackItem };
}
let setNewPackageItem = (product, newPackage, _productPrice, _retailPrice, basePriceData, quantity, weight) => {
  let modifiedschema = {}
  if (product.origin == regions.KSA) {
    modifiedschema = {
      total: (_productPrice * quantity),
      retailTotal: (_retailPrice * quantity),
      adjusttedShipment: (basePriceData.shipmentCharges) * quantity,
      vat: numberRounder(calculatePercentage(_productPrice, basePriceData.vat) * quantity),
    }
    let totalAmount = (modifiedschema.vat + modifiedschema.adjusttedShipment)
    modifiedschema.total = modifiedschema.total + totalAmount
    modifiedschema.retailTotal = modifiedschema.retailTotal + totalAmount
  }
  if (product.origin == regions.PAK) {
    modifiedschema = {
      total: (_productPrice * quantity),
      retailTotal: (_retailPrice * quantity),
      forex: numberRounder(calculatePercentage(_productPrice, basePriceData.forex) * quantity),
      adjusttedShipment: (basePriceData.shipmentCharges) * quantity,
      vat: numberRounder(calculatePercentage(_productPrice, basePriceData.vat) * quantity),
      premiumAmount: numberRounder(calculatePercentage(_productPrice, basePriceData.premiumPercentage) * quantity),
    }
    let totalAmount = (modifiedschema.forex + modifiedschema.premiumAmount + modifiedschema.vat + modifiedschema.adjusttedShipment)

    modifiedschema.total = modifiedschema.total + totalAmount
    modifiedschema.retailTotal = modifiedschema.retailTotal + totalAmount
  }
  if (product.origin == regions.CHINA) {
    let vat = numberRounder(calculatePercentage(_productPrice, basePriceData.vat) * quantity),
      modifiedschema = {
        total: (_productPrice * quantity) + vat,
        retailTotal: (_retailPrice * quantity) + vat,
        vat: vat,
      }
    // let totalAmount=(modifiedschema.forex+modifiedschema.vat)
    // modifiedschema.total= modifiedschema.total+totalAmount
    // modifiedschema.retailTotal= modifiedschema.retailTotal+totalAmount
  }

  const newPackageItem = new PackageItem({
    _package: newPackage?.id ? newPackage.id : newPackage,
    product: product.id,
    quantity: quantity,
    weight: weight * quantity,
    basePrice: _productPrice * quantity,
    ...modifiedschema
  });
  return newPackageItem
}
let packageItemUpdatebody = (product, _productPrice, _retailPrice, quantity, weight, basePriceData) => {
  let forex = numberRounder(calculatePercentage(_productPrice, basePriceData.forex) * quantity)
  let premiumAmount = numberRounder(calculatePercentage(_productPrice, basePriceData.premiumPercentage) * quantity)
  let adjusttedShipment = (basePriceData.shipmentCharges) * quantity
  let vat = numberRounder(calculatePercentage(_productPrice, basePriceData.vat) * quantity)
  let packagetitemUpdate = {
    product: product.id,
    quantity: quantity,
    weight: weight * quantity,
    basePrice: _productPrice * quantity,
  }

  if (product.origin == regions.PAK) {
    let modifiedObject = {
      total: numberRounder((_productPrice * quantity) + vat + premiumAmount + forex + adjusttedShipment),
      retailTotal: numberRounder((_retailPrice * quantity) + vat + premiumAmount + forex + adjusttedShipment),
      forex: forex,
      premiumAmount: premiumAmount,
      adjusttedShipment: adjusttedShipment,
      vat: vat,

    }

    return packagetitemUpdate = Object.assign(packagetitemUpdate, modifiedObject)

  }
  if (product.origin == regions.CHINA) {
    let modifiedObject = {
      total: (_productPrice * quantity) + vat,
      retailTotal: (_retailPrice * quantity) + vat,
      vat: vat,
    }

    return packagetitemUpdate = Object.assign(packagetitemUpdate, modifiedObject)

  }
  if (product.origin == regions.KSA) {
    let modifiedObject = {
      total: (_productPrice * quantity) + vat + adjusttedShipment,
      retailTotal: (_retailPrice * quantity) + vat + adjusttedShipment,
      adjusttedShipment: adjusttedShipment,
      vat: vat,

    }
    let a = packagetitemUpdate = Object.assign(packagetitemUpdate, modifiedObject)

    return packagetitemUpdate = Object.assign(packagetitemUpdate, modifiedObject)

  }
}

// const regionPriceHandler = (productSpecs, basePriceData) => {
//   const { _productPrice, _retailPrice, quantity, origin } = productSpecs;
//   let modifiedschema = {
//     total: (_productPrice * quantity),
//     retailTotal: (_retailPrice * quantity),
//     forex: 0,
//     adjusttedShipment: 0,
//     vat: numberRounder(calculatePercentage(_productPrice, basePriceData.vat,100-basePriceData.vat) * quantity),
//     premiumAmount: 0,
//   }
//   const retailVat = numberRounder(calculatePercentage(_retailPrice, basePriceData.vat,100-basePriceData.vat) * quantity) + modifiedschema.adjusttedShipment;
//   const retailPremium = numberRounder(calculatePercentage(_retailPrice, basePriceData.premiumPercentage,100-basePriceData.vat) * quantity);
//   const retailForex = numberRounder(calculatePercentage(_retailPrice, basePriceData.forex) * quantity);
//   if (productSpecs.origin == regions.KSA) {
//     modifiedschema.adjusttedShipment = (basePriceData.shipmentCharges) * quantity;
//     let totalAmount = (modifiedschema.vat + modifiedschema.adjusttedShipment)
//     modifiedschema.total = modifiedschema.total + totalAmount
//     modifiedschema.retailTotal = numberRounder(modifiedschema.retailTotal + retailVat + modifiedschema.adjusttedShipment)
//   }
//   if (productSpecs.origin == regions.PAK) {
//     modifiedschema.forex = numberRounder(calculatePercentage(_productPrice, basePriceData.forex,100-basePriceData.vat) * quantity);
//     modifiedschema.adjusttedShipment = (basePriceData.shipmentCharges) * quantity;
//     modifiedschema.premiumAmount = numberRounder(calculatePercentage(_productPrice, basePriceData.premiumPercentage,100-basePriceData.vat) * quantity);
//     let totalAmount = (modifiedschema.forex + modifiedschema.premiumAmount + modifiedschema.vat + modifiedschema.adjusttedShipment)
//     // const retailVat = numberRounder(calculatePercentage(_retailPrice, basePriceData.vat) * quantity) + modifiedschema.adjusttedShipment
//     modifiedschema.total = modifiedschema.total + totalAmount
//     modifiedschema.retailTotal = numberRounder(modifiedschema.retailTotal + retailVat + retailPremium + retailForex + modifiedschema.adjusttedShipment);
//   }
//   if (productSpecs.origin == regions.CHINA) {
//     let vat = numberRounder(calculatePercentage(_productPrice, basePriceData.vat,100-basePriceData.vat) * quantity);
//     modifiedschema.total = (_productPrice * quantity) + vat;
//     modifiedschema.retailTotal = numberRounder((_retailPrice * quantity) + retailVat);
//     modifiedschema.vat = vat;
//   }
//   return modifiedschema;
// }

const regionPriceHandler = (productSpecs, basePriceData) => {
  const { _productPrice, _retailPrice, quantity, origin } = productSpecs;
  basePriceData=decideOriginCharges(origin,basePriceData)
  let modifiedschema = {
    total: (_productPrice * quantity),
    retailTotal: (_retailPrice * quantity),
    forex: 0,
    adjusttedShipment: 0,
    vat: numberRounder(calculatePercentage(_productPrice, basePriceData.vat,100-basePriceData.vat) * quantity),
    premiumAmount: 0,
  }
  const retailVat = numberRounder(calculatePercentage(_retailPrice, basePriceData.vat,100-basePriceData.vat) * quantity) ;
  const retailPremium = numberRounder(calculatePercentage(_retailPrice, basePriceData.premiumPercentage,100) * quantity);
  const retailForex = numberRounder(calculatePercentage(_retailPrice, basePriceData.forex) * quantity);
  let basePricePremium=numberRounder(calculatePercentage(_productPrice, basePriceData.premiumPercentage,100) * quantity);
  let retailPremiumVat=numberRounder(calculatePercentage(retailPremium, basePriceData.vat,100-basePriceData.vat) );
  let basePricePremiumVat=numberRounder(calculatePercentage(basePricePremium, basePriceData.vat,100-basePriceData.vat));

  if (productSpecs.origin == regions.KSA) {
    modifiedschema.adjusttedShipment = (basePriceData.shipmentCharges) * quantity;
    modifiedschema.premiumAmount = basePricePremium
    let totalAmount = (modifiedschema.vat + modifiedschema.adjusttedShipment+basePricePremiumVat+basePricePremium)
    modifiedschema.total = modifiedschema.total + totalAmount
    modifiedschema.retailTotal = numberRounder(modifiedschema.retailTotal + retailVat +retailPremiumVat+retailPremium+ modifiedschema.adjusttedShipment)
  }
  if (productSpecs.origin == regions.PAK) {
    modifiedschema.forex = numberRounder(calculatePercentage(_productPrice, basePriceData.forex,100) * quantity);
    modifiedschema.adjusttedShipment = (basePriceData.shipmentCharges) * quantity;
    modifiedschema.premiumAmount = basePricePremium
    let totalAmount = (modifiedschema.forex + basePricePremiumVat + modifiedschema.vat + modifiedschema.adjusttedShipment+basePricePremium)
    // const retailVat = numberRounder(calculatePercentage(_retailPrice, basePriceData.vat) * quantity) + modifiedschema.adjusttedShipment
    modifiedschema.total = modifiedschema.total + totalAmount
    modifiedschema.retailTotal = numberRounder(modifiedschema.retailTotal + retailVat + retailPremiumVat +retailPremium+ retailForex + modifiedschema.adjusttedShipment);
  }
  if (productSpecs.origin == regions.CHINA) {
    let vat = numberRounder(calculatePercentage(_productPrice, basePriceData.vat,100-basePriceData.vat) * quantity);
    modifiedschema.adjusttedShipment = (basePriceData.shipmentCharges) * quantity;
    let totalAmount = (  basePricePremiumVat + modifiedschema.vat+basePricePremium+ modifiedschema.adjusttedShipment )
    modifiedschema.total = (_productPrice * quantity) + totalAmount;
    modifiedschema.retailTotal = numberRounder((_retailPrice * quantity) + retailVat+retailPremiumVat+retailPremium+ modifiedschema.adjusttedShipment);
    modifiedschema.vat = vat;
    modifiedschema.premiumAmount = basePricePremium
  }
  return modifiedschema;
}

const setPackItemsPrices = (productSpecs, newPackItem) => {
  newPackItem.quantity = productSpecs.quantity;
  newPackItem.total = productSpecs.total;
  newPackItem.weight = productSpecs.weight * productSpecs.quantity;
  newPackItem.retailTotal = productSpecs.retailTotal;
  newPackItem.internationalShipmentCharges = productSpecs.internationalShipmentCharges;
  newPackItem.adjusttedShipment = productSpecs.adjusttedShipment;
  newPackItem.vat = productSpecs.vat;
  newPackItem.forex = productSpecs.forex;
  newPackItem.premiumAmount = productSpecs.premiumAmount;
  newPackItem.basePrice = productSpecs.basePrice;
  return newPackItem;

}
let decideOriginCharges=(origin,basePriceData)=>{
  if(origin=="pak")
   return assignValuesToVariables(basePriceData.pakPremium,basePriceData.pakVat,basePriceData.pakForex,basePriceData.pakShipment)
  if(origin=="china")
    return assignValuesToVariables(basePriceData.chinaPremium,basePriceData.chinaVat,basePriceData.chinaForex,basePriceData.chinaShipment)
  if(origin=="ksa")
    return assignValuesToVariables(basePriceData.ksaPremium,basePriceData.ksaVat,basePriceData.ksaForex,basePriceData.ksaShipment)  
}
let assignValuesToVariables=(premium,vat,forex,shipment)=>{
  let charges={
    premiumPercentage:premium,
    vat:vat,
    forex:forex,
    shipmentCharges:shipment
  }
  return charges
}
module.exports = {
  addPackageToCart,
  addItemToCart,
  removeItemFromCart,
  emptyCart,
  getCartByUser,
  unloadPackageFromCart,
  deletePackageFromCart,
  getCartById,
  cartInternationalShippment,
  getCartByUserId,
  adminCart,
  removeItemAdmin,
  emptyCartAdmin,
  getCartAdmin,
  updatePaymentMethod,
  getCartCount,
  adminPartialPayment,
  generatePVId,
  updateCart,
  abondonedCart,
  addItemToCartV2
};
