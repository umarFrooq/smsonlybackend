const { addressLocalTypes, roleTypes, paymentMethods } = require("@/config/enums");
const nodemailer = require("nodemailer");
const config = require("../../config/config");
const logger = require("../../config/logger");

const { payment, adminDomain } = require("../../config/config");
const {settValueParser,handleSetting}=require('../setting/setting.service')
// Create transport only if SMTP config is provided; otherwise use a noop transport
let transport;

// Check if we have complete SMTP configuration
const hasCompleteSmtpConfig = (
    config &&
    config.email &&
    config.email.smtp &&
    config.email.smtp.host &&
    config.email.smtp.auth &&
    config.email.smtp.auth.user &&
    config.email.smtp.auth.pass
);

if (hasCompleteSmtpConfig) {
    transport = nodemailer.createTransport(config.email.smtp);
    /* istanbul ignore next */
    if (config.env !== "test") {
        transport
            .verify()
            .then(() => logger.info("Connected to email server"))
            .catch(() =>
                logger.warn(
                    "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
                )
            );
    }
} else {
    // Log what's missing for debugging
    if (config && config.email && config.email.smtp) {
        logger.info('SMTP config incomplete - email sending disabled');
    } else {
        logger.info('SMTP not configured - email sending disabled');
    }
    transport = { sendMail: async () => Promise.resolve() };
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html) => {
  let msg;
  if (html) msg = { from: config.email.from, to, subject, html: text };
  else msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg).then(result => {
  }).catch(err => {
    console.log("to", to)
    console.log("email Error", err);
  })
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = "Reset password";
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${adminDomain}/reset-password?token=${token}`;
  const text = `Dear user,
  To reset your password, click on this link: 
  <html><body>
  <!--VML button-->
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
    <tr>
      <td>
        <div>
          <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href=${resetPasswordUrl} style="height:40px;v-text-anchor:middle;width:130px;" arcsize="5%" strokecolor="#19cca3" fillcolor="#19cca3;width: 130;">
               <w:anchorlock/>
               <center style="color:#ffffff;font-family:Helvetica, sans-serif;font-size:18px; font-weight: 600;">Click to Reset Password!</center>
             </v:roundrect>
  
          <![endif]-->
            <a href=${resetPasswordUrl} style="display: inline-block; mso-hide:all; background-color: #19cca3; color: #FFFFFF; border:1px solid #19cca3; border-radius: 6px; line-height: 220%; width: 200px; font-family: Helvetica, sans-serif; font-size:18px; font-weight:600; text-align: center; text-decoration: none; -webkit-text-size-adjust:none;  " target="_blank">Click here!</a>
            </a>
          </div>
      </td>
    </tr>
  </table>
  </body></html>
  
  If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text, true);
};
const sendLoginEmail = async (to, token) => {
  const subject = " login from Email";

  // replace this url with the link to the reset password page of your front-end app
  const loginEmailUrl = `https://api-stage.gobazar247.com/v1/auth/login-email?token=${token}`;
  const text = `Dear user,
  To login with your email, click on this link:
  <html><body> 
  <!--VML button-->
   <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
    <tr>
      <td>
        <div>
          <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href=${loginEmailUrl} style="height:40px;v-text-anchor:middle;width:130px;" arcsize="5%" strokecolor="#19cca3" fillcolor="#19cca3;width: 130;">
               <w:anchorlock/>
               <center style="color:#ffffff;font-family:Helvetica, sans-serif;font-size:18px; font-weight: 600;">Click to Login!</center>
             </v:roundrect>
  
          <![endif]-->
            <a href=${loginEmailUrl} style="display: inline-block; mso-hide:all; background-color: #19cca3; color: #FFFFFF; border:1px solid #19cca3; border-radius: 6px; line-height: 220%; width: 200px; font-family: Helvetica, sans-serif; font-size:18px; font-weight:600; text-align: center; text-decoration: none; -webkit-text-size-adjust:none;  " target="_blank">Click to Login</a>
            </a>
          </div>
      </td>
    </tr>
  </table>
  </body></html>
  
  If you did not request any email login, then ignore this email.`;
  await sendEmail(to, subject, text, true);
};

const emailFoot = (question, answer, content, footvar) => {
  const body = `
    <tr>
        <td align="center" style=" padding: 35px 35px 20px 35px;background-color: #069ddd;"
            bgcolor="#1b9ba3">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                style="max-width:600px; ">
                <tr>
                    <td align="left">
                        <h2
                            style="font-size: 20px; font-weight: 800; line-height: 10px; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
                            Need Help?
                        </h2>
  
                    </td>
  
                </tr>
                <tr>
                    <td>
                        <h5
                            style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial; padding-top: 20px;">
                            ${question}
                        </h5>
                        <p style=" color: #ffffff;">
                          ${answer}
                        </p>
                    </td>
                </tr>
                
              ${content}

            </table>
        </td>
    </tr>
    <tr>
        <td align="center" style="padding: 35px; background-color: #ffffff;" bgcolor="#ffffff">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                style="max-width:600px;">
                <tr width="100%" align="center"
                    style="display: flex; justify-content: space-around; padding: 0 50px;">
                    <td width="33%">
                        <a href="https://stage.mysouq.com/">
                            <img src="https://bazaarghar.com/images/facebook.png" width="37"
                                height="37" />
                        </a>
                    </td>
                    <td width="33%">
  
                        <a href="https://stage.mysouq.com/">
                            <img src="https://bazaarghar.com/images/instagram.png" width="37"
                                height="37" />
                        </a>
                    </td>
                    <td width="33%">
  
                        <a href="https://stage.mysouq.com/">
                            <img src="https://bazaarghar.com/images/youtube.png" width="37"
                                height="37" />
                        </a>
                    </td>
                </tr>
                <tr>
                    <td align="center" style=" line-height: 24px; padding: 5px 0 10px 0;">
                        <p style="color: black; font-size: 14px; font-weight: 600; line-height: 18px;">
                            Quartz Building, Al Kurnaysh Br Rd, 7494, Ash Shati، <br>
                            Building No. 3340, Jeddah 23412
                        </p>
                    </td>
                </tr>
                ${footvar}
                <tr>
                    <td align="left" style=" font-size: 14px; font-weight: 300; line-height: 24px;">
                        <p
                            style="font-size: 14px; font-weight: 400; line-height: 20px; color: #777777;">
                            This is an automatically generated e-mail from our platform. Please do not
                            reply to this e-mail.
                        </p>
                    </td>
                </tr>
        </td>
    </tr>`;
  return body;
};

