// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prismadb";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { modelId, amount } = await req.json();

    // Fetch model details from db
    const model = await prisma.model.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    const pricePerMillionTokens = model.pricePerMillionTokens;
    const cost = (pricePerMillionTokens * amount) / 1000000;

    // Ensure the minimum charge is at least $0.50
    const minCharge = 0.5;
    const finalCost = Math.max(cost, minCharge);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${amount} Tokens`,
            },
            unit_amount: Math.round(finalCost * 100), // Stripe expects amount in cents
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

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
