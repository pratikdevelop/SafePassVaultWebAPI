// server.js
require("dotenv").config()
require("./model/conn")

const express = require("express");
const app = express();
const cors = require("cors");
const password = require("./routes/passwordRoutes")
const users = require("./routes/userRoutes")
const tagRoutes = require("./routes/tagRoutes")
const noteController = require('./routes/noteRoutes')
const proofIdsController = require('./routes/proofIdRoutes')
const cardControlller = require('./routes/cardRoutes')
const securityQuestionRoutes = require('./routes/securityQuestionRoutes')
const fileRoutes = require('./routes//fileRoutes')
const shareItemRoutes = require('./routes/shareItemRoutes')
const planRoutes = require('./routes/plan-routes')
const logRoutes = require('./routes/logRoutes')
const auth = require("./middleware")
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger')
const Plan = require('./model/plan')
const User = require('./model/user');
app.get("/",  (req, res) => {
  res.send("Hello World");
});
app.use(cors());
app.use(express.json());
app.use(auth);
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", users);
app.use("/api/passwords", password);
app.use("/api/tags", tagRoutes);
app.use("/api/notes",noteController);
app.use("/api/proofIds",proofIdsController);
app.use("/api/cards",cardControlller);
app.use('/api/security-questions', securityQuestionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/share', shareItemRoutes);
app.use('/api/plans',planRoutes);
app.use('/api/logs', logRoutes)


// const deletePlan = async()=>{
//   const plans = await Plan.deleteMany()
// }
// deletePlan().then((ee)=>{
//   console.log(ee)
// }).catch((err)=>{
//   console.log(err)
// })

// const plans = [
//   {
//     id: "P-683760842Y234025BM3WGQ6Y",
//     title: "Enterprise Plan (Yearly)",
//     amount: 100,
//     currency: "usd",
//     interval: "year",
//     intervalCount: 1,
//     features: [
//       {
//         icon: "📦",
//         text: "Store passwords, notes, cards, ID proofs",
//       },
//       {
//         icon: "🔐",
//         text: "Passwordless SSO Integration",
//       },
//       {
//         icon: "💾",
//         text: "10 GB Storage",
//       },
//       {
//         icon: "👥",
//         text: "Unlimited Organizations",
//       },
//       {
//         icon: "📧",
//         text: "Unlimited User Invitations",
//       },
//       {
//         icon: "🔑",
//         text: "Unlimited Password Shares",
//       },
//     ],
//     buttonLink: "/auth/signup",
//     buttonText: "Buy Now",
//     hasTrial: "true",
//     queryParams: {
//       plan: "enterprise",
//       action: "purchase",
//     },
//     trialLink: "/auth/signup",
//     trialQueryParams: {
//       plan: "enterprise",
//       action: "trial",
//     },
//   },
//   {
//     id: "P-959072281U895714BM3WGQCA",
//     title: "Enterprise Plan (Monthly)",
//     amount: 6,
//     currency: "usd",
//     interval: "month",
//     intervalCount: 1,
//     features: [
//       {
//         icon: "📦",
//         text: "Store passwords, notes, cards, ID proofs",
//       },
//       {
//         icon: "🔐",
//         text: "Passwordless SSO Integration",
//       },
//       {
//         icon: "💾",
//         text: "10 GB Storage",
//       },
//       {
//         icon: "👥",
//         text: "Unlimited Organizations",
//       },
//       {
//         icon: "📧",
//         text: "Unlimited User Invitations",
//       },
//       {
//         icon: "🔑",
//         text: "Unlimited Password Shares",
//       },
//     ],
//     buttonLink: "/auth/signup",
//     buttonText: "Buy Now",
//     hasTrial: "true",
//     queryParams: {
//       plan: "enterprise",
//       action: "purchase",
//     },
//     trialLink: "/auth/signup",
//     trialQueryParams: {
//       plan: "enterprise",
//       action: "trial",
//     },
//   },
  
//   {
//     id: "P-6XR17625JV867584NM3WGF7I",
//     title: "Premium Plan (yearly)",
//     amount: 60,
//     currency: "usd",
//     interval: "year",
//     intervalCount: 1,
//     features: [
//       {
//         icon: "💾",
//         text: "5 GB Storage",
//       },
//       {
//         icon: "📦",
//         text: "Store passwords, notes, cards, ID proofs",
//       },
//       {
//         icon: "👥",
//         text: "10 Organizations",
//       },
//       {
//         icon: "📧",
//         text: "100 User Invitations",
//       },
//       {
//         icon: "🔑",
//         text: "100 Shares",
//       },
//     ],
//     buttonLink: "/auth/signup",
//     buttonText: "Buy Now",
//     hasTrial: "true",
//     queryParams: {
//       plan: "premium",
//       action: "purchase",
//     },
//     trialLink: "/auth/signup",
//     trialQueryParams: {
//       plan: "premium",
//       action: "trial",
//     },
//   },
//   {
//     id: "P-5GV04444VF2894031M3VR2MY",
//     title: "Premium Plan (yearly)",
//     amount: 6,
//     currency: "usd",
//     interval: "month",
//     intervalCount: 1,
//    features: [
//       {
//         icon: "💾",
//         text: "5 GB Storage",
//       },
//       {
//         icon: "📦",
//         text: "Store passwords, notes, cards, ID proofs",
//       },
//       {
//         icon: "👥",
//         text: "10 Organizations",
//       },
//       {
//         icon: "📧",
//         text: "100 User Invitations",
//       },
//       {
//         icon: "🔑",
//         text: "100 Shares",
//       },
//     ],
//     buttonLink: "/auth/signup",
//     buttonText: "Buy Now",
//     hasTrial: "true",
//     queryParams: {
//       plan: "premium",
//       action: "purchase",
//     },
//     trialLink: "/auth/signup",
//     trialQueryParams: {
//       plan: "premium",
//       action: "trial",
//     },
//   },
//   {
//     id: "P-93233881XJ483274HM3WGPGA",
//     title: "Basic Plan (Yearly)",
//     amount: 40,
//     currency: "usd",
//     interval: "year",
//     intervalCount: 1,
//     features: [
//       {
//         icon: "💾",
//         text: "1 GB Storage",
//       },
//       {
//         icon: "📦",
//         text: "Store passwords, notes, cards, ID proofs",
//       },
//       {
//         icon: "👥",
//         text: "2 Organizations",
//       },
//       {
//         icon: "📧",
//         text: "15 User Invitations",
//       },
//       {
//         icon: "🔑",
//         text: "15 Shares",
//       },
//     ],
//     buttonLink: "/auth/signup",
//     buttonText: "Buy Now",
//     hasTrial: "true",
//     queryParams: {
//       plan: "basic",
//       action: "purchase",
//     },
//     trialLink: "/auth/signup",
//     trialQueryParams: {
//       plan: "basic",
//       action: "trial",
//     },
//   },
//   {
//     id: "P-85R761525X622673PM3WGOTQ",
//     title: "Basic Plan (Monthly)",
//     amount: 4,
//     currency: "usd",
//     interval: "month",
//     intervalCount: 1,
//     features: [
//       {
//         icon: "💾",
//         text: "1 GB Storage",
//       },
//       {
//         icon: "📦",
//         text: "Store passwords, notes, cards, ID proofs",
//       },
//       {
//         icon: "👥",
//         text: "2 Organizations",
//       },
//       {
//         icon: "📧",
//         text: "15 User Invitations",
//       },
//       {
//         icon: "🔑",
//         text: "15 Shares",
//       },
//     ],
//     buttonLink: "/auth/signup",
//     buttonText: "Buy Now",
//     hasTrial: "true",
//     queryParams: {
//       plan: "basic",
//       action: "purchase",
//     },
//     trialLink: "/auth/signup",
//     trialQueryParams: {
//       plan: "basic",
//       action: "trial",
//     },
//   },
// ];

// const createPlan = async (plan) => {
//   try {
//     const newPlan = new Plan({
//       paypalPlanId: plan.id,
//       planName: plan.title,
//       description: '', // Add description if needed
//       amount: plan.amount * 100, // Convert amount to cents
//       currency: plan.currency.toLowerCase(), // Ensure currency is lowercase
//       interval: plan.interval,
//       intervalCount: plan.intervalCount,
//       features: plan.features,
//       buttonLink: plan.buttonLink,
//       buttonText: plan.buttonText,
//       hasTrial: plan.hasTrial === "true", // Convert string to boolean
//       queryParams: plan.queryParams,
//       trialLink: plan.trialLink,
//       trialQueryParams: plan.trialQueryParams,
//     });

//     // Save the plan to the database
//     await newPlan.save();
//     console.log(`Plan ${plan.title} saved successfully!`);
//   } catch (error) {
//     console.error(`Error saving plan ${plan.title}:`, error);
//   }
// };

// plans.forEach(createPlan);




app.listen(3000, () => {
  console.log("Server started on port http://localhost:3000");
});
