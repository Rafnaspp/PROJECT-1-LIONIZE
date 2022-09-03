var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const userHelpers = require('../helpers/user-helpers');
const orderHelpers = require('../helpers/order-helpers');
const adminHelper = require('../helpers/admin-helpers');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
})
const verifyLogin=(req,res,next)=>{
  if(req.session.adminloggedIn){
    next()
  }else{
    res.redirect('/admin')
  }
}

/* GET ADMIN LOGINPAGE. */
router.get('/', function(req, res, next) {
  try {
    if(req.session.adminloggedIn){
      res.redirect('/admin/dashbord')
    }else{
      res.render('admin/admin-login',{layout:"admin-layout",adminLoginpage:true})
    }
  } catch (error) {
    next(error)
  }
});

/* PROPER WORKING DOUGHNUT */
// router.get('/', async function (req, res, next) {
//   try {
   
      // const allData = await Promise.all
      //   ([
      //     adminHelper.onlinePaymentCount(),
          
      //     adminHelper.totalCOD(),
    
      //   ]);
        
      //   console.log('dahsifffffffffffffff');
      //   res.render('admin/admin-dashbord',{layout:"admin-layout",

      //   OnlinePymentcount: allData[0],
      //   totalCod: allData[1]
      // })
    
//   } catch (err) {
//     next(err)
//   }
// });

// index



/* GET ADMIN DASHBORD. */
router.get('/dashbord',async(req,res,next)=>{
  try {
    if(req.session.adminloggedIn){
      let delivery = {}
      delivery.Placed = 'placed'
      delivery.Shipped = 'shipped'
      delivery.Deliverd = 'deliverd'
      const allData = await Promise.all
          ([
            adminHelper.onlinePaymentCount(),
            adminHelper.totalUsers(),
            adminHelper.totalOrder(),
            adminHelper.cancelOrder(),
            adminHelper.totalCOD(),
            adminHelper.totalDeliveryStatus(delivery.Placed),
            adminHelper.totalDeliveryStatus(delivery.Shipped),
            adminHelper.totalDeliveryStatus(delivery.Deliverd),
            adminHelper.totalCost(),
      
          ]);
          
          console.log('dahsifffffffffffffff');
          res.render('admin/admin-dashbord',{layout:"admin-layout",
  
          OnlinePymentcount: allData[0],
          totalUser: allData[1],
          totalOrder: allData[2],
          cancelOrder: allData[3],
          totalCod: allData[4],
          Placed: allData[5],
          Shipped: allData[6],
          Deliverd: allData[7],
          totalCost: allData[8]
        })
    }else{
      res.redirect('/admin')
    }
  } catch (error) {
    next(error)
  }
} )

/* GET ADMIN VIEW PRODUCTS */
router.get('/viewproduct',(req,res,next)=>{
    try {
      productHelpers.getAllProducts().then((products) => {
        if(req.session.adminloggedIn){
        res.render('admin/admin-viewProducts', {layout:"admin-layout",products });
        }else{
          res.redirect('/admin')
        }
    })
    } catch (error) {
      next(error)
    }
} );

/* GET ADMIN ADD PRODUCT */
router.get('/add-product',(req,res,next)=>{
 try {
   categoryHelpers.getallCategories().then((category)=>{
   if(req.session.adminloggedIn){
     res.render('admin/add-product' ,{layout:"admin-layout",category})
   }else{
     res.redirect('/admin')
   }
 })
 } catch (error) {
  next(error)
 }
} );

/*  POST ADMIN ADD PRODUCT */
router.post('/add-product',(req,res,next)=>{
  try {
    console.log(req.body);
    console.log(req.files.image);
   
    productHelpers.addProduct(req.body,(id)=>{
     let image = req.files.image
     console.log(image.name);
     console.log('imaaaaaaaageeeeeeeeeeeeeeee');
     image.mv('./public/product-image/'+id+'.jpg',(err,done)=>{
       if(!err){
         res.redirect('/admin/add-product')
       } else{
         console.log(err);
       }
     })
   })
  } catch (error) {
    next(error)
  }
 
 } )

/* GET ADMIN ADD  BANNER */
router.get('/add-banner',(req,res,next)=>{
 try {
   if(req.session.adminloggedIn){
     res.render('admin/add-banner',{layout:"admin-layout"})
   }else{
     res.redirect('/admin')
   }
 } catch (error) {
  next(error)
 }
});
 
