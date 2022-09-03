require('dotenv').config()
const client = require('twilio')(process.env.ACCOUNT_SID,process.env.AUTH_TOKEN);
const serviceSid=process.env.TWILLIO_SERVICE_ID

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