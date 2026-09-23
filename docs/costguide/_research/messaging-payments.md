# Messaging and Payment Prices for India, UAE, USA and Australia (checked 21 September 2026)

Scope: what EduFlow pays to send WhatsApp, SMS, email and push messages, and to collect money (its own subscriptions and schools' fee payments), in India (Phase 1) and UAE, USA, Australia (Phase 2).
Conversion: US$1 = Rs 85, A$1 = Rs 56, AED 1 = Rs 23. "Rs" figures are rounded. "+GST" means Indian GST (18%) is added on top of the listed price. GST paid on vendor fees is normally claimable as input tax credit once EduFlow is GST-registered.
Status: **Verified** = the price was read on the vendor or government page itself (WebFetch, 21 Sep 2026). **Estimate** = from a secondary source (cross-checked where possible) or reasoned. The source codes [S1] to [S38] are listed at the end.

## 1. WhatsApp Business Platform (Meta Cloud API, direct, no BSP)

### 1a. Pricing rules (apply in every country)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Billing model | Meta, Cloud API | Per delivered template message, by category and recipient's country code (since 1 Jul 2025) | n/a | per message | Only delivered messages are billed | Verified | S1 |
| Service messages (free-form replies) until 30 Sep 2026 | Meta | Free | Rs 0 | per message | Inside the 24-hour customer service window (CSW) that opens when the user messages you | Verified | S1, S2 |
| Utility templates inside the CSW until 30 Sep 2026 | Meta | Free | Rs 0 | per message | "Free until October 1, 2026" | Verified | S2 |
| Service messages and in-window utility templates **from 1 Oct 2026** | Meta | Charged at the market's utility/authentication rate | India Rs 0.115 | per message | Change confirmed on Meta's page | Verified | S2 |
| Free allowance for service messages from 1 Oct 2026 | Meta | 1,000 free service messages per business phone number per month | Rs 0 | per number per month | Resets monthly, no rollover. Stated by several Meta partners; not found on Meta's page | Estimate | S7, S8, S4 |
| Payment method deadline | Meta | Payment method on file by 30 Sep 2026, or service messages stop being delivered from 1 Oct 2026 | n/a | one time | Reported by partners; applies to directly integrated businesses | Estimate | S7, S4 |
| Free entry point (FEP) window | Meta | All messages free for 72 hours | Rs 0 | per conversation | Opens when you reply within 24 h to a user who came from a Click-to-WhatsApp ad or Page CTA. Unchanged after 1 Oct 2026 | Verified | S1, S2 |
| Volume tiers | Meta | Lower utility and authentication rates at higher monthly volume, per market | varies | per month | Counted across the whole business portfolio; reset monthly; only charged messages count. Marketing has no volume tiers (partner claim) | Verified (tiers) / Estimate (marketing) | S1, S9 |
| Meta Business Agent (AI agent) | Meta | US$2.00 per 1M tokens (from 1 Aug 2026) | Rs 170 per 1M tokens | tokens | Meta says about 4 to 5 US cents per message (Rs 3.40 to 4.25) | Verified | S2 |
| India billing currency | Meta | INR billing for India from 1 Jan 2026; migrate by 31 Dec 2026 | n/a | n/a | Indian businesses pay in rupees | Verified | S1 |
| GST on Meta charges (India) | Meta | 18% GST on top of Meta's rate | Rs 0.8631 becomes Rs 1.02 | per message | Claimable as input credit | Estimate | S4 |
| Business verification | Meta Business portfolio | Free (no fee listed) | Rs 0 | one time | Needs proof the business is registered (in India: certificate of incorporation, GST certificate; utility bill for address/phone) plus domain or email proof. Required to scale beyond 250/day. "Meta Verified for Business" is a separate, optional paid subscription | Estimate | S3, S38 |
| Messaging limit before verification | Meta | 250 unique users per 24 h (business-initiated) | n/a | per day | Shared by all numbers in the portfolio | Verified | S3 |
| Messaging limit after verification | Meta | 2,000, then 10,000, 100,000, unlimited | n/a | per day | 2,000 reached by verification, partner-led verification, or 2,000 high-quality delivered messages in 30 days. Next steps need 50% use in 7 days and good quality | Verified | S3 |

### 1b. Per-message rates (list price, before GST/VAT, tier 1)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| India, marketing | Meta, INR rate card from 1 Jul 2026 | Rs 0.8631 (US$0.0118) | Rs 0.86 (Rs 1.02 with GST) | per delivered message | Raised about 10% on 1 Jan 2026 (from Rs 0.7846) | Estimate | S4, S6, S9 |
| India, utility | Meta, INR | Rs 0.115 (US$0.0014) | Rs 0.12 (Rs 0.14 with GST) | per delivered message | Free inside CSW until 30 Sep 2026; charged from 1 Oct 2026 | Estimate | S4, S6 |
| India, authentication (OTP) | Meta, INR | Rs 0.115 (US$0.0014) | Rs 0.12 | per delivered message | Cheaper than any SMS slab (Rs 0.13 to 0.25) | Estimate | S4, S6 |
| India, authentication-international | Meta, INR | Rs 2.4971 (US$0.0304) | Rs 2.50 | per delivered message | Only for businesses outside India sending OTPs to Indian numbers; not EduFlow's case | Estimate | S4, S6 |
| India, service (from 1 Oct 2026) | Meta, INR | Rs 0.115 after 1,000 free per number per month | Rs 0.12 | per message | No volume discount on service (partner claim) | Estimate | S4 |
| UAE, marketing | Meta, USD | US$0.0499 to 30 Sep 2026; US$0.0576 from 1 Oct 2026 (+15.4%) | Rs 4.24; Rs 4.90 | per delivered message | UAE is in Meta's Oct 2026 marketing increase list | Estimate | S6, S8, S5 |
| UAE, utility and authentication | Meta, USD | US$0.0157 | Rs 1.33 | per delivered message | Same rate used for service messages from 1 Oct 2026 | Estimate | S6, S7, S5 |
| UAE, authentication-international | Meta, USD | US$0.0510 | Rs 4.34 | per delivered message | UAE has a separate international OTP rate; applies when the sender is a non-UAE business | Estimate | S6, S5 |
| USA (North America), marketing | Meta, USD | US$0.0250 | Rs 2.13 | per delivered message | Same for Canada | Estimate | S6, S9, S5 |
| USA (North America), utility and authentication | Meta, USD | US$0.0034 | Rs 0.29 | per delivered message | WhatsApp use in the USA is low; SMS/email usually needed anyway | Estimate | S6, S9, S7 |
| Australia (Rest of Asia Pacific), marketing | Meta, USD | US$0.0842 from 1 Oct 2026 | Rs 7.16 | per delivered message | Rest of Asia Pacific is in the Oct 2026 increase list. One site shows US$0.0705 (conflict) | Estimate | S5, S10 |
| Australia (Rest of Asia Pacific), utility and authentication | Meta, USD | US$0.0113 | Rs 0.96 | per delivered message | Also the service-message rate from 1 Oct 2026 | Estimate | S5, S7 |

## 2. SMS

### 2a. India: MSG91 (DLT-compliant transactional and OTP SMS)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| 5,000 SMS pack | MSG91, India to India | Rs 0.25 per SMS (Rs 1,250 total) | Rs 0.25 | per SMS | +18% GST. Smallest listed pack | Verified | S11 |
| 16,500 SMS | MSG91 | Rs 0.20 per SMS (Rs 3,300) | Rs 0.20 | per SMS | +GST | Verified | S11 |
| 30,000 SMS | MSG91 | Rs 0.18 per SMS (Rs 5,400) | Rs 0.18 | per SMS | +GST. This is the plan's Rs 0.18 cost | Verified | S11 |
| 60,000 to 4,50,000 SMS | MSG91 | Rs 0.17 per SMS (Rs 10,200 for 60,000; Rs 76,500 for 4,50,000) | Rs 0.17 | per SMS | +GST | Verified | S11 |
| 9,62,500 SMS | MSG91 | Rs 0.16 per SMS (Rs 1,54,000) | Rs 0.16 | per SMS | +GST | Verified | S11 |
| Negotiated enterprise rate | MSG91 | "up to Rs 0.13 per SMS" | Rs 0.13 | per SMS | On request, high volume | Verified | S11 |
| Platform or monthly fee | MSG91 | None listed | Rs 0 | per month | Prepaid wallet; validity and DLT scrubbing treatment not stated on the page | Verified (none listed) | S11 |

### 2b. India: TRAI DLT registration (needed before any business SMS)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Principal Entity registration, Vodafone Idea (Vilpower) | Vi DLT portal | Rs 5,000, non-refundable | Rs 5,000 (Rs 5,900 if 18% GST is added; FAQ does not say) | one time | Renewal due after 5 years; renewal fee "decided later". Payment online or NEFT | Verified | S12 |
| Principal Entity registration, Jio (TrueConnect) | Jio DLT portal | Rs 5,900 incl. GST | Rs 5,900 | one time | Reported as 1-year validity; portal page did not load | Estimate | S13 |
| Principal Entity registration, Airtel (DLTConnect) | Airtel DLT portal | about Rs 5,900 incl. GST | Rs 5,900 | one time | Portal not opened | Estimate | S13 |
| Principal Entity registration, BSNL | BSNL DLT portal | Rs 5,900 incl. GST | Rs 5,900 | one time | Portal not opened | Estimate | S13 |
| Principal Entity registration, Tata Tele | Tata DLT portal | Rs 5,000 + 18% GST | Rs 5,900 | one time | Portal not opened | Estimate | S13 |
| How many operators | TRAI DLT | Register on **one** operator portal | n/a | n/a | Entity data is shared across operator DLT platforms; pick the cheapest/longest-validity portal (Vi: 5 years) | Estimate | S13 |
| Header (sender ID) registration | Operator DLT | No fee listed on Vi FAQ | Rs 0 | per header | Some operators bundle a few headers; others may charge | Estimate | S12, S13 |
| Content template registration | Operator DLT | No fee listed on Vi FAQ | Rs 0 | per template | Historically free on most portals | Estimate | S12, S13 |
| Telemarketer registration (not needed) | Vi DLT | Rs 5,000 + Rs 50,000 refundable deposit (delivery function) | Rs 55,000 | one time | Only for SMS aggregators; MSG91 is the telemarketer, so EduFlow skips this | Verified | S12 |
| DLT scrubbing charge | Operators (BSNL example) | 2 paise per SMS (private companies, below 10 crore SMS; cut from 2.1 paise in July 2021); 1 paisa for PSUs | Rs 0.02 | per SMS | Industry figure 2 to 2.5 paise. Normally bundled into the aggregator's per-SMS price, not billed to the business separately | Estimate | S14, S13 |

### 2c. International SMS: Twilio

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| USA outbound SMS (10DLC long code, toll-free or short code) | Twilio pay-as-you-go | US$0.0083 | Rs 0.71 | per segment | Inbound also US$0.0083. Plus carrier fees below | Verified | S15 |
| USA carrier fee, AT&T | Twilio (pass-through) | US$0.0035 | Rs 0.30 | per outbound segment | Carrier fees change often; recheck before US launch | Verified | S15 |
| USA carrier fee, T-Mobile | Twilio | US$0.0045 | Rs 0.38 | per outbound segment | | Verified | S15 |
| USA carrier fee, Verizon | Twilio | US$0.0045 | Rs 0.38 | per outbound segment | | Verified | S15 |
| USA carrier fee, US Cellular | Twilio | US$0.005 | Rs 0.43 | per outbound segment | All-in US SMS is about US$0.012 (Rs 1.06) per segment | Verified | S15 |
| USA long-code number | Twilio | US$1.15 | Rs 98 | per month | Toll-free number US$2.15 (Rs 183) | Verified | S15 |
| Failed-message fee | Twilio (US, AU) | US$0.001 | Rs 0.09 | per failed message | | Verified | S15, S16 |
| A2P 10DLC brand, Sole Proprietor or Low-Volume Standard | Twilio / The Campaign Registry | US$4.50 | Rs 383 | one time | Standard and Low-Volume brands need a tax ID; Twilio accepts "equivalent in other countries" (so an Indian company can register) | Estimate (fee) / Verified (tax ID rule) | S19, S18 |
| A2P 10DLC Standard brand incl. secondary vetting | Twilio | US$46 | Rs 3,910 | one time | Needed once traffic outgrows the low-volume brand | Estimate | S19 |
| A2P 10DLC campaign vetting | Twilio | US$15 | Rs 1,275 | per campaign, one time | Resubmission fee reported removed in 2026 | Estimate | S19 |
| A2P 10DLC campaign monthly fee | Twilio | US$10 (standard); US$1.50 (low-volume mixed); US$2 (sole proprietor) | Rs 850; Rs 128; Rs 170 | per campaign per month | Unregistered 10DLC traffic is blocked by US carriers | Estimate | S19 |
| Australia outbound SMS | Twilio pay-as-you-go | US$0.0515 | Rs 4.38 | per segment | About 17 times the India SMS price. Inbound US$0.0075 (Rs 0.64); MMS US$0.35 | Verified | S16 |
| Australia mobile number | Twilio | US$8.25 | Rs 701 | per month | Alphanumeric sender ID is free to use | Verified | S16 |
| Australia SMS Sender ID Register | ACMA (government) | Registration required from 1 Jul 2026 | n/a | per sender ID | Unregistered branded sender IDs show as "Unverified". Registration uses ABN/ABR details; foreign-entity path and fee not confirmed | Estimate | S20 |
| UAE outbound SMS | Twilio pay-as-you-go | US$0.1176 | Rs 10.00 | per message | Domestic and alphanumeric sender ID pricing only through Twilio sales. WhatsApp utility (Rs 1.33) is far cheaper in the UAE | Verified | S17 |

## 3. Email and push

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Outbound email, a la carte | Amazon SES | US$0.10 per 1,000 | Rs 8.50 per 1,000 | per 1,000 emails | Cheapest option; no monthly fee. +18% GST when billed by AWS India | Verified | S21 |
| Outbound email, Essentials plan | Amazon SES | US$0.16 per 1,000 (0 to 10M a month) | Rs 13.60 per 1,000 | per 1,000 emails | **New SES accounts start on Essentials from 21 Jul 2026**; you can switch to a la carte at any time | Verified | S21 |
| Outbound email, Pro plan | Amazon SES | US$0.22 per 1,000 + US$105 a month | Rs 18.70 per 1,000 + Rs 8,925 a month | per 1,000 / month | Not needed at EduFlow's scale | Verified | S21 |
| Outbound email, Enterprise plan | Amazon SES | US$0.23 per 1,000 + US$500 a month | Rs 19.55 per 1,000 + Rs 42,500 a month | per 1,000 / month | Not needed | Verified | S21 |
| Inbound email | Amazon SES | US$0.10 per 1,000 | Rs 8.50 per 1,000 | per 1,000 emails | | Verified | S21 |
| Attachment data | Amazon SES | US$0.12 per GB | Rs 10.20 | per GB sent | Send PDF links (S3 pre-signed URLs) instead of attachments | Verified | S21 |
| Standard dedicated IP | Amazon SES | US$24.95 | Rs 2,121 | per IP per month | Not needed below about 1 lakh emails a day | Verified | S21 |
| SES free tier | AWS Free Tier | Up to US$200 credits, 6 months, new AWS customers | Rs 17,000 | one time | The older "3,000 free emails a month" allowance is not on the page | Verified | S21 |
| Push notifications | Firebase Cloud Messaging | Free ("No-cost") on Spark and Blaze | Rs 0 | unlimited | Best channel for the parent app | Verified | S22 |
| SMS OTP via Firebase Phone Auth | Firebase / Google Cloud Identity Platform | Billed per SMS by country; no free daily quota shown | varies | per SMS | Use MSG91 or WhatsApp OTP in India instead | Verified (no free quota) | S22 |

## 4. India payment gateways

### 4a. Razorpay (standard plan)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| UPI (bank-to-bank) | Razorpay Standard | "Zero MDR, 2% platform fee applies" | 2% (2.36% with GST) | per transaction | **UPI is not free on the standard plan** | Verified | S23 |
| RuPay debit card | Razorpay Standard | "Zero MDR, 2% platform fee applies" | 2% (2.36% with GST) | per transaction | | Verified | S23 |
| Visa, Mastercard, Amex, Diners debit and credit cards | Razorpay Standard | 2% platform fee | 2% (2.36% with GST) | per transaction | | Verified | S23 |
| Netbanking, wallets, Pay Later, EMI (cards) | Razorpay Standard | 2% platform fee | 2% (2.36% with GST) | per transaction | | Verified | S23 |
| RuPay credit card on UPI | Razorpay Standard | 2% platform fee | 2% (2.36% with GST) | per transaction | | Verified | S23 |
| Corporate or business cards | Razorpay Standard | 2.15% | 2.15% (2.54% with GST) | per transaction | | Verified | S23 |
| International cards | Razorpay Standard | "Up to 3%" | up to 3% (3.54% with GST) | per transaction | For foreign parents paying Indian schools | Verified | S23 |
| GST on fees | Razorpay | 18% on the platform fee | +0.36 points on a 2% fee | per transaction | Input credit claimable by a GST-registered business | Verified | S23 |
| Setup fee, AMC, refund processing | Razorpay Standard | Rs 0 | Rs 0 | one time / yearly | | Verified | S23 |
| Settlement | Razorpay | T+1, or instant settlement (separately priced add-on) | n/a | per settlement | | Verified | S23 |
| Subscriptions (card recurring) | Razorpay Subscriptions | 0.9% + platform fee | 2.9% (3.42% with GST) | per transaction | UPI AutoPay and e-mandate pricing "on request" | Verified | S23 |
| Payment Links, Payment Pages, Buttons, Invoices | Razorpay | Included at the gateway rate | 2% | per transaction | One page view listed Payment Pages/Buttons at 0.2% + gateway fee; recheck before use | Verified (included) / Estimate (0.2%) | S23 |
| UPI QR codes | Razorpay | 0.99% | 0.99% | per transaction | Cheaper than the 2% checkout route for UPI | Verified | S23 |
| Smart Collect (virtual accounts, NEFT/IMPS) | Razorpay | 1% or Rs 10, whichever is lower | max Rs 10 | per transaction | Good for large school fees paid by bank transfer | Verified | S23 |
| Route (split payments to institutes) | Razorpay Route | 0.1% + platform fee | 2.1% | per transaction | Relevant if EduFlow collects fees and splits them to schools (marketplace model) | Verified | S23 |
| Instant refunds | Razorpay | Rs 7.99 to Rs 14.99 | Rs 8 to 15 | per refund | Normal refunds free | Verified | S23 |
| Enterprise (negotiated) pricing | Razorpay | "Contact sales" | lower than 2% | per transaction | Offered above Rs 5 lakh a month of volume | Verified | S23 |

### 4b. Cashfree, PayU and PhonePe PG (comparison)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| UPI, RuPay/Visa/Mastercard debit, credit cards, netbanking, wallets | Cashfree PG standard | 1.95% platform fee | 1.95% (2.30% with GST) | per transaction | | Verified | S24 |
| New-merchant offer | Cashfree PG | 0% platform fee on the first Rs 20,00,000 GMV | Rs 0 (saves up to Rs 39,000 + GST) | per merchant | Sign-up on or after 21 Jul 2026; ends 31 Mar 2027; excludes Amex, Diners, corporate cards, EMI, prepaid, Pay Later | Verified | S24 |
| Amex and Diners | Cashfree PG | 2.95% | 2.95% | per transaction | | Verified | S24 |
| International cards | Cashfree PG | 2.99% | 2.99% | per transaction | | Verified | S24 |
| Pay Later | Cashfree PG | 2.20% to 2.50% | 2.2% to 2.5% | per transaction | Cardless EMI +1.90% | Verified | S24 |
| Instant settlement | Cashfree PG | 0.30% | 0.30% | per transaction | Standard settlement T+1 by 8 pm IST; setup fee Rs 0 | Verified | S24 |
| UPI AutoPay mandate | Cashfree Subscriptions | Rs 7.50 + Rs 5 (debits under Rs 1,000); Rs 7.50 + Rs 15 (Rs 1,000 and above) | Rs 12.50 to 22.50 | per mandate + per debit | Flat fee; far cheaper than 2% on a Rs 2,949 monthly plan | Verified | S24 |
| eNACH mandate | Cashfree Subscriptions | Rs 7.50 + Rs 7.50 | Rs 15 | per mandate + per debit | | Verified | S24 |
| Payment links and forms | Cashfree | Included with PG | 1.95% | per transaction | | Verified | S24 |
| Domestic cards, netbanking, BNPL, wallets | PayU standard | 2% | 2% (2.36% with GST) | per transaction | No setup, onboarding or annual fee | Verified | S25 |
| Amex, Diners, EMI, international | PayU standard | 3% | 3% | per transaction | | Verified | S25 |
| Merchant UPI | PayU | "Varies by business type and volume" | n/a | per transaction | Settlement T+2; 18% GST on fees | Verified | S25 |
| Standard rate (all methods) | PhonePe PG | 1.99% | 1.99% | per transaction | Zero setup and AMC. "Super Savings Offer" with T&C; method-wise rates not published | Verified | S26 |
| Limited-time free offer | PhonePe PG | Standard plan "currently free for a limited time" | Rs 0 | per transaction | Limit and end date not published | Estimate | S26 |

### 4c. UPI and debit MDR rules (government and NPCI)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| UPI P2M up to Rs 2,000 | NPCI rule | 0% MDR | Rs 0 | per transaction | Unchanged | Verified | S35 |
| UPI P2M above Rs 2,000 | NPCI rule, **from 15 Oct 2026** | 0.4% MDR | Rs 12 on Rs 3,000; Rs 200 on Rs 50,000 | per transaction | Paid by the merchant to its acquirer | Verified | S35 |
| UPI P2M Rs 75,000 and above | NPCI rule | Cap Rs 300 | Rs 300 | per transaction | | Verified | S35 |
| Education fee collections above Rs 2,000 | NPCI "Industry program" category | "Flat-fee structures or capped processing rates" | not yet published | per transaction | Up to Rs 2,000 stays free | Verified (rule) / rate unknown | S35 |
| UPI AutoPay (mandates) | NPCI rule | No prescribed MDR | Rs 0 MDR | per debit | PG mandate fees (for example Cashfree Rs 7.50 + Rs 5 or 15) still apply | Verified | S35 |
| Passing UPI MDR to the payer | NPCI rule | Not allowed | n/a | n/a | "Merchants on-boarded cannot pass on MDR charges to customers" on UPI | Verified | S35 |
| Small merchants (P2PM, up to Rs 1 lakh a month via UPI QR) | NPCI rule | 0% MDR | Rs 0 | per transaction | Most schools and institutes collecting fees will be above this | Verified | S35 |
| RuPay credit card on UPI | NPCI rule | Card MDR rules, not the UPI rule | card rates | per transaction | | Verified | S35 |
| RuPay debit card and UPI up to Rs 2,000 | Finance Ministry notification (14 Sep 2026) | No charge may be imposed | Rs 0 | per transaction | Notification itself not opened | Estimate | S36 |
| Debit card MDR (other networks) | RBI rule as shown by Stripe India | 0.4% capped at Rs 200 | max Rs 200 | per transaction | NPCI says debit MDRs are capped at up to 0.90% | Verified (as displayed) | S29, S35 |
| PG platform fee on UPI | Razorpay, Cashfree, PhonePe | 1.95% to 2% on top of any MDR | 1.95% to 2% | per transaction | NPCI bars UPI **apps** from charging consumers a platform fee; this does not stop PGs charging merchants | Verified | S23, S24, S35 |

## 5. International payments: Stripe and merchant-of-record services

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Stripe for Indian-registered businesses | Stripe India | Invite-only since May 2024; new Indian businesses cannot sign up on the website | n/a | n/a | Only "a select number of businesses" focused on exports; existing accounts continue. Video KYC for new users from 1 Jan 2026 (secondary report) | Verified (invite-only) / Estimate (KYC) | S30, S29 |
| Stripe India domestic cards | Stripe India | 2% | 2% | per transaction | | Verified | S29 |
| Stripe India international cards | Stripe India | 3% (Amex 3.5%); 4.3% with USD presentment; +2% if currency conversion | 3% to 6.3% | per transaction | | Verified | S29 |
| US entity to use Stripe US | Stripe Atlas | US$500 setup; US$100 a year registered agent after year 1 | Rs 42,500; Rs 8,500 a year | one time / yearly | Plus US tax filings and bookkeeping (not included) | Verified | S31 |
| USA domestic cards | Stripe US standard | 2.9% + US$0.30 | 2.9% + Rs 25.50 | per transaction | On a US$79 Growth plan: US$2.59 = 3.28% (Rs 220) | Estimate (Stripe US page redirects to India from an Indian IP) | S37 |
| USA international cards | Stripe US | +1.5% | +1.5% | per transaction | | Estimate | S37 |
| USA currency conversion | Stripe US | +1% | +1% | per transaction | | Estimate | S37 |
| USA ACH Direct Debit | Stripe US | 0.8%, cap US$5 | cap Rs 425 | per transaction | Good for school yearly contracts | Estimate | S37 |
| USA disputes | Stripe US | US$15 received + US$15 if countered (refunded if won) | Rs 1,275 + Rs 1,275 | per dispute | | Estimate | S37 |
| Australia domestic cards | Stripe AU standard | 1.7% + A$0.30 ("lower pricing from 1 Oct 2026") | 1.7% + Rs 16.80 | per transaction | Includes GST. On A$119: A$2.32 = 1.95% (Rs 130) | Verified | S27 |
| Australia international cards | Stripe AU | 3.5% + A$0.30 ("lower pricing from 1 Apr 2027") | 3.5% + Rs 16.80 | per transaction | +2% if currency conversion; includes GST | Verified | S27 |
| Australia BECS Direct Debit and PayTo | Stripe AU | 1% + A$0.30, cap A$3.50 | cap Rs 196 | per transaction | Includes GST | Verified | S27 |
| Australia disputes | Stripe AU | A$25 received + A$25 countered | Rs 1,400 + Rs 1,400 | per dispute | | Verified | S27 |
| UAE domestic cards | Stripe UAE standard | 2.9% + AED 1.00 | 2.9% + Rs 23 | per transaction | On AED 299: AED 9.67 = 3.23% (Rs 222). VAT treatment not stated | Verified | S28 |
| UAE international cards and conversion | Stripe UAE | +1% international; +1% conversion | +1% each | per transaction | | Verified | S28 |
| UAE disputes | Stripe UAE | AED 60 received + AED 60 countered | Rs 1,380 + Rs 1,380 | per dispute | Smart Disputes win fee 30% of the amount | Verified | S28 |
| Stripe Billing (subscriptions) | Stripe (US, AU, UAE) | 0.7% of Billing volume, pay-as-you-go | 0.7% | per transaction | Monthly plans from A$930 or AED 2,200 on a 1-year contract (not needed) | Verified (AU, UAE) / Estimate (US) | S27, S28, S37 |
| Stripe Tax Basic | Stripe (US, AU, UAE) | 0.5% per transaction where registered (no-code); UAE API option AED 2.00 per transaction incl. 10 calculations, AED 0.20 per extra call | 0.5%; Rs 46 (UAE API) | per transaction | Tax Complete from A$140 or AED 330 a month | Verified (AU, UAE) / Estimate (US) | S27, S28, S37 |
| Stripe Managed Payments (Stripe as merchant of record) | Stripe | +3.5% on top of Stripe payment fees, on the amount including tax | +3.5% (US total about 6.4% + US$0.30) | per transaction | Rolling out; eligible business locations not listed on the page | Verified (3.5%) | S39 |
| Paddle (merchant of record) | Paddle | 5% + US$0.50 | 5% + Rs 42.50 | per checkout transaction | Includes global sales tax/VAT/GST filing, fraud, chargebacks. On US$79: US$4.45 = 5.6% (Rs 378). India is not on Paddle's unsupported-country list | Verified | S32, S33 |
| Lemon Squeezy (merchant of record) | Lemon Squeezy | 5% + US$0.50 | 5% + Rs 42.50 | per transaction | "Transactions made outside of the US may encounter small additional fees"; 2026 move to Stripe Managed Payments announced | Verified | S34 |

## 6. Quick unit costs (derived from the rows above)

| Item | Vendor and plan | Price (original) | In Rs | Unit | Free tier or notes | Status | Source |
|---|---|---|---|---|---|---|---|
| Growth plan paid monthly in India (Rs 2,499 + GST = Rs 2,948.82) | Razorpay Standard 2% | Rs 58.98 fee + Rs 10.62 GST | Rs 69.60 (2.79% of the Rs 2,499 price); Rs 58.98 (2.36%) once the GST credit is claimed | per payment | Plan assumes 1.5% of the gross = 1.77% of the pre-GST price (Rs 44.23) | Verified (inputs) | S23 |
| Same payment by UPI AutoPay | Cashfree Subscriptions | Rs 7.50 mandate once + Rs 15 per debit | Rs 15 per debit (0.6% of Rs 2,499) | per payment | Cheapest recurring route found; Razorpay UPI AutoPay price is "on request" | Verified (inputs) | S24 |
| Growth plan, USA (US$79) | Stripe US cards + Billing + Tax | US$2.59 + US$0.55 + US$0.40 | Rs 301 (4.5%) | per payment | Needs a US entity (Atlas) or invite | Estimate | S37, S31 |
| Growth plan, USA (US$79) | Paddle MoR | US$4.45 | Rs 378 (5.6%) | per payment | Paddle files sales tax; no US entity needed | Verified (inputs) | S32 |
| Growth plan, Australia (A$119) | Stripe AU cards + Billing + Tax | A$2.32 + A$0.83 + A$0.60 | Rs 210 (3.15%) | per payment | Card fee includes GST; needs an Australian entity | Verified (inputs) | S27 |
| Growth plan, UAE (AED 299) | Stripe UAE cards + Billing + Tax | AED 9.67 + AED 2.09 + AED 1.50 | Rs 305 (4.4%) | per payment | Needs a UAE entity (planned Year 2) | Verified (inputs) | S28 |
| Fee reminder to one parent, India | WhatsApp utility vs MSG91 SMS | Rs 0.115 vs Rs 0.17 to 0.25 | Rs 0.12 vs Rs 0.17 to 0.25 | per message | WhatsApp is 30% to 55% cheaper than SMS in India | Estimate (WA) / Verified (SMS) | S4, S11 |
| OTP to one user, Australia | WhatsApp auth vs Twilio SMS | US$0.0113 vs US$0.0515 | Rs 0.96 vs Rs 4.38 | per message | | Estimate (WA) / Verified (SMS) | S5, S16 |

## Differences from the business plan

1. **Gateway fee on EduFlow's own billing.** Plan: 1.5% of the invoice with GST (1.77% of the pre-GST price). Razorpay's standard plan is 2% on every method including UPI, plus 18% GST on the fee: 2.0% of the gross invoice if the GST credit is claimed (2.36% of the pre-GST price), 2.36% of the gross if not. That is about 33% above the plan. The plan number needs a negotiated rate (Razorpay offers this above Rs 5 lakh a month), UPI AutoPay mandates (Cashfree: Rs 15 per debit), or Cashfree's new-merchant offer (0% on the first Rs 20 lakh of GMV, sign-up from 21 Jul 2026, valid only to 31 Mar 2027; the plan's Rs 7.13 lakh collected in Jan–Mar 2027 would carry no platform fee, saving about Rs 14,000 + GST).
2. **"UPI low or zero" for schools' fee collections (canon section 6).** Not true on standard gateway plans: Razorpay charges a 2% platform fee on UPI, Cashfree 1.95%, PhonePe 1.99%. On top of that, NPCI brings in a 0.4% MDR on UPI payments above Rs 2,000 from 15 Oct 2026 (cap Rs 300 at Rs 75,000 and above). Education fees get "flat-fee structures or capped processing rates" that have not been published yet. Most school and coaching fees are above Rs 2,000, so they fall under the new rule.
3. **"Gateway charges passed through at cost" (canon section 6).** NPCI's FAQ (Q34) says merchants cannot pass UPI MDR on to customers. A convenience fee on UPI payments could break this rule. Pass-through should apply to cards and netbanking only, and each institute should have its own gateway account (merchant of record for its own fees). EduFlow should not collect fees on the institute's behalf.
4. **WhatsApp service and utility messages are no longer free from 1 Oct 2026.** The plan's "Meta cost + 15%" still works as a formula. But replies inside the 24-hour window (helpdesk chats, fee-receipt confirmations) now cost the utility rate (India Rs 0.115) after a reported 1,000 free service messages per business phone number a month. If all tenants share one EduFlow number, the 1,000 free messages run out quickly. A payment method must be on the Meta account by 30 Sep 2026. India's marketing rate also went up about 10% on 1 Jan 2026 (Rs 0.7846 to Rs 0.8631). The plan's own WhatsApp budget (Rs 100 to 400 a month) is still enough: Rs 400 buys about 2,900 utility messages with GST.
5. **SMS cost of Rs 0.18 on a Rs 0.25 price.** MSG91 charges Rs 0.18 only when 30,000 SMS are bought at once (Rs 5,400 + GST). The 5,000 pack costs Rs 0.25, the same as EduFlow's resale price (canon: Rs 1,250 per 5,000), so margin is zero at small volume. Rs 0.17 from 60,000; about Rs 0.13 negotiated. Buy the 30,000 pack at the start of the paid launch.
6. **DLT (Rs 6,000 for one portal).** Matches: Vodafone Idea charges Rs 5,000 (Rs 5,900 with GST), valid 5 years, with no template or header fee listed. Jio's portal is reported at Rs 5,900 with 1-year validity, which would make it a yearly cost. Choose Vi.
7. **Stripe for USA, Australia and UAE (canon section 5).** Stripe India is invite-only. An Indian company cannot simply open Stripe US, AU or UAE accounts. Each needs a local entity (Stripe Atlas US: US$500 + US$100 a year; UAE entity already planned for Year 2), or a merchant of record (Paddle 5% + US$0.50). Real all-in costs per payment are 3.2% (Australia) to 4.5% (USA/UAE) with Stripe Billing and Tax, or 5.6% with Paddle.
8. **Gateway fees of 1.8% in Year 2 and 2.0% from Year 3.** At list prices: India about 2.36% of revenue (2% on the GST-inclusive amount) and international about 3.2% to 5.6%. With international at about 16% of Year 3 revenue (100 of 1,500 customers paying 2.7 times more), the blended rate is about 2.6% (estimate). The plan's 2.0% needs an Indian cost near 1.6% of revenue (a fee of about 1.4% on the GST-inclusive amount), which can only be negotiated at volume or reached by moving renewals to UPI AutoPay/eNACH mandates.
9. **Amazon SES (Rs 100 to 300 a month).** Still fine at a la carte pricing (Rs 8.50 per 1,000 emails, so Rs 300 covers about 35,000 emails). But new SES accounts start on the Essentials plan (Rs 13.60 per 1,000) from 21 Jul 2026, so switch to a la carte on day one. The old 3,000-free-emails allowance is no longer listed; new AWS accounts get up to US$200 of credits for 6 months instead.
10. **International SMS is not priced in the canon.** The SMS pack (Rs 0.25 each) is India-only. Twilio costs Rs 4.38 per SMS in Australia, about Rs 1.06 in the USA (plus about Rs 5,200 one-time and Rs 850 a month for a standard 10DLC brand and campaign), and Rs 10 in the UAE. Australia needs a registered sender ID from 1 Jul 2026. International packs need separate prices, or WhatsApp/push/email should come first.