const footer = (content, link, buttonName) => {
  const body = `
    <tr>
                        <td align="center" style=" padding: 35px 35px 20px 35px;background-color: #069ddd;"
                            bgcolor="#1b9ba3">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                style="max-width:600px; ">
                                <tr>
                                    <td align="left">
                                        <h2
                                            style="font-size: 20px; font-weight: 800; line-height: 10px; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
                                            Need Help?
                                        </h2>

                                    </td>

                                </tr>
                                <tr>
                                    <td>
                                        <p style=" color: #ffffff; line-height: 24px;">
                                            
                                           ${content}
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 10px;">
                                        <a href="${link}"
                                            style=" padding: 10px; background-color: #ff8319; border: none; border-radius: 5px; font-size: 16px; color: #fff; text-decoration: none;">
                                            ${buttonName}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 35px; background-color: #ffffff;" bgcolor="#ffffff">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                style="max-width:600px;">
                                <tr width="100%" align="center"
                                    style="display: flex; justify-content: space-around; padding: 0 50px;">
                                    <td width="33%">
                                        <a href="https://stage.mysouq.com/">
                                            <img src="https://bazaarghar.com/images/facebook.png" width="37"
                                                height="37" />
                                        </a>
                                    </td>
                                    <td width="33%">

                                        <a href="https://stage.mysouq.com/">
                                            <img src="https://bazaarghar.com/images/instagram.png" width="37"
                                                height="37" />
                                        </a>
                                    </td>
                                    <td width="33%">

                                        <a href="https://stage.mysouq.com/">
                                            <img src="https://bazaarghar.com/images/youtube.png" width="37"
                                                height="37" />
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style=" line-height: 24px; padding: 5px 0 10px 0;">
                                        <p style="color: black; font-size: 14px; font-weight: 600; line-height: 18px;">
                                            Quartz Building, Al Kurnaysh Br Rd, 7494, Ash Shati، <br>
                                            Building No. 3340, Jeddah 23412
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left" style=" font-size: 14px; font-weight: 300; line-height: 24px;">
                                        <p
                                            style="font-size: 14px; font-weight: 400; line-height: 20px; color: #777777;">
                                            This is an automatically generated e-mail from our platform. Please do not
                                            reply to this e-mail.
                                        </p>
                                    </td>
                                </tr>
                        </td>
                    </tr>

`;
  return body;
};

const sendVerificationEmail = async (to, token) => {
  const subject = "Email Verification";
  // replace this url with the link to the reset password page of your front-end app
  const verificationEmailUrl = `https://api-stage.gobazar247.com/v1/auth/email-verification?token=${token}`;
  const text = `Dear user,
  To verify your email, click on this link: ${verificationEmailUrl}
  <!--VML button-->
  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
    <tr>
      <td>
        <div>
          <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href=${verificationEmailUrl} style="height:40px;v-text-anchor:middle;width:130px;" arcsize="5%" strokecolor="#19cca3" fillcolor="#19cca3;width: 130;">
               <w:anchorlock/>
               <center style="color:#ffffff;font-family:Helvetica, sans-serif;font-size:18px; font-weight: 600;">Click to verify Email!</center>
             </v:roundrect>
  
          <![endif]-->
            <a href=${verificationEmailUrl} style="display: inline-block; mso-hide:all; background-color: #19cca3; color: #FFFFFF; border:1px solid #19cca3; border-radius: 6px; line-height: 220%; width: 200px; font-family: Helvetica, sans-serif; font-size:18px; font-weight:600; text-align: center; text-decoration: none; -webkit-text-size-adjust:none;  " target="_blank">Click to verify Email!</a>
            </a>
          </div>
      </td>
    </tr>
  </table>
  If you did not request any email verification, then ignore this email.`;
  await sendEmail(to, subject, text, true);
};

const sendOrderConfimationEmail = async (to, order) => {
  const subject = `Your package has been confirmed order #${order.orderId}`;
  const header = emailHeader("Order Confirmed");
  console.log(order.address);
  order.customer.fullname = capitalize(order.customer.fullname);
  let products = "";
  for (let i = 0; i < order.orderItems.length; i++) {
    let product = order.orderItems[i].product;
    products += orderProductDetailTemplate(
      order.orderItems[i],
      product,
      "",
      order.orderItems.length,
      order.subTotal
    );
  }
  const detail = emailDetail(
    order.orderItems.length,
    order.address.localType,
    order.subTotal
  );
  let body = emailBody(
    order.customer.fullname,
    order.createdAt,
    `We are pleased to inform that the item(s) from your <b>order #${order.orderId}</b> have been confirmed.
  The detail is as follows:`
  );
  const text = `  <html><body>
  ${header}
  ${body}
  <table style="  font-family: arial, sans-serif;
border-collapse: collapse;
width: 100%;">
  <tr>
  <th style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Product</th>
  <th style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Quantity</th>
  <th style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Price</th>
</tr>
  ${products}
  ${detail}
  </table>
  </body></html>`;
  // const text = `Dear Customer, your ${order} has been Shipped
  //  If you did not request any order, then ignore this email.`;
  // await sendEmail(to, subject, text, true);
  await sendEmail(to, subject, text, true);
};

/**
     this email is sent to the customer when he create the order
 * @param {Object} address 
 * @param {Array} sellerDetailAndProducts 
 * @param {string} orderId
 *  @param {string} to
 */


     const customerEmailTemplate = async (
      to,
      address,
      sellerDetailAndProducts,
      orderId,
      currency = "SAR",
      customerName
    ) => {
        customerName = await capitalize(customerName)
      const subject = "Thank you, for ordering.";
    
      let allpakages = "";
      if(!sellerDetailAndProducts||!Object.keys(sellerDetailAndProducts).length){
        return null;
      }
    
       
        allpakages = details(sellerDetailAndProducts);
      let body = bodyOfEmail(
        customerName,
        ` Thank you for choosing MySouq. We have got your order! We
        will let you know when it ships and is headed to your way.`
      );
    
      const detail = detailOfEmail(
        sellerDetailAndProducts.shipmentCharges,
        sellerDetailAndProducts.payableTotal,
        sellerDetailAndProducts.subTotal,
        sellerDetailAndProducts.discount,
        sellerDetailAndProducts.retailTotal,
        sellerDetailAndProducts.paymentMethod,
        sellerDetailAndProducts.payableShippment,
        sellerDetailAndProducts.total,
        currency
      );
      let qa = `<tr>
    <td>
        <h5
            style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
            Question: How do I create a new order?
        </h5>
        <p style=" color: #ffffff; font-family: Open Sans, Helvetica, Arial;">
        Answer: To create a new order, you will need to select the items you wish to 
        purchase and add them to your shopping cart. Once you have all the items you want 
        in your cart, you can proceed to the checkout page where you will enter your shipping
         and payment information to submit  the order. 
        For more details please contact at  +966-111mysouq.
        </p>
    </td>
    </tr>`;
    
      let emailFooter = emailFoot(
        ` Question: What is next procedure?`,
        `Answer: We have received your order and we are processing it with care. 
        Till that you can explore the MySouq (https://stage.mysouq.com/). For more details 
        please contact at  +966-111mysouq.`,
        qa,
        ""
      );
      const text = `
      <!DOCTYPE html>
    <html>
    
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin-left: auto;
                margin-right: auto;
                background: rgb(248, 248, 248);
    
    
            }
        </style>
    </head>
    
    <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td>
                    <!-- section table -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                        <tr>
                            <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                                <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                        width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
    
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 10px 25px 10px 25px; background-color: #ffffff;"
                                bgcolor="#ffffff">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    style="max-width:600px;">
                                    <tr>
                                        <td align="center" style=" padding-top: 5px;">
                                            <img src="https://img.icons8.com/emoji/512/check-mark-emoji.png" width="85"
                                                height="80" style="display: block; border: 0px;" /><br>
                                            <h2
                                                style="font-size: 28px; font-weight: 800; line-height: 36px; color: black; margin: 0;">
                                                Thank You For Your Order!
                                            </h2>
                                        </td>
                                    </tr>
                                   ${body}
                                    <tr>
                                        <td align="left" style="padding-top: 20px;">
                                            <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td width="80%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                        <strong>ID #${sellerDetailAndProducts.orderId} </strong>
                                                    </td>
                                                    <td width="10%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
    
                                                        <strong>Qty</strong>
                                                    </td>
                                                    <td width="10%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                        <strong>Amount(${currency})</strong>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                   ${allpakages.productDetail}
    
                                   ${detail}
    
                           </table>
    
                       </td>
                   </tr>
    
                   ${emailFooter}
               </table>
           </td>
       </tr>
    </table>
    
    
    
    
    
    </body>
    
    </html>
    
                                  
    `;
      await sendEmail(to, subject, text, true);
    };


