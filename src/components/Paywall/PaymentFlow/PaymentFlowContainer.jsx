import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PlanSelection from "./PlanSelection";
import TeamSetup from "./TeamSetup";
import PaymentForm from "./PaymentForm";
import styles from './PaymentFlow.module.css';

export default function PaymentFlowContainer() {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);
  
  // Plan selection state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [seats, setSeats] = useState(5);
  
  // Team setup state
  const [teamName, setTeamName] = useState('');
  const [companyType, setCompanyType] = useState('Provider');
  
  const [searchParams] = useSearchParams();

  // Initialize from URL params
  useEffect(() => {
    const plan = searchParams.get('plan');
    const cycle = searchParams.get('cycle');
    const seatCount = searchParams.get('seats');
    
    if (plan) setSelectedPlan(plan);
    if (cycle) setBillingCycle(cycle);
    if (seatCount) setSeats(parseInt(seatCount, 10));
  }, [searchParams]);

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
    setError(null);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handleTeamSetupNext = () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    handleNext();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Complete Your Subscription</h1>
        <p>Choose your plan and set up your team in just a few steps</p>
        <div className={styles.progress}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
            1. Plan
          </div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
            2. Team
          </div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
            3. Payment
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {currentStep === 1 && (
        <PlanSelection
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          onNext={handleNext}
        />
      )}

      {currentStep === 2 && (
        <TeamSetup
          selectedPlan={selectedPlan}
          plans={plans}
          billingCycle={billingCycle}
          seats={seats}
          setSeats={setSeats}
          teamName={teamName}
          setTeamName={setTeamName}
          companyType={companyType}
          setCompanyType={setCompanyType}
          onNext={handleTeamSetupNext}
          onBack={handleBack}
        />
      )}

      {currentStep === 3 && (
        <PaymentForm
          selectedPlan={selectedPlan}
          plans={plans}
          billingCycle={billingCycle}
          seats={seats}
          teamName={teamName}
          companyType={companyType}
          onBack={handleBack}
        />
      )}
    </div>
  );
} 