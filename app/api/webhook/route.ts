// app/api/webhooks/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import stripe from "@/lib/stripe";

const webhookSecret: string = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const buf = await req.text();
  const sig = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
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
      : 0;

    // Update user's token balance in your database
    // await prisma.userTokens.upsert({
    //   where: { userId_modelId: { userId, modelId } },
    //   update: { tokensLeft: { increment: amount } },
    //   create: { userId, modelId, tokensLeft: amount },
    // });

    // Record the purchase in your database
    // await prisma.purchase.create({
    //   data: {
    //     userId,
    //     modelId,
    //     amount,
    //     cost: session.amount_total ? session.amount_total / 100 : 0,
    //   },
    // });
  }

  return NextResponse.json({ received: true });
}