/**
    this email is sent to user when the order is confirmed
 * @param {Object} order 
 *  @param {string} to
 */
const sendEmailOrderConfimation = async (to, order) => {
  const subject = `Your package has been confirmed order #${order.orderId}`;
  const header = headerOfEmail("Order Confirmed");
  let products = "";
  order.seller.fullname =await capitalize(order.seller.fullname);

  if (!order || !order.orderItems.length) return null;
  products += allPakages(
    order.orderItems[0],
    order.orderItems[0].product,
    order.seller.fullname
  );
  
   
  const currency =  order.orderItems[0].product?.currency || "SAR";
  const detail = detailOfEmail(
    order.shippmentCharges,
    order.payable,
    order.subTotal,
    order.discount,
    order.retailTotal,
    order.paymentMethod,
    order.payableShippment,
    order.paymentMethodTotal,
    currency
  );

  let body = bodyOfEmail(
    order.customer.fullname,
    `We are pleased to inform that the item(s) from your <b>order #${order.orderId}</b> have been confirmed.
    The detail is as follows:`
  );

  // let emailFooter = footer(
  //   `We hope you enjoyed your shopping experience with us
  //    and that you will visit us again soon.`,
  //   `${config.bazaarghar_Url}`,
  //   `Bazaarghar`
  // );


  let qa = `<tr>
  <td>
      <h5
          style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
          Question: How much time it will take to deliver my order?

      </h5>
      <p style=" color: #ffffff; font-family: Open Sans, Helvetica, Arial;">
      Answer: Your order will take standard delivery time. For more details
       please contact at  +966-111mysouq.
      </p>
  </td>
  </tr>`;
  

  let emailFooter = emailFoot(
    `  Question: How do I confirm that my order has been received?`,
    `Answer: After you place an order, you should receive an order
     confirmation email that contains the details of your order, including the
      items you purchased and the total cost. This email serves as confirmation that
       your order has been received. You can also check the status of your order on the 
       company's website or by contacting their customer service department.
     For more details please contact at  +966-111mysouq.`,
    qa,
    ""
  );

  const text = `  <!DOCTYPE html>
    <html>
    
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin-left: auto;
                margin-right: auto;
                background: rgb(248, 248, 248);
    
            }
        </style>
    </head>
    
    <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td>
                    <!-- section table -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                        <tr>
                            <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                                <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                        width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
    
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 10px 25px 10px 25px; background-color: #ffffff;"
                                bgcolor="#ffffff">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    style="max-width:600px;">
                                ${header}
                                    ${body}
    
                                   
                                    <tr>
                                        <td align="left" style="padding-top: 20px;">
                                            <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td width="80%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                        <strong>ID #${order.orderId}</strong>
                                                    </td>
                                                    <td width="10%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
    
                                                        <strong>Qty</strong>
                                                    </td>
                                                    <td width="10%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                        <strong>Amount(${currency})</strong>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    ${products}
                                    ${detail}
                                    
    
                                </table>
    
                            </td>
                        </tr>
                         ${emailFooter}
    
                    </table>
                </td>
            </tr>
        </table>
    
    
    
    
    
    </body>
    
    </html>`;
  // const text = `Dear Customer, your ${order} has been Shipped
  //  If you did not request any order, then ignore this email.`;
  // await sendEmail(to, subject, text, true);
  await sendEmail(to, subject, text, true);
};



/**
    this email is sent to user when the order canceled 
 * @param {Object} order 
 *  @param {string} to
 */

const sendOrderCancelEmail = async (to, order ,type = roleTypes.USER,name) => {
  const subject = `Your order against order #${order.orderId} is cancelled`;
  const header = headerOfEmail("Your order has been cancelled!");
  let products = "";
  if (!order || !order.orderItems.length) return null;
  let product = order.orderItems[0].product;
  order.seller.fullname = await capitalize(order.seller.fullname);
  order.customer.fullname = await capitalize(order.customer.fullname);
  products += allPakages(
    order.orderItems[0],
    order.orderItems[0].product,
    order.seller.fullname
  );
  let currency =  order.orderItems[0]?.product?.currency || "SAR";

  const detail = detailOfEmail(
    order.shippmentCharges,
    order.paymentMethodTotal,
    order.subTotal,
    order.discount,
    order.retailTotal,
    order.paymentMethod,
    order.payableShippment,
    order.paymentMethodTotal,
    currency,
    cancel= true
  );
  

  let body = bodyOfEmail(
    type==roleTypes.USER?order.customer.fullname:order.seller.fullname,
    `Your order against <b>order #${order.orderId}</b> is cancelled.
  The detail is as follows:`
  );

  // let emailFooter = footer(
  //   `For more details on cancellation, click Account, and select My orders. You
  // will be redirected to a page where you can
  // view your canceled order. Click on the order that you want to check. The
  // details and reason for the cancellation will be
  // stated there.`,
  //   `https://www.bazaarghar.com/account/invoices`,
  //   `View Cancellation Details`
  // );


  let qa = `<tr>
  <td>
      <h5
          style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
          Question: How can my I cancel an existing order?
      </h5>
      <p style=" color: #ffffff; font-family: Open Sans, Helvetica, Arial;">
      Answer: To cancel an existing order, you will need to contact the CSR team of 
      MySouq (${config.domainName}). Our company has its own policies and procedures 
      for canceling orders, so you will need to follow their specific instructions delivered 
      by CSR team. You may need to provide a reason for the cancelation or request the
       cancelation within a certain time frame in order to be eligible for a refund. For more
       details please contact at  +966-111mysouq.
      </p>
  </td>
  </tr>`;
  

  let emailFooter = emailFoot(
    ` Question: Why sellers cancel my order??`,
    `Answer: Their may be some defected pieces in inventory or due to the unavailability 
    of product seller can cancel your order.
     For more details please contact at  +966-111mysouq.`,
    qa,
    ""
  );

  const text = ` <!DOCTYPE html>
  <html>
  
  <head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin-left: auto;
            margin-right: auto;
            background: rgb(248, 248, 248);

          }
      </style>
  </head>
  
  <body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
              <td>
                  <!-- section table -->
                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                      <tr>
                          <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                              <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                      width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
  
                          </td>
                      </tr>
                      <tr>
                          <td align="center" style="padding: 10px 25px 10px 25px; background-color: #ffffff;"
                              bgcolor="#ffffff">
                              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                  style="max-width:600px;">
                              ${header}
                                  ${body}
  
                                 
                                  <tr>
                                      <td align="left" style="padding-top: 20px;">
                                          <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                              <tr>
                                                  <td width="80%" align="left" bgcolor="#eeeeee"
                                                      style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                      <strong>ID #${order.orderId}</strong>
                                                  </td>
                                                  <td width="10%" align="left" bgcolor="#eeeeee"
                                                      style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
  
                                                      <strong>Qty</strong>
                                                  </td>
                                                  <td width="10%" align="left" bgcolor="#eeeeee"
                                                      style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                      <strong>Amount(${currency})</strong>
                                                  </td>
                                              </tr>
                                          </table>
                                      </td>
                                  </tr>
                                  ${products}
                                  ${detail}
                                  
  
                              </table>
  
                          </td>
                      </tr>
  
                      ${emailFooter}
  
                  </table>
              </td>
          </tr>
      </table>
  
  
  
  
  
  </body>
  
  </html>`;
  // const text = `Dear Customer, your ${order} has been Shipped
  //  If you did not request any order, then ignore this email.`;
  // await sendEmail(to, subject, text, true);
  await sendEmail(to, subject, text, true);
};

