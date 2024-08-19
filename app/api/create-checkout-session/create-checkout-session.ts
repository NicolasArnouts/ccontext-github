// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { modelId, amount } = await req.json();

    // Fetch model details from your database
    // const model = await prisma.model.findUnique({ where: { id: modelId } });
    // if (!model) {
    //   return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    // }

    // For now, we'll use a placeholder price
    const pricePerMillionTokens = 10; // Replace with actual price from your model
    const cost = (pricePerMillionTokens * amount) / 1000000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${amount} Tokens`,
            },
            unit_amount: Math.round(cost * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/token-store?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/token-store`,
      metadata: {
        userId,
        modelId,
        amount,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
