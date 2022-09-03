var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const orderHelpers = require('../helpers/order-helpers');
const adminHelper = require('../helpers/admin-helpers');
var collection=require('../config/collections');
var db=require('../config/connection');
const twillioHelper = require('../helpers/twillio-helper');
const { otpVerify } = require('../helpers/twillio-helper');
const { Router } = require('express');
const { route } = require('./admin');
const { validateRequestWithBody } = require('twilio');
const { response } = require('../app');
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET HOME PAGE */
router.get('/', function(req, res, next) {
 
try {
    productHelpers.getAllProducts().then((products) => {
      categoryHelpers.getallCategories().then((categories)=>{
        categoryHelpers.getAllBanners().then((banners)=>{
          let user=req.session.user
          res.render('user/user-homepage',{layout:'user-layout',user,products,categories,banners});
        })
    })
  })
} catch (error) {
  next(error)
}
  
});

/* GET LOGIN PAGE */
router.get('/login',(req,res,next)=>{
try {
    if(req.session.userLoggedIn){
     res.redirect('/')
    }else{
    res.render('user/user-login',{"loginErr": req.session.userLoggErr})
    // req.session.userLoggErr=false
  }
} catch (error) {
  next(error)
}
})

/* GET SIGNUP PAGE */
router.get('/signup',(req,res,next)=>{
  try {
    res.render('user/user-signup',{userExist:req.session.userError})
    req.session.userError=false
    let userExist=req.session.userError
    if(userExist){
      console.log('redirected');
    }
  } catch (error) {
    next(error)
  }
})

/* POST SIGNUP PAGE */
router.post('/signup',async (req,res,next)=>{
  console.log('post ssssssssssssssssssssssss');
   let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:req.body.Email})
   if(!user){
    console.log('1111111111111111111111111111111111');
     req.session.body=req.body
   twillioHelper.dosms(req.session.body).then((data)=>{
     console.log(data);
     console.log('daattatatat');
     if(data){
       res.redirect('/otp')
     }else{
       console.log('entry failed');
       res.redirect('/signup')
     }
   })
 }else{
   req.session.userError='already exist choose another email'
   res.redirect('/signup')
   console.log('already exist');
 }
 } 
)

/* GET OTP PAGE */
router.get('/otp',(req,res,next)=>{
  console.log('2222222222222222222222222222222222');
    if(req.session.userLoggedIn){
      res.redirect('/login')
     }else{
      res.render('user/otp')
     }
  } 
)

/* POST OTP PAGE */
router.post('/otp',(req,res,next)=>{
    twillioHelper.otpVerify(req.body,req.session.body).then((data)=>{
  
      console.log(data);
      console.log("data is valid");
        if(data.valid){
          console.log('siguped');
          userHelpers.doSignup(req.session.body).then((data)=>{
            if(data.isUserValid){
  
              console.log('success dosignup');
              // req.session.userLoggedIn=true
              // req.session.user=data.user
              res.redirect('/login')
            }
          }).catch((err)=>{
            req.session.err=err
            res.redirect('/signup')
          })
        }
    })
  } 
)

/* POST LOGIN PAGE */
router.post('/userLogin', function(req,res,next){
  try {
    userHelpers.doLogin(req.body).then((response)=>{
      if(response.status){
        req.session.userLoggedIn=true;
        req.session.user=response.user;
        res.redirect('/');
      }else{
        req.session.userLoggErr ="invalid userName or password";
        res.redirect('/login');
      } 
    })
  } catch (error) {
    next(error)
  }
});

/* GET SHOP PAGE */
router.get('/view-products',(req,res,next)=>{
  try {
    productHelpers.getAllProducts().then((products) => {
      categoryHelpers.getallCategories().then((categories)=>{
    let user=req.session.user
    res.render('user/user-viewProducts',{layout:'user-layout',user,products,categories});
    })
  })
  } catch (error) {
    next(error)
  }
})

