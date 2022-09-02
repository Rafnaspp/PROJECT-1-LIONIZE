var db=require('../config/connection')
var collection=require('../config/collections');
const { response } = require('../app');
var objectid = require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback)=>{
        console.log(product);

        db.get().collection(collection.PRODUCT_COLLECTION).insertOne({
            name:product.name,
            description:product.description,
            price:parseInt(product.price),
            category:product.category,
            deletedprod:false
        }).then((data)=>{
            console.log(data);
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            try {
                let products=await db.get().collection(collection.PRODUCT_COLLECTION).find({deletedprod:false}).sort({_id:-1}).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },
    deleteProduct:(prodId)=>{
        console.log(prodId);
        return new Promise((resolve,reject)=>{
           try {
             db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectid(prodId)},{$set:{deletedprod:true}}).then((response)=>{
                 resolve(response) 
             })
           } catch (error) {
            reject(error)
           }
        })
    },
    getProductDetail:(proid)=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectid(proid)}).then((productDetail)=>{
                    resolve(productDetail)
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    editProduct:(proid,productDetail)=>{
        return new Promise((resolve,reject)=>{
              try {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectid(proid)},{
                  $set:{
                      name:productDetail.name,
                      description:productDetail.description,
                      price:productDetail.price
                  }
                }).then((response)=>{
                  resolve()
                })
              } catch (error) {
                reject(error)
              }
        })
    }

}