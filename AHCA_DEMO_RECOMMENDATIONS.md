# AHCA Presentation Demo Recommendations

**Quick Reference: What to Show & How to Show It**

---

## 🎯 Recommended Live Demos for AHCA Presentation

Based on your existing capabilities and the Five Dimensions framework, here are the **most impactful demonstrations** for your AHCA audience:

---

## **Demo 1: Hospital Referral Intelligence**
### "Stop Guessing Which Hospitals Matter"

**Time**: 3 minutes  
**Dimension**: Pathways + Payers  
**Wow Factor**: ⭐⭐⭐⭐⭐

### What You'll Show:

**Step 1**: "Traditional Approach"
> "Marketing teams visit 20 hospitals hoping for referrals. No data, just relationships and guesswork."

**Step 2**: "Intelligence Approach" (Live in app)
```
Claims Investigation Tool
↓
Filter: Select 3-5 SNF NPIs in a market
↓
Aggregation Query:
  GROUP BY: facility_provider_name, payor_group
  AGGREGATIONS: 
    - COUNT(*) as total_referrals
    - SUM(charge_total) as total_revenue
    - COUNT(DISTINCT patient_zip3) as coverage_area
↓
Results: Ranked list of hospitals by volume and value
```

**Step 3**: "The Insight"
Show on screen:
- Hospital A: 450 referrals, 85% Medicare Advantage, $2.3M revenue
- Hospital B: 180 referrals, 60% Medicaid, $450K revenue
- Hospital C: 45 referrals, 90% Medicare FFS, $380K revenue

**The Reveal**:
> "Your marketing team spends equal time at all three hospitals. Intelligence shows Hospital A drives 5X the revenue of Hospital B. Where should you focus?"

**Transition Line**:
> "This query took 30 seconds. Without intelligence, operators rely on census coordinators' anecdotes."

---

## **Demo 2: Geographic Market Opportunity**
### "Data Shows You Where to Grow"

**Time**: 4 minutes  
**Dimension**: Population + Providers + Positioning  
**Wow Factor**: ⭐⭐⭐⭐⭐

### What You'll Show:

**Step 1**: "Traditional Approach"
> "Operators hear 'Florida is growing' and invest in consultants for 6-month feasibility studies that are outdated before they're finished."

**Step 2**: "Intelligence Approach" (Live in app)
```
Geography Analysis Page
↓
Select Market: "Tampa Metro - 25 miles"
↓
Demographics Tab:
  - Show choropleth map colored by "% Population 65+"
  - Switch to "Median Income"
  - Switch to "Poverty Rate"
↓
Provider Density Section:
  - Show "No Providers" census tracts
  - Show "High Density" competitive zones
↓
The Insight: Visual overlay shows opportunity
```

**Step 3**: "The Story the Data Tells"
Point to map on screen:
- **Northeast quadrant**: High elderly population (35%+), high income ($95K median), ZERO providers
- **Southwest quadrant**: Medium elderly (22%), lower income ($58K), 8 competing SNFs

**The Reveal**:
> "If you were expanding to Tampa, would you build in the southwest where there are already 8 SNFs competing for middle-income residents, or the northeast where wealthy seniors have no nearby options?"
>
> "Intelligence doesn't just answer yes/no—it tells you EXACTLY WHERE."

**Bonus**: 
Show census tract ID: "Hillsborough County, Tract 01420.05 - 2,100 seniors, $98k income, 3.2 square miles, nearest SNF is 8.7 miles away."

**Transition Line**:
> "This level of precision used to require expensive consultants. Now it's 3 clicks."

---

## **Demo 3: Service Line Gap Analysis**
### "Find Revenue Hiding in Your Market"

**Time**: 3 minutes  
**Dimension**: Providers + Population + Payers  
**Wow Factor**: ⭐⭐⭐⭐

### What You'll Show:

**Step 1**: "Traditional Approach"
> "Operators add service lines based on gut feel: 'Memory care is hot right now, maybe we should do that.'"

**Step 2**: "Intelligence Approach" (Live in app)
```
HCO Analysis Page
↓
Select Market: "Nashville Metro - 30 miles"
↓
Filters:
  - Service Type: "Memory Care"
  - Show map + listing
↓
The Insight: Geographic distribution
```

