# Strategic Analytics Opportunities for Market Mover

**A Big Picture View: Expanding Healthcare Business Intelligence Capabilities**

*Based on analysis of existing data resources, educational framework, and market intelligence approach*

---

## Executive Summary

Your Market Mover platform has built a sophisticated foundation leveraging:
- **Census tract-level geographic precision** with demographic overlays
- **Claims data investigation** with 130+ columns of procedure, diagnosis, and billing information
- **Provider network analysis** (HCO/HCP) with quality measures
- **Public dataset integration** (Census, Medicare Advantage enrollment, geographic boundaries)
- **Five Dimensions framework** (Population, Payers, Providers, Pathways, Positioning)

This document identifies **10 strategic analytics opportunities** that align with post-acute and senior care business growth objectives for AHCA presentation attendees.

---

## 🎯 Analytics Opportunities by Strategic Category

### Category 1: REFERRAL NETWORK OPTIMIZATION

#### **Opportunity 1: Hospital Discharge Pattern Analysis**

**What It Is:**
Map where patients are coming FROM (acute hospitals) and identify high-value referral sources based on volume, payor mix, and patient acuity.

**Data You Have:**
- Claims data with `facility_provider_npi`, `facility_provider_name`, `facility_provider_state`
- Service codes showing acuity (DRG codes, diagnosis codes)
- Payor information (`payor_group`, `type_of_coverage`)
- Patient demographics (age, location)

**What You'd Build:**
- **Referral Source Dashboard**: Rank hospitals by referral volume to specific SNFs/HHAs
- **Payor Mix by Hospital**: Show which hospitals send high-MA vs high-Medicaid patients
- **Discharge Timing Patterns**: Identify hospitals that discharge on weekends (harder to place)
- **Geographic Catchment Map**: Visualize which zip codes drive admissions from each hospital

**Business Value:**
- **Strategic**: Target relationship-building efforts on highest-value hospitals
- **Operational**: Staff appropriately for known referral patterns
- **Financial**: Focus on hospitals sending profitable payor mix

**AHCA Presentation Angle:**
"Most SNFs treat all hospitals equally. Intelligence shows you which 20% of hospitals drive 80% of your profitable census—and which ones you're spending marketing dollars on that will never convert."

---

#### **Opportunity 2: Competitive Leakage Analysis**

**What It Is:**
Identify geographic areas where patients are bypassing your facility to go to competitors, and understand why.

**Data You Have:**
- Patient zip codes (patient_zip3, patient_state)
- Service location data
- HCO density by census tract
- Demographic data by tract

**What You'd Build:**
- **Leakage Heat Map**: Show where patients from your "natural" catchment area are going elsewhere
- **Competitor Preference Zones**: Identify tracts where specific competitors dominate
- **Distance vs Choice Analysis**: Determine if patients are bypassing you for closer options or driving farther for perceived quality
- **Service Line Leakage**: Show which service lines (PT, wound care, dialysis) leak most

**Business Value:**
- **Strategic**: Identify expansion opportunities in underserved zones
- **Marketing**: Target high-leakage areas with specific messaging
- **Service Line**: Add services that competitors offer and you don't

**AHCA Presentation Angle:**
"You think you serve a 25-mile radius. Intelligence shows you actually have strong pull in the north and west, but lose 70% of patients in the east—where your competitor has newer private rooms and better Google reviews."

---

### Category 2: PAYER STRATEGY & CONTRACTING

#### **Opportunity 3: Medicare Advantage Network Positioning**

**What It Is:**
Analyze MA plan penetration by geography, correlate with provider network inclusion, and identify contracting opportunities.

**Data You Have:**
- MA enrollment by county (existing endpoint)
- Claims payor data
- Geographic boundaries (county, census tract)
- Patient demographics

**What You'd Build:**
- **MA Penetration vs Network Coverage**: Map MA enrollment density against your network participation
- **High-Value MA Markets**: Identify counties with high MA enrollment but low provider participation (pricing power)
- **Plan-Specific Volume Analysis**: Show which MA plans drive volume to which providers
- **Network Gap Analysis**: Counties where you're not in-network but MA enrollment is growing

**Business Value:**
- **Contracting Power**: Enter negotiations knowing your value to specific plans
- **Strategic Planning**: Prioritize which MA plans to pursue
- **Revenue Optimization**: Focus on plans with better reimbursement in high-enrollment areas

**AHCA Presentation Angle:**
"Operators often negotiate with MA plans reactively. Intelligence shows you which plans have 40% market share in your county but send you zero patients—that's a $2M revenue opportunity sitting on the table."

---

#### **Opportunity 4: Payor Mix Optimization Model**

