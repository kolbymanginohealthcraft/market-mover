import { useState } from 'react';
import styles from './MobileNavigationWorkshop.module.css';

const navigationPatterns = [
  {
    id: 'drawer',
    label: 'Slide-out drawer',
    headline: 'Sidebar collapses into a menu button and overlay drawer.',
    checklist: [
      'Reserve the top-left trigger and keep header actions minimal.',
      'Lock body scroll while the drawer is open to prevent overlap.',
      'Mirrors desktop navigation order for familiarity.'
    ],
    previewLabel: 'Drawer open'
  },
  {
    id: 'bottom-bar',
    label: 'Bottom action bar',
    headline: 'Primary links move to a sticky bottom rail.',
    checklist: [
      'Limit items to four key destinations.',
      'Pair text labels with concise verbs for clarity.',
      'Keep destructive or secondary actions inside overflow menus.'
    ],
    previewLabel: 'Bottom rail'
  },
  {
    id: 'quick-panel',
    label: 'Floating quick panel',
    headline: 'Contextual panel anchors to the lower edge as needed.',
    checklist: [
      'Hide the panel until a task requires fast access.',
      'Provide an obvious dismiss gesture and screen-reader label.',
      'Avoid stacking with other sticky elements on critical screens.'
    ],
    previewLabel: 'Quick panel'
  }
];

const headerModes = [
  {
    id: 'condensed',
    label: 'Condensed sticky header',
    summary: 'Shrinks to 56px with a single-line title and one action.',
    notes: [
      'Works best with a drawer trigger and search icon.',
      'Keep breadcrumbs and filters below the fold.'
    ],
    previewLabel: 'Condensed header'
  },
  {
    id: 'auto-hide',
    label: 'Auto-hide on scroll',
    summary: 'Header hides while scrolling down and returns on upward intent.',
    notes: [
      'Reserve for data-heavy dashboards where vertical space is scarce.',
      'Ensure focus management restores the header when navigated via keyboard.'
    ],
    previewLabel: 'Header hidden'
  },
  {
    id: 'stacked',
    label: 'Stacked header',
    summary: 'Header gains a secondary row for filters when needed.',
    notes: [
      'Second row should collapse into a sheet on narrow devices.',
      'Set max height to keep content visible above the fold.'
    ],
    previewLabel: 'Two-line header'
  }
];

const landingLayouts = [
  {
    id: 'stacked-hero-first',
    label: 'Stacked hero-first',
    summary: 'Hero narrative leads with text followed by image, all sections collapse into single column.',
    flow: [
      {
        title: 'Hero narrative',
        guidance: 'Text first with 24px spacing; image compresses to 280px height with rounded corners.'
      },
      {
        title: 'Why section split',
        guidance: 'Transform the two columns into a vertical card stack separated by a soft divider.'
      },
      {
        title: 'Modules spotlight',
        guidance: 'Preview chart becomes a swipeable carousel; module list converts to accordion summaries.'
      },
      {
        title: 'Feature tiles',
        guidance: 'Single column cards with condensed bullet lists and icons left-aligned.'
      },
      {
        title: 'Use cases',
        guidance: 'Two-column grid collapses to horizontal scroll cards with consistent height.'
      },
      {
        title: 'CTA banner',
        guidance: 'Full-width card pinned near footer with reduced copy and primary button.'
      }
    ],
    mobileHero: 'Text above image',
    heroNotes: 'Keep hero copy readable at 18px and allow CTA button to stretch full width.'
  },
  {
    id: 'visual-lead',
    label: 'Visual lead',
    summary: 'Hero image stacks first, copy follows with a sticky CTA and lightweight nav anchor chips.',
    flow: [
      {
        title: 'Hero visuals',
        guidance: 'Lead with imagery cropped to 16:9; overlay tagline in top-left with subtle gradient for contrast.'
      },
      {
        title: 'Quick jump chips',
        guidance: 'Place horizontal scroll chips linking to modules, features, and use cases.'
      },
      {
        title: 'Modules spotlight',
        guidance: 'Images swap to icon-only cards; keep parity with desktop order.'
      },
      {
        title: 'Feature stack',
        guidance: 'Collapse each bullet list into an accordion to control vertical scroll.'
      },
      {
        title: 'Use case wall',
        guidance: 'Group audiences into three quick-read cards; provide “View all personas” button revealing the rest.'
      },
      {
        title: 'CTA banner',
        guidance: 'Sticky bottom CTA appears after 50% scroll to avoid crowding the hero.'
      }
    ],
    mobileHero: 'Image above text',
    heroNotes: 'Promote a subtle gradient overlay so text chips remain legible over photography.'
  }
];

const heroPlacements = [
  {
    id: 'text-first',
    label: 'Text first',
    description: 'Preserves message hierarchy and keeps CTA in immediate view.',
    recommendation: 'Use when storytelling copy is the primary conversion driver.'
  },
  {
    id: 'image-first',
    label: 'Image first',
    description: 'Front-loads visuals for quick scanning and sets tone before copy.',
    recommendation: 'Use when imagery carries brand differentiation or product interface is the hook.'
  }
];

