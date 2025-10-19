# Market Mover: Analytics Capabilities & Strategic Opportunities

**Executive Summary & Quick Reference**

*Created: October 18, 2025*

---

## 📊 Current State: What You've Built

Your Market Mover platform represents a **sophisticated healthcare business intelligence system** purpose-built for post-acute and senior care strategic decision-making.

### **Core Data Assets**

| Data Category | Source | Coverage | Key Value |
|---------------|--------|----------|-----------|
| **Claims Data** | Vendor BigQuery | 130+ columns, multi-year | Procedure volume, payor mix, patient flows, service patterns |
| **Provider Data** | HCO/HCP tables | 50,000+ organizations | Locations, taxonomies, specialties, ownership |
| **Demographics** | Census Bureau ACS API | All US census tracts | Income, age, education, insurance, housing |
| **Geography** | BigQuery Public Data | National coverage | Census tracts, counties, ZIP codes with precise boundaries |
| **Quality Measures** | CMS Care Compare | SNFs, HHAs, hospice | Star ratings, survey results, outcomes |
| **MA Enrollment** | CMS | County-level | Medicare Advantage penetration trends |

### **Core Analytical Capabilities**

1. **Geographic Market Analysis**
   - Census tract-level precision (not just radius)
   - Provider density heat mapping
   - Demographic overlays (10+ metrics)
   - Distance band distribution

2. **Claims Investigation**
   - Dynamic filtering (auto-populated options)
   - SQL-style aggregation (GROUP BY, SUM, COUNT, AVG)
   - Multi-dimensional analysis (provider × service × payor × demographic)
   - Raw data exploration + summary analytics

3. **Provider Intelligence**
   - Market-defined provider lists
   - Taxonomy and specialty filtering
   - Procedure volume ranking
   - Competitive landscape mapping

4. **Market Definition & Saving**
   - User-defined markets (lat/lon + radius)
   - Persistent market library
   - Multi-market comparison ready

### **Technical Advantages**

✅ **Single-query architecture**: Vendor BigQuery can access public datasets (census, geography)  
✅ **No data transfer bottlenecks**: All processing in BigQuery  
✅ **Spatial precision**: ST_CONTAINS for exact tract membership  
✅ **Real-time**: No batch processing delays  
✅ **Scalable**: Handles metro-area sized markets in seconds  

---

## 🎯 Strategic Opportunities: What You Can Build

Based on your data assets and technical infrastructure, **10 high-value analytics opportunities** have been identified:

### **Tier 1: Immediate High-Impact** (Build First)

1. **Hospital Referral Network Analysis** 🔥
   - Which hospitals drive volume/revenue?
   - Payor mix by referral source
   - Patient origin patterns
   - **Impact**: Focus marketing on highest-ROI hospitals

2. **Competitive Leakage Analysis** 🔥
   - Where are you losing patients to competitors?
   - Which census tracts prefer which providers?
   - Distance vs quality vs choice patterns
   - **Impact**: Identify expansion opportunities, fix service gaps

3. **Greenfield Site Selection Scoring** 🔥
   - Quantitative scoring of every census tract
   - Demand factors (demographics) × Supply factors (competition)
   - "What-if" scenario planning
   - **Impact**: De-risk $10M+ facility investments

### **Tier 2: High-Value Strategic** (Build Next)

4. **Medicare Advantage Network Positioning**
   - MA enrollment density vs network participation
   - Plan-specific volume analysis
   - Network gap opportunities
   - **Impact**: Optimize contracting strategy

5. **Payor Mix Optimization**
   - Ideal payor mix by market demographics
   - Private-pay capacity heat maps
   - Payor dependency risk scoring
   - **Impact**: Revenue diversification, margin improvement

6. **Service Line Expansion Feasibility**
   - Demand (claims) vs Supply (providers) gaps
   - Service-demographic fit scoring
   - Volume projection modeling
   - **Impact**: Add profitable service lines where demand exists

