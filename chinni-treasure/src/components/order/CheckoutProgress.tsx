"use client";

interface Step {
  number: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Personal", description: "Who is this order for?" },
  { number: 2, label: "Delivery", description: "Where should we send it?" },
  { number: 3, label: "Payment", description: "Pay and confirm" },
];

interface CheckoutProgressProps {
  currentStep: number;
}

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="checkout-progress" role="navigation" aria-label="Checkout progress">
      <div className="checkout-progress-step-label" aria-live="polite">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label}
      </div>
      <div className={`checkout-progress-bar step-${currentStep}`}>
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === STEPS.length - 1;

          return (
            <div
              key={step.number}
              className={`checkout-step${isCompleted ? " completed" : ""}${isCurrent ? " current" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="checkout-step-indicator">
                <span className="checkout-step-circle" aria-hidden="true">
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>
                {!isLast && <div className="checkout-step-connector" />}
              </div>
              <span className="checkout-step-label">{step.label}</span>
              <span className="checkout-step-desc">{step.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