export default function MobileNavigationWorkshop() {
  const [navigation, setNavigation] = useState(navigationPatterns[0].id);
  const [header, setHeader] = useState(headerModes[0].id);
  const [showStickyFooter, setShowStickyFooter] = useState(true);
  const [landingLayout, setLandingLayout] = useState(landingLayouts[0].id);
  const [heroPlacement, setHeroPlacement] = useState(heroPlacements[0].id);

  const activeNavigation = navigationPatterns.find((pattern) => pattern.id === navigation);
  const activeHeader = headerModes.find((mode) => mode.id === header);
  const activeLandingLayout = landingLayouts.find((layout) => layout.id === landingLayout);
  const activeHeroPlacement = heroPlacements.find((placement) => placement.id === heroPlacement);

  return (
    <div className={styles.container}>
      <section className={styles.intro}>
        <div>
          <h1>Mobile Navigation Workshop</h1>
          <p>Explore how the platform sidebar and header adapt when the viewport collapses to mobile dimensions.</p>
        </div>
        <div className={styles.bannerNotes}>
          <h2>Starting points</h2>
          <p>Prioritize reachability, prevent sticky collisions, and keep high-frequency actions within thumb range.</p>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.controls}>
          <div className={styles.panel}>
            <h3>Navigation pattern</h3>
            <div className={styles.buttonGrid}>
              {navigationPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  className={navigation === pattern.id ? styles.buttonActive : styles.button}
                  onClick={() => setNavigation(pattern.id)}
                  aria-pressed={navigation === pattern.id}
                >
                  {pattern.label}
                </button>
              ))}
            </div>
            <p className={styles.panelHeadline}>{activeNavigation.headline}</p>
            <ul>
              {activeNavigation.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <h3>Header behavior</h3>
            <div className={styles.buttonGrid}>
              {headerModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={header === mode.id ? styles.buttonActive : styles.button}
                  onClick={() => setHeader(mode.id)}
                  aria-pressed={header === mode.id}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className={styles.panelHeadline}>{headerModes.find((mode) => mode.id === header)?.summary}</p>
            <ul>
              {activeHeader.notes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <h3>Sticky layers</h3>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={showStickyFooter}
                onChange={(event) => setShowStickyFooter(event.target.checked)}
              />
              <span>Show task footer for page-level actions</span>
            </label>
            <p className={styles.panelHeadline}>Use this to simulate when filters or calls to action need to remain visible.</p>
          </div>
        </div>

        <div className={styles.previewArea}>
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <h3>Viewport preview</h3>
              <p>Represents a 360px wide device. Toggle options to see potential collisions.</p>
            </div>

            <div className={styles.mobileFrame}>
              <div
                className={
                  header === 'auto-hide'
                    ? `${styles.mobileHeader} ${styles.headerHidden}`
                    : header === 'stacked'
                    ? `${styles.mobileHeader} ${styles.headerStacked}`
                    : styles.mobileHeader
                }
              >
                <div className={styles.headerRow}>
                  <span className={styles.headerTag}>{activeNavigation.previewLabel}</span>
                  <span className={styles.headerTitle}>{activeHeader.previewLabel}</span>
                </div>
                {header === 'stacked' && <div className={styles.headerSecondary}>Filters collapse into sheet</div>}
                {header === 'auto-hide' && <div className={styles.headerHint}>Header hidden until upward scroll</div>}
              </div>

              <div className={styles.mobileContent}>
                <div className={styles.contentBlock} />
                <div className={styles.contentBlock} />
                <div className={styles.contentBlock} />
                <div className={styles.contentBlockWide} />
              </div>

              {navigation === 'drawer' && (
                <div className={`${styles.overlay} ${styles.drawerOverlay}`}>
                  <div className={styles.overlayHeader}>App menu</div>
                  <div className={styles.overlayItem}>Dashboard</div>
                  <div className={styles.overlayItem}>Markets</div>
                  <div className={styles.overlayItem}>Referrals</div>
                  <div className={styles.overlayItem}>Settings</div>
                </div>
              )}

              {navigation === 'quick-panel' && (
                <div className={`${styles.overlay} ${styles.panelOverlay}`}>
                  <div className={styles.overlayHeader}>Quick tools</div>
                  <div className={styles.overlayItem}>Filters</div>
                  <div className={styles.overlayItem}>Saved view</div>
                  <div className={styles.overlayItem}>Share</div>
                </div>
              )}

              {navigation === 'bottom-bar' && (
                <div className={`${styles.mobileFooter} ${styles.footerVisible}`}>
                  <span>Home</span>
                  <span>Markets</span>
                  <span>Referrals</span>
                  <span>More</span>
                </div>
              )}

              {showStickyFooter && (
                <div className={`${styles.taskFooter} ${navigation === 'bottom-bar' ? styles.taskFooterRaised : ''}`}>
                  <span>Compare</span>
                  <button type="button">Primary action</button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.notesPanel}>
            <h3>Collision checklist</h3>
            <ul>
              <li>Confirm the drawer or panel never covers confirmation banners.</li>
              <li>Keep one tap path back to the dashboard within thumb reach.</li>
              <li>Align sticky surfaces so only two layers remain fixed at once.</li>
              <li>Audit keyboard order when overlays or footers appear.</li>
            </ul>

            <h3>Next experiments</h3>
            <ul>
              <li>Prototype gesture support for closing the drawer and quick panel.</li>
              <li>Validate header height against devices with cutouts or notches.</li>
              <li>Explore progressive enhancement for tablets with split views.</li>
            </ul>
          </div>
        </div>
      </div>

      <section className={styles.caseStudy}>
        <div className={styles.caseStudyHeader}>
          <div>
            <h2>Marketing landing page layout models</h2>
            <p>Evaluate two stacking strategies that reflow the existing desktop layout without rebuilding content.</p>
          </div>
          <div className={styles.caseControls}>
            <div>
              <span className={styles.caseLabel}>Layout strategy</span>
              <div className={styles.buttonGrid}>
                {landingLayouts.map((layoutOption) => (
                  <button
                    key={layoutOption.id}
                    type="button"
                    className={landingLayout === layoutOption.id ? styles.buttonActive : styles.button}
                    onClick={() => setLandingLayout(layoutOption.id)}
                    aria-pressed={landingLayout === layoutOption.id}
                  >
                    {layoutOption.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={styles.caseLabel}>Hero placement</span>
              <div className={styles.buttonGrid}>
                {heroPlacements.map((placement) => (
                  <button
                    key={placement.id}
                    type="button"
                    className={heroPlacement === placement.id ? styles.buttonActive : styles.button}
                    onClick={() => setHeroPlacement(placement.id)}
                    aria-pressed={heroPlacement === placement.id}
                  >
                    {placement.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.caseLayout}>
          <div className={styles.caseFlow}>
            <h3>Section flow</h3>
            <p className={styles.panelHeadline}>{activeLandingLayout.summary}</p>
            <ul>
              {activeLandingLayout.flow.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}:</strong> {step.guidance}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.casePreviewPanel}>
            <div className={styles.previewHeader}>
              <h3>Mobile marketing preview</h3>
              <p>{activeLandingLayout.heroNotes}</p>
            </div>

            <div className={`${styles.mobileFrame} ${styles.caseMobileFrame}`}>
              <div className={styles.caseHeroWrapper}>
                {heroPlacement === 'image-first' && <div className={styles.caseHeroImage}>Hero image</div>}
                <div className={styles.caseHeroCopy}>
                  <span className={styles.headerTag}>{activeLandingLayout.mobileHero}</span>
                  <h4>Smarter Decisions</h4>
                  <p>Succinct subhead trimmed for mobile readability.</p>
                  <button type="button" className={styles.casePrimaryButton}>Sign up now</button>
                </div>
                {heroPlacement === 'text-first' && <div className={styles.caseHeroImage}>Hero image</div>}
              </div>

              <div className={styles.caseSectionCard}>
                <h5>Why Market Intelligence Matters</h5>
                <p>Collapse copy into two short paragraphs and swap arrow divider for soft separator.</p>
              </div>
              <div className={styles.caseSectionCard}>
                <h5>Platform Modules</h5>
                <p>Convert module list to accordion summary with CTA links beneath each summary.</p>
              </div>
              <div className={styles.caseSectionCardTall}>
                <h5>Key Components</h5>
                <p>Single column cards; allow checklist bullets to wrap at 16px line height.</p>
              </div>
              <div className={styles.caseSectionScroll}>
                <span>Use case personas</span>
                <div className={styles.casePersonaRow}>
                  <div className={styles.casePersonaCard}>Administrator</div>
                  <div className={styles.casePersonaCard}>Clinical leader</div>
                  <div className={styles.casePersonaCard}>Referral coordinator</div>
                </div>
              </div>
              <div className={styles.caseSectionCard}>
                <h5>CTA banner</h5>
                <p>Reserve space for a light gray banner with full-width CTA.</p>
              </div>
            </div>
          </div>

          <div className={styles.caseNotes}>
            <h3>Hero placement guide</h3>
            <p className={styles.panelHeadline}>{activeHeroPlacement.description}</p>
            <ul>
              <li>{activeHeroPlacement.recommendation}</li>
              <li>Maintain a 24px safe zone above and below the primary CTA.</li>
              <li>Audit viewport height at 640px to ensure hero doesn’t overshadow scannable content.</li>
              <li>Mirror desktop order so anchors and analytics track cleanly across breakpoints.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}