### **Tier 3: Differentiation & Efficiency** (Build Later)

7. **Quality Performance Benchmarking**
   - Market-specific (not national) percentile rankings
   - Quality vs volume correlation
   - Competitive gap analysis
   - **Impact**: Focus quality improvement efforts, enhance messaging

8. **Online Reputation Integration**
   - Clinical quality vs online review correlation
   - Perception gap identification
   - Reputation competitive landscape
   - **Impact**: Align experience with outcomes

9. **Labor Market Competitiveness**
   - Labor shed mapping
   - Wage benchmarking by market
   - Staffing vulnerability scoring
   - **Impact**: Recruitment strategy, wage optimization

10. **Volume Forecasting & Capacity Planning**
    - Demographic trend modeling
    - Supply/demand balance projections
    - Market saturation timing
    - **Impact**: Strategic planning, capital timing

---

## 🎓 Educational Framework Alignment

Your **Five Dimensions of Market Intelligence** map perfectly to these opportunities:

```
         POPULATION
              │
              ├──→ Site Selection
              ├──→ Service Line Expansion
              ├──→ Volume Forecasting
              └──→ Payor Mix Optimization
              
           PAYERS
              │
              ├──→ MA Network Positioning
              ├──→ Payor Mix Optimization
              ├──→ Referral Analysis (payor patterns)
              └──→ Volume Forecasting
              
         PROVIDERS
              │
              ├──→ Competitive Leakage
              ├──→ Quality Benchmarking
              ├──→ Site Selection (competition)
              └──→ Labor Market Analysis
              
          PATHWAYS
              │
              ├──→ Referral Network Analysis
              ├──→ Competitive Leakage
              └──→ Service Line Gaps
              
        POSITIONING
              │
              ├──→ Quality Benchmarking
              ├──→ Reputation Management
              └──→ Competitive Leakage
```

**Every opportunity touches 2-3 dimensions** → Reinforces the framework while delivering tangible value.

---

## 📈 Implementation Roadmap

### **Phase 1: Revenue & Growth** (Months 1-2)
*Focus: Drive census and identify expansion*

- **Build**: Hospital Referral Dashboard
- **Build**: Competitive Leakage Maps
- **Why**: Directly impacts revenue with existing data

**Expected Outcomes**:
- Marketing teams can prioritize highest-ROI hospitals
- Identify 3-5 high-leakage areas per market for targeted campaigns
- Quantify referral opportunity (e.g., "Hospital X sends 200 patients/year to competitors")

### **Phase 2: Strategic Planning** (Months 3-4)
*Focus: Expansion and service line decisions*

- **Build**: Site Selection Scoring Model
- **Build**: Service Line Gap Analysis
- **Why**: Annual planning cycle alignment

**Expected Outcomes**:
- Rank every census tract in target metros by opportunity score
- Identify top 10 expansion sites with supporting data
- Quantify unmet demand for specific service lines (e.g., "800-patient memory care gap")

### **Phase 3: Payer Strategy** (Months 5-6)
*Focus: Contracting and revenue optimization*

- **Build**: MA Network Positioning Suite
- **Build**: Payor Mix Optimization Tools
- **Why**: Contract cycles, CFO priorities

**Expected Outcomes**:
- Identify high-value MA plans for network participation
- Model revenue impact of payor mix shifts
- Benchmark payor mix against market potential

### **Phase 4: Differentiation** (Months 7-9)
*Focus: Quality and competitive messaging*

- **Build**: Market-Specific Quality Benchmarking
- **Explore**: Online Reputation Integration
- **Why**: Referral source confidence, consumer choice

**Expected Outcomes**:
- Know exact quality ranking within competitive set
- Align marketing messaging with differentiated strengths
- Identify perception vs reality gaps

### **Phase 5: Operational Excellence** (Months 10-12)
*Focus: Efficiency and forecasting*

- **Explore**: Labor Market Analysis
- **Build**: Volume Forecasting Models
- **Why**: Workforce is #1 challenge, forecasting enables planning

