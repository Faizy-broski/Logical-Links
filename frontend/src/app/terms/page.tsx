import type { Metadata } from "next";
import LegalPage from "@/components/landingPage/LegalPage";

export const metadata: Metadata = { title: "Terms of Service | Logical Links" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 2026"
      intro="These terms govern your use of the Logical Links website and customer portal. By creating an account or using our services, you agree to them. If you do not agree, please do not use the site."
      sections={[
        {
          heading: "Our services",
          paragraphs: [
            "Logical Links arranges shipping and delivery services, including freight brokerage, courier and last-mile delivery, medical deliveries, specialized transport and logistics consultancy. Many services are performed by carriers and service providers in our network, and availability depends on the shipment and the provider.",
          ],
        },
        {
          heading: "Accounts",
          paragraphs: [
            "You must provide accurate information when you register and keep it up to date. You are responsible for keeping your login details confidential and for activity under your account. Corporate accounts are reviewed by our team and may be approved, paused or declined at our discretion.",
          ],
        },
        {
          heading: "Quotations and bookings",
          paragraphs: [
            "Residential quotations are produced through our automated process. Corporate quotations are prepared individually and are valid for 10 days unless stated otherwise. A quotation is an offer based on the information you provide; prices and availability may change if the shipment details differ from what was quoted.",
            "You are responsible for the accuracy of pickup and delivery details, descriptions and declared weights, and for disclosing any special handling or documentation requirements before booking.",
          ],
        },
        {
          heading: "Payment",
          paragraphs: [
            "Fees are as stated in your accepted quotation or invoice. Invoices are payable by the due date shown. We may suspend services on accounts with overdue balances.",
          ],
        },
        {
          heading: "Prohibited shipments",
          paragraphs: [
            "You may not ship items that are illegal or restricted by law, or dangerous goods without prior written arrangement and the required documentation.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "We work to deliver reliable service, but to the extent permitted by law we are not liable for indirect or consequential losses, or for delays or damage caused by events beyond our reasonable control. Any liability for loss or damage to a shipment is subject to the terms of the carrier handling it and to any coverage arranged in writing.",
          ],
        },
        {
          heading: "Changes and governing law",
          paragraphs: [
            "We may update these terms from time to time; continued use after a change means you accept the updated terms. These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable there.",
          ],
        },
      ]}
    />
  );
}
