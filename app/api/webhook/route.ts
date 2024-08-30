import { NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prismadb";
import Stripe from "stripe";

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Retrieve the session metadata
    const userId = session.metadata?.userId;
    const modelId = session.metadata?.modelId;
    const amount = session.metadata?.amount
      ? parseInt(session.metadata.amount)
      : undefined;

    // Check if any required metadata is missing
    if (!userId || !modelId || amount === undefined) {
      console.error("Missing required metadata in session", session.metadata);
      return NextResponse.json(
        { error: "Missing required metadata in session" },
        { status: 400 }
      );
    }

    try {
      // Update user's token balance in your database
      await prisma.userTokens.upsert({
        where: { userId_modelId: { userId, modelId } },
        update: { tokensLeft: { increment: amount } },
        create: { userId, modelId, tokensLeft: amount },
      });

      // Record the purchase in your database
      await prisma.purchase.create({
        data: {
          userId,
          modelId,
          amount,
          cost: session.amount_total ? session.amount_total / 100 : 0,
        },
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Error processing webhook" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