**Expected Outcomes**:
- Map labor sheds and optimize recruiting
- Benchmark wages by local market
- Project census 6-24 months forward

---

## 🎤 AHCA Presentation: Recommended Approach

### **The Setup** (Your current framework works perfectly)

**Slide 1-6**: Frame the problem
- Data paradox: everywhere but no insight
- The chaos: fragmented systems
- The solution: Market Intelligence via Five Dimensions
- The challenges: why it's hard

**Slide 7-10**: **SHOW, DON'T TELL** (New recommendation)

**Live Demo 1: Hospital Referral Intelligence** (3 min)
- Claims Investigation Tool
- GROUP BY facility_provider, payor_group
- **Reveal**: Hospital A = 5X revenue of Hospital B
- **Impact**: "Stop marketing equally, focus where it matters"

**Live Demo 2: Geographic Market Opportunity** (4 min)
- Geography Analysis → Demographics Tab
- Show census tract map: elderly population + income + provider density
- **Reveal**: "Northeast quadrant = 2,100 wealthy seniors, zero SNFs"
- **Impact**: "That's where you build, not where competitors cluster"

**Live Demo 3: Service Line Gap** (3 min)
- HCO Analysis → Filter by service type
- Show provider density for memory care
- **Reveal**: "1,200 annual demand, 400 supply capacity"
- **Impact**: "800-patient gap in your backyard"

**Slide 11-12**: Close with urgency
- Opportunity cost of inaction
- Competitive advantage of intelligence

### **Why This Works**

✅ **Concrete** vs abstract (real maps, real numbers)  
✅ **Visual** vs verbal (choropleth maps, density charts)  
✅ **Relevant** vs generic (Tampa, Nashville—markets they know)  
✅ **Quick** vs comprehensive (2-3 min per demo)  
✅ **Actionable** vs theoretical (each ends with "you should...")  

---

## 💡 Quick Wins You Can Build This Week

### **#1: Hospital Referral Dashboard** (4-8 hours)

**What**:
- Query claims data: `GROUP BY facility_provider_name, payor_group`
- Aggregate: `COUNT(*), SUM(charge_total), COUNT(DISTINCT patient_zip3)`
- Sort by volume descending

**Output**: Ranked list of referring hospitals with value metrics

**Where**: New tab in Claims Investigation or standalone dashboard

**Impact**: Immediately actionable for marketing teams

---

### **#2: Service Line "Deserts" Map** (4-8 hours)

**What**:
- HCO Analysis → Add service type filter (Memory Care, LTACH, etc.)
- Geography tab → Show provider density by service
- Highlight census tracts with zero providers of selected type

**Output**: Heat map showing service gaps

**Where**: Enhancement to existing Geography Analysis page

**Impact**: Visual site selection for service line expansion

---

### **#3: Payor Mix Benchmarking** (2-4 hours)

**What**:
- Claims Investigation → Aggregation by `payor_group`
- Calculate % distribution
- Compare across NPIs in same market

**Output**: Payor mix table with peer comparison

**Where**: New summary view in Claims Investigation

**Impact**: CFOs immediately see payor concentration risk

---

## 📊 Data Architecture Insights

### **What You Learned Recently**

✅ **Vendor BigQuery CAN access public datasets**
- This eliminates 80% of your DHC crosswalk need
- Census tracts, demographics, MA enrollment all available
- Single-query architecture (no cross-instance orchestration)

✅ **Census tract approach > Simple radius**
- More accurate (respects boundaries)
- Enables demographic filtering
- Matches government reporting (MA enrollment, census)

✅ **Claims data is underutilized**
- 130+ columns = dozens of unexplored analytics
- Aggregation + filtering unlocks provider intelligence
- Referral patterns, service gaps, payor strategies all in there

### **Strategic Implications**

**Before**: "We need expensive DHC crosswalk to link provider tables"  
**After**: "We can do 80% of analytics using public data joins in vendor BigQuery"

