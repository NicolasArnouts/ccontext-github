// lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_API_KEY) {
  throw new Error("STRIPE_API_KEY is not set in the environment variables");
}

const stripe = new Stripe(process.env.STRIPE_API_KEY, {
  apiVersion: "2024-12-18.acacia", // Use the latest API version
  typescript: true,
});

export default stripe;
