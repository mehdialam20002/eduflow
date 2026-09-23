# WhatsApp and Email Templates

**In simple words:** This chapter gives you ready-to-send WhatsApp and email texts for every step of a sale, from the first message after a call to renewal and win-back. Every WhatsApp text comes in English and Hinglish. The chapter also shows how to keep your WhatsApp number safe, when to send, how to track replies, and which EduFlow product messages to show prospects as proof of value.

## How to Use These Templates

- IDs: `W-` WhatsApp, `E-` email, `M-` product messages EduFlow sends for institutes. Log the ID with every send to compare reply rates.
- **EN** is English, **HI** is Hinglish (Hindi in Latin script). Reply in the prospect's last language.
- Fill every placeholder, and change one line using what you heard on the call. A leftover `{{owner_name}}` shouts "mass message".
- The boxes show prices as `Rs` (the PDF box takes plain letters only). Type ₹ in the real message.

| Placeholder | Example | Where it comes from |
|---|---|---|
| `{{owner_name}}` | Rajesh ji, Dr. Verma | Lead sheet, contact column |
| `{{institute}}`, `{{city}}` | Sharma Classes, Patna | Lead sheet |
| `{{segment}}` | coaching, school | Lead sheet, type column |
| `{{pain_line}}` | "Staff call 80 parents for fees every month" | Call notes, in the owner's words |
| `{{slot}}`, `{{slot_1}}`, `{{slot_2}}` | Thu 15 Oct, 12:00 | Your demo calendar |
| `{{plan}}`, `{{price}}`, `{{gst}}`, `{{total}}` | Pro, 5,999, 1,079.82, 7,078.82 | Price lines in this chapter |
| `{{trial_end}}` | 29 Oct 2026 | Signup date plus 14 days |
| `{{pay_link}}` | Razorpay payment link | EduFlow billing page |

Stage names are the ten CRM stages from *Sales Process and Playbooks*.

## Keep Your WhatsApp Number Safe

A banned number loses every lead chat at once. These rules follow WhatsApp's business policies in general terms; details change, so re-read the current policy pages every quarter. First, know the two tools.

| Item | WhatsApp Business app | WhatsApp Business Platform (Cloud API) |
|---|---|---|
| Who uses it | You, for one-to-one sales chats | EduFlow product, for institute messages to parents |
| How a message goes | You type or paste it | Code sends a Meta-approved template |
| First message | Possible, but policy expects the person agreed to hear from you | Approved template only, after opt-in |
| Replies | Free | Free inside 24 hours after the person writes |
| Sending to many | Broadcast list; reaches only people who saved your number | Templates to opted-in people, within a daily limit |
| Cost | Free | Per template message; marketing costs several times more than utility in India |
| Risk if misused | Number restricted or banned | Quality drops, templates paused, limit cut |

**Opt-in** means the person agreed to get your WhatsApp messages. A **template** is a message text Meta approved in advance, in one of three categories: Utility (receipts, reminders, alerts), Marketing (offers, greetings) or Authentication (OTP codes).

### Set up the sales number once

1. Use a new prepaid SIM with the WhatsApp Business app, for sales only. EduFlow's product sender numbers stay separate.
2. Profile: EduFlow logo, name "EduFlow", category Education, description "School and coaching management app: fees, attendance, admissions and parent messages. Founder: Mehdi Alam." Add city address, email, `app.eduflow.app` and hours Mon to Sat, 10:00 to 19:00 (assumption; match *Onboarding and Customer Success Playbook*).
3. Turn on the greeting message for new chats and the away message outside hours:

```text
EN  Namaste! Thank you for writing to EduFlow. I am Mehdi, the founder.
    I reply within 2 working hours (Mon-Sat, 10:00-19:00).
HI  Namaste! EduFlow ko message karne ka shukriya. Main Mehdi, founder.
    2 working ghante mein jawab dunga (Somvaar-Shanivaar, 10-7 baje).
```

4. Save each `W-` template as a quick reply (shortcut `/w01` and so on). Create labels that match your stages: Lead, Demo booked, Trial, Quote sent, Won, Nurture, DNC.

### The safety rules

1. **No bulk cold blasting.** Cold first touches go one by one, by hand, at most 15 a day (the target in *Sales Foundation and Lead Generation*).
2. **Personalise.** Use two real facts per message: name, institute, city, exam or class. Identical texts to strangers get blocked.
3. **Opt-in, written down.** "Send it on WhatsApp" on a call counts; log `Opt-in: call, 12 Oct`. Every cold message carries an opt-out line.
4. **Stop at the first "no".** Reply "Noted, I will not message again. Thank you.", add the DNC label and never write again.
5. **Broadcast only to warm contacts.** Lists reach only people who saved your number. Use them for customers, never for leads.
6. **Automation only on the Platform.** Bulk or coded sends (trial, renewal, parent messages) use approved templates, with opt-in.
7. **No unofficial tools.** Bulk-sender extensions and modified apps such as "GB WhatsApp" break WhatsApp's terms and get numbers banned.
8. **No groups, no shorteners.** Never add a lead to a group. One link, on your own domain. No PDF until the person shows interest.
9. **Pause when warned.** After any restriction warning, stop cold touches for 7 days and rewrite the most-blocked template.

### Quality rating on the Platform

Meta rates each Platform number from recent blocks and reports. It also caps how many different people a number may message with templates in a rolling 24 hours (tiers such as 1K, 10K and 100K); good quality raises the cap. A rating that stays low can pause templates and lower the cap.

