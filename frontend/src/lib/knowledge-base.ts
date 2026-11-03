// Customer-facing Knowledge Base content (client-supplied, Oct 2026).
// Rendered as an accordion on the corporate and residential Support pages.

export type KnowledgeBaseBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] };

export interface KnowledgeBaseItem {
  title: string;
  blocks: KnowledgeBaseBlock[];
}

export interface KnowledgeBaseSection {
  slug:    string;
  title:   string;
  summary: string;
  items:   KnowledgeBaseItem[];
}

export const KNOWLEDGE_BASE_TITLE = "Knowledge Base";
export const KNOWLEDGE_BASE_SUBTITLE =
  "Guidance and information to help you manage your Logical Links account.";

const p = (text: string): KnowledgeBaseBlock => ({ kind: "p", text });
const list = (...items: string[]): KnowledgeBaseBlock => ({ kind: "list", items });

export const KNOWLEDGE_BASE_SECTIONS: KnowledgeBaseSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started & Your Account",
    summary: "Learn how to access your account and manage your profile.",
    items: [
      {
        title: "Creating Your Account",
        blocks: [
          p("Create an account before requesting a quote or booking a delivery. Complete your profile with accurate contact information so Logical Links can process your requests and keep you informed."),
          p("A customer account is required before proceeding. Guest quote requests are not available."),
        ],
      },
      {
        title: "Residential or Corporate Account?",
        blocks: [
          p("Logical Links provides services to both Residential and Corporate customers."),
          p("If you register as an individual without providing a Business Name, your account follows the Residential customer process."),
          p("If you provide a Business Name, your account is treated as Corporate, and your quotation requests are reviewed individually by the Logical Links team. Your account type determines the applicable quotation process and customer benefits."),
        ],
      },
      {
        title: "Managing Your Profile",
        blocks: [
          p("Keep your name, email address, telephone number, and other account details up to date."),
          p("Accurate account information helps us communicate with you regarding quotations, bookings, deliveries, and other service-related matters."),
        ],
      },
    ],
  },
  {
    slug: "quotes-bookings",
    title: "Quotes & Bookings",
    summary: "Understand how quotations and bookings work for your account.",
    items: [
      {
        title: "Residential Customers – Requesting a Quote",
        blocks: [
          p("Residential customers follow an automated quotation process. Once your account profile is complete, select Book Now and enter the required delivery information, including pickup and delivery locations, service requirements and any special instructions."),
          p("The system processes your request and provides an immediate automated response. Review the information presented and follow the instructions to proceed with your booking. If your request requires additional review, Logical Links will contact you."),
        ],
      },
      {
        title: "Corporate Customers – Requesting a Quote",
        blocks: [
          p("Corporate customers follow a manual quotation process. Once your corporate profile is complete, select Get a Quote and submit your transportation requirements."),
          p("Please provide the relevant information, including:"),
          list(
            "Pickup and delivery locations.",
            "Required transportation or delivery service.",
            "Type of goods or cargo, where applicable.",
            "Expected shipment volume or frequency, where applicable.",
            "Preferred pickup or delivery dates.",
            "Any special handling or service requirements.",
          ),
          p("The Logical Links team will review your requirements, assess the appropriate transportation arrangements, and prepare a quotation. You will receive an email notification when your quotation is ready. You can also review the quotation through your customer dashboard."),
        ],
      },
      {
        title: "Reviewing and Accepting a Corporate Quote",
        blocks: [
          p("Once your quotation is available, review the service details, pricing, and applicable conditions. Corporate quotations are valid for 10 days unless otherwise stated."),
          p("If you wish to proceed, follow the instructions provided with your quotation. If you have questions or require clarification, contact the Logical Links team before the quotation expires."),
        ],
      },
      {
        title: "Booking a Delivery",
        blocks: [
          p("Residential customers can proceed through the automated booking workflow using Book Now. Corporate customers should follow the instructions associated with their reviewed and approved quotation. Before confirming a booking, ensure that the pickup, delivery and service details are accurate."),
        ],
      },
    ],
  },
  {
    slug: "deliveries-tracking",
    title: "Deliveries & Tracking",
    summary: "Find out how to follow delivery progress and receive updates.",
    items: [
      {
        title: "Viewing Your Delivery",
        blocks: [
          p("Sign in to your account and open the Deliveries section of your dashboard. Select the relevant delivery or shipment to review its details and current status."),
          p("Your dashboard provides a convenient place to access your delivery information."),
        ],
      },
      {
        title: "Understanding Delivery Updates",
        blocks: [
          p("Your dashboard displays available delivery updates as the job progresses. Depending on the delivery, status information may include:"),
          list("Scheduled", "In Progress", "Completed", "Exception"),
          p("These updates help you understand the current progress of your delivery or shipment."),
        ],
      },
      {
        title: "Delivery Confirmation",
        blocks: [
          p("Once a delivery has been completed, review the available completion information in your account. If you have a question or notice an issue with a completed delivery, contact Customer Support and provide your delivery or shipment reference number."),
        ],
      },
    ],
  },
  {
    slug: "invoices-benefits",
    title: "Invoices & Customer Benefits",
    summary: "Review billing information and the benefits associated with your customer account.",
    items: [
      {
        title: "Invoices & Payments",
        blocks: [
          p("Open the Invoices section of your dashboard to review available invoices, charges, and payment information. Select an invoice to view its details and payment status."),
          p("If you have a question about an invoice or a particular charge, contact Customer Support and include the relevant invoice reference."),
        ],
      },
      {
        title: "Residential Customers – Rewards Program",
        blocks: [
          p("The Logical Links Residential Rewards Program allows eligible residential customers to earn points on their spending."),
          p("How the program works:"),
          list(
            "Earn 1 Rewards Point for every $1 spent.",
            "Redeem 500 Rewards Points for $5 in delivery credit.",
            "Receive 250 birthday points.",
          ),
          p("Your Rewards section displays your available points balance, delivery credit and points history. Rewards are available to Residential customers only."),
        ],
      },
      {
        title: "Corporate Customers – Partner Tiers",
        blocks: [
          p("Logical Links offers four corporate partner tiers:"),
          list("Standard", "Preferred", "Priority", "Enterprise"),
          p("Corporate accounts are assigned a partner tier based on the business relationship and applicable account arrangements. Partner tier status is managed by Logical Links and may be reviewed as the business relationship develops."),
          p("If you have questions about your corporate account or partner tier, contact your Logical Links representative. Corporate Partner Tiers are separate from the Residential Rewards Program."),
        ],
      },
    ],
  },
  {
    slug: "help-support",
    title: "Help & Support",
    summary: "Find out how to contact our team and follow up on an enquiry.",
    items: [
      {
        title: "Requesting Customer Support",
        blocks: [
          p("If you require assistance with an account, quotation, booking, delivery, or invoice, use the Customer Support option. Submit a support ticket and provide a clear description of your enquiry. Where applicable, include your delivery, shipment, quotation, or invoice reference number so our team can assist you more efficiently."),
        ],
      },
      {
        title: "Following a Support Ticket",
        blocks: [
          p("Open the Support section of your dashboard to review your submitted support tickets and their latest status. You can return to the relevant ticket to review available updates and follow up on your enquiry."),
        ],
      },
      {
        title: "General Inquiries",
        blocks: [
          p("For questions that are not related to a specific booking, delivery or support issue, use the General Inquiry contact option. Our team will review your message and respond accordingly."),
        ],
      },
    ],
  },
];
