import { Link } from "react-router-dom";

const sections = [
  {
    title: "Using the Platform",
    body: "You agree to use the platform for lawful learning purposes, keep your account secure, and not misuse tests, content, or access controls.",
  },
  {
    title: "Subscriptions & Payments",
    body: "Paid plans are billed through the available payment flow. Subscription access depends on your active plan and may change if payment fails or is refunded.",
  },
  {
    title: "Content & Availability",
    body: "We may update, pause, or remove features, tests, or content at any time to maintain quality, security, or compliance.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-dark-400 px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">Legal</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Terms &amp; Conditions</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
            These terms describe the basic rules for using the learning platform and its content.
          </p>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/70">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-bold text-white">Acceptance</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">
            By continuing to use the site, you agree to these terms and any future updates we publish.
          </p>
        </section>

        <div>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg btn-gradient px-5 py-3 text-sm font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
