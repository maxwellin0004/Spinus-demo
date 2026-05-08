# Tanglin V1 Finance and Wallet Design

## Product Positioning

Tanglin V1 uses manual finance operations with platform-controlled escrow. The product supports three different money surfaces:

- Admin: finance operations center.
- Brand: budget, billing, and escrow account.
- Creator: earnings wallet and withdrawal.

These surfaces should share financial concepts and audit requirements, but they should not all be labeled as generic wallets. Each role has a different job:

- Admin controls and audits money movement.
- Brand funds campaigns and manages budget.
- Creator receives earnings and requests withdrawal.

## V1 Scope

V1 supports:

- RMB only.
- Offline brand payment with payment proof.
- Admin manual payment confirmation.
- Campaign-level escrow before launch.
- Creator earnings credited immediately after brand proof acceptance.
- Manual creator withdrawal payout.
- Balance fields plus transaction records and audit logs.
- Freezing available creator balance for post-acceptance risk.

V1 does not support:

- Online payment gateways.
- Automatic payout.
- Multi-currency settlement.
- Negative brand or creator balances.
- Campaign launch before escrow is funded.
- Minimum platform service fee.
- Platform commission deducted from creator earnings.
- Strict ledger as the only source of truth.
- Automatic clawback after creator withdrawal is paid.

## Role Surfaces

### Admin Finance Operations

Admin needs a platform-level finance operations center, not a personal wallet.

Core jobs:

- Confirm brand payment proof.
- Credit brand budget balance.
- Freeze and release campaign escrow.
- Monitor pending invoices and campaign payment status.
- Review and process creator withdrawals.
- Handle refunds, disputes, freezes, and manual adjustments.
- Track platform service fee recognition.
- Review audit logs for every balance-changing action.

Recommended UI name:

- Finance Center
- Funds Operations
- 资金运营 / 财务中心

### Brand Budget and Billing

Brand needs budget and billing, not a withdrawal wallet.

Core jobs:

- View available budget balance.
- View frozen campaign escrow.
- Create campaign-specific payment orders.
- Submit offline payment proof.
- Pre-fund account balance as a secondary path.
- Track budget ledger and invoice/payment status.
- Receive unused escrow back when a campaign is completed, cancelled, or archived.

Recommended UI name:

- Budget and Billing
- Campaign Funds
- 预算与账单 / 投放资金

### Creator Wallet and Withdrawal

Creator needs an earnings wallet.

Core jobs:

- View estimated earnings.
- View earnings under content/proof review.
- View available withdrawable balance.
- View frozen balance.
- Submit withdrawal request.
- Track withdrawal status.
- Maintain payout details.
- Review earnings and withdrawal transaction history.

Recommended UI name:

- Wallet and Withdrawal
- Earnings Wallet
- 钱包与提现

## Brand Funding Flow

V1 supports two funding paths:

1. Campaign-specific payment as the main path.
2. Pre-funded brand balance as a secondary path.

Main path:

1. Brand creates a Campaign.
2. System calculates creator budget, estimated platform fee, and total required payment.
3. If brand balance is insufficient, the Campaign enters an awaiting-payment state.
4. System creates a payment order linked to the Campaign.
5. Brand submits offline payment proof.
6. Admin manually confirms the payment.
7. Brand budget balance is credited.
8. The linked Campaign escrow is frozen from brand balance.
9. Campaign can proceed to review and launch.

Pre-funding path:

1. Brand creates a budget top-up request.
2. Brand submits offline payment proof.
3. Admin confirms the payment.
4. Brand budget balance is credited.
5. Future Campaigns can freeze escrow directly from available balance.

Rules:

- Brand balance must never go negative.
- Campaign must not launch before required escrow is frozen.
- V1 does not support credit limits or pay-later campaigns.
- Admin confirmation is required before offline payments affect available balance.

## Campaign Escrow Flow

Campaign launch depends on escrow.

When brand balance is sufficient:

1. Freeze the required Campaign escrow.
2. Increase brand frozen escrow balance.
3. Decrease brand available budget balance.
4. Record a brand ledger transaction.
5. Write an audit log.
6. Allow Campaign to continue into review/launch flow.

Escrow covers:

- Creator reward budget.
- Estimated platform service fee.

When a proof is accepted:

1. Release the relevant creator reward amount from Campaign escrow.
2. Credit the creator available balance immediately.
3. Recognize the proportional platform service fee.
4. Record creator wallet transaction.
5. Record brand ledger transaction.
6. Write audit logs.

When Campaign ends, is cancelled, or is archived:

1. Calculate unused creator reward budget.
2. Calculate unrecognized platform service fee.
3. Return unused escrow to brand available balance.
4. Keep already accepted creator rewards and recognized platform fees final.
5. Record ledger transactions and audit logs.

## Creator Earnings Flow

Confirmed product rule:

- Brand proof acceptance immediately credits creator withdrawable balance.
- Admin does not manually approve each creator earning before it becomes withdrawable.

Recommended state model:

- Estimated earnings: task/application may produce earnings, but no accepted delivery yet.
- Under review earnings: content/proof is submitted but not accepted.
- Available balance: brand accepted proof, creator can request withdrawal.
- Frozen balance: platform temporarily blocks withdrawal due to risk, dispute, or manual action.

