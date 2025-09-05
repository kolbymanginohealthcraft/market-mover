import React from "react";
import { Link } from "react-router-dom";
import styles from "./MarketingPage.module.css";
import Button from "../../../components/Buttons/Button";
import Hero from "./Hero";
import About from "./About";
import HowItWorks from "./HowItWorks";
import WhosItFor from "./WhosItFor";
import TestimonialCarousel from "./TestimonialCarousel";
import MarketPreview from "./MarketPreview";

const MarketingPage = () => {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <Hero />
      
      {/* About Section */}
      <About />
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Who's It For Section */}
      <WhosItFor />
      
      {/* Testimonial Carousel (commented out) */}
      {/* <TestimonialCarousel /> */}
      
      {/* Market Preview Section */}
      <MarketPreview />

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2>Ready to Explore?</h2>
          <Link to="/signup">
            <Button variant="accent" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MarketingPage;
