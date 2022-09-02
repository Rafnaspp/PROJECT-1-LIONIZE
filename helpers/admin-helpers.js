var db = require('../config/connection')
var collection = require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectId

module.exports = {
    getCoupons: () => {

        return new Promise(async (resolve, reject) => {
           try {
             let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
             resolve(coupons)
           } catch (error) {
            reject(error)
           }
        })
    },

    generateCoupon: (couponData) => {

        const oneDay = 1000 * 60 * 60 * 24
        let couponObj = {
            Name: couponData.name.toUpperCase(),
            Offer: parseFloat(couponData.offer / 100),
            validity: new Date(new Date().getTime() + (oneDay * parseInt(couponData.validity))).toLocaleString(),
            valDays: couponData.validity

        }
        return new Promise((resolve, reject) => {

            try {
                db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((result) => {
                    if (result[0] == null) {
    
                        db.get().collection(collection.COUPON_COLLECTION).createIndex({ "Name": 1 }, { unique: true })
    
                        db.get().collection(collection.COUPON_COLLECTION).createIndex({ "validity": 1 }, { expireAfterSeconds: 0 })
    
                        db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response) => {
                            resolve(response)
                        })
                    } else {
                        db.get().collection(collection.COUPON_COLLECTION).insertOne(couponObj).then((response) => {
                            resolve(response)
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    deleteCoupon: (couponId) => {

        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((response) => {
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    },
    onlinePaymentCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collection.ORDER_COLLECTION).find({ paymentMethod: "ONLINE" }).count()
                resolve(count)
            } catch (err) {
                reject(err)
            }

        })
    },
    totalUsers: () => {
        return new Promise(async (resolve, reject) => {
          try {
            let count = await db.get().collection(collection.USER_COLLECTION).find().count()
            resolve(count)
          } catch (err) {
            reject(err)
          }
        })
      },
  totalOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).find().count()
        resolve(count)
      } catch (err) {
        reject(err)
      }
    })
  },
  cancelOrder: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              'status': 'canceled'
            }
          }, {
            $count: 'number'
          }

        ]).toArray()
        resolve(count)
        console.log(count);
      } catch (err) {
        reject(err)
      }

    })
  },
    totalCOD: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collection.ORDER_COLLECTION).find({
                    paymentMethod
                        : "COD",
                }).count()
                resolve(count)
            } catch (err) {
                reject(err)
            }
        })

    },
  totalDeliveryStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        let statusCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
            $match: {
              'status': data

            }
          }, {
            $count: 'number'
          }

        ]).toArray()
        resolve(statusCount)
      } catch (err) {
        reject(err)
      }
    })
  },
  totalCost: () => {
    return new Promise(async (resolve, reject) => {
      try {
        total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $project: {
              'totalAmount': 1
            }
          },
          {
            $group: {
              _id: null,
              sum: { $sum: '$totalAmount' }
            }
          }
        ]).toArray()
        resolve(total)
      } catch (err) {
        reject(err)
      }
    })
  }
}