**What It Is:**
Predict optimal payor mix by market based on demographics, provider competition, and reimbursement rates.

**Data You Have:**
- Claims payor breakdown
- Demographic data (income, age, insurance coverage rates)
- Provider density
- Service types offered

**What You'd Build:**
- **Ideal Payor Mix Calculator**: Input market characteristics, output recommended payor target mix
- **Private Pay Capacity Heat Map**: Overlay income, home values, and age 65+ to identify private-pay opportunities
- **Medicaid Dependency Risk Score**: Alert markets over-reliant on single payor
- **Seasonal Payor Trends**: Show how payor mix changes by month (Medicare SNF winter spikes)

**Business Value:**
- **Risk Management**: Diversify payor mix to reduce dependency
- **Capacity Planning**: Reserve beds for high-margin private pay patients
- **Market Selection**: Choose expansion markets with favorable payor environment

**AHCA Presentation Angle:**
"Your 80% Medicaid census isn't a compliance problem—it's a strategic vulnerability. Intelligence identifies markets where demographics support 30% private-pay mix, giving you financial resilience."

---

### Category 3: MARKET EXPANSION & SITE SELECTION

#### **Opportunity 5: Greenfield Site Selection Scoring**

**What It Is:**
Develop a quantitative scoring model for evaluating new facility locations based on multiple market factors.

**Data You Have:**
- Census tract demographics (age, income, population growth)
- Provider density analysis
- Hospital locations and discharge volumes
- Medicare/Medicaid enrollment
- Geographic boundaries

**What You'd Build:**
- **Market Opportunity Score**: Weighted index combining:
  - Demand factors (elderly population growth, disability rates)
  - Supply factors (provider density, bed capacity)
  - Economic factors (income levels, insurance coverage)
  - Access factors (distance to hospitals, transportation corridors)
- **Census Tract Ranking Dashboard**: Sort every tract in a metro area by opportunity score
- **"What-If" Site Evaluator**: Input potential address, see immediate market profile
- **Competitor Distance Buffering**: Show underserved areas using Voronoi diagrams

**Business Value:**
- **Capital Allocation**: Invest in highest-probability-of-success markets
- **Risk Reduction**: Avoid saturated markets or weak demographic areas
- **Speed to Decision**: Replace months of analysis with data-driven scoring

**AHCA Presentation Angle:**
"Site selection used to mean driving around and looking at demographics. Intelligence scores every census tract in a metro area and tells you the top 10 locations—with the data to back it up."

---

#### **Opportunity 6: Service Line Expansion Feasibility**

**What It Is:**
Determine which service lines (ALF, memory care, home health, PACE, hospice) have unmet demand in specific markets.

**Data You Have:**
- Claims data showing service types, volumes, and gaps
- HCO taxonomy showing what services competitors offer
- Demographics (age, income, diagnosis patterns)
- Provider density by service type

**What You'd Build:**
- **Service Line Gap Analysis**: Compare demand (claims volume) vs supply (provider count) by service
- **Demographic Fit Scoring**: Match service lines to market demographics
  - Memory care → High 75+ population, high income
  - Medicaid ALF → Lower income, younger elderly
  - Home health → Suburban, lower density areas
- **Competitive White Space Map**: Show areas with no competitors in specific service lines
- **Volume Projection Model**: Estimate revenue potential for adding specific service

**Business Value:**
- **Revenue Growth**: Add high-margin services where demand exists
- **Market Differentiation**: Offer services competitors don't
- **Asset Utilization**: Convert underused space to profitable service lines

**AHCA Presentation Angle:**
"Your SNF operates at 75% occupancy. Intelligence shows you're in a census tract with 2,000 seniors, $90k median income, and zero memory care beds within 10 miles. That's your next revenue stream."

---

### Category 4: QUALITY & REPUTATION MANAGEMENT

#### **Opportunity 7: Quality Performance Benchmarking Intelligence**

**What It Is:**
Contextualize your quality metrics against market-specific competitors rather than national averages.

**Data You Have:**
- Quality measures endpoint (existing)
- Provider locations and service types
- Market definitions

**What You'd Build:**
- **Market-Specific Percentile Rankings**: "You're 4-star nationally, but 3rd out of 12 in your county"
- **Quality vs Volume Correlation**: Show if highest-quality providers get more referrals
- **Quality Trajectory Analysis**: Track quality score changes over time vs competitors
- **"Quality Gap" Opportunity Matrix**: Which metrics, if improved, would most improve competitive position
- **Hospital-Specific Quality Alignment**: Match your quality profile to hospital discharge priorities

