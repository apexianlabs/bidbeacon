import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { platform, itemTitle, currentBid, buyItNow, condition, endTime, sellerRating, shippingCost, notes, userId } = body

    if (!itemTitle || !currentBid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (userId) {
      const usageRes = await fetch(
        `${process.env.DB_API_URL}/usage/check?user_id=${userId}&product=bidbeacon`,
        { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_BIDBEACON}` } }
      )
      const usage = await usageRes.json()
      if (!usage.allowed) return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
    }

    const totalCost = parseFloat(currentBid) + (parseFloat(shippingCost) || 0)

    const prompt = `You are an expert auction buyer and reseller with 20 years of experience on eBay, Copart, and other auction platforms. Analyse this auction deal and respond ONLY with valid JSON.

Auction Details:
- Platform: ${platform}
- Item: ${itemTitle}
- Current Bid: $${currentBid}
- Shipping: $${shippingCost || 0}
- Total Cost at Current Bid: $${totalCost}
${buyItNow ? `- Buy It Now Price: $${buyItNow}` : ''}
- Condition: ${condition}
${endTime ? `- Time Remaining: ${endTime}` : ''}
${sellerRating ? `- Seller Rating: ${sellerRating}%` : ''}
${notes ? `- Additional Notes: ${notes}` : ''}

Based on your knowledge of typical market prices for this type of item, analyse whether this is a good deal.

Respond ONLY with this JSON:
{
  "verdict": "Strong Buy|Buy|Watch|Pass",
  "maxBid": <maximum you would bid as a number, all-in including shipping>,
  "marketValue": <estimated current market value for this item in this condition>,
  "potentialSaving": <marketValue minus totalCost - positive means saving, negative means overpaying>,
  "currentBid": ${currentBid},
  "analysis": "2-3 sentence plain English analysis of the deal value, why it is or isn't worth bidding",
  "risks": [
    "specific risk 1 for this item/platform/condition",
    "risk 2",
    "risk 3"
  ],
  "biddingStrategy": "specific advice on HOW to bid — when to place bids, how much to increment, sniping advice for timed auctions",
  "alternatives": "brief note on where else to find this item or what alternatives to consider if passing",
  "platform": "${platform}",
  "itemTitle": "${itemTitle}"
}

Guidelines:
- Be realistic about market values — use your knowledge of typical prices
- For eBay: account for 10-15% buyer premium and PayPal fees in max bid calculation
- For Copart: account for buyer fees (typically 15-25% on top of hammer price)
- Strong Buy = 30%+ below market value
- Buy = 10-30% below market value  
- Watch = roughly at market value, wait to see if price drops
- Pass = above market value or too risky
- Consider condition carefully — 'for parts' items have much lower value`

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'analyse_auction_deal', inputs: { prompt } })
    })

    if (!aiRes.ok) throw new Error('AI analysis failed')

    const aiData = await aiRes.json()
    let result = aiData.data || aiData.result || {}

    try {
      if (typeof result === 'string') {
        const clean = result.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      } else if (result.raw_response) {
        const clean = result.raw_response.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      }
    } catch(e) {}

    if (userId) {
      await fetch(`${process.env.DB_API_URL}/db/bidbeacon/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_BIDBEACON}` },
        body: JSON.stringify({
          user_id: userId,
          title: `${platform} — ${itemTitle} — ${result.verdict}`,
          result_data: { ...result, platform, itemTitle, currentBid, buyItNow, condition, shippingCost },
          status: 'active'
        })
      })
      await fetch(`${process.env.DB_API_URL}/usage/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_BIDBEACON}` },
        body: JSON.stringify({ user_id: userId, product: 'bidbeacon', action: 'analyse_auction_deal' })
      })
    }

    return NextResponse.json(result)
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
