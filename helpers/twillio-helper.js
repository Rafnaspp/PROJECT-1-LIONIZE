const client = require('twilio')('AC540070733f87f5dbf7c18f5aa3e91df5','1b6f11620ada4a3af1f9b2ccf55c0461');
const serviceSid='VAd733bbf502d8d04b6bc7a124e09201fe'

             module.exports={
                dosms:(noData)=>{
                    let res={}
                    return new Promise(async(resolve,reject)=>{
                        await client.verify.services(serviceSid).verifications.create({
                            to :`+91${noData.mobileNo}`,
                            channel:"sms"
                        }).then((res)=>{
                            res.valid=true;
                            resolve(res)
                            // console.log(res);
                        })
                    })
                },
                otpVerify:(otpData,nuData)=>{
                    console.log(otpData,nuData);
                    let resp={}
                    return new Promise(async(resolve,reject)=>{
                        await client.verify.services(serviceSid).verificationChecks.create({
                            to:   `+91${nuData.mobileNo}`,
                            code:otpData.otp
                        }).then((resp)=>{
                            // console.log("verification success");
                            // console.log(resp);
                            resolve(resp)
                        })
                    })
                }

             }