**Business Value:**
- **Marketing Messaging**: Lead with quality metrics where you excel locally
- **Operational Focus**: Prioritize quality improvements that matter competitively
- **Referral Conversion**: Demonstrate quality advantage to hospitals and ACOs

**AHCA Presentation Angle:**
"Your 4-star rating is great nationally, but hospitals don't discharge nationally—they discharge locally. Intelligence shows you're the #2 quality SNF in your market for short-stay rehab. That's the message you lead with."

---

#### **Opportunity 8: Online Reputation vs Clinical Quality Correlation**

**What It Is:**
Integrate online reputation data (Google reviews, star ratings) with clinical quality metrics to understand perception vs reality gaps.

**Data You Have:**
- Clinical quality measures
- Provider locations and characteristics
- Volume and procedure data

**What You'd Enhance With:**
- Web scraping or APIs for Google reviews, Caring.com ratings
- Sentiment analysis on review text

**What You'd Build:**
- **Perception Gap Dashboard**: Compare star ratings to clinical quality scores
- **Reputation by Service Line**: Analyze reviews by service type (rehab vs long-term care)
- **Competitive Reputation Landscape**: Map quality + reputation for all providers in market
- **Review Response Effectiveness**: Track quality score changes after implementing review management

**Business Value:**
- **Marketing ROI**: Invest in online reputation where it drives census
- **Service Recovery**: Identify areas where experience doesn't match clinical quality
- **Referral Alignment**: Understand what matters to consumers vs hospitals

**AHCA Presentation Angle:**
"You have excellent clinical outcomes but 3.2 Google stars because of food complaints. Intelligence shows competitors with worse outcomes but 4+ stars get more direct admissions. Fix the perception gap."

---

### Category 5: WORKFORCE & OPERATIONAL EFFICIENCY

#### **Opportunity 9: Labor Market Competitiveness Analysis**

**What It Is:**
Analyze workforce supply/demand dynamics in your markets relative to competitor density and wage trends.

**Data You Have:**
- Provider density (facilities competing for staff)
- Census tract demographics (working-age population, income levels)
- Service types (staffing intensity varies)

**What You'd Enhance With:**
- Bureau of Labor Statistics data (healthcare wages by metro area)
- State workforce databases (CNA registries, nurse licensing)

**What You'd Build:**
- **Labor Shed Analysis**: Map where your workers likely live based on income and commute patterns
- **Competitor Staffing Pressure Index**: Markets with high provider density = tight labor
- **Wage Competitiveness Benchmarking**: Compare local healthcare wages to your pay structure
- **Staffing Vulnerability Score**: Markets at risk due to worker shortages
- **Recruitment Zone Mapping**: Identify census tracts for targeted recruiting based on demographics

**Business Value:**
- **Recruitment Strategy**: Focus recruiting in areas with right demographics
- **Wage Strategy**: Set wages competitively based on local market, not national
- **Expansion Planning**: Avoid markets with severe labor constraints

**AHCA Presentation Angle:**
"Everyone blames workforce shortages. Intelligence shows your facility is in a census tract with 8 competing SNFs and below-market wages—you're not competing for the same small labor pool, you're losing it."

---

#### **Opportunity 10: Volume Forecasting & Capacity Planning**

**What It Is:**
Predict future census based on demographic trends, competitor changes, and historical patterns.

**Data You Have:**
- Census projections (Census Bureau)
- Provider supply (current and new facilities)
- Historical claims volume trends
- Payor enrollment trends (MA growth)

**What You'd Build:**
- **Demand Forecasting Model**: Project elderly population growth by census tract over 5/10 years
- **Supply/Demand Balance**: Forecast provider bed capacity vs projected need
- **Market Saturation Timeline**: Predict when markets tip from undersupplied to oversupplied
- **Census Risk Alerts**: Markets where competitor openings will pressure your occupancy
- **Capital Investment Timing**: Optimal years to expand based on demand curves

**Business Value:**
- **Strategic Planning**: Align capital investments with demand growth
- **Risk Mitigation**: Exit saturating markets before occupancy drops
- **Competitive Advantage**: Enter growth markets before competitors

**AHCA Presentation Angle:**
"Your county's 65+ population is projected to grow 35% by 2030, but three new SNFs are already permitted. Intelligence shows you have a 4-year window of opportunity before the market saturates."

---

## 🎓 Educational Framework Alignment

### Mapping Opportunities to "Five Dimensions"

