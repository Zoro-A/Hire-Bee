import { designAudit, designPrinciples } from "./data/designAudit"

function App() {
  const features = [
    {
      title: "AI Resume Intelligence",
      text: "Parse resumes, normalize skills, and score candidate-to-role fit with transparent match reasoning.",
    },
    {
      title: "Flow-Based CV Builder",
      text: "Build ATS-friendly CVs with reorderable sections, optional blocks, and export-ready layouts.",
    },
    {
      title: "Recruiter Operations",
      text: "Post jobs, review applicants, schedule interviews, and automate communication from one panel.",
    },
  ]

  const metrics = [
    { label: "Profiles Parsed", value: "12.4k" },
    { label: "Avg. Match Precision", value: "92%" },
    { label: "Hiring Teams Active", value: "148" },
  ]

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-[#171520]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#2a2354] shadow-[0_10px_30px_rgba(42,35,84,0.25)]" />
          <p className="text-lg font-semibold tracking-tight">HireBee</p>
        </div>
        <nav className="hidden items-center gap-7 text-sm text-[#5d5a72] md:flex">
          <a href="#product" className="hover:text-[#171520]">
            Product
          </a>
          <a href="#workflow" className="hover:text-[#171520]">
            Workflow
          </a>
          <a href="#design" className="hover:text-[#171520]">
            Design DNA
          </a>
          <button className="rounded-xl bg-[#2a2354] px-4 py-2 font-medium text-white transition hover:bg-[#1f1a3d]">
            Open Dashboard
          </button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-16 px-6 pb-16 md:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-[#e9e6f3] bg-white p-8 shadow-[0_24px_60px_rgba(21,16,47,0.06)]">
            <p className="mb-4 inline-flex rounded-full border border-[#d8d3ea] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#5d5a72]">
              Production-ready recruitment platform
            </p>
            <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
              Hiring workflows that feel human, fast, and data-native.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5d5a72]">
              HireBee unifies resume parsing, AI matching, CV generation, applications, and recruiter operations into one clean platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-xl bg-[#2a2354] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1a3d]">
                Start as Job Seeker
              </button>
              <button className="rounded-xl border border-[#d8d3ea] bg-white px-5 py-3 text-sm font-semibold text-[#2a2354] transition hover:bg-[#f2effb]">
                Explore Recruiter Suite
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-[#e9e6f3] bg-[#2a2354] p-8 text-white shadow-[0_24px_60px_rgba(21,16,47,0.2)]">
            <p className="text-sm text-[#d8d3ea]">Live intelligence snapshot</p>
            <div className="mt-6 space-y-5">
              {metrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#4a4378] bg-[#312a62] p-4"
                >
                  <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
                  <p className="mt-1 text-sm text-[#d8d3ea]">{item.label}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section id="product" className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6e6890]">
              Core capabilities
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Built for both candidates and recruiters
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-[#e9e6f3] bg-white p-6 shadow-[0_10px_30px_rgba(21,16,47,0.05)]"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#5d5a72]">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="rounded-3xl border border-[#e9e6f3] bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6e6890]">
            Journey map
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            How Phase 6 frontend is structured
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-4">
            {[
              "Role-based onboarding",
              "Resume parsing + CV tools",
              "Job matching + application flow",
              "Recruiter review + interview scheduling",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[#e9e6f3] bg-[#faf9fd] p-4"
              >
                <p className="text-xs font-semibold text-[#6e6890]">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm font-medium text-[#2a2354]">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="design" className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <article className="rounded-3xl border border-[#e9e6f3] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6e6890]">
              20-site inspiration audit
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              Visual references studied
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-[#5d5a72]">
              {designAudit.map((site) => (
                <div key={site} className="rounded-lg bg-[#f7f5fc] px-3 py-2">
                  {site}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-[#e9e6f3] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6e6890]">
              HireBee design principles
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              Chosen to avoid generic AI look
            </h3>
            <ul className="mt-4 space-y-3">
              {designPrinciples.map((principle) => (
                <li
                  key={principle}
                  className="rounded-xl border border-[#ece9f6] bg-[#fcfbff] px-4 py-3 text-sm text-[#47435f]"
                >
                  {principle}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