**Before**: "Geographic filtering is approximate radius calculations"  
**After**: "We have census tract precision with demographic overlays"

**Before**: "Claims data is for compliance reporting"  
**After**: "Claims data is strategic intelligence on market behavior"

---

## 🎯 Success Metrics by Opportunity

| Opportunity | User Metric | Business Metric |
|-------------|-------------|-----------------|
| **Referral Network** | Minutes to identify top 5 hospitals | % marketing time spent on high-ROI targets |
| **Competitive Leakage** | # high-leakage tracts identified | Admissions growth in targeted tracts |
| **Site Selection** | Hours to shortlist top 10 sites | Capital deployed in high-score locations |
| **MA Positioning** | Plans identified for outreach | Contract wins with targeted plans |
| **Payor Mix** | Time to benchmark vs peers | % reduction in payor concentration |
| **Service Line Gaps** | Minutes to quantify demand gap | New service line launch success |
| **Quality Benchmarking** | Time to understand local ranking | Marketing message alignment |
| **Reputation** | Time to identify perception gaps | Online rating improvement |
| **Labor Market** | Hours to map labor shed | Recruitment cost per hire |
| **Volume Forecasting** | Time to generate 12-mo projection | Forecast accuracy (±%) |

---

## 🚀 Your Competitive Advantages

### **vs Traditional Consultants**

| Dimension | Consultants | Your Platform |
|-----------|------------|---------------|
| **Speed** | 3-6 months | 30 seconds - 15 minutes |
| **Cost** | $50K - $250K per project | Marginal cost ~$0 |
| **Currency** | Data 6-12 months old | Real-time / latest available |
| **Customization** | Fixed methodology | Infinite permutations |
| **Repeatability** | One-time deliverable | Continuous intelligence |
| **Transparency** | Black box | Full data visibility |

### **vs Generic BI Tools** (Tableau, Power BI, etc.)

| Dimension | Generic BI | Your Platform |
|-----------|-----------|---------------|
| **Data Integration** | Manual ETL required | Pre-integrated datasets |
| **Healthcare Context** | General purpose | Purpose-built for post-acute |
| **Geographic Precision** | Basic mapping | Census tract + demographics |
| **Market Intelligence** | Internal metrics only | External + internal context |
| **Learning Curve** | Steep (SQL, modeling) | Guided workflows |

### **vs Spreadsheet Analysis**

| Dimension | Spreadsheets | Your Platform |
|-----------|-------------|---------------|
| **Scale** | Manual, error-prone | Automated, validated |
| **Visualization** | Static charts | Interactive maps |
| **Collaboration** | File emailing | Shared market library |
| **Auditability** | Version chaos | Query logging |
| **Insight Generation** | Manual analysis | Guided frameworks |

---

## 📋 Next Steps Decision Tree

### **For AHCA Presentation**:

```
Do you have < 2 weeks until presentation?
│
├─ YES → Focus on AHCA_DEMO_RECOMMENDATIONS.md
│         - Pick 2-3 demos
│         - Practice until smooth
│         - Prepare backup screenshots
│         - Create handout
│
└─ NO → Consider building 1-2 new features to demo
         - Hospital Referral Dashboard (Quick Win #1)
         - Service Line Deserts Map (Quick Win #2)
         - Shows platform evolution
         - More impressive live demos
```

### **For Product Development**:

```
What's your primary goal?
│
├─ REVENUE GROWTH → Phase 1 opportunities
│                    (Referral + Leakage)
│
├─ STRATEGIC PLANNING → Phase 2 opportunities
│                        (Site Selection + Service Line)
│
├─ MARKET DIFFERENTIATION → Phase 4 opportunities
│                            (Quality + Reputation)
│
└─ OPERATIONAL EFFICIENCY → Phase 5 opportunities
                             (Labor + Forecasting)
```

### **For Customer Conversations**:

