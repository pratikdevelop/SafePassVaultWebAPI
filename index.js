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
const auth = require("./middleware")
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
app.use(cors());
app.use(express.json());
app.use(auth);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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

app.get("/", (req, res) => {
  res.send("Hello World");
});


/*const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'YOUR_KEY_ID',
  key_secret: 'YOUR_KEY_SECRET',
});

const plans = [
  {
      id: "price_1PuewBAE6VGXmCKJ4khInJVB",
      title: "Free Plan",
      amount: 0, // Amount in the smallest currency unit (e.g. 0 for free)
      currency: "sgd",
      interval: "month",
      intervalCount: 1,
      features: [
          "💾 500 MB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 1 Organization",
          "📧 5 User Invitations",
          "🔑 5 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Get Started",
      hasTrial: false,
      queryParams: {
          plan: "free",
          action: "signup"
      },
      trialQueryParams: {}
  },
  {
      id: "price_1PrG2IAE6VGXmCKJddKejt9t",
      title: "Enterprise Plan (Yearly)",
      amount: 6000, // Amount in cents (100 for $1, 6000 for $60)
      currency: "usd",
      interval: "year",
      intervalCount: 1,
      features: [
          "📦 Store passwords, notes, cards, ID proofs",
          "🔐 Passwordless SSO Integration",
          "💾 10 GB Storage",
          "👥 Unlimited Organizations",
          "📧 Unlimited User Invitations",
          "🔑 Unlimited Password Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "enterprise",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "enterprise",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2IAE6VGXmCKJliwsawTy",
      title: "Enterprise Plan (Monthly)",
      amount: 600, // Amount in cents (100 for $1, 600 for $6)
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      features: [
          "📦 Store passwords, notes, cards, ID proofs",
          "🔐 Passwordless SSO Integration",
          "💾 10 GB Storage",
          "👥 Unlimited Organizations",
          "📧 Unlimited User Invitations",
          "🔑 Unlimited Password Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "enterprise",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "enterprise",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2HAE6VGXmCKJ2fxRMDut",
      title: "Teams Plan (Yearly)",
      amount: 4000, // Amount in cents (100 for $1, 4000 for $40)
      currency: "usd",
      interval: "year",
      intervalCount: 1,
      features: [
          "💾 5 GB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 10 Organizations",
          "📧 100 User Invitations",
          "🔑 100 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "teams",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "teams",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2HAE6VGXmCKJQpyzJOgX",
      title: "Teams Plan (Monthly)",
      amount: 400, // Amount in cents (100 for $1, 400 for $4)
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      features: [
          "💾 5 GB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 10 Organizations",
          "📧 100 User Invitations",
          "🔑 100 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "teams",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "teams",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2GAE6VGXmCKJR7zcpPwa",
      title: "Premium Plan (Yearly)",
      amount: 10000, // Amount in cents (100 for $1, 10000 for $100)
      currency: "usd",
      interval: "year",
      intervalCount: 1,
      features: [
          "💾 2 GB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 5 Organizations",
          "📧 50 User Invitations",
          "🔑 50 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "premium",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "premium",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2FAE6VGXmCKJIIXKUlib",
      title: "Premium Plan (Monthly)",
      amount: 1000, // Amount in cents (100 for $1, 1000 for $10)
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      features: [
          "💾 2 GB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 5 Organizations",
          "📧 50 User Invitations",
          "🔑 50 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "premium",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "premium",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2FAE6VGXmCKJPSQa0fha",
      title: "Basic Plan (Yearly)",
      amount: 5000, // Amount in cents (100 for $1, 5000 for $50)
      currency: "usd",
      interval: "year",
      intervalCount: 1,
      features: [
          "💾 1 GB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 2 Organizations",
          "📧 15 User Invitations",
          "🔑 15 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "basic",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "basic",
          action: "trial"
      }
  },
  {
      id: "price_1PrG2EAE6VGXmCKJQ7uz1SAu",
      title: "Basic Plan (Monthly)",
      amount: 500, // Amount in cents (100 for $1, 500 for $5)
      currency: "usd",
      interval: "month",
      intervalCount: 1,
      features: [
          "💾 1 GB Storage",
          "📦 Store passwords, notes, cards, ID proofs",
          "👥 2 Organizations",
          "📧 15 User Invitations",
          "🔑 15 Shares"
      ],
      buttonLink: "/auth/signup",
      buttonText: "Buy Now",
      hasTrial: true,
      queryParams: {
          plan: "basic",
          action: "purchase"
      },
      trialLink: "/auth/signup",
      trialQueryParams: {
          plan: "basic",
          action: "trial"
      }
  }
];

// Function to create a subscription plan on Razorpay
const createPlan = async (plan) => {
  try {
    const createdPlan = await razorpay.plans.create({
      period: plan.interval, // 'weekly', 'monthly', 'yearly'
      interval: plan.intervalCount, // Number of intervals
      item: {
        name: plan.title,
        amount: plan.amount * 100, // Convert to paise
        currency: plan.currency,
        description: plan.description || plan.title, // Use title as description if not provided
      },
      metadata: {
        features: JSON.stringify(plan.features), // Store features as a string
        buttonLink: plan.buttonLink, // Link to the signup or buy page
        buttonText: plan.buttonText, // Text for the button
        hasTrial: plan.hasTrial ? 'Yes' : 'No', // Trial status
      },
    });
    console.log("Plan created successfully:", createdPlan);
  } catch (error) {
    console.error("Error creating plan:", error);
  }
};

plans.forEach(createPlan);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

async function createPlanWithFeatures(planDetails) {
  try {
      // Create a Stripe product for the plan
      const product = await stripe.products.create({
          id: planDetails.id, // Set your own ID for the product
          name: planDetails.title,
          description: planDetails.title + ' - subscription plan',
          metadata: {
              // Store the features as a JSON string in metadata
              features: JSON.stringify(planDetails.features),
          },
      });

      // Create a Stripe price for the product
      const price = await stripe.prices.create({
          product: product.id,
          unit_amount: planDetails.amount * 100, // Stripe works in the smallest currency unit (e.g. cents for USD)
          currency: planDetails.currency,
          recurring: {
              interval: planDetails.interval,
              interval_count: planDetails.intervalCount,
          },
          metadata: {
              buttonText: planDetails.buttonText,
              buttonLink: planDetails.buttonLink,
              hasTrial: planDetails.hasTrial,
              queryParams: JSON.stringify(planDetails.queryParams),
              trialQueryParams: JSON.stringify(planDetails.trialQueryParams),
          },
      });

      console.log(`Plan "${planDetails.title}" created successfully!`);
  } catch (error) {
      console.error('Error creating plan:', error);
  }
}


const plans = [
  {
      "id": "price_1PuewBAE6VGXmCKJ4khInJVB",
      "title": "Free Plan",
      "amount": 0,
      "currency": "sgd",
      "interval": "month",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "500 MB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "1 Organization"
          },
          {
              "icon": "📧",
              "text": "5 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "5 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Get Started",
      "hasTrial": "false",
      "queryParams": {
          "plan": "free",
          "action": "signup"
      },
      "trialQueryParams": {}
  },
  {
      "id": "price_1PrG2IAE6VGXmCKJddKejt9t",
      "title": "Enterprise Plan",
      "amount": 60,
      "currency": "usd",
      "interval": "year",
      "intervalCount": 1,
      "features": [
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "🔐",
              "text": "Passwordless SSO Integration"
          },
          {
              "icon": "💾",
              "text": "10 GB Storage"
          },
          {
              "icon": "👥",
              "text": "Unlimited Organizations"
          },
          {
              "icon": "📧",
              "text": "Unlimited User Invitations"
          },
          {
              "icon": "🔑",
              "text": "Unlimited Password Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "enterprise",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "enterprise",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2IAE6VGXmCKJliwsawTy",
      "title": "Enterprise Plan",
      "amount": 6,
      "currency": "usd",
      "interval": "month",
      "intervalCount": 1,
      "features": [
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "🔐",
              "text": "Passwordless SSO Integration"
          },
          {
              "icon": "💾",
              "text": "10 GB Storage"
          },
          {
              "icon": "👥",
              "text": "Unlimited Organizations"
          },
          {
              "icon": "📧",
              "text": "Unlimited User Invitations"
          },
          {
              "icon": "🔑",
              "text": "Unlimited Password Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "enterprise",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "enterprise",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2HAE6VGXmCKJ2fxRMDut",
      "title": "Teams Plan",
      "amount": 40,
      "currency": "usd",
      "interval": "year",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "5 GB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "10 Organizations"
          },
          {
              "icon": "📧",
              "text": "100 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "100 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "teams",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "teams",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2HAE6VGXmCKJQpyzJOgX",
      "title": "Teams Plan",
      "amount": 4,
      "currency": "usd",
      "interval": "month",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "5 GB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "10 Organizations"
          },
          {
              "icon": "📧",
              "text": "100 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "100 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "teams",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "teams",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2GAE6VGXmCKJR7zcpPwa",
      "title": "Premium Plan",
      "amount": 100,
      "currency": "usd",
      "interval": "year",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "2 GB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "5 Organizations"
          },
          {
              "icon": "📧",
              "text": "50 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "50 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "premium",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "premium",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2FAE6VGXmCKJIIXKUlib",
      "title": "Premium Plan",
      "amount": 10,
      "currency": "usd",
      "interval": "month",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "2 GB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "5 Organizations"
          },
          {
              "icon": "📧",
              "text": "50 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "50 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "premium",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "premium",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2FAE6VGXmCKJPSQa0fha",
      "title": "Basic Plan",
      "amount": 50,
      "currency": "usd",
      "interval": "year",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "1 GB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "2 Organizations"
          },
          {
              "icon": "📧",
              "text": "15 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "15 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "basic",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "basic",
          "action": "trial"
      }
  },
  {
      "id": "price_1PrG2EAE6VGXmCKJQ7uz1SAu",
      "title": "Basic Plan",
      "amount": 5,
      "currency": "usd",
      "interval": "month",
      "intervalCount": 1,
      "features": [
          {
              "icon": "💾",
              "text": "1 GB Storage"
          },
          {
              "icon": "📦",
              "text": "Store passwords, notes, cards, ID proofs"
          },
          {
              "icon": "👥",
              "text": "2 Organizations"
          },
          {
              "icon": "📧",
              "text": "15 User Invitations"
          },
          {
              "icon": "🔑",
              "text": "15 Shares"
          }
      ],
      "buttonLink": "/auth/signup",
      "buttonText": "Buy Now",
      "hasTrial": "true",
      "queryParams": {
          "plan": "basic",
          "action": "purchase"
      },
      "trialLink": "/auth/signup",
      "trialQueryParams": {
          "plan": "basic",
          "action": "trial"
      }
  }
]

// [
//   {
//       "id": "price_1PuewBAE6VGXmCKJ4khInJVB",
//       "title": "Free Plan",
//       "amount": 0,
//       "currency": "sgd",
//       "interval": "month",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "500 MB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "1 Organization"
//           },
//           {
//               "icon": "📧",
//               "text": "5 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "5 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Get Started",
//       "hasTrial": "false",
//       "queryParams": {
//           "plan": "free",
//           "action": "signup"
//       },
//       "trialQueryParams": {}
//   },
//   {
//       "id": "price_1PrG2IAE6VGXmCKJddKejt9t",
//       "title": "Enterprise Plan",
//       "amount": 60,
//       "currency": "usd",
//       "interval": "year",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "🔐",
//               "text": "Passwordless SSO Integration"
//           },
//           {
//               "icon": "💾",
//               "text": "10 GB Storage"
//           },
//           {
//               "icon": "👥",
//               "text": "Unlimited Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "Unlimited User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "Unlimited Password Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "enterprise",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "enterprise",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2IAE6VGXmCKJliwsawTy",
//       "title": "Enterprise Plan",
//       "amount": 6,
//       "currency": "usd",
//       "interval": "month",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "🔐",
//               "text": "Passwordless SSO Integration"
//           },
//           {
//               "icon": "💾",
//               "text": "10 GB Storage"
//           },
//           {
//               "icon": "👥",
//               "text": "Unlimited Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "Unlimited User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "Unlimited Password Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "enterprise",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "enterprise",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2HAE6VGXmCKJ2fxRMDut",
//       "title": "Teams Plan",
//       "amount": 40,
//       "currency": "usd",
//       "interval": "year",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "5 GB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "10 Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "100 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "100 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "teams",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "teams",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2HAE6VGXmCKJQpyzJOgX",
//       "title": "Teams Plan",
//       "amount": 4,
//       "currency": "usd",
//       "interval": "month",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "5 GB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "10 Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "100 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "100 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "teams",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "teams",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2GAE6VGXmCKJR7zcpPwa",
//       "title": "Premium Plan",
//       "amount": 100,
//       "currency": "usd",
//       "interval": "year",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "2 GB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "5 Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "50 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "50 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "premium",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "premium",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2FAE6VGXmCKJIIXKUlib",
//       "title": "Premium Plan",
//       "amount": 10,
//       "currency": "usd",
//       "interval": "month",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "2 GB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "5 Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "50 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "50 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "premium",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "premium",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2FAE6VGXmCKJPSQa0fha",
//       "title": "Basic Plan",
//       "amount": 50,
//       "currency": "usd",
//       "interval": "year",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "1 GB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "2 Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "15 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "15 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "basic",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "basic",
//           "action": "trial"
//       }
//   },
//   {
//       "id": "price_1PrG2EAE6VGXmCKJQ7uz1SAu",
//       "title": "Basic Plan",
//       "amount": 5,
//       "currency": "usd",
//       "interval": "month",
//       "intervalCount": 1,
//       "features": [
//           {
//               "icon": "💾",
//               "text": "1 GB Storage"
//           },
//           {
//               "icon": "📦",
//               "text": "Store passwords, notes, cards, ID proofs"
//           },
//           {
//               "icon": "👥",
//               "text": "2 Organizations"
//           },
//           {
//               "icon": "📧",
//               "text": "15 User Invitations"
//           },
//           {
//               "icon": "🔑",
//               "text": "15 Shares"
//           }
//       ],
//       "buttonLink": "/auth/signup",
//       "buttonText": "Buy Now",
//       "hasTrial": "true",
//       "queryParams": {
//           "plan": "basic",
//           "action": "purchase"
//       },
//       "trialLink": "/auth/signup",
//       "trialQueryParams": {
//           "plan": "basic",
//           "action": "trial"
//       }
//   }
// ];

plans.forEach(createPlanWithFeatures);

*/

app.listen(3000, () => {
  console.log("Server started on port http://localhost:3000");
});
