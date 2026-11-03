import type { Metadata } from "next";
import LegalPage from "@/components/landingPage/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | Logical Links" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 2026"
      intro="Logical Links respects your privacy. This policy explains what personal information we collect, how we use it, and the choices you have. We handle personal information in line with applicable Canadian privacy law, including the Personal Information Protection and Electronic Documents Act (PIPEDA)."
      sections={[
        {
          heading: "Information we collect",
          paragraphs: [
            "Account details such as your name, email address, telephone number, company name and business address, and your password (stored securely and never visible to us).",
            "Shipment and quotation details you provide, such as pickup and delivery addresses, cargo descriptions, dates and special instructions.",
            "Messages you send us through our contact forms, support tickets and email, and basic technical information such as your browser type and IP address when you use our website.",
          ],
        },
        {
          heading: "How we use your information",
          paragraphs: [
            "To create and manage your account, prepare quotations, arrange and track shipments, issue invoices, and provide customer support.",
            "To send service-related communications, such as application updates, quotation and delivery notifications, and replies to your enquiries.",
            "To maintain the security of our systems, prevent fraud, and meet our legal and accounting obligations.",
          ],
        },
        {
          heading: "Sharing your information",
          paragraphs: [
            "We share information only as needed to deliver our services, for example with carriers and delivery providers arranging your shipment, and with service providers that help us run our platform (such as hosting and email delivery). These providers may only use your information to perform services for us.",
            "We do not sell your personal information. We may disclose information where required by law or to protect our rights and the safety of others.",
          ],
        },
        {
          heading: "Retention and security",
          paragraphs: [
            "We keep personal information only as long as needed for the purposes described above and to meet legal and record-keeping requirements. We use reasonable technical and organizational safeguards to protect it, although no online system can be guaranteed to be completely secure.",
          ],
        },
        {
          heading: "Your choices and rights",
          paragraphs: [
            "You may ask to access, correct or delete the personal information we hold about you, or withdraw consent for optional communications, by contacting us using the details below. We will respond within a reasonable time and in line with applicable law.",
          ],
        },
        {
          heading: "Changes to this policy",
          paragraphs: [
            "We may update this policy from time to time. The date at the top of this page shows when it was last revised.",
          ],
        },
      ]}
    />
  );
}