/* GET CART PAGE */
router.get('/cart',verifyLogin,async (req,res,next)=>{
 
try {
   let products=await userHelpers.getCartProducts(req.session.user._id)
   let total=0
    if(products.length>0){
     total=await userHelpers.getTotalAmount(req.session.user._id)
    }
    console.log(products);
    res.render('user/view-cart',{layout:'user-layout',products,user:req.session.user,total})
} catch (error) {
  next(error)
}
})

/* GET ADD-TO-CART */
router.get('/add-to-cart/:id',verifyLogin,(req,res,next)=>{
  try {
    userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
      res.redirect('/view-products')
    })
  } catch (error) {
    next(error)
  }
})


/* GET PRODUCT-DETAILS (on eye icon)PAGE */
router.get('/product-detail',verifyLogin,async (req,res,next)=>{
  try {
    let productDetail=await productHelpers.getProductDetail(req.query.id)
    res.render('user/product-details',{layout:'user-layout',productDetail,user:req.session.user})
  } catch (error) {
    next(error)
  }

})
/* POST CHANGE QUANTITY */
router.post("/change-product-quantity",verifyLogin,(req,res,next)=>{
 try {
  userHelpers.changeProductQuantity(req.body).then((response)=>{
           res.json(response)
   })
 } catch (error) {
  next(error)
 }
})

/* TOTAL CHECKOUT PROCEED */
router.get('/proceed-checkout',verifyLogin,async (req,res,next)=>{
  try {
    let products=await userHelpers.getCartProducts(req.session.user._id)
    let total=await userHelpers.getTotalAmount(req.session.user._id)
    let saveAddress=await categoryHelpers.getSavedAddress(req.session.user._id)
    let coupon=await adminHelper.getCoupons()
    res.render('user/checkout',{layout:'user-layout', products,total,user:req.session.user,saveAddress,coupon})
  } catch (error) {
    next(error)
  }
})

/* POST PLACE-ORDER */
router.post('/place-order',async(req,res,next)=>{
  try {
    console.log('called placeorder');
      if (req.body.saveAddress == 'on') {
          await categoryHelpers.addNewAddress(req.body, req.session.user._id)
      }
  
      let products = await userHelpers.getCartProductList(req.body.userId)
      let totalAmount = await userHelpers.getTotalAmount(req.body.userId)
      let discountData = null
  
      if (req.body.Coupon_Code) {
          await userHelpers.checkCoupon(req.body.Coupon_Code, totalAmount).then((response) => {
              discountData = response
          }).catch(() => discountData = null)
  
      }
  
      userHelpers.placeOrder(req.body, products, totalAmount, discountData).then((orderId) => {
  
          if (req.body['payment-method']==='COD') {
              res.json({ codSuccess: true })
          } else {
              let netAmount = (discountData) ? discountData.amount : totalAmount
              userHelpers.generateRazorpay(orderId, netAmount).then((response) => {
                  res.json(response)
              })
          }
  
      })
  } catch (error) {
    next(error)
  }
})


/* GET SUCCESS PAGE PLACE ORDER */
router.get('/success-placeOrder',verifyLogin,async(req,res,next)=>{
 
  try {
    res.render('user/place-success',{layout:'user-layout',user:req.session.user})
  } catch (error) {
    next(error)
  }
})

/* GET ORDER-DETAILS PAGE */
router.get('/order-details',verifyLogin,async(req,res,next)=>{
 try {
   console.log(req.session.user._id);
   let orderDetails=await userHelpers.getOrderDetails(req.session.user._id)
   console.log('here get order dtail');
   console.log(orderDetails)
   res.render('user/order-details',{layout:'user-layout',user:req.session.user,orderDetails})
 } catch (error) {
  next(error)
 }
})

/* GET CATEGORY-BASE PAGE */
router.get('/category-base/:id',verifyLogin,async(req,res,next)=>{
 try {
   console.log('paramssshereee');
   
   console.log(req.params.id);
   let category=req.params.id
    console.log(category);
   let catBaseProducts=await userHelpers.getCatBaseProducts(req.params.id) 
   res.render('user/view-catBaseProducts',{layout:'user-layout',catBaseProducts,category,user:req.session.user})
 } catch (error) {
  next(error)
 }
})