| Rating | Meaning | What you do |
|---|---|---|
| Green | Few blocks or reports | Keep going |
| Yellow | Blocks and reports rising | Stop marketing sends; find the blocked template. EduFlow blocks marketing on that number |
| Red | Many blocks and reports | Stop bulk sends; rewrite templates. EduFlow also blocks bulk utility; single receipts still go |

The product rules are in the *WhatsApp Module* chapter.

## WhatsApp Before the Demo

**W-01 First touch after a call.** When: within 10 minutes of the call. Goal: a reply that confirms the next step.

```text
EN
Namaste {{owner_name}}, this is Mehdi Alam, founder of EduFlow. Thank
you for your time on the call. As discussed, EduFlow sends fee
reminders, receipts and absent alerts to parents on WhatsApp by itself.
Demo: {{slot}}, 25 minutes, with your own batch names.
Please reply "OK" to confirm, or send a better time.

HI
Namaste {{owner_name}} ji, main Mehdi Alam, EduFlow ka founder. Call pe
time dene ke liye shukriya. Jaisa baat hui, EduFlow parents ko fee
reminder, receipt aur absent alert WhatsApp pe apne aap bhejta hai.
Demo: {{slot}}, 25 minute, aapke apne batch ke naam ke saath.
"OK" likh kar confirm kijiye, ya koi aur time bata dijiye.
```

No demo booked on the call? Replace the demo line with: "I am sending a 60-second video. Shall I call on {{callback}}?" / "60 second ka video bhej raha hoon. {{callback}} ko call karoon?"

**W-02 First touch cold, with opt-out line.** When: a lead from your list, on a number the institute publishes for enquiries. Goal: permission to talk.

```text
EN
Good morning {{owner_name}}, I am Mehdi Alam, founder of EduFlow, a fee
and attendance app for institutes in {{city}}. Many {{segment}} owners
tell me fee follow-up calls take hours every month. EduFlow does them
on WhatsApp by itself. May I show you in 25 minutes this week?
If this is not useful, reply "no" and I will not message again.

HI
Namaste {{owner_name}} ji, main Mehdi Alam, EduFlow ka founder. EduFlow
{{city}} ke institutes ke liye fee aur attendance app hai. Kai
{{segment}} owners bataate hain ki fee follow-up ki calls mein har
mahine ghante lagte hain. EduFlow yeh kaam WhatsApp pe apne aap karta
hai. Is hafte 25 minute mein dikha doon?
Kaam ka na lage toh "no" likh dijiye, dobara message nahi karunga.
```

If you called first and nobody answered, add "I tried calling you today." / "Aaj call kiya tha." The voice-note version is in *Cold Call Scripts*.

**W-03 Demo invite.** When: a lead showed interest (a reply, an ad, a referral) but no slot is fixed. Goal: a booked slot.

```text
EN
Thank you, {{owner_name}}. The demo takes 25 minutes. I use your own
batch names, and a fee receipt reaches your phone on WhatsApp while
you watch. Which suits you: {{slot_1}} or {{slot_2}}?
Please ask your accountant to join for the fee part.

HI
Shukriya {{owner_name}} ji. Demo 25 minute ka hai. Aapke batch ke naam
se dikhaunga, aur fee receipt aapke phone pe WhatsApp pe aayegi, aapke
saamne. Kaunsa time theek rahega: {{slot_1}} ya {{slot_2}}?
Fee wale hisse ke liye accountant ji ko bhi bula lijiye.
```

**W-04 Demo reminder, the day before.** When: right after the confirmation call in *Cold Call Scripts*. Goal: the right people attend, with batch names ready.

```text
EN
Reminder: EduFlow demo tomorrow, {{slot}}.
Link or place: {{meet_link}}
Agenda (25 min): 1) your fee and attendance work today
2) fee collection and the WhatsApp receipt  3) price and next step
Please WhatsApp three batch names and your fee heads. Keep your
student Excel ready, but do not send it now. See you tomorrow. Mehdi

HI
Yaad dila raha hoon: EduFlow demo kal, {{slot}}.
Link ya jagah: {{meet_link}}
Agenda (25 min): 1) aaj fee aur attendance kaise hota hai
2) fee collection aur WhatsApp receipt  3) price aur agla step
Teen batch ke naam aur fee heads WhatsApp kar dijiye. Student ka Excel
tayyar rakhiye, abhi bhejna nahi hai. Kal milte hain. Mehdi
```

**W-05 Demo reminder, one hour before.** When: 60 minutes before the slot. Goal: no no-show.

```text
EN
{{owner_name}}, see you in one hour, at {{slot_time}}. {{meet_link}}
Please keep your phone near you: a sample receipt will reach your
WhatsApp during the demo. Earphones help. Mehdi

HI
{{owner_name}} ji, ek ghante mein milte hain, {{slot_time}} baje.
{{meet_link}}
Phone paas rakhiye, demo ke beech sample receipt WhatsApp pe aayegi.
Earphone laga lein toh behtar. Mehdi
```

## WhatsApp After the Demo and During the Trial

**W-06 Post-demo summary with pricing.** When: within 2 hours of the demo. Goal: a written record the owner can forward to a partner. It carries the five items listed in *Demo Script*.