/* GET ADMIN VIEW BANNER */
router.get('/view-bannerManagement',(req,res,next)=>{
 try {
  categoryHelpers.getAllBanners().then((banners) => {
     if(req.session.adminloggedIn){
     res.render('admin/view-bannerManagement', {layout:"admin-layout",banners});
     }else{
       res.redirect('/admin')
     }
 })
 } catch (error) {
  next(error)
 }
} );

 /*  POST ADMIN ADD BANNER */
 router.post('/add-banner',(req,res,next)=>{
  try {
    console.log(req.body);
    console.log(req.files.image);
   
    categoryHelpers.addBanner(req.body,(id)=>{
     let image = req.files.image
     image.mv('./public/banner-image/'+id+'.jpg',(err,done)=>{
       if(!err){
         res.redirect('/admin/add-banner')
       } else{
         console.log(err);
       }
     })
   })
  } catch (error) {
    next(error)
  }
 
 } )
 
/* GET ADMIN EDIT BANNER */
router.get('/edit-banner/',verifyLogin,async (req,res,next)=>{
  try {
    let bannerDetail=await categoryHelpers.getBannerDetail(req.query.id)
    res.render('admin/edit-banner',{layout:"admin-layout",bannerDetail})
  } catch (error) {
    next(error)
  }
})

/* POST ADMIN EDIT BANNER */
router.post('/edit-banner/:id',(req,res,next)=>{
try {
    let id=req.params.id
    console.log(req.params.id);
    categoryHelpers.editBanner(req.params.id,req.body).then(()=>{
      res.redirect('/admin/')
      if(req.files.image){
      let image = req.files.image
      image.mv('./public/banner-image/'+id+'.jpg')
      }
    })
} catch (error) {
  next(error)
}
})

/* GET DELETE BANNER. */
router.get('/delete-banner/',(req,res,next)=>{
  try {
    let banId=req.query.id
    categoryHelpers.deleteBanner(banId).then((response)=>{
      res.redirect('/admin/view-bannerManagement')
    })
  } catch (error) {
    next(error)
  }
})
 

 /* GET DELETE PRODUCT. */
router.get('/delete-product/',(req,res,next)=>{
   try {
     let proId=req.query.id
     console.log(proId);
     productHelpers.deleteProduct(proId).then((response)=>{
       res.redirect('/admin/viewproduct')
     })
   } catch (error) {
    next(error)
   }
})

/* GET ADMIN EDIT PRODUCT */
router.get('/edit-product/',verifyLogin,async (req,res,next)=>{
  try {
    let productDetail=await productHelpers.getProductDetail(req.query.id)
    res.render('admin/edit-product',{layout:"admin-layout",productDetail})
  } catch (error) {
    next(error)
  }
})

/* POST ADMIN EDIT PRODDUCT */
router.post('/edit-product/:id',(req,res,next)=>{
try {
    let id=req.params.id
    console.log(req.params.id);
    productHelpers.editProduct(req.params.id,req.body).then(()=>{
      res.redirect('/admin/viewproduct')
      if(req.files.image){
      let image = req.files.image
      image.mv('./public/product-image/'+id+'.jpg')
      }
    })
} catch (error) {
  next(error)
}
})

/* GET ADMIN VIEW CATEGORY */
router.get('/view-category',verifyLogin,(req,res,next)=>{
  try {
    categoryHelpers.getallCategories().then((category)=>{
    res.render('admin/view-category', {layout:"admin-layout",category})
    })
  } catch (error) {
    next(error)
  }
})

/* GET ADMIN ADD CATEGORY */
router.get('/add-category',verifyLogin,(req,res,next)=>{
  try {
    res.render('admin/add-category', {layout:"admin-layout"})
  } catch (error) {
    next(error)
  }
})

/* POST ADMIN ADD CATEGORY */
router.post('/add-category',(req,res,next)=>{
  try {
    let category=req.body.categoryName.toUpperCase()
    categoryHelpers.addCategory(category).then((data)=>{
      if(data){
        let image = req.files.image
        image.mv('./public/product-image/'+data+'.jpg',(err,done)=>{
          if(!err){
           res.redirect('/admin/view-category')
          } else{
            console.log('err');
            console.log(err);
          }
        })
      }else{
        console.log('fffffffffffffffffffffff');
        res.render('admin/add-category',{layout:"admin-layout",status:'Alredy exist'})
      }
     
   
    
     
    })
  } catch (error) {
    next(error)
  }
  
})

/* GET DELETE CATEGORY. */
router.get('/delete-category/',verifyLogin,(req,res,next)=>{
 try {
   let cateId=req.query.id
   categoryHelpers.deleteCategory(cateId).then((response)=>{
     res.redirect('/admin/view-category')
   })
 } catch (error) {
  next(error)
 }
})

/* GET ADMIN EDIT CATEGORY  */
router.get('/edit-category/',verifyLogin,async (req,res,next)=>{
  try {
    let categoryDetail=await categoryHelpers.getCategoryDetail(req.query.id)
    res.render('admin/edit-category',{layout:"admin-layout",categoryDetail})
  } catch (error) {
    next(error)
  }
})