const sendOrderCancelationEmail = async (to, order) => {
  const subject = `Your order against order #${order.orderId} is cancelled`;
  const header = emailHeader("Order Cancelled");
  console.log(order.address);
  order.cutomer.fullname = capitalize(order.customer.fullname);
  let products = "";
  for (let i = 0; i < order.orderItems.length; i++) {
    let product = order.orderItems[i].product;
    products += orderProductDetailTemplate(
      order.orderItems[i],
      product,
      "",
      order.orderItems.length,
      order.subTotal
    );
  }
  const detail = emailDetail(
    order.orderItems.length,
    order.address.localType,
    order.subTotal
  );
  let body = emailBody(
    order.customer.fullname,
    order.createdAt,
    `Your order against <b>order #${order.orderId}</b> is cancelled.
    The detail is as follows:`
  );
  const text = `  <html><body>
    ${header}
    ${body}
    <table style="  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;">
    <tr>
    <th style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">Product</th>
    <th style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">Quantity</th>
    <th style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">Price</th>
  </tr>
    ${products}
    ${detail}
    </table>
    </body></html>`;
  // const text = `Dear Customer, your ${order} has been Shipped
  //  If you did not request any order, then ignore this email.`;
  // await sendEmail(to, subject, text, true);
  await sendEmail(to, subject, text, true);
};

const sendOrderInProcessEmail = async (to, order) => {
  const subject = "Order Process Email";
  // replace this url with  the link to the reset password page of your front-end app
  const text = `Dear Customer, your ${order} is in Processing . 
   If you did not request any order, then ignore this email.`;
  await sendEmail(to, subject, text);
};





/**
    this email is sent to user when the order is shipped
 * @param {Object} order 
 *  @param {string} to
 */
const shippedEmailSendOrder = async (to, order) => {
  
  const subject = `Your package has been shipped order #${order.orderId}`;
  const header = headerOfEmail("Order Shipped");
  
  let products = "";

  if (!order || !order.orderItems.length) return null;
  order.seller.fullname = await capitalize(order.seller.fullname);
  order.customer.fullname =await capitalize(order.customer.fullname);
  products += allPakages(
    order.orderItems[0],
    order.orderItems[0].product,
    order.seller.fullname
  );
 let currency  = order.orderItems[0].product?.currency || "SAR"
  const detail = detailOfEmail(
    order.shippmentCharges,
    order.payable,
    order.subTotal,
    order.discount,
    order.retailTotal,
    order.paymentMethod,
    order.payableShippment,
    order.paymentMethodTotal,
    currency
  );

  let body = bodyOfEmail(
    order.customer.fullname,
    order.createdAt,
    `We are pleased to inform that the item(s) from your <b>order #${order.orderId}</b> have been shipped.
    The detail is as follows:`
  );

  // let emailFooter = footer(
  //   `We hope you enjoyed your shopping experience with us
  //    and that you will visit us again soon.`,
  //    `${config.bazaarghar_Url}`,
  //   `Bazaarghar`
  // );




  let qa = `<tr>
  <td>
      <h5
          style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
          Question: How do I know when my order has shipped?
      </h5>
      <p style=" color: #ffffff; font-family: Open Sans, Helvetica, Arial;">
      Answer: When your order has shipped, you should receive a notification
       email that includes a tracking number and a link to the shipping company's 
       website where you can track the progress of your delivery. You can also check the 
       status of your order on the company's website or by
       contacting their customer service department.
      </p>
  </td>
  </tr>`;
  

  let emailFooter = emailFoot(
    ` Question: How can I apply for return the order?`,
    `Answer: You can apply for return the order by applying via My Orders
     console in Profile Section. Click on order you want to return and then
      click on Return option, then select the reason for return.
     For more details please contact at  +966-111mysouq.`,
    qa,
    ""
  );

  const text = ` <!DOCTYPE html>
    <html>
    
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin-left: auto;
                margin-right: auto;
                background: rgb(248, 248, 248);
      
    
            }
        </style>
    </head>
    
    <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td>
                    <!-- section table -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                        <tr>
                            <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                                <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                        width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
    
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 10px 25px 10px 25px; background-color: #ffffff;"
                                bgcolor="#ffffff">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    style="max-width:600px;">
                                    <tr>
                                        <td align="center" style=" padding-top: 5px;">
                                            <img src="https://img.icons8.com/ios/512/shipped.png" width="85" height="80"
                                                style="display: block; border: 0px;" /><br>
                                            <h2
                                                style="font-size: 28px; font-weight: 800; line-height: 36px; color: black; margin: 0;">
                                                Your package has been shipped!
                                            </h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="left"
                                            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                                            <p
                                                style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                                                Hi ${order.customer.fullname},
                                            </p>
                                            <p
                                                style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                                                We are pleased to share that the product(s) from your order #${order.orderId}
                                                have been shipped.
    
                                            </p>
                                            <p
                                                style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                                                <strong>Note:</strong> For all My Souq pick-up point orders you will be
                                                notified once your
                                                order reaches the pick-up point.
                                            </p>
                                        </td>
                                    </tr>
    
                                   
                                    <tr>
                                        <td align="left" style="padding-top: 20px;">
                                            <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td width="80%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                        <strong>ID #${order.orderId}</strong>
                                                    </td>
                                                    <td width="10%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
    
                                                        <strong>Qty</strong>
                                                    </td>
                                                    <td width="10%" align="left" bgcolor="#eeeeee"
                                                        style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                        <strong>Amount(${currency})</strong>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    ${products}
                                    ${detail}
                                    
    
                                </table>
    
                            </td>
                        </tr>
    
                        ${emailFooter}

                    </table>
                </td>
            </tr>
        </table>
    
    
    
    
    
    </body>
    
    </html>`;
  // const text = `Dear Customer, your ${order} has been Shipped
  //  If you did not request any order, then ignore this email.`;
  // await sendEmail(to, subject, text, true);
  await sendEmail(to, subject, text, true);
};