**Step 3**: "The Question"
> "You operate a 120-bed SNF in South Nashville at 78% occupancy. Should you convert 20 beds to memory care?"

**The Analysis** (show on screen):
1. **Provider view**: Only 3 memory care facilities in entire south metro (25+ miles)
2. **Demographics** (switch to demo view): South Nashville tracts show 28% elderly, $87K income
3. **Claims data** (switch to investigation tool):
   - Filter to diagnosis codes indicating dementia
   - Show volume: 1,200+ dementia-related admissions in south metro annually
   - Current providers can only serve ~400 (3 facilities × ~25 beds × 80% occupancy)

**The Reveal**:
> "There's demand for 1,200 memory care placements annually. Supply is 400. That's an 800-patient gap in your market—and you already own the real estate."

**The Closer**:
> "Without intelligence, you'd survey staff, maybe visit a competitor. With intelligence, you quantify the exact unmet demand in 10 minutes."

---

## **Demo 4: Competitive Positioning Reality Check**
### "How You Think You're Positioned vs How You're Actually Positioned"

**Time**: 2 minutes  
**Dimension**: Positioning + Providers  
**Wow Factor**: ⭐⭐⭐

### What You'll Show:

**Step 1**: "Traditional Approach"
> "SNFs check their star rating on CMS, think 'we're 4 stars,' and assume they're competitive."

**Step 2**: "Intelligence Approach" (Live in app)
```
HCO Analysis → Geography Tab
↓
Select Market: "Orlando Metro"
↓
Show provider density + quality data overlay
```

**Step 3**: "The Reality"
Show comparison table:
- **Your facility**: 4 stars overall | Within your 10-mile competitive set: Ranked #7 out of 11
- **Why?**: Your market has unusually high-quality providers
- **Implication**: Hospitals and ACOs aren't comparing you to the national average—they're comparing you to the 5-star SNF 3 miles away

**The Reveal**:
> "Being above average nationally doesn't matter if you're below average locally. Intelligence shows you your competitive position where it counts—in your actual market."

---

## 🎬 Presentation Flow Integration

### **Suggested Placement in Your Outline**:

**Current Slide 7**: "Intelligence in Action" → Hypothetical scenario

**Enhanced Slide 7-10**: "Intelligence in Action" → **LIVE DEMOS**

| Slide | Title | Content |
|-------|-------|---------|
| **7** | Intelligence in Action | Introduce: "I'm going to show you four ways intelligence changes decision-making" |
| **8** | Demo 1: Referral Network | Hospital referral ranking |
| **9** | Demo 2: Market Opportunity | Geographic site selection |
| **10** | Demo 3: Service Line Gaps | Memory care opportunity analysis |
| **11** | Demo 4: Competitive Reality | Quality positioning |
| **12** | What's at Stake | Return to opportunity cost table |
| **13** | Q&A | Open discussion |

---

## 🎯 Key Talking Points for Each Demo

### **Demo 1 Talking Points**:
- "Most SNFs market to hospitals equally because they lack data"
- "20% of hospitals typically drive 80% of profitable referrals"
- "Intelligence shows you which 20%"
- "Result: Focus marketing dollars where they have ROI"

### **Demo 2 Talking Points**:
- "Census data is public, geography is public, provider locations are public"
- "The gap is integration—putting them together"
- "This precision used to cost $50K and take 6 months"
- "Now it's real-time and free"

### **Demo 3 Talking Points**:
- "Service line decisions often made based on conferences and trends"
- "Intelligence shows you what YOUR market needs, not the industry"
- "Quantify demand, supply, and gap in minutes"
- "De-risks major capital decisions"

### **Demo 4 Talking Points**:
- "National benchmarks don't drive local referrals"
- "Hospitals discharge to the best LOCAL option"
- "Intelligence shows you how you stack up in your actual competitive set"
- "Focus quality improvement where it matters competitively"

---

## 🛠️ Pre-Presentation Technical Prep

### **Data Prep Checklist**:

