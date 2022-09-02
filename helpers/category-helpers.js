var db=require('../config/connection')
var collection=require('../config/collections');
const { response } = require('../app');
var objectid = require('mongodb').ObjectId

module.exports={
    addCategory:(category)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let isCategory = await 
                db.get()
                .collection(collection.CATEGORY_COLLECTION)
                .findOne({
                     Category: category,
                     deletedCateg:false
                 })
                 if(!isCategory){
                    
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne({
                    Category:category,
                    deletedCateg:false
                }).then((data)=>{
                    console.log(data);
                    resolve(data.insertedId)
                })
            }else{
                resolve()
            }
            } catch (error) {
                reject(error)
            }
        })
       
    },
    getallCategories:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find({deletedCateg:false}).toArray()
                console.log(categories);
                resolve(categories)
            } catch (error) {
                reject(error)
            }
        })
    },
    deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
           try {
             db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectid(catId)},{$set:{deletedCateg:true}}).then((response)=>{
                 resolve(response) 
             })
           } catch (error) {
            reject(error)
           }
        })
    },
    getCategoryDetail:(catid)=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectid(catid)}).then((categoryDetail)=>{
                    resolve(categoryDetail)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    editCategory:(catid,categoryDetail)=>{
        return new Promise((resolve,reject)=>{
              try {
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectid(catid)},{
                  $set:{
                      Category:categoryDetail.categoryName
                     
                  }
                }).then((response)=>{
                  resolve()
                })
              } catch (error) {
                reject(error)
              }
        })
    },
    getallUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let userDetails=await db.get().collection(collection.USER_COLLECTION).find().toArray()
                console.log(userDetails);
                resolve(userDetails)
            } catch (error) {
               reject(error) 
            }
        })
    },
    addBanner:(banner,callback)=>{
       try {
         db.get().collection(collection.BANNER_COLLECTION).insertOne({
             name:banner.name,
             description:banner.description,
             offer:banner.offer
         }).then((data)=>{
             console.log(data);
             callback(data.insertedId)
         })
       } catch (error) {
        reject(error)
       }
    },
    getAllBanners:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let Banners=await db.get().collection(collection.BANNER_COLLECTION).find().sort({_id:-1}).toArray()
                resolve(Banners)
            } catch (error) {
               reject(error) 
            }
        })
    },
    getBannerDetail:(banid)=>{
        return new Promise((resolve,reject)=>{
           try {
             db.get().collection(collection.BANNER_COLLECTION).findOne({_id:objectid(banid)}).then((productDetail)=>{
                 resolve(productDetail)
             })
           } catch (error) {
            reject(error)
           }
        })
    },
    editBanner:(banid,productDetail)=>{
        console.log('editbaannenrrr');
        return new Promise((resolve,reject)=>{
             try {
                 db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:objectid(banid)},{
                   $set:{
                       name:productDetail.name,
                       description:productDetail.description,
                   }
                 }).then((response)=>{
                   resolve()
                 })
             } catch (error) {
               reject(error) 
             }
        })
    },
    deleteBanner:(banId)=>{
        console.log(banId);
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:objectid(banId)}).then((response)=>{
                    resolve(response) 
                })
            } catch (error) {
               reject(error) 
            }
        })
    },
    addNewAddress: (address, userId) => {

        let addressData = {

           
            Name: address.name,
            Address: address.address,
            Town_City: address.city,
            State: address.state,
            Post_Code: address.pincode,
            Phone: address.mobileNo,
            Email: address.email

        }

        console.log(addressData);

        return new Promise(async(resolve, reject) => {
            try {
                let getAddress = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: objectid(userId) })
                console.log(getAddress);
                if (getAddress) {
                    db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user:objectid(userId) },
                        {
                            $push: {
                                address: addressData
                            }
                        }).then((response) => {
                            resolve(response)
                        })
    
                } else {
                    let addressObj = {
                        user: objectid(userId),
                        address: [addressData]
                    }
    
                    db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response) => {
                        resolve(response)
                    })
                }
            } catch (error) {
            reject(error)    
            }
        })
    },
    getSavedAddress:(userId)=>{
        return new Promise((resolve,reject)=>{
         try {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({user: objectid(userId)}).then((savedAddress)=>{
               if(savedAddress){
                   let addressArray=savedAddress.address
                   if(addressArray.length > 0){
                       resolve(savedAddress)
                   }else{
                       resolve(false)
                   }
                }else{
                   resolve(false)
                }
            })
         } catch (error) {
            reject(error)
         }
        
        })
    }
    

}