/* POST ADMIN EDIT CATEGORY  */
router.post('/edit-category/:id',(req,res,next)=>{
 try {
   let id=req.params.id
   console.log(req.params.id);
   categoryHelpers.editCategory(req.params.id,req.body).then(()=>{
     res.redirect('/admin/view-category')
     if(req.files.image){
     let image = req.files.image
     image.mv('./public/product-image/'+id+'.jpg')
     }
   })
 } catch (error) {
  next(error)
 }
})

const admindata={
  email:process.env.ADMIN,
  password:process.env.PASSWORD
}

/* POST ADMIN LOGIN */
router.post('/adminLogin',(req,res,next)=>{
 try {
   console.log(req.body);
 if(req.body.email==admindata.email && req.body.password==admindata.password){
   req.session.adminloggedIn=true;
   res.redirect('/admin/dashbord');
 }else{
   req.session.adminLogErr=true;
   res.redirect('/admin');
 }
 } catch (error) {
  next(error)
 }

})

/* GET USER MANAGEMENT*/
router.get('/view-userManagement',(req,res,next)=>{
  try {
    categoryHelpers.getallUsers().then((userDetails)=>{
    
    res.render('admin/user-management',{layout:"admin-layout",userDetails})
  
    })
  } catch (error) {
    next(error)
  }
})

/* GET ORDER MANAGEMENT*/
router.get('/view-orderManagement',(req,res,next)=>{
  try {
    orderHelpers.getallOrderDetails().then((orderDetails)=>{
    res.render('admin/order-management',{layout:"admin-layout",orderDetails})
    })
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
    res.render('admin/view-orderproducts',{layout:'admin-layout',orderProducts})
  } catch (error) {
    next(error)
  }
})

/* GET BANNER MANAGEMENT*/
router.get('/view-bannerManagement',(req,res,next)=>{
  
  try {
    res.render('admin/banner-management',{layout:"admin-layout"})
  } catch (error) {
    next(error)
  }
  

})

/* GET BLOCK USER */
router.get('/block-user/',(req,res,next)=>{
  try {
    let userId=req.query.id
    console.log(userId);
    userHelpers.blockUser(userId).then((response)=>{
      res.redirect('/admin/view-userManagement')
    })
  } catch (error) {
    next(error)
  }
})

/* GET UNBLOCK USER */
router.get('/unblock-user/',(req,res,next)=>{
  try {
    let userId=req.query.id
    userHelpers.unblockUser(userId).then((response)=>{
      res.redirect('/admin/view-userManagement')
    })
  } catch (error) {
    next(error)
  }
})

/* SHIPPED CHANGE ORDER-STATUS */
router.get('/change-status1/:id',(req,res,next)=>{
   try {
    let orderId=req.params.id
    let data='shipped'
   orderHelpers.changeOrderStatus(orderId,data)
   } catch (error) {
    next(error)
   }

})

/* DELIVERED CHANGE ORDER-STATUS */
router.get('/change-status2/:id',(req,res,next)=>{
 try {
   let orderId=req.params.id
   let data='deliverd'
  orderHelpers.changeOrderStatus(orderId,data)
 } catch (error) {
  next(error)
 }

})

/* CANCEL ORDER-STATUS */
router.get('/cancel-order/:id',(req,res,next)=>{
  try {
    let orderId=req.params.id
    let data='canceled'
    orderHelpers.cancelOrder(orderId,data).then((response)=>{
      res.redirect('/admin/view-orderManagement')
    })
  } catch (error) {
    next(error)
  }
  
})

 // coupon section >>>>>>>>>>>>>>>

 router.get('/view-coupons',(req, res, next) => {
 try {
   adminHelper.getCoupons().then((coupons) => {
       console.log(coupons);
       res.render('admin/view-coupon', { layout: 'admin-layout',coupons})
   })
 } catch (error) {
  next(error)
 }
})

router.get('/add-coupon',(req, res, next) => {

 try {
   res.render('admin/add-coupon', { layout: 'admin-layout' })
 } catch (error) {
  next(error)
 }


})

router.post('/add-coupon',(req, res, next) => {
  try {
    adminHelper.generateCoupon(req.body).then((response) => {
        res.redirect('/admin/add-coupon')
    })
  } catch (error) {
    next(error)
  }
})

router.get('/delete-coupon/',(req, res, next) => {
  try {
    let couponId = req.query.id
    adminHelper.deleteCoupon(couponId).then((response) => {
        res.redirect('/admin/view-coupons')
    })
  } catch (error) {
    next(error)
  }
})


/* GET  ADMIN LOGOUT*/      
router.get('/logout',(req,res,next)=>{
  try {
    req.session.adminloggedIn=null;
    req.session.adminLogErr=null;
    res.redirect('/admin/')
  } catch (error) {
    next(error)
  }
})
module.exports = router;
