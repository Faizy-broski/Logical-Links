import { renderEmail, type RenderedEmail } from './layout'
import type { RejectionEmailBody } from '../../../modules/accounts/rejection-reasons'

// Customer-facing emails for the corporate account application decision.
// Copy is taken verbatim from the client's spec; these close with
// "Regards, / Logical Links" rather than the default support-team sign-off.
//
// No email provider is wired yet (see email.service.ts) — these are rendered
// and logged only until the transport lands.

const SIGN_OFF = ['Regards,', 'Logical Links']
const DECISION_SUBJECT = 'Your Logical Links Corporate Account Application Update'

// "Hello Jane," / "Hello," when we don't have a name.
const greeting = (name: string) => (name.trim() ? `Hello ${name.trim()},` : 'Hello,')

// Incomplete / Insufficient Information · Business Verification Unsuccessful
function informationRejectionEmail(name: string): RenderedEmail {
  return renderEmail({
    subject: DECISION_SUBJECT,
    heading: DECISION_SUBJECT,
    signOff: SIGN_OFF,
    paragraphs: [
      greeting(name),
      'Thank you for submitting your corporate account application with Logical Links.',
      'After reviewing your application, we were unable to approve the corporate account at this time because additional information was required or we were unable to verify the business information provided.',
      'You may submit a new application with updated or additional information for review.',
      'Thank you for your interest in Logical Links.',
    ],
  })
}

// Services or Coverage Not Available
function coverageRejectionEmail(name: string): RenderedEmail {
  return renderEmail({
    subject: DECISION_SUBJECT,
    heading: DECISION_SUBJECT,
    signOff: SIGN_OFF,
    paragraphs: [
      greeting(name),
      'Thank you for your interest in establishing a corporate account with Logical Links.',
      'We are unable to approve your application at this time because the requested services, delivery requirements, or service area are not currently supported.',
      'We appreciate your interest in Logical Links and hope to have an opportunity to work with you in the future.',
    ],
  })
}

// Account Requirements Not Met
function requirementsRejectionEmail(name: string): RenderedEmail {
  return renderEmail({
    subject: DECISION_SUBJECT,
    heading: DECISION_SUBJECT,
    signOff: SIGN_OFF,
    paragraphs: [
      greeting(name),
      'Thank you for submitting your corporate account application with Logical Links.',
      'After reviewing your application, we determined that the business does not currently meet the requirements for a corporate account.',
      'You may submit a new application in the future if your business circumstances or requirements change.',
      'Thank you for your interest in Logical Links.',
    ],
  })
}

// Commercial Terms Not Suitable · Other
function genericRejectionEmail(name: string): RenderedEmail {
  return renderEmail({
    subject: DECISION_SUBJECT,
    heading: DECISION_SUBJECT,
    signOff: SIGN_OFF,
    paragraphs: [
      greeting(name),
      'Thank you for your interest in establishing a corporate account with Logical Links.',
      'After completing our review, we are unable to approve the corporate account application at this time.',
      'We appreciate your interest in Logical Links and thank you for your understanding.',
    ],
  })
}

const REJECTION_EMAIL_BODIES: Record<RejectionEmailBody, (name: string) => RenderedEmail> = {
  information:  informationRejectionEmail,
  coverage:     coverageRejectionEmail,
  requirements: requirementsRejectionEmail,
  generic:      genericRejectionEmail,
}

export function rejectionEmail(body: RejectionEmailBody, customerName: string): RenderedEmail {
  return REJECTION_EMAIL_BODIES[body](customerName)
}

// Sent when a corporate application is approved — i.e. the account first reaches
// a pipeline stage that grants portal access (onboarding / active).
export function approvalEmail(customerName: string): RenderedEmail {
  return renderEmail({
    subject: 'Your Logical Links Corporate Account Has Been Approved',
    heading: 'Your Logical Links Corporate Account Has Been Approved',
    signOff: SIGN_OFF,
    paragraphs: [
      greeting(customerName),
      'Good news! Your corporate account application with Logical Links has been approved.',
      'Your corporate account is now active, and you can sign in to your customer portal to manage your deliveries, view account information, and access your available services.',
      'We look forward to working with you.',
    ],
  })
}

// ── Registration + application progress ───────────────────────────────────────
// Drafted copy — to be confirmed by the client. Each is sent from the matching
// moment in accounts.service.ts / auth.service.ts.

const mail = (subject: string, name: string, lines: string[]): RenderedEmail =>
  renderEmail({ subject, heading: subject, signOff: SIGN_OFF, paragraphs: [greeting(name), ...lines] })

// Corporate sign-up submitted (pipeline stage: Interested).
export function applicationReceivedEmail(name: string): RenderedEmail {
  return mail('We Have Received Your Logical Links Corporate Account Application', name, [
    'Thank you for applying for a corporate account with Logical Links.',
    'Our team will review your details and be in touch. You will be notified by email as your application progresses, and you will be able to sign in to the customer portal once your account is activated.',
    'If you have any questions in the meantime, please contact our support team.',
  ])
}

// Residential sign-up completed (no approval step - they can sign in straight away).
export function residentialWelcomeEmail(name: string): RenderedEmail {
  return mail('Welcome to Logical Links', name, [
    'Thank you for creating a Logical Links account.',
    'You can now sign in to book deliveries, follow their progress, and manage your account and rewards from your dashboard.',
    'If you have any questions, our support team is happy to help.',
  ])
}

// Pipeline: Contacted
export function applicationContactedEmail(name: string): RenderedEmail {
  return mail('Update on Your Logical Links Corporate Account Application', name, [
    'A member of the Logical Links team has been in touch regarding your corporate account application.',
    'If we still need anything from you, we will let you know. If you would like to share additional details, please contact our support team.',
  ])
}

// Pipeline: Interested
export function applicationInterestedEmail(name: string): RenderedEmail {
  return mail('Your Logical Links Corporate Account Application Is Progressing', name, [
    'Thank you for your interest in Logical Links.',
    'Our team is reviewing your requirements and discussing next steps. We will notify you by email once your account is approved and ready to use.',
  ])
}

// Pipeline: Onboarding (portal access is granted while the account is set up).
export function accountOnboardingEmail(name: string): RenderedEmail {
  return mail('Your Logical Links Corporate Account Has Been Approved', name, [
    'Good news! Your corporate account application with Logical Links has been approved.',
    'Our team is now setting up your account. You can sign in to your customer portal to start exploring, and we will let you know once setup is complete.',
  ])
}

// Pipeline: Onboarding -> Active
export function accountFullyActiveEmail(name: string): RenderedEmail {
  return mail('Your Logical Links Corporate Account Is Now Fully Active', name, [
    'Your corporate account setup is complete and your account is now fully active.',
    'You can sign in to your customer portal to request quotes, manage deliveries, and access your account information.',
  ])
}

// Pipeline: Inactive / Lost / moved back before onboarding - portal access removed.
export function accessPausedEmail(name: string): RenderedEmail {
  return mail('Update on Your Logical Links Corporate Account', name, [
    'Portal access for your Logical Links corporate account has been paused.',
    'If you believe this is a mistake, or you would like to resume service, please contact our support team and we will be glad to help.',
  ])
}

// A rejected application was reopened for review.
export function applicationReconsideredEmail(name: string): RenderedEmail {
  return mail('Your Logical Links Corporate Account Application Is Being Reviewed Again', name, [
    'We have reopened your corporate account application for review.',
    'Our team will be in touch, and you will be notified by email once there is an update.',
  ])
}
