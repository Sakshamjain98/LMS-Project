import { Link } from "react-router-dom";

const sections = [
  {
    title: "Information We Collect",
    body: "We collect account details, learning activity, device information, and content you submit so the platform can work properly and improve your experience.",
  },
  {
    title: "How We Use It",
    body: "We use data to provide tests, track progress, prevent misuse, support subscriptions, and send important platform updates.",
  },
  {
    title: "Sharing & Security",
    body: "We do not sell your personal data. We may share limited data with trusted service providers that help us operate the platform, and we protect it using reasonable safeguards.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-dark-400 px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">Legal</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Privacy Policy</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
            This page explains how we collect, use, and protect your information while you use the learning platform.
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
          <h2 className="text-lg font-bold text-white">Contact</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">
            If you have privacy questions, contact our support team through the footer email on the home page.
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