```text
EN
Thank you for today, {{owner_name}}. Short summary:
- Your problem: {{pain_line}}
- You saw: the fee receipt and the absent alert on your own phone
- For {{student_count}} students: {{plan}}
  Monthly Rs {{price}} + GST Rs {{gst}} = Rs {{total}}
  Yearly Rs {{year_price}} + GST = Rs {{year_total}} (2 months free)
- Your questions: {{answers}}
- Trial: free till {{trial_end}}, no card needed
Next meeting: {{next_meeting}}. Any question, reply here.

HI
Aaj ke time ke liye shukriya {{owner_name}} ji. Chhota summary:
- Aapki dikkat: {{pain_line}}
- Aapne dekha: fee receipt aur absent alert aapke apne phone pe
- {{student_count}} students ke liye: {{plan}}
  Mahina Rs {{price}} + GST Rs {{gst}} = Rs {{total}}
  Saal Rs {{year_price}} + GST = Rs {{year_total}} (2 mahine free)
- Aapke sawaal: {{answers}}
- Trial: {{trial_end}} tak free, card nahi chahiye
Agli meeting: {{next_meeting}}. Koi sawaal ho toh yahin likhiye.
```

Filled price lines (GST 18%): Pro ₹5,999 + ₹1,079.82 = ₹7,078.82 a month, or ₹59,990 + ₹10,798.20 = ₹70,788.20 a year. Growth ₹2,499 + ₹449.82 = ₹2,948.82 a month, or ₹24,990 + ₹4,498.20 = ₹29,488.20 a year.

**W-07 Trial welcome.** When: the day the trial account is created. Goal: a first action within 24 hours. The trial is 14 days of Pro, no card, 100 free WhatsApp messages (*Pricing Strategy*).

```text
EN
Welcome to EduFlow, {{owner_name}}! Your Pro trial is live till
{{trial_end}}. No card needed, and 100 WhatsApp messages are free.
Three steps this week:
1) Import students from your Excel (Students > Import)
2) Collect one fee and watch the receipt reach the parent
3) Mark attendance for one batch
I am on this number, Mon-Sat, 10:00-19:00. Mehdi

HI
EduFlow mein swagat hai {{owner_name}} ji! Aapka Pro trial
{{trial_end}} tak chalu hai. Card nahi, aur 100 WhatsApp message free.
Is hafte teen kaam:
1) Excel se students import kijiye (Students > Import)
2) Ek fee collect kijiye, receipt parent tak jaati dikhegi
3) Ek batch ki attendance lagaiye
Main isi number pe hoon, Somvaar-Shanivaar, 10-7 baje. Mehdi
```

**W-08 Trial day-3 tip.** When: day 3, late morning. Goal: the first fee receipt, which counts as activation.

```text
EN
{{owner_name}}, tip for day 3: collect today's first fee in EduFlow,
not in the register. The parent gets a WhatsApp receipt within a
minute, and you see it on your dashboard. {{progress_line}}
Shall we set up your fee heads together in a 20-minute call?

HI
{{owner_name}} ji, teesre din ki tip: aaj ki pehli fee register ki
jagah EduFlow mein collect kijiye. Parent ko ek minute mein WhatsApp
receipt milegi, aur aapko dashboard pe dikhegi. {{progress_line}}
Fee heads saath mein set karne ke liye 20 minute ki call karein?
```

`{{progress_line}}` example: "212 students are in; only fees are left." / "212 students aa gaye; ab sirf fees baaki hai."

**W-09 Day-7 check-in.** When: day 7. Goal: find the blocker. If all numbers are zero, call instead; activation was missed (see *Onboarding and Customer Success Playbook*).

```text
EN
{{owner_name}}, one week of EduFlow done: {{students}} students,
{{receipts}} receipts, {{att_days}} days of attendance.
What is the one thing that stops your staff from using it every day?
Reply in one line; I will fix it or explain it today.

HI
{{owner_name}} ji, EduFlow ka ek hafta pura: {{students}} students,
{{receipts}} receipts, {{att_days}} din ki attendance.
Staff roz use kare, isme sabse badi rukawat kya hai? Ek line mein
bataiye; aaj hi theek karunga ya samjha dunga.
```

**W-10 Day-12 upgrade nudge.** When: day 12, morning. Goal: a plan paid before day 14.

```text
EN
{{owner_name}}, your trial ends on {{trial_end}}. For {{students}}
students, {{plan}} fits: Rs {{price}} a month, or Rs {{year_price}} a
year (2 months free), plus GST. {{offer_line}}
Pay by UPI, card or netbanking: {{pay_link}}
Your data stays exactly as it is. Need more time? Reply "extend".

HI
{{owner_name}} ji, trial {{trial_end}} ko khatam hoga. {{students}}
students ke liye {{plan}} sahi hai: Rs {{price}} mahina, ya Rs
{{year_price}} saal (2 mahine free), plus GST. {{offer_line}}
UPI, card ya netbanking se: {{pay_link}}
Data jaisa hai waisa rahega. Aur time chahiye? "extend" likhiye.
```

`{{offer_line}}` until 30 April 2027 (Founding 100 offer): "Founding offer: 20% off the first year on yearly, Pro Rs 47,992 + GST." / "Founding offer: yearly pe pehle saal 20% off, Pro Rs 47,992 + GST." On "extend", add the one-time 7-day extension.

## WhatsApp Proposal Follow-ups, Revival and Referrals

A deal enters Negotiation when the written quote goes out (E-08). After 7 silent days it leaves Negotiation, so the three follow-ups fit inside that week.

**W-11 Proposal follow-up A, the soft check (day 2).**

```text
EN
Namaste {{owner_name}}, did you get a chance to see the EduFlow quote?
Happy to explain any line in a 5-minute call. What time suits you?

HI
Namaste {{owner_name}} ji, EduFlow ka quote dekhne ka mauka mila? Koi
line samajhni ho toh 5 minute ki call kar lete hain. Kab theek rahega?
```

**W-12 Proposal follow-up B, the helpful question (day 4).**