const sendOrderShippedEmail = async (to, order) => {
  const subject = `Your package has been shipped order #${order.orderId}`;
  const header = emailHeader("Order Shipped");
  console.log(order.address);
  order.customer.fullname = capitalize(order.customer.fullname);
  let products = "";
  for (let i = 0; i < order.orderItems.length; i++) {
    let product = order.orderItems[i].product;
    products += orderProductDetailTemplate(
      order.orderItems[i],
      product,
      "",
      order.orderItems.length,
      order.subTotal
    );
  }
  const detail = emailDetail(
    order.orderItems.length,
    order.address.localType,
    order.subTotal
  );
  let body = emailBody(
    order.customer.fullname,
    order.createdAt,
    `We are pleased to inform that the item(s) from your <b>order #${order.orderId}</b> have been shipped.
  The detail is as follows:`
  );
  const text = `  <html><body>
  ${header}
  ${body}
  <table style="  font-family: arial, sans-serif;
border-collapse: collapse;
width: 100%;">
  <tr>
  <th style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Product</th>
  <th style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Quantity</th>
  <th style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Price</th>
</tr>
  ${products}
  ${detail}
  </table>
  </body></html>`;
  // const text = `Dear Customer, your ${order} has been Shipped
  //  If you did not request any order, then ignore this email.`;
  await sendEmail(to, subject, text, true);
};

const emailTemplateCustomer = async (to, address, sellerDetailAndProducts) => {
    let  pkr=await handleSetting({key:"PAKISTAN"})
  const subject = "Thank you, for ordering.";
  let productDetail = "";
  // sellerDetailAndProducts.map(seller => {
  if (sellerDetailAndProducts && sellerDetailAndProducts.products) {
    sellerDetailAndProducts.products.map(product => {
      productDetail += `<tr> 
    <th style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">${product.productName}</th>
    <td style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">${product.quantity}</td>
    <td style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">${pkr} ${product.total}</td> 
  </tr>`
    })
    // });
    const shippingCharges = address.localType == addressLocalTypes.LOCAL ? `<tr>
  <th colspan="2" style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">Shipping Charges:</th>
  <td style="border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;">${pkr}: ${sellerDetailAndProducts.length * 100}</td>
</tr>`: "";
    const text = `
  <html><body>
  <div style=" max-width: 800px;margin:0 auto; text-transform: capitalize;">
    <h1 style=" background-color: orange;color:white;text-align: center;width: 100%;padding: 30px 0;">Thank you for your order</h1>
    <div >
    <h3 style="text-transform: capitalize;">Hi ${address.fullname},</h3>
    <p style=" font-size: 14px;">
    Hi ${address.fullname},

    Thank you for ordering with MySouq, Pakistan's first social e-commerce marketplace.
    We are happy to receive your order #128806024788016 and will notify you once it's on its way. If you have ordered from multiple sellers, your items will be delivered in separate packages. We hope you will have an excellent experience with us. You can check order status from here as well

    Your order and delivery detail is as follows:
</p>
<h4>Order Date: ${address._doc ? address._doc.orderDate : sellerDetailAndProducts.date}</h4>
<table style="  font-family: arial, sans-serif;
border-collapse: collapse;
width: 100%;">
    <tr>
      <th style="border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;">Product</th>
      <th style="border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;">Quantity</th>
      <th style="border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;">Price</th>
    </tr>
${productDetail}
${sellerDetailAndProducts.shippingCharges}
    <tr>
      <th colspan="2" style="border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;">Total:</th>
      <td style="border: 1px solid #dddddd;
      text-align: left;
      padding: 8px;">${pkr} ${address._doc ? address._doc.total : address.total ? address.total : sellerDetailAndProducts.total}</td>
    </tr>
  </table>
  <div style="width:100%; display:flex;">
    <div style="width:50% ; ">
  <h4>Shipping address</h4>
<pre style="border: 1px solid; padding: 20px;  font-size: 14px;">${address.fullname}
    ${address.address}
   ${address.city}
    ${address.province}
      ${address.phone}
    </pre>
</div>
    </div>
    <p style="font-size: 14px;"> We look forward to fulfilling your order soon.</p>
    </div>
  </html></body> 
`
    await sendEmail(to, subject, text, true);
  }
}

// </body>

// </html>

                              
// `;
//   await sendEmail(to, subject, text, true);
// };

const emailTemplateSeller = async (address, sellerDetailAndProducts) => {
    let  pkr=await handleSetting({key:"PAKISTAN"})
  const subject = "Congratulation, you got a new order.";
  for (let i = 0; i < sellerDetailAndProducts.length; i++) {
    let seller = sellerDetailAndProducts[i];
    if (seller.email && seller.products) {
      let productDetail = "";
      seller.products.map((product) => {
        productDetail += `<tr>
          <th style="border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">${product.productName}</th>
          <td style="border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">${product.quantity}</td>
          <td style="border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;">${pkr} ${product.total}</td>
        </tr>`;
      });
      const text = `<html><body>
        <div style=" max-width: 800px;margin:0 auto;">
          <h1 style=" background-color: orange;color:white;text-align: center;width: 100%;padding: 30px 0;">Thank you for your order</h1>
          <div >
          <h3 style="text-transform: capitalize;">Hi ${seller.name},</h3>
          <p style=" font-size: 14px;">Congratulations, you have received an order. Please process it within 24hrs to have a good dispatch rate. Order details are as follows:</p>
      <h4>Order Date: ${address._doc ? address._doc.orderDate : sellerDetailAndProducts.date}</h4>
      <table style="  font-family: arial, sans-serif;
      border-collapse: collapse;
      width: 100%;">
          <tr>
            <th style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;">Product</th>
            <th style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;">Quantity</th>
            <th style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;">Price</th>
          </tr>
      ${productDetail}
               <tr>
            <th colspan="2" style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;">Total:</th>
            <td style="border: 1px solid #dddddd;
            text-align: left;
            padding: 8px;">${pkr} ${seller.total}</td>
          </tr>
        </table>
        <div style=" float:right ; margin-top: 10px;">
        <a href=${config.adminDomain}/orders/${seller.orderId} style="display: inline-block; mso-hide:all; background-color: #ff9400; color: #FFFFFF; border:1px solid #19CCA3; border-radius: 6px; line-height: 220%; width: 200px; font-family: Helvetica, sans-serif; font-size:18px; font-weight:600; text-align: center; text-decoration: none; -webkit-text-size-adjust:none;  " target="_blank">Click here!</a>
      </div>
                </html></body>
      `;
      await sendEmail(seller.email, subject, text, true);
    }
  }
};






/**
 * @param {Object} address 
 * @param {Array} sellerDetailAndProducts 
 * @param {string} orderId
 */


