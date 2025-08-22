import React, { useState, useEffect } from "react";

export default function DetailedLoadingSpinner({ 
  message = "Loading provider analysis...",
  loadingStates = {},
  showProgress = true 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Define the loading steps in order
  const loadingSteps = [
    { key: 'provider', label: 'Loading provider details' },
    { key: 'nearbyProviders', label: 'Fetching nearby providers' },
    { key: 'ccns', label: 'Loading provider CCNs' },
    { key: 'npis', label: 'Loading provider NPIs' },
    { key: 'censusData', label: 'Fetching population statistics' },
    { key: 'qualityMeasures', label: 'Loading quality measures' }
  ];

  // Update completed steps based on loading states
  useEffect(() => {
    const completed = new Set();
    loadingSteps.forEach(step => {
      if (loadingStates[step.key] === false) { // false means loading is complete
        completed.add(step.key);
      }
    });
    setCompletedSteps(completed);
  }, [loadingStates]);

  // Update current step
  useEffect(() => {
    const current = loadingSteps.findIndex(step => 
      loadingStates[step.key] === true || !completedSteps.has(step.key)
    );
    setCurrentStep(Math.max(0, current));
  }, [loadingStates, completedSteps]);

  const totalSteps = loadingSteps.length;
  const completedCount = completedSteps.size;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "40vh",
        fontSize: "1.5rem",
        color: "#1DADBE",
        paddingTop: "60px",
        gap: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div className="loader" />
        <span>{message}</span>
      </div>

      {showProgress && (
        <div style={{ 
          width: "400px", 
          maxWidth: "90vw",
          textAlign: "center" 
        }}>
          {/* Progress bar */}
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#f3f3f3",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "20px"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#1DADBE",
              transition: "width 0.3s ease-in-out"
            }} />
          </div>

          {/* Loading steps */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            fontSize: "0.9rem",
            textAlign: "left"
          }}>
            {loadingSteps.map((step, index) => {
              const isCompleted = completedSteps.has(step.key);
              const isCurrent = index === currentStep && !isCompleted;
              const isPending = index > currentStep;

              return (
                <div 
                  key={step.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: isPending ? 0.5 : 1,
                    color: isCompleted ? "#4CAF50" : isCurrent ? "#1DADBE" : "#666"
                  }}
                >
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: isCompleted ? "#4CAF50" : isCurrent ? "#1DADBE" : "#ddd",
                    backgroundColor: isCompleted ? "#4CAF50" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    color: "white"
                  }}>
                    {isCompleted ? "✓" : isCurrent ? "●" : ""}
                  </div>
                  <span>{step.label}</span>
                  {isCurrent && (
                    <div className="mini-loader" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress text */}
          <div style={{ 
            marginTop: "15px", 
            fontSize: "0.8rem", 
            color: "#666" 
          }}>
            {completedCount} of {totalSteps} steps completed
          </div>
        </div>
      )}

      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1DADBE;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }

        .mini-loader {
          width: 12px;
          height: 12px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #1DADBE;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
