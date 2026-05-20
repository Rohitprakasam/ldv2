import Link from "next/link";

const metrics = [
  { label: "Classes", value: "4" },
  { label: "Report store", value: "RFID" },
  { label: "Backend", value: "Flask" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1417] text-slate-100">
      <header className="border-b border-slate-800 bg-[#11191d]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-cyan-300">Clinical AI workstation</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              Lung Disease Classification
            </h1>
          </div>
          <Link
            href="/class"
            className="rounded-md bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-200"
          >
            Open Workstation
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <p className="text-base font-medium text-emerald-300">X-ray prediction with patient-linked report history</p>
          <h2 className="mt-4 max-w-3xl text-5xl font-semibold tracking-normal text-white sm:text-6xl">
            Scan, diagnose, and retrieve reports from one patient flow.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            The system classifies chest X-rays, generates PDF reports, and links patient records to RFID card UIDs for fast lookup during repeat visits.
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-md border border-slate-800 bg-[#151d21] p-4">
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-[#151d21] p-5 shadow-lg shadow-black/20">
          <div className="border-b border-slate-800 pb-4">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-cyan-300">Workflow</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">Patient report cycle</h3>
          </div>

          <div className="mt-5 divide-y divide-slate-800 overflow-hidden rounded-md border border-slate-800">
            {["Register patient and RFID UID", "Upload chest X-ray", "Generate diagnosis PDF", "Tap card to reopen history"].map((item, index) => (
              <div key={item} className="flex items-center gap-4 bg-[#10181c] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-cyan-200">
                  {index + 1}
                </span>
                <p className="font-medium text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
