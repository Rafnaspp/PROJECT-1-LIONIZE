var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { response } = require('../app')
var objectid = require('mongodb').ObjectId
const Razorpay=require('razorpay')
const { resolve } = require('path')
const { USER_COLLECTION } = require('../config/collections')
const { Collection } = require('mongodb')
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
  })
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret:  process.env.KEY_SECRET,
  });

module.exports={
    doSignup:(userData)=>{
        return new Promise(async (resolve, reject) => {
          try {
              const userinfo={}
              userData.password = await bcrypt.hash(userData.password, 10)
              db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
  
                  console.log(data);
                  if(data){
                      console.log("valid user");
                    userinfo.isUserValid=true
                    userinfo.user=userData
                    resolve(userinfo)
                  }else{
                      console.log("not a  valid user");
                      userinfo.isUserValid=false
                      resolve(userinfo)
                  }
                 
              }).catch((err)=>{
                  reject(err)
              })
          } catch (error) {
            reject(error)
          }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
           try {
             let loginStatus = false
             let response = {}
             let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email,blockUser:false})
             if (user) {
                 bcrypt.compare(userData.password, user.password).then((status) => {
                     if (status) {
                         response.user = user;
                         response.status = true; 
                         resolve(response);
                     } else {
                         resolve({ status: false })
                     }
                 })
             } else {
                 resolve({ status: false })
             }
           } catch (error) {
            reject(error)
           }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectid(proId),
            quantity:1
        }
        return new Promise(async (resolve,reject)=>{
           try {
             let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectid(userId)})
             if(userCart){
                 let proExist=userCart.products.findIndex(product=>product.item==proId)
                 if(proExist!=-1){
                     db.get().collection(collection.CART_COLLECTION)
                     .updateOne({user:objectid(userId),'products.item':objectid(proId)},
                     {
                             $inc:{'products.$.quantity':1} 
                     }
                     ).then(()=>{
                         resolve()
                     })
                 }else{
                 db.get().collection(collection.CART_COLLECTION)
                 .updateOne({user:objectid(userId)},
                 {
                     $push:{products:proObj}
                 }).then((response)=>{
                     resolve()
                 })}
             }else{
                 let cartObj={
                     user:objectid(userId),
                     products:[proObj]
                 }
                 db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                     resolve()
                 })
             }
           } catch (error) {
            reject(error)
           }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
       try {
        let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
         {
             $match:{user:objectid(userId)}
         },
         {
             $unwind:'$products'
         },
         {
             $project:{
                 item:'$products.item',
                 quantity:'$products.quantity'
             }
         },
         {
             $lookup:{
                 from:collection.PRODUCT_COLLECTION,
                 localField:'item',
                 foreignField:'_id',
                 as:'product'
             }
         },
         {
             $project:{
                 item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
             }
         },
         {
             $addFields:{
                 sum:{$multiply:['$quantity','$product.price']}
             }
         }
        ]).sort({_id:-1})
        .toArray()
        console.log('haiii');
        console.log(cartItems);
        console.log('hloo');
        resolve(cartItems)
       } catch (error) {
        
       }
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
      try {
              if(details.count==-1 && details.quantity==1){
                  db.get().collection(collection.CART_COLLECTION)
              .updateOne({_id:objectid(details.cart)},
              {
                      $pull:{products:{item:objectid(details.product)}} 
              }
              ).then((response)=>{
                  resolve({removeProduct:true})
              }) 
        }else{
          console.log(details.count);
          db.get().collection(collection.CART_COLLECTION)
              .updateOne({_id:objectid(details.cart),'products.item':objectid(details.product)},
              {
                      $inc:{'products.$.quantity':details.count} 
              }
              ).then((response)=>{
                  resolve({status:true})
              })
        }
      } catch (error) {
        reject(error)
      }
            
            
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                 {
                     $match:{user:objectid(userId)}
                 },
                 {
                     $unwind:'$products'
                 },
                 {
                     $project:{
                         item:'$products.item',
                         quantity:'$products.quantity'
                     }
                 },
                 {
                     $lookup:{
                         from:collection.PRODUCT_COLLECTION,
                         localField:'item',
                         foreignField:'_id',
                         as:'product'
                     }
                 },
                 {
                     $project:{
                         item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                     }
                 },
                 {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.price']}}
                    }
    
                 }
                ]).toArray()
                console.log('before total');
                console.log(total);
                console.log('after total'); 
               console.log(total[0].total)
                resolve(total[0].total)
            } catch (error) {
               reject(error) 
            }
             })
    },
    placeOrder:(order,products,total,discountData)=>{
        let orderData = {
            Total_Amount: total,
            discountData: discountData

        }
          return new Promise((resolve,reject)=>{
          try {
               let status=order['payment-method']==='COD'?'placed':'pending'
               let orderObj={
                  deliveryDetails:{
                         mobile:order.mobileNo,
                         address:order.address,
                         pincode:order.pincode
                  },
                  orderData: orderData,
                  userId:objectid(order.userId),
                  paymentMethod:order['payment-method'],
                  products:products,
                  totalAmount:total,
                  status:status,
                  date:  new Date(new Date().getTime()).toLocaleString()
               }
               db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                  db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectid(order.userId)})
                  resolve(response.insertedId)
               })
          } catch (error) {
            reject(error)
          }
          })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectid(userId)})
                resolve(cart.products)
            } catch (error) {
              reject(error)  
            }
        })
    },
    getOrderDetails:(userId)=>{
        console.log(userId+'userid');
        
        return new Promise(async (resolve,reject)=>{
         try {
             let orderDetail=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectid(userId)})
             .sort({_id:-1})
             .toArray()
               console.log(orderDetail);
               console.log('orderdetail');
       resolve(orderDetail)
         } catch (error) {
            reject(error)
         }
           
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
      try {
         let orderProducts=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
              $match:{_id:objectid(orderId)}
          },
          {
              $unwind:'$products'
          },
          {
              $project:{
                  item:'$products.item',
                  quantity:'$products.quantity'
              }
          },
          {
              $lookup:{
                  from:collection.PRODUCT_COLLECTION,
                  localField:'item',
                  foreignField:'_id',
                  as:'product'
              }
          },
          {
              $project:{
                  item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
              }
          },
          {
              $addFields:{
                  sum:{$multiply:['$quantity','$product.price']}
              }
          }
         ]).toArray()
         console.log('orderproducts');
         console.log(orderProducts);
         console.log('orderproducts');
         resolve(orderProducts)
      } catch (error) {
        reject(error)
      }
        })
    },
    blockUser:(userId)=>{
        console.log(userId);
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectid(userId)},{$set:{blockUser:true}}).then((response)=>{
                    resolve(response) 
                })
            } catch (error) {
              reject(error)  
            }
        })
    },
    unblockUser:(userId)=>{
        console.log(userId);
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectid(userId)},{$set:{blockUser:false}}).then((response)=>{
                    resolve(response) 
                })
            } catch (error) {
              reject(error)  
            }
        })
    },
    generateRazorpay:(orderId,total)=>{
        
        console.log('orderiddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd');
        console.log(orderId,total);
        return new Promise(async(resolve,reject)=>{
     try {
               var options ={
                   amount:total*100,
                   currency:'INR',
                   receipt:""+orderId
               }
               instance.orders.create(options, function(err,order){
                   if(err){
                       console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                       console.log(err);
                   }else{
                       console.log('order here');
                   console.log(order);
                   resolve(order)
                   }
               })
     } catch (error) {
        reject(error)
     }
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
         try {
               const crypto = require('crypto')
               let hmac = crypto.createHmac('sha256', "hrK9Sby0eswnOmku5NXuqcX7")
               hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
               hmac=hmac.digest('hex')
               if(hmac==details[ 'payment[razorpay_signature]']){
                   resolve()
               }else{
                   reject()
               }
         } catch (error) {
            reject(error)
         }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
        try {
                db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({_id:objectid(orderId)},
                {
                    $set:{
                        status:'placed'
                    }
                }).then(()=>{
                    resolve()
                })
        } catch (error) {
          reject(error)  
        }
        })
    },
    removeCartItem:(details)=>{
        return new Promise((resolve,reject)=>{
           try {
             console.log('remove callllllllllllll');
             db.get().collection(collection.CART_COLLECTION)
             .updateOne({_id:objectid(details.cart)},
             {
                     $pull:{products:{item:objectid(details.product)}} 
             }
             ).then((response)=>{
                 resolve({removeProdu:true}) 
             })
           } catch (error) {
            reject(error)
           }
             
        })
    },
    getCatBaseProducts:(cateName)=>{
        console.log(cateName+'heiiiiiiiiiiiiii');
        return new Promise(async (resolve,reject)=>{
          try {
            let catBaseProducts=await db.get().collection(collection.PRODUCT_COLLECTION).find({category:cateName}).toArray()
              console.log(catBaseProducts);
              console.log('orderdetail');
      resolve(catBaseProducts)
          } catch (error) {
           reject(error) 
          }
           
        })
    },
    addToWishlist:(proId,userId)=>{
        let proObj={
            item:objectid(proId),
            
        }
        return new Promise(async (resolve,reject)=>{
       try {
             let userCart=await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectid(userId)})
             if(userCart){
                 let proExist=userCart.products.findIndex(product=>product.item==proId)
                 if(proExist < 0){
                     db.get().collection(collection.WISHLIST_COLLECTION)
                 .updateOne({user:objectid(userId)},
                 {
                     $push:{products:proObj}
                 }).then((response)=>{
                     resolve()
                 })}
                 
                
             }else{
                 let cartObj={
                     user:objectid(userId),
                     products:[proObj]
                 }
                 db.get().collection(collection.WISHLIST_COLLECTION).insertOne(cartObj).then((response)=>{
                     resolve()
                 })
             }
       } catch (error) {
        reject(error)
       }
        })
    },
    getWishlistProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
      try {
         let cartItems=await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
          {
              $match:{user:objectid(userId)}
          },
          {
              $unwind:'$products'
          },
          {
              $project:{
                  item:'$products.item'
              }
          },
          {
              $lookup:{
                  from:collection.PRODUCT_COLLECTION,
                  localField:'item',
                  foreignField:'_id',
                  as:'product'
              }
          },
          {
              $project:{
                  item:1,product:{$arrayElemAt:['$product',0]}
              }
          }
         ]).sort({_id:-1})
         .toArray()
         console.log('haiii');
         console.log(cartItems);
         console.log('hloo');
         resolve(cartItems)
      } catch (error) {
        reject(error)
      }
        })
    },
    removeWishItem:(detai)=>{
        return new Promise((resolve,reject)=>{
       try {
             console.log('remove callllllllllllll');
             db.get().collection(collection.WISHLIST_COLLECTION)
             .updateOne({_id:objectid(detai.user)},
             {
                     $pull:{products:{item:objectid(detai.product)}} 
             }
             ).then((response)=>{
                 resolve({removeProd:true}) 
             })
       } catch (error) {
        reject(error)
       }
             
        })
    },
    getUserDetail:(userId)=>{
         return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.USER_COLLECTION).findOne({_id:objectid(userId)}).then((data)=>{
                    console.log(data);
                    resolve(data)
                })
            } catch (error) {
              reject(error)  
            }
         })
        
    },
    editUserProfile:(userid,profileDetail)=>{
        return new Promise((resolve,reject)=>{
             try {
                 db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectid(userid)},{
                   $set:{
                       Name:profileDetail.name,
                       lastName:profileDetail.lastName,
                       Email:profileDetail.email,
                       mobileNo:profileDetail.mobileNo
                      
                   }
                 }).then((response)=>{
                   resolve()
                 })
             } catch (error) {
                reject(error)
             }
        })
    },
    checkCoupon: (code, amount) => {
        const coupon = code.toString().toUpperCase();

        console.log(coupon);

        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).findOne({ Name: coupon }).then((response) => {
                console.log(response);
                console.log('from db');
                if (response == null) {
                    // let response = {status : false}
                    console.log(response + "          null resp");
                    reject({ status: false })
                } else {
                    let offerPrice = parseInt(amount * response.Offer)
                    // let discountPrice = amount - offerPrice
                    let newTotal = parseInt(amount - offerPrice)
                    // response = {
                    //     amount: newTotal,
                    //     discount: discountPrice
                    // }
                    console.log("          Nonnull resp");
                    resolve(response = {
                        couponCode: coupon,
                        status: true,
                        amount: newTotal,
                        discount: offerPrice
                    })
                }
            }).catch((error) => {
                reject(error)
            })
        })
    },
    getRevenue: () => {
        return new Promise(async (resolve, reject) => {
            let deliveredRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { "status": "Delivered" }
                },

                {
                    $group: {
                        _id : null,
                        total: { $sum: '$orderData.Total_Amount' }
                    }
                }

            ]).toArray()

            deliveredRevenue = deliveredRevenue[0]?deliveredRevenue[0].total:0

            let discountRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match : { "status" : "Delivered" }
                },
                
                {
                    $group : {
                        _id : null,
                        total : { $sum : "$orderData.discountData.discount"}
                    }
                }           
            ]).toArray()
            discountRevenue = discountRevenue[0]?discountRevenue[0].total:0

            let totalRevenue = deliveredRevenue - discountRevenue

            resolve(totalRevenue)
        })
    }

}
