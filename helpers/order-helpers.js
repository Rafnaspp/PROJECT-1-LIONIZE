var db=require('../config/connection')
var collection=require('../config/collections');
const { response } = require('../app');
var objectid = require('mongodb').ObjectId

module.exports={
    getallOrderDetails:()=>{
        return new Promise(async(resolve,reject)=>{
           try {
             let orderDetails=await db.get().collection(collection.ORDER_COLLECTION).find()
             .sort({_id:-1}).
             toArray()
             console.log(orderDetails);
             resolve(orderDetails)
           } catch (error) {
            reject(error)
           }
        })
    },
    changeOrderStatus:(oId,data)=>{
        return new Promise((resolve,reject)=>{
          try {
              db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectid(oId)},{$set:{status:data}}).then((response)=>{
                  resolve() 
              })
          } catch (error) {
            reject(error)
          }
        })
    },
    cancelOrder:(oId,data)=>{
        return new Promise((resolve,reject)=>{
           try {
             db.get().collection(collection.ORDER_COLLECTION).updateOne({
                 _id:objectid(oId)
             },
             {
                 $set:{status:data,fixed:true}
             }).then((res)=>{
                 resolve(res)
             })
           } catch (error) {
            reject(error)
           }
        })
    }

}
    