**7 Days Before**:
- [ ] Select 3-4 real markets to demo (ideally ones attendees know—Nashville, Tampa, Orlando, Dallas)
- [ ] Pre-save these markets in your Markets table for quick access
- [ ] Run through each demo flow to ensure query speeds are acceptable
- [ ] Screenshot backup images in case of WiFi issues

**3 Days Before**:
- [ ] Test on presentation laptop with projector (screen resolution issues)
- [ ] Ensure vendor BigQuery credentials work from presentation venue WiFi
- [ ] Prepare "offline mode" screenshots if live demo isn't feasible
- [ ] Create handout with demo screenshots and key metrics

**Day Of**:
- [ ] Have backup laptop
- [ ] Have screenshots on USB drive
- [ ] Test internet connection
- [ ] Open all demo pages in browser tabs (pre-loaded)

---

## 📊 Handout Concept for Attendees

**One-Page Tearsheet**: "Market Intelligence Quick Wins"

```
┌─────────────────────────────────────────────────────┐
│ INTELLIGENCE IN ACTION: FOUR QUICK WINS             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 1. REFERRAL NETWORK OPTIMIZATION                   │
│    Question: Which hospitals should we prioritize? │
│    Data: Claims → facility provider → payor mix    │
│    Time: 5 minutes | Impact: Focus marketing ROI   │
│                                                     │
│ 2. MARKET EXPANSION SITE SELECTION                 │
│    Question: Where should we build next?           │
│    Data: Census tracts + demographics + providers  │
│    Time: 15 minutes | Impact: De-risk $10M+ invest │
│                                                     │
│ 3. SERVICE LINE GAP ANALYSIS                       │
│    Question: Should we add memory care?            │
│    Data: Provider density + claims + demographics  │
│    Time: 10 minutes | Impact: Quantify demand gap  │
│                                                     │
│ 4. COMPETITIVE POSITIONING                         │
│    Question: How do we compare locally?            │
│    Data: Quality measures + market boundaries      │
│    Time: 5 minutes | Impact: Right-size messaging  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ All powered by publicly available data + claims    │
│ No expensive consultants. No 6-month studies.      │
│ Intelligence. Not guesswork.                       │
└─────────────────────────────────────────────────────┘
```

---

## 🎤 Presentation Delivery Tips

### **For Each Demo**:

1. **Set Context** (15 seconds)
   - "Here's the question every operator asks..."
   
2. **Show Old Way** (15 seconds)
   - "Traditionally, you'd..."
   
3. **Demo Live** (90-120 seconds)
   - Navigate quickly, narrate what you're doing
   - "I'm selecting a market... clicking demographics... and now you can see..."
   
4. **Interpret Results** (30 seconds)
   - "What this tells us is..."
   - Point to specific data on screen
   
5. **Business Implication** (15 seconds)
   - "Which means you should..."
   - Concrete action

**Total per demo**: 2-3 minutes  
**Total for 4 demos**: 10-12 minutes  
**With transitions and questions**: 15 minutes

---

## ⚠️ Common Pitfalls to Avoid

### **Don't**:
- ❌ Apologize for the interface ("I know this looks rough, but...")
- ❌ Get lost in menus or struggle with navigation
- ❌ Show too many features—focus on the 4 demos
- ❌ Use technical jargon ("We query BigQuery using ST_CONTAINS...")
- ❌ Show bugs or errors live
- ❌ Go over time—respect the session schedule

### **Do**:
- ✅ Practice each demo 10+ times before presenting
- ✅ Have a "reset" plan if something breaks (go to screenshots)
- ✅ Narrate what you're doing ("Now I'm clicking...")
- ✅ Pause after each demo for the insight to land
- ✅ Use business language, not technical
- ✅ Smile and show enthusiasm—you're solving real problems!

---

## 🎯 Audience Engagement Techniques

### **During Demos**:

**Technique 1: The Prediction Game**
> "Before I show you the results, what do you think we'll find? How many hospitals do you think drive 80% of referrals—5? 10? 20?"
> 
> [Show answer: Usually 2-4]
>
> "Interesting, right?"