```text
EN
{{owner_name}}, owners usually pause at one of three points: price,
staff training or a partner's OK. Which one is it for you? If it is the
partner, I can show {{partner_name}} only the fee part in 15 minutes.

HI
{{owner_name}} ji, owners aksar teen jagah rukte hain: price, staff ki
training, ya partner ki haan. Aapke case mein kaunsa hai? Partner ki
baat ho toh {{partner_name}} ji ko sirf fee wala hissa 15 minute mein
dikha deta hoon.
```

**W-13 Proposal follow-up C, the season deadline (day 7).**

```text
EN
{{owner_name}}, my last note on the quote. {{season_line}} If we start
by {{start_date}}, fee reminders run from day one. Shall I keep
{{start_date}} for your setup, or close this for now? Both are fine.

HI
{{owner_name}} ji, quote par mera aakhri message. {{season_line}}
{{start_date}} tak shuru karein toh fee reminder pehle din se chalenge.
Setup ke liye {{start_date}} rakh doon, ya abhi band kar doon? Dono
jawab theek hain.
```

`{{season_line}}` example: "New batches start on 1 April." / "1 April se naye batch shuru hain." No reply: move the deal to Nurture with a dated next touch, or to Lost with a reason.

**W-14 Lost-deal revive after 45 days.** When: 45 days after Lost or "not now". Goal: a new talk, for a new and true reason.

```text
EN
Namaste {{owner_name}}, Mehdi from EduFlow. We spoke in {{month}}.
Since then, {{news_line}}. With {{season}} coming, do fee follow-ups
still take your staff's time? If yes, I can show just that in 15
minutes. If not, no problem at all.

HI
Namaste {{owner_name}} ji, Mehdi, EduFlow se. {{month}} mein baat hui
thi. Tab se {{news_line}}. {{season}} aa raha hai; kya fee follow-up
mein ab bhi staff ka time lagta hai? Haan toh sirf wahi 15 minute mein
dikha doon. Nahi toh koi baat nahi.
```

`{{news_line}}` must be true: a newly live feature ("online fee payment by UPI is live" / "UPI se online fee payment chalu hai") or real local customers.

**W-15 Referral ask.** When: after a win moment, such as a good first month, a happy message or an NPS score of 9 or 10 (NPS: a 0-to-10 "would you recommend us" score). Goal: two named introductions. The reward, from *Go-To-Market Strategy*: one free month on the referrer's plan for each referral that pays, capped at ₹5,999.

```text
EN
{{owner_name}}, thank you for trusting EduFlow. {{win_line}}
Do you know two institute owners who still chase fees by phone? With
their OK, share their names and numbers and I will call them myself.
For each one who starts a paid plan, you get one month free.

HI
{{owner_name}} ji, EduFlow par bharosa karne ka shukriya. {{win_line}}
Kya aap do aise institute owners ko jaante hain jo abhi bhi phone karke
fee maangte hain? Unki haan le kar naam aur number bhej dijiye, main
khud call karunga. Har paid join par aapko ek mahina free.
```

`{{win_line}}` uses only real dashboard numbers: "This month 41% of your fees came online." / "Is mahine aapki 41% fee online aayi."

## WhatsApp for Seasons and Paying Customers

**W-16 Festival greeting with a soft CTA.** When: Diwali, Holi, Eid or Christmas, to leads who have talked with you and to customers; never to cold numbers. Plain text, no forwarded image cards. CTA means call to action (the one thing you ask the reader to do). Customers get only the first two lines.

```text
EN
{{owner_name}}, wishing you and your family a very happy {{festival}}.
May the coming admission season bring you your best batches yet.
If you want fees and admissions organised before the rush, just reply
"yes" after the festival. No hurry. Mehdi, EduFlow

HI
{{owner_name}} ji, aapko aur parivar ko {{festival}} ki dher saari
shubhkamnayein. Aane wala admission season sabse accha rahe.
Rush se pehle fees aur admission set karne hain toh tyohaar ke baad
bas "yes" likh dijiye. Koi jaldi nahi. Mehdi, EduFlow
```

**W-17 New session greeting.** When: the last week of March for schools, or the week new batches start for coaching. Goal: wake up Nurture leads; help customers set up the new year.

```text
EN
{{owner_name}}, best wishes for the new session {{session}}! New
batches mean new fee plans. EduFlow sets up batches, fee plans and
parent reminders in one day. Shall I call you this week?

HI
{{owner_name}} ji, naye session {{session}} ki shubhkamnayein! Naye
batch matlab nayi fee structure. EduFlow mein batch, fee plan aur
parent reminder ek din mein set. Is hafte call karoon?
```

For customers, replace the pitch with: "Please create the {{session}} academic year and batches before {{date}}; 20 minutes on a call with me." / "{{date}} se pehle {{session}} ka academic year aur batches bana lijiye; call pe 20 minute."

**W-18 Subscription payment reminder.** When: 3 days before a monthly due date, and on the due date if unpaid. Goal: payment without a call.

```text
EN
Namaste {{owner_name}}, your EduFlow {{plan}} bill for {{month}} is due
on {{due_date}}: Rs {{price}} + GST Rs {{gst}} = Rs {{total}}.
Pay by UPI, card or netbanking: {{pay_link}}
The GST invoice is in your email. Already paid? Please ignore this.

HI
Namaste {{owner_name}} ji, EduFlow {{plan}} ka {{month}} ka bill
{{due_date}} ko due hai: Rs {{price}} + GST Rs {{gst}} = Rs {{total}}.
UPI, card ya netbanking se: {{pay_link}}
GST invoice email mein hai. Pay kar diya ho toh ignore kijiye.
```

