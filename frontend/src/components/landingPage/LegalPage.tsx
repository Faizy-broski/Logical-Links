import Header from "@/components/landingPage/Header";
import Footer from "@/components/landingPage/Footer";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/support-contact";

export type LegalSection = { heading: string; paragraphs: string[] };

// Shared shell for the public legal pages (privacy, terms, accessibility).
export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="landing-page min-h-screen bg-white flex flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-36">
        <h1 className="text-3xl font-bold text-black sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {updated}</p>
        <p className="mt-8 leading-relaxed text-black">{intro}</p>

        {sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="mb-3 text-xl font-semibold text-black">{section.heading}</h2>
            {section.paragraphs.map((p) => (
              <p key={p} className="mb-3 leading-relaxed text-black">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-10 rounded-xs border border-gray-100 p-6">
          <h2 className="mb-2 text-lg font-semibold text-black">Contact us</h2>
          <p className="leading-relaxed text-black">
            Questions about this page? Email{" "}
            <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            or call {SUPPORT_PHONE}.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