const sellerEmailTemplate = async (
  sellerDetailAndProducts,
  orderId
) => {
  let currency = sellerDetailAndProducts.currency || "SAR";
   delete sellerDetailAndProducts.currency
  const subject = "Congratulation, you got a new order.";

  if (!sellerDetailAndProducts || !sellerDetailAndProducts.length) return null;
  for (let i = 0; i < sellerDetailAndProducts.length; i++) {
    let seller = sellerDetailAndProducts[i];
    let allpakages = "";
    let productDetai = "";
    if (seller.email) {
      allpakages = details(seller);
        productDetai += allpakages.productDetail;
   const detail = detailOfEmail(
        seller.shipmentCharges,
        seller.payableTotal,
        seller.subTotal,
        seller.discount,
        seller.retailTotal,
        seller.paymentMethod,
        seller.payableShippment,
        seller.paymentMethodTotal,
        currency
      );
      let body = bodyOfEmail(
       seller.name,
        ` Please process it within 24hrs to have a good dispatch rate. Order details are as follows:`
      );

      let footVariable = `<tr>
<td align="center" style=" line-height: 24px; padding: 5px 0 10px 0;">
    <p style="color: black; font-size: 16px; font-weight: 600; line-height: 18px;">
        Contact us
      
    </p>
    <div style="
    width: 60%;
    display: flex  !important;
    justify-content: space-between !important">
    <p style="color: black; font-size: 14px; font-weight: 600; line-height: 18px;">
    ${config.email.from}
      
    </p>
    <p style="color: black; font-size: 14px; font-weight: 600; line-height: 18px;">
    ${config.phone}
      
      
    </p>
</div>

</td>
</tr>`;

      // let emailFooter = emailFoot(
      //   `How can I fullfill the order?`,
      //   ` Print invoice and place it inside the package.
      // Print shipping label and place it on top of the package.
      // Pack the order properly as per Bazaarghar packaging guidelines`,
      //   "",
      //   footVariable
      // );



      let qa = `<tr>
      <td>
          <h5
              style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
              Question: Can I cancel the order once I have confirmed?
          </h5>
          <p style=" color: #ffffff; font-family: Open Sans, Helvetica, Arial;">
          Answer: No you can not cancel the order if once you have confirmed and 
          make ready the product for shipment. 
          For more details please contact at  +966-111mysouq.
          </p>
      </td>
      </tr>`;
      
        let emailFooter = emailFoot(
          ` Question: What to next?  `,
          `Answer:  Now please visit the Seller Panel, and Confirm the order 
          if product/s are available to
           sale or Cancel the order if there is any problem with product.`,
          qa,
          footVariable
        );
      

      const text = ` <!DOCTYPE html>
        <html>
        
        <head>
            <title></title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <style>
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    margin-left: auto;
                    margin-right: auto;
                    background: rgb(248, 248, 248);
        

                }
            </style>
        </head>
        
        <body>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                    <td>
                        <!-- section table -->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                            <tr>
                                <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                                    <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                            width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
        
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 10px 25px 10px 25px; background-color: #ffffff;"
                                    bgcolor="#ffffff">
                                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                        style="max-width:600px;">
                                        <tr>
                                            <td align="center" style=" padding-top: 5px;">
                                                <img src="https://img.icons8.com/emoji/512/check-mark-emoji.png" width="85"
                                                    height="80" style="display: block; border: 0px;" /><br>
                                                <h2
                                                    style="font-size: 28px; font-weight: 800; line-height: 36px; color: black; margin: 0;">
                                                    Congratulation, you have received a new order!
                                                </h2>
                                            </td>
                                        </tr>
                                        ${body}
                                        <tr>
                                            <td align="left" style="padding-top: 20px;">
                                                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                    <tr>
                                                        <td width="80%" align="left" bgcolor="#eeeeee"
                                                            style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                            <strong>ID #${seller.orderId} </strong>
                                                        </td>
                                                        <td width="10%" align="left" bgcolor="#eeeeee"
                                                            style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
        
                                                            <strong>Qty</strong>
                                                        </td>
                                                        <td width="10%" align="left" bgcolor="#eeeeee"
                                                            style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                            <strong>Amount(${currency})</strong>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        ${productDetai}
                                     ${detail}
        
                                    </table>
        
                                </td>
                            </tr>
        
        ${emailFooter}
        
                        </table>
                    </td>
                </tr>
            </table>
        
        
        
        
        
        </body>
        
        </html>
        
        `;
        
        await sendEmail(seller.email, subject, text, true);
    }
  }
};

const headerOfEmail = (title) => {
  const header = `

<tr>
              <td align="center" style=" padding-top: 5px;">
                  <img src="https://img.icons8.com/ios/512/shipped.png" width="85" height="80"
                      style="display: block; border: 0px;" /><br>
                  <h2
                      style="font-size: 28px; font-weight: 800; line-height: 36px; color: black; margin: 0;">
                      ${title}
                  </h2>
              </td>
          </tr>


`;
  return header;
};

const allPakages = (orderItem, products,sellerName) => {
  let productDetail = "";

  productDetail += `
          
          <tr>
          <td align="center" style="background-color: #ffffff;" bgcolor="#ffffff">
              <!-- new table -->
              <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0"
                  style="max-width:600px; font-size: 14px; ">
                  <tr>

                      <td width="80%" align="left" style=" font-weight: 600;  padding: 10px;">
                          Package ${1} ${sellerName}
                      </td>
                  </tr>
                  <tr>
                      <td style="width: 80%; padding: 5px 0;">
                          <table cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                  <td style="padding:0 5px ">
                                      <img src="${
                                        products.mainImage
                                      }" width="80px" height="80px"
                                          alt="productImage">
                                  </td>
                                  <td align="left"
                                      style="color: black; vertical-align:top; padding:0 5px">
                                      ${products.productName}
                                  </td>
                              </tr>

                          </table>
                      </td>
                      <td width="10%" align="left"
                          style="color: black;  vertical-align:top; padding: 10px;">
                          ${orderItem.quantity}
                      </td>
                      <td width="10%" align="left"
                          style="color:#F44336; vertical-align:top; padding: 10px;">
                          ${orderItem.total}
                      </td>

                  </tr>
              </table>
          </td>
      </tr>
             `;
  return productDetail;
};

const orderProductDetailTemplate =async (orderItem, products) => {
  let productDetail = "";
  let  pkr=await handleSetting({key:"PAKISTAN"})
  if (products.length) {
    products.map((product) => {
      productDetail += `<tr> 
              <th style="border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;">${product.productName}</th>
              <td style="border: 1px solid #dddddd; 
              text-align: left;
              padding: 8px;">${orderItem.quantity}</td>
              <td style="border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;">${pkr} ${orderItem.total}</td>  
            </tr>`;
    });
  } else {
    productDetail += `<tr> 
              <th style="border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;">${products.productName}</th>
              <td style="border: 1px solid #dddddd; 
              text-align: left;
              padding: 8px;">${orderItem.quantity}</td>
              <td style="border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;">${pkr} ${orderItem.total}</td>  
            </tr>`;
  }
  return productDetail;
};

const emailBody = (name, orderDate, content) => {
  const body = `<h3 style="text-transform: capitalize;">Hi ${name},</h3>
<p style=" font-size: 14px;">${content}</p>
<h4>Order Date: ${orderDate}</h4>`;
  return body;
};

const bodyOfEmail = (name, content) => {
  const body = `
 
          
          <tr>
              <td align="left"
                  style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                  <p
                      style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                      Hi ${name},
                  </p>
                  <p
                      style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                      ${content}

                  </p>
                 
              </td>
          </tr>



  
  
  `;
  return body;
};