**W-19 Renewal reminder.** When: 30 days and 7 days before a yearly renewal. The 60-day step is email E-15; the full renewal playbook is in *Onboarding and Customer Success Playbook*.

```text
EN
{{owner_name}}, your EduFlow year renews on {{renewal_date}}. This
year: {{receipts}} receipts, {{reminders}} fee reminders sent,
{{online_share}}% of fees paid online.
Renewal: Rs {{year_price}} + GST Rs {{gst}} = Rs {{total}}
Pay here: {{pay_link}}. Want to change the plan? Reply here.

HI
{{owner_name}} ji, aapka EduFlow saal {{renewal_date}} ko renew hoga.
Is saal: {{receipts}} receipts, {{reminders}} fee reminder,
{{online_share}}% fee online aayi.
Renewal: Rs {{year_price}} + GST Rs {{gst}} = Rs {{total}}
Yahan pay kijiye: {{pay_link}}. Plan badalna hai? Yahin likhiye.
```

**W-20 Win-back.** When: 60 to 90 days after a cancellation or an unpaid trial end, and only when `{{fix_line}}` is true. Goal: a 10-minute call. The offer is "value before price" from *Pricing Strategy*.

```text
EN
Namaste {{owner_name}}, Mehdi from EduFlow. When you left, you said
"{{exit_reason}}". We have fixed it: {{fix_line}}.
Your old records are still in your account. If you restart this month,
I will import your latest Excel myself and add a Rs 499 WhatsApp pack
free. Worth a 10-minute call?

HI
Namaste {{owner_name}} ji, Mehdi, EduFlow se. Jaate waqt aapne kaha
tha "{{exit_reason}}". Humne theek kar diya: {{fix_line}}.
Aapka purana record account mein hai. Is mahine dobara shuru karein toh
latest Excel main khud import karunga, aur Rs 499 ka WhatsApp pack
free. 10 minute ki call karein?
```

Send W-20 only while the account still exists (on Starter or read-only).

## Email Templates

Email is the second channel for Indian owners, the first for principals of larger schools, and the only first-touch channel abroad.

- Send sales email by hand from your founder mailbox. Amazon SES sends only product mail, such as the trial series.
- Subject under 45 characters. A cold body stays under 120 words: one ask, plain text, no attachment.
- Every cold email ends with an opt-out line.
- E-03 to E-05 are for leads without a WhatsApp opt-in, so one lead never gets both follow-up sequences.
- `{{signature}}` is four lines: Mehdi Alam; Founder, EduFlow; `app.eduflow.app` and WhatsApp number; business address.

### Cold intros and follow-ups

**E-01 Cold intro to a school principal.** To: the email the school publishes. Formal, because the principal often forwards it to the management.

```text
Subject: Fee dues and parent calls at {{institute}}

Dear {{owner_name}},

I am Mehdi Alam, founder of EduFlow, a management app for Indian
schools: admissions, attendance, fees and parent communication.

Many principals tell me the office spends days each month calling
parents about dues, and still hears "we never got the receipt".
EduFlow sends fee reminders with a UPI link, and receipts, to parents
on WhatsApp by itself. You see every class's dues on one screen.

May I show you and your accountant in 25 minutes, on {{slot_1}} or
{{slot_2}}?

If this is not relevant, reply "no" and I will not write again.

Warm regards,
{{signature}}
```

**E-02 Cold intro to a coaching owner.** Shorter and direct; owners read email on the phone.

```text
Subject: {{institute}}: fees without phone calls

Namaste {{owner_name}} ji,

I am Mehdi Alam, founder of EduFlow. It runs a coaching institute's
batches, attendance and fees from one phone screen.

A fee falls due: the parent gets a WhatsApp reminder with a UPI link.
A student misses class: the parent gets an alert within minutes.
Your staff stop chasing fees by phone.

25 minutes on {{slot_1}} or {{slot_2}}, with your own batch names?

If not useful, reply "no" and I will stop.
{{signature}}
```

**E-03 to E-05 Follow-ups 1, 2 and 3.** Reply in the same thread on day 4, 8 and 14. With the first email, that is never more than 3 messages in any 10 days, the silent-lead limit in *Sales Process and Playbooks*. Each adds one new thing: a number, a question, a clean exit.

```text
E-03  Day 4   Subject: Re: {{original_subject}}
{{owner_name}}, one number to add. A 350-student institute sends about
350 fee reminders a month. On EduFlow that is under Rs 50 of WhatsApp
charges and no staff hours. Is 25 minutes on {{slot_1}} possible?

E-04  Day 8   Subject: Re: {{original_subject}}
{{owner_name}}, one question; a one-letter answer is enough. How does
{{institute}} track fee dues today? (a) register (b) Excel
(c) software (d) the accountant's memory. I will reply with one idea
you can use this month, with or without EduFlow.

E-05  Day 14  Subject: Closing the loop
{{owner_name}}, I have not heard back, so the timing is probably not
right. I will not write again this session. If fee follow-up becomes
a headache before {{season}}, reply "demo" any time and I will set it
up within a day.
```

The ₹50 comes from 350 × ₹0.1323 (the utility rate with margin in the *WhatsApp Module* chapter) = ₹46.31. After E-05, move the lead to Nurture with a date.

### Demo, proposal and quotation

**E-06 Demo confirmation with agenda.** Send with the calendar invite, within an hour of booking.

```text
Subject: EduFlow demo confirmed: {{slot}}

Dear {{owner_name}},

Confirmed: {{slot}}, 25 minutes. Join: {{meet_link}}

Agenda
1. How fees, attendance and parent messages work today (5 min)
2. EduFlow with your batch names: attendance, fee collection and a
   WhatsApp receipt reaching your phone (15 min)
3. Plan, price and next step (5 min)

Please invite {{attendees}}. Before the demo, send three batch or
class names and your fee heads.

{{signature}}
```