/* GET ORDER-PRODUCTS PAGE */
router.get('/order-products/:id',verifyLogin,async(req,res,next)=>{
 try {
   console.log(req.params.id+'paramsid');
   let orderProducts=await userHelpers.getOrderProducts(req.params.id)
   console.log('orderProducts here');
   console.log(orderProducts);
   res.render('user/order-products',{layout:'user-layout',orderProducts,user:req.session.user})
 } catch (error) {
  next(error)
 }
})

/* GET USER-PROFILE PAGE */
router.get('/view-user-profile',verifyLogin,(req,res,next)=>{
try {
    userHelpers.getUserDetail(req.session.user._id).then((userDetail)=>{
      console.log(userDetail);
      res.render('user/view-userProfile',{layout:'user-layout',userDetail,user:req.session.user})
    })
    
  /* POST EDIT USER-PROFILE  */
  router.post('/edit-user-profile/:id',(req,res,next)=>{
    console.log(req.params.id);
   userHelpers.editUserProfile(req.params.id,req.body).then(()=>{
      res.redirect('/view-user-profile')
    })
  })  
} catch (error) {
  next(error)
}

})

/* POST VERIFY-PAYMENT PAGE */
router.post('/verify-payment',(req,res,next)=>{
  try {
    console.log('check bodyyyyyyyyyyyyyyyyyyy');
       console.log(req.body);
    userHelpers.verifyPayment(req.body).then(()=>{
      userHelpers.changePaymentStatus(req.body['order[receipt]'])
      .then(()=>{
        console.log('payment success full');
        res.json({status:true})
      })
    }).catch((err)=>{
      console.log(err);
      res.json({status:false,errMsg:''})
    })
  } catch (error) {
    next(error)
  }
})

/* POST REMOVE CART ITEM */
router.post('/remove-cartItem',(req,res,next)=>{
  try {
    userHelpers.removeCartItem(req.body).then((response)=>{
      console.log(response)
      // res.redirect('/cart')
      res.json(response)
    })
    console.log('remove cart itemmmmmmmmmmmm');
  } catch (error) {
   next(error) 
  }
})

/* POST REMOVE WISH ITEM */
router.post('/remove-wishItem',(req,res,next)=>{
 try {
   userHelpers.removeWishItem(req.body).then((response)=>{
     console.log(response)
     // res.redirect('/cart')
     res.json(response)
   })
   console.log('remove cart itemmmmmmmmmmmm');
 } catch (error) {
  next(error)
 }
})

/* GET ADD-TO-WISHLIST PAGE */
router.get('/add-to-wishlist/:id',verifyLogin,(req,res,next)=>{
  try {
    userHelpers.addToWishlist(req.params.id,req.session.user._id)
    res.redirect('/view-products')
  } catch (error) {
    next(error)
  }
})

/* GET VIEW-WISHLIST PAGE */
router.get('/view-wishlist',verifyLogin,async(req,res,next)=>{
  try {
    let wishproducts=await userHelpers.getWishlistProducts(req.session.user._id)
    res.render('user/view-wishlist',{layout:'user-layout',wishproducts,user:req.session.user})
  } catch (error) {
    next(error)
  }
})

/* POST APPLY-COUPON PAGE */
router.post('/check-coupon',async (req, res, next) => {
try {
  
    let userId = req.session.user._id
    let couponCode = req.body.coupon
    let totalAmount = await userHelpers.getTotalAmount(userId)
    userHelpers.checkCoupon(couponCode, totalAmount).then((response) => {
        res.json(response)
    }).catch((response) => {
        res.json(response)
    })
} catch (error) {
  next(error)
}
})

/* GET LOGOUT PAGE */
router.get('/logout',(req,res,next)=>{
 try {
   req.session.userLoggedIn=null
   req.session.user=null
   res.redirect('/')
 } catch (error) {
  next(error)
 }
})

module.exports = router;
 

