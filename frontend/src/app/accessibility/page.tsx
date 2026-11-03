import type { Metadata } from "next";
import LegalPage from "@/components/landingPage/LegalPage";

export const metadata: Metadata = { title: "Accessibility | Logical Links" };

export default function AccessibilityPage() {
  return (
    <LegalPage
      title="Accessibility"
      updated="November 2026"
      intro="Logical Links is committed to making our website and customer portal usable by as many people as possible, including people with disabilities. We aim to follow the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and the requirements of the Accessibility for Ontarians with Disabilities Act (AODA) where they apply to us."
      sections={[
        {
          heading: "What we are doing",
          paragraphs: [
            "We aim to use clear page structure and headings, sufficient colour contrast, text alternatives for meaningful images, and layouts that work on phones, tablets and computers. We design forms and navigation so they can be used with a keyboard.",
            "Accessibility is part of how we build and review new pages, and we continue to look for ways to improve.",
          ],
        },
        {
          heading: "Known limitations",
          paragraphs: [
            "Some parts of the site, including older content and third-party features such as maps and address search, may not yet fully meet these standards. We are working to address these areas.",
          ],
        },
        {
          heading: "Need help or an alternative format?",
          paragraphs: [
            "If you have difficulty using any part of our website, or you would like information in a different format, please contact us and we will work with you to provide it or to complete your request another way, such as by phone.",
            "We welcome your feedback on the accessibility of our site and will respond as quickly as we can.",
          ],
        },
      ]}
    />
  );
}