## Sources

All pages were opened (WebFetch) on 21 September 2026 unless marked "search result".

- S1: Meta for Developers, "Pricing on the WhatsApp Business Platform", https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing (also reached via https://developers.facebook.com/docs/whatsapp/pricing/), 21 Sep 2026
- S2: Meta for Developers, "Upcoming pricing updates for Meta Business Agent, service and utility messages", https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages, 21 Sep 2026
- S3: Meta for Developers, "Messaging limits", https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits, 21 Sep 2026
- S4: WhAutomate, "WhatsApp API Pricing India (₹ rate card)", https://whautomate.com/whatsapp-business-api-pricing-india, 21 Sep 2026
- S5: WhAutomate, "WhatsApp API Pricing 2026: Meta Rates by Country", https://whautomate.com/whatsapp-business-api-pricing, 21 Sep 2026
- S6: FormBeep, "Meta WhatsApp Business API Pricing (2026) — Rates by Country", https://formbeep.com/whatsapp-api-pricing/, 21 Sep 2026
- S7: 360dialog, "Service Message Charging Starts October 1, 2026", https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/, 21 Sep 2026
- S8: YCloud, "WhatsApp API Pricing Update: Effective October 1, 2026", https://www.ycloud.com/blog/whatsapp-api-message-pricing-update-effective-october-1-2026, 21 Sep 2026
- S9: ChatMaxima, "WhatsApp API Pricing 2026: Per-Message Rates by Country", https://chatmaxima.com/whatsapp-api-pricing/, 21 Sep 2026
- S10: Ominiflow, "WhatsApp API Pricing by Country 2026", https://ominiflow.com/whatsapp-api-pricing-by-country, 21 Sep 2026 (conflicting Australia/UAE figures; not relied on)
- S11: MSG91, "SMS pricing (India)", https://msg91.com/in/pricing/sms, 21 Sep 2026
- S12: Vodafone Idea, "VILPOWER DLT FAQ", https://www.vilpower.in/faq/, 21 Sep 2026
- S13: SMSGatewayHub, "DLT Registration Charges & Cost Breakdown in India", https://crm.smsgatewayhub.com/knowledge-base/article/dlt-registration-charges-cost-breakdown-in-india, 21 Sep 2026
- S14: TelecomTalk, "BSNL Cuts Bulk SMS Scrubbing Charges for Both Private Cos and PSUs" (24 Jul 2021), https://telecomtalk.info/bsnl-cuts-bulk-sms-scrubbing-charges-for-both-private-cos-and-psus/454552/, 21 Sep 2026
- S15: Twilio, "SMS Pricing in United States", https://www.twilio.com/en-us/sms/pricing/us, 21 Sep 2026
- S16: Twilio, "SMS Pricing in Australia", https://www.twilio.com/en-us/sms/pricing/au, 21 Sep 2026
- S17: Twilio, "SMS Pricing in United Arab Emirates", https://www.twilio.com/en-us/sms/pricing/ae, 21 Sep 2026
- S18: Twilio Docs, "Programmable Messaging and A2P 10DLC", https://www.twilio.com/docs/messaging/compliance/a2p-10dlc, 21 Sep 2026
- S19: Sociocs, "Twilio 10DLC Registration & Pricing Explained" (18 Jul 2026), https://www.sociocs.com/post/twilio-10dlc-explained/, 21 Sep 2026 (Twilio's own fee article returned HTTP 403)
- S20: Twilio blog, "What you should know about Australia's new SMS Sender ID Register", https://www.twilio.com/en-us/blog/insights/australia-sender-id-register, 21 Sep 2026 (ACMA pages timed out)
- S21: Amazon Web Services, "Amazon SES pricing", https://aws.amazon.com/ses/pricing/, 21 Sep 2026
- S22: Google Firebase, "Firebase pricing", https://firebase.google.com/pricing, 21 Sep 2026
- S23: Razorpay, "Pricing", https://razorpay.com/pricing/, 21 Sep 2026
- S24: Cashfree Payments, "Payment Gateway Charges", https://www.cashfree.com/payment-gateway-charges/, 21 Sep 2026
- S25: PayU India, "Pricing", https://payu.in/pricing/, 21 Sep 2026
- S26: PhonePe, "Payment Gateway Pricing & Fees", https://www.phonepe.com/business-solutions/payment-gateway/pricing/, 21 Sep 2026
- S27: Stripe, "Pricing & fees (Australia)", https://stripe.com/au/pricing, 21 Sep 2026
- S28: Stripe, "Pricing & fees (United Arab Emirates)", https://stripe.com/ae/pricing, 21 Sep 2026
- S29: Stripe, "Pricing & fees (India)", https://stripe.com/in/pricing, 21 Sep 2026
- S30: Stripe Support, "Stripe accounts are invite-only in India", https://support.stripe.com/questions/stripe-accounts-are-invite-only-in-india, 21 Sep 2026
- S31: Stripe, "Stripe Atlas", https://stripe.com/atlas, 21 Sep 2026
- S32: Paddle, "Pricing", https://www.paddle.com/pricing, 21 Sep 2026
- S33: Paddle Help Center, "Which countries are supported by Paddle?", https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle, 21 Sep 2026
- S34: Lemon Squeezy, "Pricing", https://www.lemonsqueezy.com/pricing, 21 Sep 2026
- S35: NPCI, "Merchant Discount Rate (MDR) on Select UPI (P2M) Transactions: FAQs" (15 Sep 2026), https://www.npci.org.in/uploads/FA_Qs_Merchant_Discount_Rate_MDR_on_Select_UPI_P2_M_Transactions_58dba1d39e.pdf, 21 Sep 2026
- S36: The Wire, "Finance Ministry Notification Sets Stage for Charges on UPI Transactions Above Rs 2,000" (15 Sep 2026), https://m.thewire.in/article/banking/finance-ministry-notification-sets-stage-for-charges-on-upi-transactions-above-rs-2000, 21 Sep 2026
- S37: Checkout Page, "Stripe fees explained: Every rate and cost (2026)" (updated 8 Sep 2026), https://checkoutpage.com/blog/stripe-processing-fees, 21 Sep 2026 (Stripe's US page, https://stripe.com/us/pricing, redirected to the India page from this location)
- S38: 360dialog Docs, "Meta Business Verification", https://docs.360dialog.com/docs/resources/meta-business-verification, 21 Sep 2026
- S39: Stripe Support, "Managed Payments pricing", https://support.stripe.com/questions/managed-payments-pricing, 21 Sep 2026