**E-07 Post-demo proposal.** When: the day after the demo, if the owner wants something in writing for a partner, trust or board. W-06 is the short version.

```text
Subject: EduFlow proposal for {{institute}}

Dear {{owner_name}},

Thank you for the demo on {{demo_date}}. What we agreed:

Your need: {{pain_line}}; {{need_2}}
EduFlow will: send fee reminders with UPI links and WhatsApp receipts;
let teachers mark attendance on the phone, with absent alerts to
parents; show dues, collection and attendance on one dashboard.
Plan: {{plan}} for {{student_count}} students. The quotation follows
in a separate email for your accountant.
Setup: a 45-minute call where we import your Excel together and train
your staff. Included.
Start: {{start_date}}, so reminders run before {{season}}.

Reply "go" to start; the pay link is in the quotation. Trial data
carries over as it is.

{{signature}}
```

**E-08 Quotation with GST.** Sending it moves the deal to Negotiation. A quotation is not a tax invoice; the GST invoice goes out when the payment arrives.

```text
Subject: Quotation Q-2027-014: EduFlow Pro, Sharma Classes

Dear Rajesh ji,

Our quotation is below, valid for 15 days (till 27 Jan 2027).

To:   Sharma Classes, Patna, Bihar. GSTIN {{customer_gstin}}
From: {{company_name}}, GSTIN {{our_gstin}}

Item                                     SAC       Amount (Rs)
EduFlow Pro, yearly, 12 months,         {{sac}}      59,990.00
up to 1,000 students and 3 campuses
IGST 18%                                             10,798.20
Total payable                                        70,788.20

Monthly option: Rs 5,999 + GST Rs 1,079.82 = Rs 7,078.82 a month.
WhatsApp messages are prepaid credit packs, outside this price.
Pay by UPI, card or netbanking: {{pay_link}}, or bank transfer to
{{bank_details}}.

{{signature}}
```

- Same state as EduFlow's GST registration: CGST 9% + SGST 9%. Other state: IGST 18%. The total is the same. The example assumes EduFlow is registered outside Bihar.
- Founding 100 offer (yearly only, till 30 April 2027): add "Founding 100 discount 20%: -11,998.00". Taxable 47,992.00, IGST 8,638.56, total 56,630.56.
- Your CA fixes the SAC code (the GST service code) once; see *Company Setup, Legal and Finance Basics*. No customer GSTIN? Leave the line out.

### Trial onboarding series

EduFlow sends these five emails through Amazon SES to the Organization Admin; replies reach your mailbox. During the pilot, before this automation exists, send them by hand. They follow the trial message plan in *Pricing Strategy* and pair with W-07 to W-10.

```text
E-09  Day 0   Subject: Your EduFlow trial is live
Dear {{owner_name}}, your 14-day Pro trial for {{institute}} is ready.
Login: {{login_url}}  User: {{login_email}}  Ends: {{trial_end}}
No card needed; 100 WhatsApp messages are free. This week:
1) import students 2) collect one fee 3) mark one batch's attendance.
Stuck? Reply here; I answer within 2 working hours.

E-10  Day 2   Subject: Import your students in 10 minutes
1) Download the template: {{import_template_link}}
2) Fill name, class or batch, parent name and parent mobile
3) Students > Import > upload > fix red rows > Save
Parent mobiles matter most: every reminder and alert goes there.
{{import_status_line}}

E-11  Day 7   Subject: Week 1 at {{institute}}: {{receipts}} receipts
Students {{students}} | Receipts {{receipts}} (Rs {{collected}})
Attendance days {{att_days}} | Parents reached {{parents_reached}}
Next best step: {{next_step}}. Book a 20-minute help call:
{{booking_link}}

E-12  Day 12  Subject: 2 days left in your EduFlow trial
For {{students}} students we suggest {{plan}}: Rs {{year_price}} a
year (2 months free) or Rs {{price}} a month, plus GST.
Pay by UPI QR, card or netbanking: {{pay_link}}. All data stays.

E-13  Day 14  Subject: Your trial ended; nothing is deleted
{{end_state_line}} Continue on {{plan}}: {{pay_link}}
Need more time? Reply "extend" for 7 more days (once).
```

`{{import_status_line}}` with no students yet: "Shall we do it together on a 15-minute screen share?" `{{end_state_line}}` follows the trial-end rules in *Pricing Strategy*: 50 students or fewer, "You are now on the free Starter plan."; more than 50, "Your account is read-only; you can still export everything."

### Proof, renewal and notices

**E-14 Case-study share.** When: to Trial, Negotiation and Nurture leads with the same pain. Real numbers only, with the customer's written permission. Founding 100 customers have agreed to a testimonial; still ask before you share their numbers.

```text
Subject: How {{customer_institute}} stopped fee follow-up calls

Dear {{owner_name}},

You asked how this works in a real institute. Here is one from
{{customer_city}}, shared with their permission.

Before: {{before_line}}
What changed: {{change_line}}
After {{weeks}} weeks: {{result_line}}
In their words: "{{quote}}" - {{customer_owner}}

Would the same setup help {{institute}} before {{season}}?
{{signature}}
```

> **Example:** An illustrative fill: before, "two staff phoned about 90 parents in the first week of every month"; after 8 weeks, "41% of fees paid online, calls down to about 15 a month".

**E-15 Renewal notice, 60 days before.** W-19 follows at 30 and 7 days.