Acceptance flow:

1. Brand accepts a proof.
2. Proof is marked accepted/verified according to the existing business state model.
3. Submission is advanced to the appropriate verified/settled state.
4. Creator reward is added to available balance.
5. Wallet transaction is created.
6. Campaign escrow is reduced.
7. Proportional platform fee is recognized.
8. Audit logs are written.

Rules:

- Settlement is per accepted proof/task, not per whole Campaign.
- A creator should not wait for the whole Campaign to finish.
- Creator balance must never go negative.
- Already paid withdrawals are not automatically clawed back.

## Creator Withdrawal Flow

All payouts are manual in V1.

Withdrawal statuses:

- Pending: creator submitted withdrawal request.
- Approved: Admin reviewed and approved payout preparation.
- Paid: Admin completed manual transfer and marked it paid.
- Rejected: Admin rejected the request.

Flow:

1. Creator requests withdrawal from available balance.
2. Requested amount moves from available balance to frozen/processing balance.
3. Withdrawal request is created as pending.
4. Admin reviews the request.
5. If approved, request enters approved status.
6. Admin manually transfers RMB outside the system.
7. Admin marks request as paid.
8. If rejected, frozen amount returns to available balance.

Rules:

- No automatic payout.
- No withdrawal can exceed available balance.
- Withdrawal requests should store payout method and payout details.
- Admin note is required for rejection and recommended for approval/paid actions.
- Every status transition that changes balance must write wallet transaction and audit log.

## Platform Service Fee

Confirmed product rule:

- Platform service fee is charged to the brand budget.
- Creator rewards are not reduced by platform commission.
- No minimum platform service fee in V1.
- Platform fee is recognized progressively as KOL proofs are accepted.

Formula:

- creatorBudget = sum of all creator rewards.
- estimatedPlatformFee = creatorBudget * feeRate.
- totalBudget = creatorBudget + estimatedPlatformFee.

Recognition:

- Campaign creation shows estimated platform fee.
- Each accepted proof recognizes platform fee proportional to that accepted reward.
- Unused and unrecognized platform fee is returned/released when Campaign ends, is cancelled, or is archived.

Admin reporting should distinguish:

- Estimated platform fee.
- Recognized platform fee.
- Pending/unrecognized platform fee.
- Unused budget to return.

## Freezing and Risk Handling

Confirmed product rule:

- If a creator earning has already been withdrawn and marked paid, V1 does not automatically claw it back.
- If money remains available or frozen, Admin can freeze it.
- No negative creator balance.

Risk examples:

- Accepted proof link is later deleted.
- Metrics are suspected to be fake.
- Brand opens dispute after acceptance.
- Creator violates platform rules.

Freeze rules:

- Freeze amount cannot exceed current available balance.
- If risk amount exceeds available balance, freeze all available balance and record the remaining exposure in notes/audit/risk records.
- Platform can restrict creator withdrawal or task access.
- Severe cases can freeze account status or lower creator level.

## Balance and Ledger Rules

V1 uses balance fields plus transaction records. It is not a strict ledger-first system yet.

Required safeguards:

- No balance-changing action may only update a balance field.
- Every balance change must write a transaction record.
- Every balance change must write an audit log.
- Balance update, transaction creation, and audit log creation must happen in one database transaction.
- Existing transaction records must not be deleted.
- Corrections must be represented by adjustment or reversal transactions.

Brand-side records should capture:

- Payment credit.
- Escrow freeze.
- Creator reward release.
- Platform fee recognition.
- Refund or unused escrow return.
- Manual adjustment.

Creator-side records should capture:

- Earning credit.
- Withdrawal freeze.
- Withdrawal paid.
- Withdrawal rejection release.
- Risk freeze.
- Manual adjustment.

## Status Coupling

Business status and financial status should be stored separately, but key lifecycle actions must update both in the same transaction.

Required coupling:

- Campaign funding:
  - Balance sufficient: freeze escrow and allow Campaign to proceed.
  - Balance insufficient: Campaign waits for payment.
- Admin payment confirmation:
  - Invoice/payment is confirmed.
  - Brand balance is credited.
  - Linked Campaign escrow is frozen if applicable.
- Proof acceptance:
  - Proof/submission status advances.
  - Creator available balance is credited.
  - Escrow is released.
  - Platform fee is recognized.
- Campaign completion/cancellation/archive:
  - Business status changes.
  - Unused escrow returns to brand balance.
- Dispute/risk:
  - Business status may change.
  - Available creator balance may be frozen.

## Implementation Notes

Recommended implementation order:

1. Align UI naming:
   - Admin: finance operations center.
   - Brand: budget and billing.
   - Creator: wallet and withdrawal.
2. Update dashboard summaries to match the confirmed states.
3. Make proof acceptance directly credit creator available balance.
4. Adjust platform fee recognition to accepted proof progress.
5. Add explicit unused escrow return on Campaign completion/cancellation/archive.
6. Harden balance-changing server actions with transaction records and audit logs.
7. Add finance regression tests around the key flows.

Do not implement online payment, auto payout, multi-currency, negative balances, or strict ledger migration in V1.
