import { Link } from "react-router-dom";

const sections = [
  {
    title: "Why Cookies Are Used",
    body: "Cookies help remember your session, improve navigation, and keep the platform responsive and secure.",
  },
  {
    title: "Types We Use",
    body: "We may use essential cookies for login and security, plus preference cookies for a smoother experience.",
  },
  {
    title: "Managing Cookies",
    body: "You can usually control cookies through your browser settings, but disabling some cookies may affect site functionality.",
  },
];

export default function Cookies() {
  return (
    <div className="min-h-screen bg-dark-400 px-6 py-24 text-white md:px-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">Legal</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Cookie Policy</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
            This page explains how cookies and similar technologies may be used on the platform.
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
          <h2 className="text-lg font-bold text-white">Control Options</h2>
          <p className="mt-2 text-sm leading-7 text-white/70">
            You can clear cookies anytime from your browser settings if you want to remove stored session data.
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