```text
Subject: Your EduFlow year: renewal on {{renewal_date}}

Dear {{owner_name}},

Your yearly {{plan}} plan renews on {{renewal_date}}. Your year:
- {{receipts}} receipts; Rs {{collected}} collected through EduFlow
- {{reminders}} fee reminders sent; {{online_share}}% paid online
- {{att_days}} attendance days marked

Renewal: Rs {{year_price}} + GST Rs {{gst}} = Rs {{total}}
{{price_lock_line}}
{{plan_fit_line}}
Pay any time before the date: {{pay_link}}

{{signature}}
```

`{{plan_fit_line}}` example: "You now have 288 active students; Growth covers 300. Pro covers 1,000 and 3 campuses." `{{price_lock_line}}`, for Founding 100 only: "Your price stays locked till {{lock_end}}."

**E-16 Price-increase notice.** Rules from *Pricing Strategy*: no change before 31 December 2027; at least 60 days' written notice by email, in-app and WhatsApp; the old price for 12 months after the new list price starts; at most 10% a year; never inside a paid year.

```text
Subject: Your EduFlow price from {{your_change_date}}

Dear {{owner_name}},

I am writing early so you can plan. From {{list_date}}, the {{plan}}
list price for new customers moves from Rs {{old_price}} to
Rs {{new_price}} a month.

For {{institute}}:
- You pay Rs {{old_price}} until {{your_change_date}}.
- Your first bill at the new price is on {{first_new_bill}}.
- A yearly plan never changes inside a paid year.
Why: {{reason_line}}

Questions? Reply here; I read every reply.
{{signature}}
```

With the *Pricing Strategy* illustration (Growth ₹2,499 to ₹2,699 from 1 Jan 2028), a monthly customer since March 2027 pays ₹2,499 until 31 Dec 2028 and gets this email by 1 Nov 2028. `{{reason_line}}` names what the plan gained, for example "Exams, Report Cards and Homework are now in your plan."

**E-17 Apology or incident notice.** When: within 24 hours of the fix, to affected institutes only. Use it for service problems: downtime, double reminders, a wrong total. If personal data may have been exposed, do not use it; follow the breach steps in *Monitoring, Backups and Incident Response*.

```text
Subject: Sorry: {{incident_short}} on {{incident_date}}

Dear {{owner_name}},

On {{incident_date}}, from {{start_time}} to {{end_time}},
{{what_happened}}. This was our mistake, and I am sorry.

Effect on {{institute}}: {{your_impact}}
Your data: {{data_line}}
Fixed: {{fix_done}}
So it does not happen again: {{prevention}}
What you need to do: {{action_or_nothing}}
{{credit_line}}

Questions? Reply here or call me on {{sales_number}}.
{{signature}}
```

Example fill: "fee reminders for 41 of your parents went out twice"; "No data was lost or seen by anyone else"; "We added 100 free WhatsApp messages to your wallet." Own the fault even when a vendor caused it.

### International variant for USA and Australia

Tutoring centres abroad expect a formal, email-first approach. Do not use WhatsApp until they share a number and ask for it. In general terms, US CAN-SPAM and the Australian Spam Act 2003 expect a true subject, your identity and postal address, and a working unsubscribe that you honour quickly. Australia also expects consent; for a cold email that usually means a business address published for this kind of contact. Check the current rules before the Year 3 pilots.

**E-18 Cold intro, tutoring centre.**

```text
Subject: Attendance and billing for {{institute}}

Dear {{title}} {{last_name}},

I am Mehdi Alam, founder of EduFlow, a management platform for
tutoring centers: enrollment, attendance, invoicing and parent
updates in one place.

Owners often tell us that chasing unpaid invoices and answering
"did my child attend?" takes hours each week. EduFlow sends invoices
with card payment links, and attendance updates, to parents by email
and text message automatically.

Plans start at {{growth_price}} per month for up to 300 students.
The 14-day trial needs no card.

Would a 20-minute video call on {{slot_1}} or {{slot_2}} ({{tz}})
be useful?

Kind regards,
{{signature}}
If you prefer not to hear from us, reply "unsubscribe".
```

| Item | USA | Australia |
|---|---|---|
| Spelling | center, enrollment | centre, enrolment |
| `{{growth_price}}` | $79, plus sales tax where it applies | A$119, plus 10% GST |
| Date format | Mar 9, 2029 | 9 March 2029 |
| Slot time zone | ET, CT or PT | AEST or AEDT |
| Payments and parent texts | Stripe; SMS through Twilio | Stripe; SMS through Twilio |
| Follow-ups | E-03 to E-05, formal; no Hinglish, no WhatsApp | Same |
| Signature | Postal address and phone with +91; no WhatsApp line | Same |

## Product Messages to Show in Sales

Owners buy what their parents will see. These are the parent messages EduFlow sends for institutes, with canon sample data. In the product they are Meta-approved utility templates (see the *WhatsApp Module* chapter); in sales they are your proof.

| ID | Message | Event key | Fires | Sales line |
|---|---|---|---|---|
| M-01 | Fee reminder with Pay now | `fee.invoice.due_soon` | Before the due date | "Parents pay from the message; nobody calls" |
| M-02 | Absent alert | `attendance.absent` | When attendance is saved | "Parents know before the child is home" |
| M-03 | Receipt with PDF | `receipt.issued` | Within 60 seconds of payment | "No more 'I paid, where is the receipt?'" |
| M-04 | Exam result | `exam.results.published` | When results are published | "Every parent gets results the same hour" |

