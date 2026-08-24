import BrandIcon, { type IconName } from "@/components/BrandIcon";

const steps = [
  {
    icon: "note" as IconName,
    title: "Pick your repair",
    desc: "Choose your device category, brand and model from the repair catalogue.",
  },
  {
    icon: "chat" as IconName,
    title: "Select services & book",
    desc: "Add the services you need, pick a pickup date and confirm your booking online.",
  },
  {
    icon: "wrench" as IconName,
    title: "We fix it fast",
    desc: "Drop off your device and most repairs are completed within 24 hours.",
  },
  {
    icon: "package" as IconName,
    title: "Track & pick up",
    desc: "Use your tracking ID anytime to follow the repair progress online.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section section--tint" id="how-it-works">
      <div className="container">
        <div className="section__header">
          <div className="section__eyebrow">Simple process</div>
          <h2 className="section__title">How It Works</h2>
          <p className="section__lead">
            From cracked screen to working device in four easy steps.
          </p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={index}>
              <div className="step__icon"><BrandIcon name={step.icon} /></div>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}