**Technique 2: The Personal Connection**
> "How many of you operate in [demo market]? Great—pay attention, you might learn something about your own backyard."

**Technique 3: The Open Question**
> "Looking at this map, if you had $15 million to build a new facility, which census tract would you choose? Anyone want to call it out?"
>
> [Point to their choice, show the data]

**Technique 4: The Validation**
> "How many of you have made a decision like this based on gut feel because you didn't have the data? [Hands go up] You're not alone. That's the industry standard. But it doesn't have to be."

---

## 📋 Post-Presentation Follow-Up

### **What to Offer Attendees**:

1. **"See Your Market" Offer**
   - "Send me your market, I'll run this analysis for you"
   - Builds your prospect list
   - Demonstrates immediate value

2. **Recorded Demo Access**
   - "Want to show your executive team? Here's the recording"
   - Extends your reach beyond the room

3. **Market Intelligence Toolkit**
   - PDF guide: "10 Questions Market Intelligence Answers"
   - Includes worksheets for each demo scenario

4. **Office Hours**
   - "Book 15 minutes with me to discuss your specific strategic question"
   - Converts interest to conversations

---

## 🎓 Why These Demos Work

### **Alignment with Learning Principles**:

1. **Concrete > Abstract**
   - Not "market intelligence is valuable"
   - But "here's $2M in referrals you're missing"

2. **Visual > Verbal**
   - Maps, charts, color-coded data
   - Easier to remember than bullet points

3. **Relevant > Generic**
   - Markets they know (Tampa, Nashville)
   - Questions they actually ask

4. **Quick > Comprehensive**
   - 2-3 minutes per demo
   - Attention span optimal range

5. **Actionable > Theoretical**
   - Each demo ends with "you should..."
   - Clear next step

---

## 🚀 Success Metrics

### **How to Know Your Demos Landed**:

**During Presentation**:
- Attendees lean forward during demos (engagement)
- Questions are about "how do I get this?" not "how does it work?" (interest)
- People take photos of screens (intent to share)
- Nodding during "reveal" moments (recognition)

**After Presentation**:
- Business cards exchanged (networking)
- "Can you analyze my market?" requests (qualified leads)
- LinkedIn connections with message referencing specific demo (recall)
- Invitations to present to their organization (expansion)

**Long-Term**:
- Demo attendees become customers (conversion)
- Referrals to colleagues not at conference (word of mouth)
- Speaking invitations to other conferences (authority building)

---

## 💡 Final Recommendations

### **For Maximum Impact**:

1. **Choose 2-3 demos, not all 4**
   - Quality over quantity
   - Go deeper on fewer examples
   - My recommendation: Demo 1 (Referral) + Demo 2 (Geographic) are must-haves

2. **Customize demos to audience**
   - AHCA = SNF/ALF operators → Focus on census drivers (referrals, site selection)
   - If different audience (hospitals, ACOs) → Adjust accordingly

3. **Make it feel effortless**
   - The more you practice, the more natural it feels
   - When you know it cold, you can improvise based on audience reaction

4. **Tie back to framework**
   - After each demo: "This is the [Dimension] dimension in action"
   - Reinforces the Five Dimensions mental model

5. **End with urgency**
   - "Your competitors are starting to use intelligence like this"
   - "The organizations that build this muscle now will win the next decade"
   - "The data is available to everyone. The question is: who will act on it first?"

---

## ✅ Action Items

**This Week**:
- [ ] Review 10 opportunities in STRATEGIC_ANALYTICS_OPPORTUNITIES.md
- [ ] Select 2-3 demos for your presentation
- [ ] Choose specific markets to showcase
- [ ] Practice demo flows

**Next Week**:
- [ ] Create backup screenshots
- [ ] Draft talking points script
- [ ] Prepare handout/takeaway
- [ ] Test on presentation equipment

**Week of Presentation**:
- [ ] Final tech check
- [ ] Rehearse with timer
- [ ] Prepare Q&A responses
- [ ] Set up follow-up process

---

You have a powerful platform that solves real problems. These demos will prove it in minutes, not months. The intelligence is built—now show them what it can do.

**Go make market intelligence tangible.** 🚀

