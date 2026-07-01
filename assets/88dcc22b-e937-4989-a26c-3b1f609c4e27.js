// Wizard host — orchestrates the 5 steps

const WizardHost = ({ onFinish }) => {
  const [step, setStep] = React.useState(1);
  const [completed, setCompleted] = React.useState([]);
  const [data, setData] = React.useState({});

  const markDone = (s) => setCompleted(c => c.includes(s) ? c : [...c, s]);
  const updateData = (key, val) => setData(d => ({ ...d, [key]: val }));

  const goNext = () => {
    markDone(step);
    if (step < 5) setStep(step + 1);
    else onFinish();
  };
  const goBack = () => step > 1 && setStep(step - 1);
  const goSkip = () => { if (step < 5) setStep(step + 1); };

  let stepDisabled = false;
  if (step === 1) stepDisabled = !data.directory;
  if (step === 2) stepDisabled = !data.synced;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-canvas)" }}>
      {/* Header */}
      <div style={{ height: 56, padding: "0 32px", borderBottom: "1px solid var(--border)", background: "var(--bg-app)", display: "flex", alignItems: "center", gap: 16 }}>
        <Logo size={22}/>
        <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }}/>
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>First-run setup · Step {step} of 5</span>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-sm" onClick={onFinish}>Exit setup</button>
      </div>

      <WizardSteps.StepIndicator step={step} completed={completed}/>

      {step === 1 && <WizardSteps.Step1Connect tested={!!data.directory} onTested={d => updateData("directory", d)}/>}
      {step === 2 && <WizardScreens.Step2Sync synced={!!data.synced} onSynced={() => updateData("synced", true)}/>}
      {step === 3 && <WizardScreens.Step3Map onMapped={m => updateData("mapping", m)}/>}
      {step === 4 && <WizardScreens.Step4MFA onConfigured={c => updateData("mfa", c)}/>}
      {step === 5 && <WizardScreens.Step5Validate wizardData={data} onFinish={onFinish}/>}

      <WizardSteps.WizardFooter
        onBack={step > 1 ? goBack : null}
        onSkip={step < 5 ? goSkip : null}
        onContinue={goNext}
        continueLabel={step === 5 ? "Finish setup" : "Continue"}
        continueDisabled={stepDisabled}
      />
    </div>
  );
};

window.WizardHost = WizardHost;