```text
M-01 EN  Dear Sunita Devi, Rs 10,800 for Aarav Sharma (10-A) is due
         on 10 Oct 2027. Tap Pay now to pay by UPI.
         Reply STOP to opt out.                           [ Pay now ]
     HI  Namaste Sunita Devi ji, Aarav Sharma (10-A) ki fee Rs 10,800,
         10 Oct 2027 tak due hai. UPI se bharne ke liye Pay now
         dabaiye. Band karna ho toh STOP likhiye.         [ Pay now ]

M-02 EN  Dear Sunita Devi, Aarav Sharma (10-A) is absent today, 15 Oct.
         If this is wrong, please reply here. Bright Future Public
         School
     HI  Namaste Sunita Devi ji, Aarav Sharma (10-A) aaj 15 Oct ko
         absent hai. Galti ho toh yahin reply kijiye. Bright Future
         Public School

M-03 EN  [PDF Receipt-BF-27-000233] Dear Sunita Devi, we received
         Rs 12,000 for Aarav Sharma (10-A) on 14 Jul 2027. Balance: Rs 0.
     HI  [PDF Receipt-BF-27-000233] Namaste Sunita Devi ji, Aarav
         Sharma (10-A) ke Rs 12,000, 14 Jul 2027 ko mil gaye. Baaki: Rs 0.

M-04 EN  Dear Sunita Devi, the Half-Yearly result of Aarav Sharma
         (10-A) is out: 412/500 (82.4%).          [ View result ]
     HI  Namaste Sunita Devi ji, Aarav Sharma (10-A) ka Half-Yearly
         result aa gaya: 412/500 (82.4%).         [ View result ]
```

1. In the demo, fire M-03 to the owner's own phone; the moment is scripted in *Demo Script*. Never show a real parent's message.
2. After the demo, attach screenshots of M-01 and M-03 from the demo organization to W-06 or E-07.
3. Show M-04 only after the Exams module ships (Phase 2, by 1 Feb 2027). Never demo what is not live.

## Timing, Length and Tracking Replies

| Reader | Best time to send (Estimate) | Avoid |
|---|---|---|
| Coaching owner | 11:00 to 13:00, before afternoon batches | 16:00 to 20:00 batch hours; Sundays |
| School principal | 14:00 to 16:00, after dispersal | Mornings, exam weeks, result days |
| Accountant | 11:00 to 12:30 | 1st to 10th of the month, the fee rush |
| Paying customer | 10:00 to 12:00, Tuesday to Friday | Festival days |
| USA and Australia | Tuesday to Thursday, 9:00 to 11:00 their time | Weekends and school holidays |

These times are estimates from how institutes run their day. After four weeks, your own reply log replaces them.

- **WhatsApp length:** under 70 words, one question, at most one link, and no link in a cold first message.
- **Email length:** subject under 45 characters; cold body under 120 words; proposals, quotes and notices under 200.
- **Language:** answer in the language the person last used.

Add a Touches tab to the EduFlow CRM sheet from *Sales Foundation and Lead Generation*, one row per message sent:

| Col | Header | Example |
|---|---|---|
| A | Date sent | 14 Jan 2027 |
| B | Lead ID | L-0142 |
| C | Template ID | W-02 |
| D | Variant | A |
| E | Channel | WhatsApp |
| F | Reply date (blank means none) | 14 Jan 2027 |
| G | Outcome | Demo booked |

Reply rate for one template, in the Weekly tab:

```text
=COUNTIFS(Touches!C:C,"W-02",Touches!F:F,"<>")/COUNTIF(Touches!C:C,"W-02")
```

1. Count replies, not opens. Some mail apps open images by themselves, so open counts lie, and tracking pixels can push mail into spam.
2. Judge a template after 30 sends. Change one line at a time and log the new text as variant B.
3. Targets (Estimates): W-02 about 25% (4 replies from 15 sends); E-01 and E-02 5%; W-06 80%; W-09 50%.
4. Every Monday, rewrite the template with the lowest reply rate. A "no" counts as a reply and goes to DNC.

## Templates by Funnel Stage

| Stage | WhatsApp | Email | Product proof | Goal of the touch |
|---|---|---|---|---|
| Lead | W-02 | E-01, E-02, E-18 | None | Permission to talk |
| Contacted | W-01, W-03 | E-03, E-04, E-05 | M-01 screenshot | A booked demo |
| Qualified | W-03 | None | None | Demo date accepted |
| Demo Scheduled | W-04, W-05 | E-06 | None | Decision maker attends |
| Demo Done | W-06 | E-07 | M-01 to M-03 live | Trial started |
| Trial | W-07 to W-10 | E-09 to E-13 | Their own M-03 | Activation, then payment |
| Negotiation | W-11 to W-13 | E-08, E-14 | M-01, M-03 screenshots | Payment received |
| Won | W-15, W-18, W-19 | E-15, E-16, E-17 | Their dashboard numbers | Renewal and referrals |
| Lost | W-14; W-20 for cancelled customers | None | None | A new talk, for a true reason |
| Nurture | W-16, W-17 | E-14 | M-04 after Phase 2 | Back to Contacted in season |

## Key takeaways

- Every template has one goal and one ask. Fill every placeholder and change one line using what you heard.
- Protect the sales number: cold touches by hand (at most 15 a day), an opt-out line, stop at the first "no", and automation only through approved Platform templates.
- Every WhatsApp text exists in English and Hinglish; reply in the language the owner last used.
- Quotes show price, GST and total in rupees, and the same numbers appear on WhatsApp, in email and on the pay link.
- Parent messages (M-01 to M-04) on the owner's own phone sell better than any feature list.
- Log every send by template ID, count replies not opens, and rewrite the weakest template each Monday.