```
What does prospect care about most?
│
├─ "We need to grow census" → Show Referral Network demo
│
├─ "We're planning expansion" → Show Site Selection demo
│
├─ "We're adding service lines" → Show Service Line Gap demo
│
├─ "We need better contracts" → Show MA Positioning analysis
│
└─ "We want to understand our market" → Show Geographic Overview
```

---

## 🎓 Educational Content Bank

### **Analogies That Land**:

**Market Intelligence vs Analytics**:
> "Analytics is your rearview mirror—it shows where you've been. Intelligence is your windshield—it shows where the market is going and where the opportunities are."

**Public Data Integration**:
> "The data is like LEGO bricks scattered on the floor. Each brick (census, demographics, claims) is available to anyone. Intelligence is building something useful from those bricks—and most people never bother."

**Census Tract Precision**:
> "Radius filtering is like saying 'anyone within 25 miles of my house.' Census tracts are like saying 'anyone in these specific neighborhoods.' Same area, but one respects actual community boundaries."

**Five Dimensions**:
> "If market intelligence is a house, the Five Dimensions are the blueprint. They ensure you're not just collecting data, you're answering strategic questions."

### **Objection Handling**:

**"This seems overwhelming for a small organization"**
> "Start with one question: 'Which hospitals should we focus on?' That's one query, 5 minutes. Once you have that answer, add one more question. Intelligence scales to your capacity."

**"How much does this cost?"**
> "The data is mostly free—CMS, Census, public BigQuery datasets. The investment is time and attention. Most organizations start with 2-3 hours per month."

**"Our data is probably wrong"**
> "No data is perfect. The question is: is imperfect intelligence better than no intelligence? Would you rather make decisions with 80% accurate data or 100% gut feel?"

**"We already have dashboards"**
> "Dashboards show what happened inside your building. Intelligence shows why it happened based on what's occurring outside. It's context, not just metrics."

---

## ✅ Summary & Recommendations

### **What You've Accomplished**:
- ✅ Built sophisticated data infrastructure (census tracts + demographics + claims + providers)
- ✅ Created investigation tools (aggregation, filtering, visualization)
- ✅ Developed educational framework (Five Dimensions)
- ✅ Proven technical approach (public dataset integration)

### **What You Should Do Next**:

**Immediate** (This week):
1. Review the 10 opportunities in detail
2. Select 2-3 for AHCA demos
3. Practice demo flows until smooth
4. Prepare presentation materials

**Short-term** (Next 30 days):
1. Build 1-2 "Quick Win" dashboards
2. Refine based on user feedback
3. Document use cases and examples

**Medium-term** (Next 90 days):
1. Implement Phase 1 opportunities (Referral + Leakage)
2. Gather customer testimonials
3. Develop case studies

**Long-term** (6-12 months):
1. Build Phase 2-3 opportunities systematically
2. Expand data integrations (reputation, labor market)
3. Develop predictive models (forecasting)

---

## 📞 Questions to Consider

1. **For AHCA**: Which 2-3 demos will resonate most with SNF/ALF operators?
2. **For Product**: Which opportunities align with your go-to-market strategy?
3. **For Development**: How much development time can you allocate in next 3-6 months?
4. **For Sales**: What strategic questions do prospects ask that these don't address?

---

**You have the data infrastructure to revolutionize post-acute market intelligence.**

**The opportunities are identified. The roadmap is clear. The educational framework is ready.**

**Now: Execute, demonstrate, and win.** 🚀

---

*Related Documents*:
- `STRATEGIC_ANALYTICS_OPPORTUNITIES.md` - Detailed analysis of 10 opportunities
- `AHCA_DEMO_RECOMMENDATIONS.md` - Presentation strategy and demo scripts
- `EducationalPresentation.md` - Five Dimensions framework and Q&A
- `GEOGRAPHY_VIEWS_GUIDE.md` - Technical capabilities overview
- `NEW_FEATURES_SUMMARY.md` - Claims investigation features