| Opportunity | Population | Payers | Providers | Pathways | Positioning |
|-------------|------------|--------|-----------|----------|-------------|
| **Referral Network Optimization** | ✓ | ✓ | | ✓ | |
| **Competitive Leakage** | ✓ | | ✓ | ✓ | ✓ |
| **MA Network Positioning** | ✓ | ✓ | ✓ | | ✓ |
| **Payor Mix Optimization** | ✓ | ✓ | | | |
| **Site Selection Scoring** | ✓ | ✓ | ✓ | | |
| **Service Line Expansion** | ✓ | ✓ | ✓ | | ✓ |
| **Quality Benchmarking** | | | ✓ | | ✓ |
| **Reputation Management** | | | ✓ | | ✓ |
| **Labor Market Analysis** | ✓ | | ✓ | | |
| **Volume Forecasting** | ✓ | ✓ | ✓ | | |

### AHCA Presentation Integration

Each opportunity above includes a **presentation angle**—a one-sentence hook that:
1. Acknowledges current industry practice ("What operators do now")
2. Contrasts with intelligence-driven approach ("What intelligence reveals")
3. Quantifies the opportunity or risk ("The dollars/impact at stake")

These can be woven into your "Intelligence in Action" section (Slide 7) as concrete examples.

---

## 📊 Implementation Complexity Matrix

| Opportunity | Data Availability | Development Effort | Strategic Impact | Priority |
|-------------|------------------|-------------------|------------------|----------|
| **Referral Network Analysis** | ✓✓✓ High (already have) | Medium | Very High | **🔥 P1** |
| **Competitive Leakage** | ✓✓✓ High | Medium | Very High | **🔥 P1** |
| **MA Network Positioning** | ✓✓ Medium (have enrollment) | Medium | High | **P2** |
| **Payor Mix Optimization** | ✓✓✓ High | Low | High | **P2** |
| **Site Selection Scoring** | ✓✓✓ High | High | Very High | **🔥 P1** |
| **Service Line Expansion** | ✓✓✓ High | Medium | High | **P2** |
| **Quality Benchmarking** | ✓✓ Medium (need enhancements) | Medium | Medium | **P3** |
| **Reputation Management** | ✓ Low (need external data) | High | Medium | **P3** |
| **Labor Market Analysis** | ✓ Low (need BLS data) | High | Medium | **P3** |
| **Volume Forecasting** | ✓✓ Medium | High | High | **P2** |

**Priority Definitions:**
- **P1**: High impact, high data availability, clear path to implementation
- **P2**: High impact, moderate data gaps or complexity
- **P3**: Valuable but requires significant new data sources or complex modeling

---

## 💡 Quick Wins vs Long-Term Plays

### **Quick Wins** (Can build with existing data, <2 weeks each)

1. **Hospital Referral Dashboard**
   - Claims data → Group by facility_provider → Rank by volume and payor mix
   - **Value**: Immediately actionable for marketing teams

2. **Service Line Gap Heat Maps**
   - HCO taxonomy → Count providers by service type per census tract
   - Claims → Identify high procedure volume areas with low provider counts
   - **Value**: Spot white space opportunities in days, not months

3. **Payor Mix Benchmarking**
   - Claims → Aggregate payor mix by market
   - Demographics → Overlay income/age to explain variations
   - **Value**: Validate or challenge current payor strategy

4. **Provider Density "Deserts" Identification**
   - Already built! (Geography tab shows "No Providers" tracts)
   - Enhancement: Add demographic scoring to rank deserts by opportunity
   - **Value**: Site selection shortlist in minutes

### **Long-Term Strategic Plays** (Require new data or complex models, 1-3 months each)

1. **Predictive Volume Forecasting**
   - Build time-series models using historical claims
   - Layer in demographic projections and competitor pipeline
   - **Value**: 5-year strategic planning foundation

2. **MA Network Optimization Suite**
   - Integrate MA contract terms with enrollment and claims data
   - Model revenue impact of different network participation scenarios
   - **Value**: Multi-million dollar contracting decisions

3. **Labor Market Competitiveness Platform**
   - Integrate BLS wage data, CNA registries, commute patterns
   - Model optimal wage structures by market
   - **Value**: Solve #1 operational challenge (staffing)

---

## 🚀 Recommended Implementation Roadmap

### **Phase 1: Referral & Network Intelligence** (Months 1-2)
- Build: Hospital Referral Dashboard
- Build: Competitive Leakage Analysis
- **Why first**: Directly drives census (revenue) with existing data

### **Phase 2: Expansion & Growth** (Months 3-4)
- Build: Site Selection Scoring Model
- Build: Service Line Gap Analysis
- **Why second**: Supports strategic planning cycles (typically annual)

### **Phase 3: Payer Strategy** (Months 5-6)
- Enhance: MA Network Positioning
- Build: Payor Mix Optimization
- **Why third**: Requires more complex data integration but high ROI

