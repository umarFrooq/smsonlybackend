const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../config/express');
const setupTestDB = require('../utils/setupTestDB');
const { userOne,supplierOne, userTwo, admin, insertUsers, supplierTwo } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken, userTwoAccessToken } = require('../fixtures/token.fixture');
const { cartOne, cartTwo,cartThree,insertCarts } = require('../fixtures/cart.fixture');
const { productOne, productTwo, productThree,insertProducts } = require('../fixtures/product.fixture');

const db = require("../../config/mongoose");
setupTestDB();


const Cart = db.Cart;
describe('Cart routes', () => {
  // describe('POST /v1/cart', () => {
  //   let newCart;
  //   beforeEach(() => {
  //     newCart = {
  //       product: productOne._id.toHexString(),
  //       quantity:2
  //     };
  //   });

  
  //   test('should return 201 and successfully create cart and add product to cart if data is ok', async () => {
  //     await insertUsers([userOne]);
  //     await insertProducts([productOne, productTwo, productThree]);
  //     const res = await request(app)
  //       .post('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send(newCart)
  //       .expect(httpStatus.CREATED);
  //      expect(res.body).toEqual({ 
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
        
  //        user: userOne._id.toHexString() 
  //       });
  //       expect(res.body.items[0]).toEqual({
  //         id: expect.anything(),
  //         product: expect.objectContaining({
  //           id: productOne._id.toHexString(),
            
           
  //         }),
  //         quantity: newCart.quantity,
  //       });


  //     const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
  //     expect(dbCart).toBeDefined();
  //     expect(dbCart).toMatchObject({ 
         
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
  //        user: userOne._id 
  //     });

  //     expect(res.body.items[0]).toMatchObject({
        
  //       product: expect.objectContaining({
  //         id: productOne._id.toHexString(),
          
         
  //       }),
  //       quantity: newCart.quantity,
  //     });

  //   });
    
  //   test('should return 201 and successfully add product already in cart and update quantity  if data is ok', async () => {
  //     await insertUsers([userOne]);
  //     await insertProducts([productOne, productTwo, productThree]);
  //     await insertCarts([cartOne])
  //     const res = await request(app)
  //       .post('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send(newCart)
  //       .expect(httpStatus.CREATED);
  //      expect(res.body).toEqual({ 
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
        
  //        user: userOne._id.toHexString() 
  //       });
  //       expect(res.body.items[0]).toEqual({
  //         id: expect.anything(),
  //         product: expect.objectContaining({
  //           id: productOne._id.toHexString(),
            
           
  //         }),
  //         quantity: 4,
  //       });


  //     const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
  //     expect(dbCart).toBeDefined();
  //     expect(dbCart).toMatchObject({ 
         
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
  //        user: userOne._id 
  //     });

  //     expect(res.body.items[0]).toMatchObject({
  //       product: expect.objectContaining({
  //         id: productOne._id.toHexString(),
          
         
  //       }),
  //       quantity: 4,
  //     });

  //   });
  
  //   test('should return 201 and successfully add another product  to cart   if data is ok', async () => {
  //     await insertUsers([userOne]);
  //     //newCart.product=productTwo._id.toHexString()
  //     await insertProducts([productOne, productTwo, productThree]);
  //     await insertCarts([cartOne])
  //     const res = await request(app)
  //       .post('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send({
  //         product: productTwo._id.toHexString(),
  //         quantity:2
  //       })
  //       .expect(httpStatus.CREATED);
  //      expect(res.body).toEqual({ 
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
        
  //        user: userOne._id.toHexString() 
  //       });
        
    
  //       expect(res.body.items[0]).toEqual({
  //         id: expect.anything(),
  //         product: expect.objectContaining({
  //           id: productOne._id.toHexString(),
            
           
  //         }),
  //         quantity: 2,
  //       });
  //       expect(res.body.items[1]).toEqual({
  //         id: expect.anything(),
  //         product: expect.objectContaining({
  //           id: productTwo._id.toHexString(),
            
           
  //         }),
  //         quantity: 2,
  //       });


  //     const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
  //     expect(dbCart).toBeDefined();
  //     expect(dbCart).toMatchObject({ 
         
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
  //        user: userOne._id 
  //     });

  //     expect(res.body.items[0]).toMatchObject({
  //       product: expect.objectContaining({
  //         id: productOne._id.toHexString(),
          
         
  //       }),
  //       quantity: 2,
  //     });
  //     expect(res.body.items[1]).toMatchObject({
  //       product: expect.objectContaining({
  //         id: productTwo._id.toHexString(),
          
         
  //       }),
  //       quantity: 2,
  //     });

  //   });
    
   
  //   test('and successfully removing product form cart  if  quantity is negative', async () => {
  //     await insertUsers([userOne]);
  //     newCart.quantity=-3;
  //     await insertProducts([productOne, productTwo, productThree]);
  //     await insertCarts([cartOne])
  //     const res = await request(app)
  //       .post('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send(newCart)
  //       .expect(httpStatus.CREATED);
  //      expect(res.body).toEqual({ 
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
        
  //        user: userOne._id.toHexString() 
  //       });
  //       expect(res.body.items[0]).toBeUndefined();


  //     const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
  //     expect(dbCart).toBeDefined();
  //     expect(dbCart).toMatchObject({ 
         
  //       id: expect.anything(), 
  //       items: expect.any(Array), 
        
  //        user: userOne._id 
  //     });

  //     expect(res.body.items[0]).toBeUndefined()

  //   });
  
  //   test('should return 404 if product add to cart is not found', async () => {
  //     await insertUsers([userOne]);
  //     await insertProducts([ productTwo, productThree]);

  //     const res = await request(app)
  //       .post('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send(newCart)
  //       .expect(httpStatus.NOT_FOUND);
  
  // });
  
  
  
  // });
 
  describe("GET /v1/cart", () => {
    // test("should return 200 and the cart object", async () => {
    
    //   await insertUsers([userOne]);
    //   await insertProducts([productOne, productTwo, productThree]);
    //   await insertCarts([cartOne])
    //   const res = await request(app)
    //     .get('/v1/cart')
    //     .set('Authorization', `Bearer ${userOneAccessToken}`)
    //     .send()
    //     .expect(httpStatus.OK);
    //     // console.log(res.body)
    //    expect(res.body).toEqual({ 
    //     id: expect.anything(), 
    //     items: expect.any(Array), 
        
        
    //      user: userOne._id.toHexString() 
    //     });
        
    
    //     expect(res.body.items[0]).toEqual({
    //       id: expect.anything(),
    //       product: expect.objectContaining({
    //         id: productOne._id.toHexString(),
            
           
    //       }),
    //       quantity: 2,
    //     });
       
    //   const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
    //   expect(dbCart).toBeDefined();
    //   expect(dbCart).toMatchObject({ 
         
    //     id: expect.anything(), 
    //     items: expect.any(Array), 
        
    //      user: userOne._id 
    //   });

    //   expect(res.body.items[0]).toMatchObject({
    //     product: expect.objectContaining({
    //       id: productOne._id.toHexString(),
          
         
    //     }),
    //     quantity: 2,
    //   });
    
    
    // })
    
    
    test("should return 404 error if cart is not found", async () => {
      await insertUsers([userOne,supplierOne,supplierTwo]);
      await insertProducts([productOne, productTwo, productThree]);
      await insertCarts([cartTwo])
      const res = await request(app)
        .get('/v1/cart')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);

      
    })
  
  })
 
  // describe("PATCH /v1/cart", () => {
  //   let removeFromCart;
  //   beforeEach(() => {
  //     removeFromCart = {
  //       product: productOne._id.toHexString(),

  //     };
  //   });
  //   test('and successfully removing product form cart ', async () => {
  //     await insertUsers([userOne]);
  //     await insertProducts([productOne, productTwo, productThree]);
  //     await insertCarts([cartOne])
  //     const res = await request(app)
  //       .patch('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send(removeFromCart)
  //       .expect(httpStatus.OK);
        
  //         expect(res.body).toEqual({ 
  //         id: expect.anything(), 
  //         items: expect.any(Array), 
          
          
  //          user: userOne._id.toHexString() 
  //         });
  //         expect(res.body.items[0]).toBeUndefined();
  
  
  //       const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
  //       expect(dbCart).toBeDefined();
  //       expect(dbCart).toMatchObject({ 
           
  //         id: expect.anything(), 
  //         items: expect.any(Array), 
          
  //          user: userOne._id 
  //       });
  
  //       expect(res.body.items[0]).toBeUndefined()
  
    


        
  //     })

  //     test('retrun 404 if removing that product form cart which is not found   ', async () => {
  //       await insertUsers([userOne]);
  //       await insertProducts([productOne, productThree]);
  //       await insertCarts([cartOne])
  //       removeFromCart.product=productTwo._id.toHexString()
  //       await request(app)
  //         .patch('/v1/cart')
  //         .set('Authorization', `Bearer ${userOneAccessToken}`)
  //         .send(removeFromCart)
  //         .expect(httpStatus.NOT_FOUND);
          
           
      
  
  
          
  //       })
  
  //       test('retrun 404 if removing a product but the cart is not found  ', async () => {
  //         await insertUsers([userOne]);
  //         await insertProducts([productOne, productThree]);
  //         await insertCarts([cartTwo])
  //         await request(app)
  //           .patch('/v1/cart')
  //           .set('Authorization', `Bearer ${userOneAccessToken}`)
  //           .send(removeFromCart)
  //           .expect(httpStatus.NOT_FOUND);
            
             
        
    
    
            
  //         })
    
  // })
  
  // describe("DELETE /v1/cart", () => {
  //   test("should return 204 if data is ok ", async () => {
  //     await insertUsers([admin,userOne, supplierOne, supplierTwo]);
  //     await insertProducts([productOne, productTwo, productThree]);
  //     await insertCarts([cartOne])
     
  //    const res= await request(app)
  //       .delete(`/v1/cart`)
  //       .set("Authorization", `Bearer ${userOneAccessToken}`)
  //       .send()
  //       .expect(httpStatus.OK);
  // expect(res.body).toEqual({ 
  //   id: expect.anything(), 
  //   items: expect.any(Array), 
    
    
  //    user: userOne._id.toHexString() 
  //   });
    

  //   expect(res.body.items).toEqual([]);



  //       const dbCart = await Cart.findOne({user:userOne._id.toHexString()});
  //       expect(dbCart).toBeDefined();
  //       expect(dbCart).toMatchObject({ 
         
  //         id: expect.anything(), 
  //         items: expect.any(Array), 
          
  //          user: userOne._id 
  //       });
       
  //      expect(dbCart.items).toHaveLength(0);
  
  //   });

  //   test('retrun 200 if emptying the cart which  is not found  ', async () => {
  //     await insertUsers([userOne]);
  //     await insertProducts([productOne, productThree]);
  //     await insertCarts([cartTwo])
  //     await request(app)
  //       .delete('/v1/cart')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .send()
  //       .expect(httpStatus.NOT_FOUND);
        
         
    


        
  //     })


  //   });


});