const detailOfEmail = (shipment, payableTotal, subTotal, discount, retailTotal, paymentMethod, payableShipment, total,currency="SAR",cancel=false ) => {
if(paymentMethod== paymentMethods.COD_WALLET || paymentMethod== paymentMethods.WALLET_CARD){
    paymentMethod= paymentMethod.split("_").join("+")
}
paymentMethod = paymentMethod === "card" ? "Credit/Debit Card" : paymentMethod
let payable = cancel ? "Return Amount" :"Payable"
    shipment = typeof shipment === "number" && shipment % 1 !== 0 ? parseFloat(shipment).toFixed(2) : shipment
    payableShipment = typeof payableShipment === "number"   && payableShipment % 1 !== 0 ? parseFloat(payableShipment).toFixed(2) : payableShipment
    payableTotal = typeof payableTotal === "number" && payableTotal % 1 !== 0 ? parseFloat(payableTotal).toFixed(2) : payableTotal
    subTotal = typeof subTotal === "number" && subTotal % 1 !== 0 ? parseFloat(subTotal).toFixed(2) : subTotal
    discount = typeof discount === "number"  && discount % 1 !== 0 ? parseFloat(discount).toFixed(2) : discount
    retailTotal = typeof retailTotal === "number" && retailTotal % 1 !== 0 ? parseFloat(retailTotal).toFixed(2) : retailTotal
    total = typeof total === "number" && total % 1 !== 0 ? parseFloat(total).toFixed(2) : total


    let detail = `<tr>
      <td style="padding-top: 10px;">
          <!-- new table -->
          <table cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                  <td width="80%" align="left" bgcolor="#eeeeee"
                      style="color: black; font-size: 16px; line-height: 24px; padding: 10px;">
                      <strong>Details</strong>
                  </td>
                  <td width="20%" align="left" bgcolor="#eeeeee"
                      style="color: black; font-size: 16px; line-height: 24px; padding: 10px;">
                      <strong>Amount(${currency})</strong>
                  </td>
              </tr>
              <tr>
          <td width="80%" align="left"
              style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
              Product Total
          </td>
          <td width="20%" align="left"
              style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
              ${retailTotal}
          </td>
      </tr> 
              <tr>
                  <td width="80%" align="left"
                      style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
                      Discount
                  </td>
                  <td width="20%" align="left"
                      style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
                      ${discount}
                  </td>
              </tr>
              <tr>
              <td width="80%" align="left"
                  style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
                  Subtotal
              </td>
              <td width="20%" align="left"
                  style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
                  ${subTotal}
              </td>
          </tr> <tr>
      <td width="80%" align="left"
          style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
          Shippment Charges
      </td>
      <td width="20%" align="left"
          style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
          ${shipment}
      </td>
  </tr>

             

              <tr>
                  <td width="80%" align="left"
                      style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;">
                      Total
                  </td>
                  <td width="20%" align="left"
                      style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 5px 10px;">
                      ${total}
                  </td>
              </tr>
              <tr>
                  <td width="80%" align="left"
                      style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
                      Payment method
                  </td>
                  <td width="20%" align="left"
                      style="color: black; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
                      ${paymentMethod}
                  </td>
              </tr>
            
          </table>
      </td>
      </tr>`;

    detail += `  <tr>
  <td align="left" style="padding-top: 20px;">
      <table cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
              <td width="80%" align="left"
                  style="color: black; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                  ${payable}
              </td>
              <td width="20%" align="left"
                  style="color: black; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                   ${payableTotal}
              </td>
          </tr>
      </table>
  </td>
  </tr>
`;

    return detail;
};


const emailDetail = async (shipping, localType, subTotal) => {
    let  pkr=await handleSetting({key:"PAKISTAN"})
    let  locaCharge=await handleSetting({key:"LOCAL_CHARGES"})
    let  intCharge=await handleSetting({key:"INT_CHARGES"})
  let detail = "";
  const shippingCharges =
    localType == addressLocalTypes.LOCAL
      ? `<tr>
    <th colspan="2" style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">Shipping</th>
    <td style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">${pkr} ${
          shipping * locaCharge
        }</td>
  </tr>`
      : "";
  detail += shippingCharges;
  detail += `  <tr>
    <th colspan="2" style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">Total</th>
    <td style="border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;">${pkr} ${
    localType == addressLocalTypes.LOCAL
      ? subTotal + locaCharge
      : subTotal + intCharge
  }</td>
  </tr>`;
  return detail;
};




