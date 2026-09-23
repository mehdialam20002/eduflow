# Brief for 54-stage-4-growing-to-10000-customers.md

Title: Stage 4: Growing to 10,000 Customers
Minimum words: 2600
Web research needed: no

## What this chapter must cover (every item, fully)

A complete operating guide for this scaling stage: 1,000 to 10,000 paying customers (Year 3 – Year 5; team 40–220; multi-region, enterprise, compliance certifications). Sections: what this stage looks like (customers, students, users, data volume, request peaks — consistent with the Scaling Overview chapter and canon targets); goals and exit criteria to the next stage; architecture at this stage (mermaid flowchart + component table: hosting, DB size/instance, Redis, workers, storage, CDN, search, observability) and the exact upgrades to make during this stage in priority order with effort and risk; database work (indexes, slow-query review, partitioning, archival, connection pooling, replicas, backups and restore drills); performance and reliability targets (SLOs: uptime, p95 latency, job delay) and error budget in simple words; security and compliance work for this stage (from basics to pen-test, SOC 2/ISO 27001 later); what breaks at this stage — a table of 10–12 typical failures with symptoms, root cause and fix (for example fee-day traffic spike, WhatsApp rate limits, long-running report queries, noisy-neighbour tenant, import of 50,000 students, migration locks); team and roles to add, with triggers (consistent with the BRD hiring plan team sizes); processes to introduce (on-call, release train, QA, change management, customer advisory board); support model and tooling; monthly cost table (infra, tools, people — labelled estimates in ₹) and gross margin check; key metrics dashboard for this stage; top risks; a 10-item stage checklist.