### **Phase 4: Quality & Differentiation** (Months 7-9)
- Build: Market-Specific Quality Benchmarking
- Explore: Online Reputation Integration (if data accessible)
- **Why fourth**: Important but less urgent than revenue/growth analytics

### **Phase 5: Operational Efficiency** (Months 10-12)
- Explore: Labor Market Analysis (if BLS data integration feasible)
- Build: Volume Forecasting Models
- **Why last**: High complexity, longer time to value

---

## 🎯 Alignment with Your Educational Message

Your EducationalPresentation.md emphasizes:
- **"Data is everywhere, insight is rare"** → These opportunities convert raw data to actionable insight
- **Five Dimensions Framework** → Each opportunity explicitly addresses 2-3 dimensions
- **"Market intelligence ≠ Internal analytics"** → All opportunities focus on external market context
- **"Bridge between analytics and strategy"** → Every opportunity links to specific business decisions

### Sample AHCA Presentation Flow Enhancement:

**Current Slide 7: "Intelligence in Action"**

You could add a concrete demonstration:

> **Hypothetical Scenario: Should We Expand to Tampa?**
>
> **Without Intelligence:**
> - "Tampa is growing, so probably yes"
> - Relies on anecdote and national trends
> - 6-12 month analysis paralysis
>
> **With Intelligence (Live Demo):**
> 1. **Population**: Show census tract demographic map → 15% growth in 75+ over 5 years
> 2. **Payers**: MA enrollment at 42% and rising → Favorable reimbursement environment
> 3. **Providers**: Provider density map shows southern suburbs underserved
> 4. **Pathways**: Hospital referral analysis shows 3 acute hospitals with discharge gaps
> 5. **Positioning**: Quality benchmarking shows opportunity to be top-tier in submarket
>
> **Decision**: Yes, expand—specifically to Hillsborough County census tracts 12057013401-13408. Estimated 120-bed SNF with SNF + ALF license. Projected census: 105 within 18 months based on referral capture model.
>
> **Time to decision**: 2 hours of analysis vs 6 months of consultants.

---

## 📋 Summary: What You Should Do Next

### **For Your AHCA Presentation:**

1. **Choose 2-3 Opportunities** from the P1 list to demonstrate live or via screenshots
   - Recommendation: Referral Network + Site Selection + Service Line Gaps
   - These span multiple dimensions and have clear "dollars at stake"

2. **Prepare "Before/After" Slides** showing:
   - Before: "How operators traditionally make this decision"
   - After: "How intelligence changes the decision process"
   - Impact: "The measurable outcome difference"

3. **Add to Q&A Prep**: Anticipated question: "Can you show me a real example?"
   - Answer: Walk through one of the opportunities with anonymized market data

### **For Product Development:**

1. **Immediate** (This month):
   - Build Hospital Referral Dashboard (highest ROI, easiest to build)
   - Enhance Provider Density with demographic scoring

2. **Short-term** (Next quarter):
   - Site Selection Scoring Model
   - Service Line Gap Analysis with volume projections

3. **Medium-term** (6 months):
   - MA Network Positioning suite
   - Volume forecasting

### **For Data Architecture:**

1. **Leverage what you have**:
   - Census tract infrastructure is game-changing—use it everywhere
   - Claims data is underutilized—huge opportunity

2. **Strategic data additions to consider**:
   - BLS wage data (for labor market analytics)
   - Online reputation APIs (for quality/reputation correlation)
   - State licensing databases (for competitor pipeline tracking)

3. **Don't need**:
   - Expensive third-party market intelligence—you can build most of it
   - Complex DHC crosswalks for 80% of use cases—census tract approach solves it

---

## 🎓 Final Thought

Your platform sits at the intersection of **data you control** (claims, provider info, quality measures) and **data freely available** (Census, MA enrollment, geography). The strategic opportunity isn't acquiring more data—it's **synthesizing what exists into decision-ready intelligence**.

Each opportunity above answers a specific business question that post-acute operators face daily:
- "Which hospital should I visit this week?"
- "Where should we build our next facility?"
- "Should we add memory care beds?"
- "Which MA plans should we contract with?"

Intelligence is the **operationalization of the Five Dimensions framework**. These opportunities make it real.

---

## 📞 Next Steps Questions to Consider

1. Which opportunities resonate most with your target AHCA audience?
2. Do you want to build any of these as demos for the presentation?
3. Are there specific strategic questions your users ask that aren't covered here?
4. What timeline do you have for the AHCA presentation?

I'm ready to help build any of these opportunities or refine them based on your priorities. You have exceptional data infrastructure—now it's about directing it toward the highest-value business problems.