let details = function (seller) {
  let productDetail = "";
  if(!seller||!seller.products.length)
  return null;
  let pakage=0
  seller.products.map((product,index) => {
   
    if(index>0)
    {
      pakage++;

    }
    productDetail += `<tr>
          <td align="center" style="background-color: #ffffff;" bgcolor="#ffffff">
              <!-- new table -->
              <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0"
                  style="max-width:600px; border-bottom: 2px solid gray; font-size: 14px; ">
                  <tr><td width="80%" style="color:black;font-weight:600;padding:10px">
                          Package  ${pakage + 1}, ${product.brandName}
                      </td>
                  </tr>
                  <tr>
                      <td style="width: 80%; padding: 5px 0;">
                          <table cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                  <td style="padding:0 5px ">
                                      <img src="${
                                        product.mainImage
                                      }" width="80px" height="80px"
                                          alt="productImage">
                                  </td>
                                  <td align="left"
                                      style="color: black; vertical-align:top; padding:0 5px">
                                      ${product.productName}
                                  </td>
                              </tr>
    ​
                          </table>
                      </td>
                      <td width="10%" align="left"
                          style="color: black; vertical-align:top; padding: 10px;">
                          ${product.quantity}
                      </td>
                      <td width="10%" align="left"
                          style="color:#F44336; vertical-align:top; padding: 10px;">
                          ${product.total}
                      </td>
    ​
                  </tr>
              </table>
          </td>
      </tr>`;
  });
  return { productDetail: productDetail };
};
const sendEmailVerifemail = async (to,code,sellerName) => {
    const subject = `verification code`;
   
    const text = `  <!DOCTYPE html>
    <html>
    
    <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <style>
            body {
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                font-family: Open Sans, Helvetica, Arial, sans-serif;
            }
        </style>
    </head>
    
    <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="background-color: #eeeeee;">
                    <!-- section table -->
                    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                        <tr>
                            <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                                <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                        width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
    
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 10px 25px 10px 25px;  background-color: #ffffff;"
                                bgcolor="#ffffff">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    style="max-width:600px;">
                                    <tr>
                                        <td align="center" style=" padding-top: 5px;">
                                            
                                            <h2
                                                style="font-size: 28px; font-weight: 800; line-height: 36px; margin: 0;">
                                               Email confirmation
                                            </h2>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="left"
                                            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                                            <p>
                                                Dear ${sellerName}
                                            </p>
                                            <p>
                                            Your email confirmation code is  <span style=font-weight: 600;>
                                           <b> ${code} <b/>
                                            </span> </p>
                                            
                                            <p>
                                               <p> if you have not make this request please ignore and do not share this with any one.<p/>
                                                <p>For more details and queries please call at <b +966-111mysouq.</b>  and you can also email at ${config.email.from} <br><br>
                                                Thank you
                                                  <p/>
                                                
                                                
                                            </p>
                                        </td>
                                   
                                   
                                  
                                  
    
                                </table>
    
                            </td>
                        </tr>
                       
                        <tr>
                            <td align="center" style="padding: 35px; background-color: #ffffff;" bgcolor="#ffffff">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                    style="max-width:600px;">
                                    <tr width="100%" align="center"
                                        style="display: flex; justify-content: space-around; padding: 0 50px;">
                                        <td width="33%">
                                            <a href="https://stage.mysouq.com/">
                                                <img src="https://bazaarghar.com/images/facebook.png" width="37"
                                                    height="37" />
                                            </a>
                                        </td>
                                        <td width="33%">
    
                                            <a href="https://stage.mysouq.com/">
                                                <img src="https://bazaarghar.com/images/instagram.png" width="37"
                                                    height="37" />
                                            </a>
                                        </td>
                                        <td width="33%">
    
                                            <a href="https://stage.mysouq.com/">
                                                <img src="https://bazaarghar.com/images/youtube.png" width="37"
                                                    height="37" />
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="center" style=" line-height: 24px; padding: 5px 0 10px 0;">
                                            <p style="color: black; font-size: 14px; font-weight: 600; line-height: 18px;">
                                                Quartz Building, Al Kurnaysh Br Rd, 7494, Ash Shati، <br>
                                                Building No. 3340, Jeddah 23412
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="left" style=" font-size: 14px; font-weight: 300; line-height: 24px;">
                                            <p
                                                style="font-size: 14px; font-weight: 400; line-height: 20px; color: #777777;">
                                                This is an automatically generated e-mail from our platform. Please do not
                                                reply to this e-mail.
                                            </p>
                                        </td>
                                    </tr>
                            </td>
                        </tr>
    
    
                    </table>
                </td>
            </tr>
        </table>
    
    
    
    
    
    </body>
    
    </html>`;
    await sendEmail(to, subject, text, true);
  };
  
 async function capitalize(name) {
    let capitalizeName = name ?name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '):"";

    return capitalizeName
  }
  
  const sendOrderDeliveredEmail = async (to, order) => {
  
    const subject = `Your package has been delivered order #${order.orderId}`;
    const header = headerOfEmail("Order delivered");
    
    let products = "";
  
    if (!order || !order.orderItems.length) return null;
    order.seller.fullname = await capitalize(order.seller.fullname);
    order.customer.fullname =await capitalize(order.customer.fullname);
    products += allPakages(
      order.orderItems[0],
      order.orderItems[0].product,
      order.seller.fullname
    );
   let currency  = order.orderItems[0].product?.currency || 'SAR';
    const detail = detailOfEmail(
      order.shippmentCharges,
      order.payable,
      order.subTotal,
      order.discount,
      order.retailTotal,
      order.paymentMethod,
      order.payableShippment,
      order.paymentMethodTotal,
      currency
    );
  
    let body = bodyOfEmail(
      order.customer.fullname,
      order.createdAt,
      `We are pleased to inform that the item(s) from your <b>order #${order.orderId}</b> have been delivered.
      The detail is as follows:`
    );
  
    // let emailFooter = footer(
    //   `We hope you enjoyed your shopping experience with us
    //    and that you will visit us again soon.`,
    //    `${config.bazaarghar_Url}`,
    //   `Bazaarghar`
    // );
  
  
  
  
    let qa = `<tr>
    <td>
        <h5
            style="font-size: 15px; font-weight: 800; color: #ffffff; margin: 0; font-family: Open Sans, Helvetica, Arial;">
            Question: How do I know when my order has delivered?
        </h5>
        <p style=" color: #ffffff; font-family: Open Sans, Helvetica, Arial;">
        Answer: When your order has delivered, you should receive a notification
         email that includes a tracking number and a link to the shipping company's 
         website where you can track the progress of your delivery. You can also check the 
         status of your order on the company's website or by
         contacting their customer service department.
        </p>
    </td>
    </tr>`;
    
  
    let emailFooter = emailFoot(
      ` Question: How can I apply for return the order?`,
      `Answer: You can apply for return the order by applying via My Orders
       console in Profile Section. Click on order you want to return and then
        click on Return option, then select the reason for return.
       For more details please contact at  +966-111mysouq.`,
      qa,
      ""
    );
  
    const text = ` <!DOCTYPE html>
      <html>
      
      <head>
          <title></title>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <style>
              body {
                  font-family: Arial, Helvetica, sans-serif;
                  margin-left: auto;
                  margin-right: auto;
                  background: rgb(248, 248, 248);
        
      
              }
          </style>
      </head>
      
      <body>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                  <td>
                      <!-- section table -->
                      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">
                          <tr>
                              <td align="center" valign="top" class="mobile-center" bgcolor="#069ddd">
                                  <a href="${config.domainName}"><img src="https://d.bazaarghar.com/images/mysouq-logo.png"
                                          width="200" height="40" style="display: block; border: 0px; padding: 20px;" /></a>
      
                              </td>
                          </tr>
                          <tr>
                              <td align="center" style="padding: 10px 25px 10px 25px; background-color: #ffffff;"
                                  bgcolor="#ffffff">
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"
                                      style="max-width:600px;">
                                      <tr>
                                          <td align="center" style=" padding-top: 5px;">
                                              <img src="https://img.icons8.com/ios/512/shipped.png" width="85" height="80"
                                                  style="display: block; border: 0px;" /><br>
                                              <h2
                                                  style="font-size: 28px; font-weight: 800; line-height: 36px; color: black; margin: 0;">
                                                  Your package has been Delivered!
                                              </h2>
                                          </td>
                                      </tr>
                                      <tr>
                                          <td align="left"
                                              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding-top: 10px;">
                                              <p
                                                  style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                                                  Hi ${order.customer.fullname},
                                              </p>
                                              <p
                                                  style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                                                  We are pleased to share that the product(s) from your order #${order.orderId}
                                                  have been delivered.
      
                                              </p>
                                              <p
                                                  style="font-size: 16px; font-weight: 400; line-height: 24px; color: #777777; margin: 0;">
                                                  <strong>Note:</strong> For all My Souq pick-up point orders you will be
                                                  notified once your
                                                  order reaches the pick-up point.
                                              </p>
                                          </td>
                                      </tr>
      
                                     
                                      <tr>
                                          <td align="left" style="padding-top: 20px;">
                                              <table cellspacing="0" cellpadding="0" border="0" width="100%">
                                                  <tr>
                                                      <td width="80%" align="left" bgcolor="#eeeeee"
                                                          style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                          <strong>ID #${order.orderId}</strong>
                                                      </td>
                                                      <td width="10%" align="left" bgcolor="#eeeeee"
                                                          style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
      
                                                          <strong>Qty</strong>
                                                      </td>
                                                      <td width="10%" align="left" bgcolor="#eeeeee"
                                                          style="color: black; font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 10px;">
                                                          <strong>Amount(${currency})</strong>
                                                      </td>
                                                  </tr>
                                              </table>
                                          </td>
                                      </tr>
                                      ${products}
                                      ${detail}
                                      
      
                                  </table>
      
                              </td>
                          </tr>
      
                          ${emailFooter}
  
                      </table>
                  </td>
              </tr>
          </table>
      
      
      
      
      
      </body>
      
      </html>`;
    // const text = `Dear Customer, your ${order} has been Shipped
    //  If you did not request any order, then ignore this email.`;
    // await sendEmail(to, subject, text, true);
    await sendEmail(to, subject, text, true);
  };


module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendLoginEmail,
  sendOrderInProcessEmail,
  sendVerificationEmail,
  sendOrderShippedEmail,
  sendOrderConfimationEmail,
  emailTemplateCustomer,
  emailTemplateSeller,
  sendOrderCancelationEmail,

  customerEmailTemplate,
  sendEmailOrderConfimation,
  shippedEmailSendOrder,
  sendOrderCancelEmail,
  sellerEmailTemplate,
  sendEmailVerifemail,
  sendOrderDeliveredEmail
};
