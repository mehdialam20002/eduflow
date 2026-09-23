# Brief for 07-messaging-and-payment-costs.md

Title: Messaging and Payment Costs
Minimum words: 2800
Research files to read: _research/messaging-payments.md

## What this chapter must cover (every item, fully)

Every per-message and per-transaction cost. WhatsApp Cloud API pricing for India (current per-message model and categories: marketing, utility, authentication; free service window rules) with rupee rates, and rates for UAE, USA, Australia; MSG91 SMS price by volume plus DLT charges; Twilio SMS for USA/Australia plus US A2P 10DLC registration fees; Amazon SES email; push notifications (free). Payments: Razorpay standard fees by method (UPI, RuPay debit, cards, netbanking, wallets, international cards), settlement timelines, no setup fee; Stripe fees for USA, Australia and UAE; GST on gateway fees. Who pays: the canon pass-through rule (customer credits at Meta cost + 15%; gateway fees passed through at cost in Year 1). Worked examples: a 300-student school's monthly message bill; EduFlow's own OTP and demo messages; EduFlow's own subscription collections (1.5% of invoice with GST from the BRD). How to keep these costs down (utility vs marketing templates, WhatsApp first then SMS fallback, email for long content, UPI first, yearly plans to cut transaction count).

## Budget conventions for this guide

Use the three budget levels everywhere: **Minimum** (bare bootstrap: free tiers, founder does it himself, only what is legally or technically unavoidable), **Recommended** (equals the BRD plan in _anchors.md), **Maximum** (the sensible upper end; above it is waste). The standard cost table is: | Item | When to pay | Minimum | Recommended | Maximum | Can you avoid or reduce it? | (6 columns). Always say whether a price includes GST, whether it is one-time, monthly or yearly, and whether GST input tax credit can be claimed once the company is GST-registered.
