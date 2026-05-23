'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#2563eb"/>
    <text x="16" y="23" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="Arial,sans-serif" fill="white">A</text>
  </svg>
)


function GeneratePageInner() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('verdict')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    platform: 'ebay',
    itemTitle: '',
    currentBid: '',
    buyItNow: '',
    condition: 'used',
    endTime: '',
    sellerRating: '',
    shippingCost: '',
    itemUrl: '',
    notes: ''
  })

  const COLOR = '#f97316'

  useEffect(() => {
    const match = document.cookie.match(/bid_user=([^;]+)/)
    if (match) {
      try { setUser(JSON.parse(decodeURIComponent(match[1]))) } catch(e) {}
    }
  }, [])

  const handleAnalyse = async () => {
    if (!form.itemTitle || !form.currentBid) {
      setError('Please enter the item title and current bid')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const token = document.cookie.match(/bid_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') { setError('limit_reached'); setLoading(false); return }
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setActiveTab('verdict')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600, color:'#475569', marginBottom:4, display:'block' }

  const verdictColors = {
    'Strong Buy': { bg:'#f0fdf4', border:'#bbf7d0', text:'#15803d', emoji:'🟢' },
    'Buy':        { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a', emoji:'✅' },
    'Watch':      { bg:'#fffbeb', border:'#fde68a', text:'#d97706', emoji:'👀' },
    'Pass':       { bg:'#fef2f2', border:'#fecaca', text:'#dc2626', emoji:'🔴' },
  }

  if (error === 'limit_reached') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,textAlign:'center',border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:40,marginBottom:16}}>🔔</div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',marginBottom:8}}>Free limit reached</h2>
        <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>Upgrade to keep analysing auction deals.</p>
        <Link href="/billing" style={{display:'block',background:COLOR,color:'#fff',padding:'12px 24px',borderRadius:9,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:12}}>Upgrade now →</Link>
        <button onClick={() => setError('')} style={{background:'none',border:'none',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>Maybe later</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <Logo size={28}/>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>BidBeacon</span>
        </Link>
        <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← Dashboard</Link>
      </div>

      <div style={{maxWidth:980,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:6}}>Analyse an auction deal</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Enter the auction details and get an AI verdict on whether it is worth bidding and what to pay.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns: result ? 'clamp(300px,45%,460px) 1fr' : '1fr',gap:24}}>
          {/* Form */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:20}}>Auction Details</h2>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Platform</label>
                <select style={inputStyle} value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                  <option value="ebay">🛍 eBay</option>
                  <option value="copart">🚗 Copart</option>
                  <option value="govplanet">🏛 GovPlanet</option>
                  <option value="proxibid">📦 Proxibid</option>
                  <option value="estatesales">🏠 EstateSales</option>
                  <option value="catawiki">🎨 Catawiki</option>
                  <option value="sothebys">💎 Sothebys</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Item Condition</label>
                <select style={inputStyle} value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="used">Used</option>
                  <option value="for_parts">For Parts</option>
                </select>
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Item Title *</label>
              <input style={inputStyle} placeholder="e.g. Apple MacBook Pro 14-inch M3 2023 16GB 512GB" value={form.itemTitle}
                onChange={e => setForm({...form, itemTitle: e.target.value})} />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Current Bid ($) *</label>
                <input style={inputStyle} type="number" placeholder="450" value={form.currentBid}
                  onChange={e => setForm({...form, currentBid: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Buy It Now ($)</label>
                <input style={inputStyle} type="number" placeholder="799" value={form.buyItNow}
                  onChange={e => setForm({...form, buyItNow: e.target.value})} />
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
              <div>
                <label style={labelStyle}>Shipping Cost ($)</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.shippingCost}
                  onChange={e => setForm({...form, shippingCost: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Seller Rating (%)</label>
                <input style={inputStyle} type="number" placeholder="99.2" value={form.sellerRating}
                  onChange={e => setForm({...form, sellerRating: e.target.value})} />
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Time Remaining</label>
              <input style={inputStyle} placeholder="e.g. 2 hours 15 minutes or ends Sunday 8pm" value={form.endTime}
                onChange={e => setForm({...form, endTime: e.target.value})} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Additional Notes</label>
              <textarea style={{...inputStyle, height:70, resize:'vertical'}}
                placeholder="Any extra details — item description, photos show damage, local pickup only..."
                value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            {error && error !== 'limit_reached' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#dc2626'}}>{error}</div>
            )}

            <button onClick={handleAnalyse} disabled={loading}
              style={{width:'100%',background:loading ? '#fed7aa' : COLOR,color:'#fff',border:'none',borderRadius:9,padding:'13px 24px',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
              {loading ? '🔍 Analysing deal...' : '🔔 Analyse Auction'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>Deal Analysis</h2>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{result.platform} · {result.itemTitle}</p>

              {/* Verdict */}
              {result.verdict && (() => {
                const vc = verdictColors[result.verdict] || verdictColors['Watch']
                return (
                  <div style={{background:vc.bg,border:`1px solid ${vc.border}`,borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:18,fontWeight:800,color:vc.text}}>{vc.emoji} {result.verdict}</div>
                      <div style={{fontSize:12,color:'#64748b',marginTop:2}}>AI Recommendation</div>
                    </div>
                    {result.maxBid && (
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:11,color:'#94a3b8'}}>MAX BID</div>
                        <div style={{fontSize:20,fontWeight:800,color:'#0f172a'}}>${result.maxBid}</div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Value summary */}
              {result.marketValue && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>CURRENT BID</div>
                    <div style={{fontSize:15,fontWeight:800,color:'#0f172a'}}>${result.currentBid}</div>
                  </div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>MARKET VALUE</div>
                    <div style={{fontSize:15,fontWeight:800,color:COLOR}}>${result.marketValue}</div>
                  </div>
                  <div style={{background: result.potentialSaving > 0 ? '#f0fdf4' : '#fef2f2',borderRadius:8,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:'#94a3b8',fontWeight:600}}>POTENTIAL SAVING</div>
                    <div style={{fontSize:15,fontWeight:800,color: result.potentialSaving > 0 ? '#16a34a' : '#dc2626'}}>
                      {result.potentialSaving > 0 ? '-' : '+'}${Math.abs(result.potentialSaving)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid #f1f5f9',paddingBottom:8,flexWrap:'wrap'}}>
                {[
                  {key:'verdict', label:'🎯 Analysis'},
                  {key:'risks', label:'⚠️ Risks'},
                  {key:'strategy', label:'🧠 Strategy'},
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{padding:'6px 12px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',
                      background:activeTab===tab.key ? COLOR : '#f1f5f9',
                      color:activeTab===tab.key ? '#fff' : '#64748b'}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'verdict' && result.analysis && (
                <div style={{background:'#f8fafc',borderRadius:8,padding:14,fontSize:13,color:'#334155',lineHeight:1.7}}>{result.analysis}</div>
              )}

              {activeTab === 'risks' && result.risks && (
                <div>
                  {result.risks.map((r, i) => (
                    <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                      <span style={{color:'#dc2626',fontSize:14,flexShrink:0}}>⚠</span>
                      <span style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'strategy' && result.biddingStrategy && (
                <div>
                  <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,padding:14,marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:COLOR,marginBottom:6}}>BIDDING STRATEGY</div>
                    <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{result.biddingStrategy}</div>
                  </div>
                  {result.alternatives && (
                    <div style={{background:'#f8fafc',borderRadius:8,padding:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:6}}>ALTERNATIVES TO CONSIDER</div>
                      <div style={{fontSize:13,color:'#334155',lineHeight:1.6}}>{result.alternatives}</div>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => {
                const txt = `BidBeacon Analysis\n${result.platform} — ${result.itemTitle}\nVerdict: ${result.verdict}\nMax Bid: $${result.maxBid}\nMarket Value: $${result.marketValue}\n\n${result.analysis}`
                navigator.clipboard.writeText(txt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }} style={{width:'100%',marginTop:16,background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                {copied ? '✓ Copied!' : '📋 Copy Analysis'}
              </button>

              <Link href="/dashboard" style={{display:'block',marginTop:10,textAlign:'center',fontSize:13,color:'#94a3b8',textDecoration:'none'}}>View all analyses →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GeneratePageInner /></Suspense>
}
