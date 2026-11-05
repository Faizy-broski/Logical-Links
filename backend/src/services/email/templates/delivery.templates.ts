import { renderEmail, type RenderedEmail } from './layout'

// Customer-facing transactional emails for the delivery lifecycle. Copy is
// taken verbatim from the client's spec. Residential customers see "delivery",
// corporate customers see "shipment" where the spec distinguishes them.
//
// Per the client's event matrix, only these lifecycle points send an email:
//   Booking Received · Quote Ready (corporate only) · Picked Up ·
//   Out for Delivery · Delivered · Cancelled
// (Confirmed / Assigned / In Transit are dashboard-alert-only.)

export type EmailAudience = 'residential' | 'corporate'

type TemplateArgs = {
  loadNumber: string
  audience:   EmailAudience
}

const noun = (audience: EmailAudience) => (audience === 'residential' ? 'delivery' : 'shipment')

export function bookingReceivedEmail({ loadNumber }: TemplateArgs): RenderedEmail {
  return renderEmail({
    subject: `Booking Received – ${loadNumber}`,
    heading: `Booking Received – ${loadNumber}`,
    paragraphs: [
      'Hello,',
      `We have received your booking request, ${loadNumber}. Our team will review the details and provide you with an update shortly.`,
      'We appreciate the opportunity to serve you.',
    ],
  })
}

/**
 * INTERNAL notice for the Logical Links inbox when a booking is submitted.
 * This is deliberately NOT the customer's "Booking Received" copy: it tells the
 * team who booked, what is moving and what they need to do next.
 */
export function bookingReceivedInternalEmail(args: {
  loadNumber: string
  adminUrl:   string
  details:    [label: string, value: string][]
}): RenderedEmail {
  const { loadNumber, adminUrl, details } = args
  return renderEmail({
    subject: `New Booking Received – ${loadNumber}`,
    heading: `New Booking Received – ${loadNumber}`,
    paragraphs: [
      `A new booking, ${loadNumber}, has just been submitted through the Logical Links platform. The details are below.`,
    ],
    details,
    footnotes: [
      'Action needed: please review the booking, then confirm it, prepare a quote or assign it to a driver from the admin dashboard.',
    ],
    cta: { label: 'Open booking in dashboard', url: adminUrl },
    signOff: ['Logical Links Operations'],
  })
}

export function quoteReadyEmail({ loadNumber }: TemplateArgs): RenderedEmail {
  return renderEmail({
    subject: `Your Quote Is Ready – ${loadNumber}`,
    heading: `Your Quote Is Ready – ${loadNumber}`,
    paragraphs: [
      'Hello,',
      `Your quote for ${loadNumber} is now ready for review. Please log in to your Logical Links account to review and respond to the quote.`,
      'We look forward to assisting you with your shipment.',
    ],
  })
}

export function pickedUpEmail({ loadNumber, audience }: TemplateArgs): RenderedEmail {
  const n = noun(audience)
  return renderEmail({
    subject: `Picked Up – ${loadNumber}`,
    heading: `Picked Up – ${loadNumber}`,
    paragraphs: [
      'Hello,',
      `Your ${n}, ${loadNumber}, has been picked up and is now on its way to the destination.`,
      `Thank you for trusting Logical Links with your ${n}.`,
    ],
  })
}

export function outForDeliveryEmail({ loadNumber, audience }: TemplateArgs): RenderedEmail {
  return renderEmail({
    subject: `Out for Delivery – ${loadNumber}`,
    heading: `Out for Delivery – ${loadNumber}`,
    paragraphs: [
      'Hello,',
      `Your ${noun(audience)}, ${loadNumber}, is now out for delivery and on its way to the destination.`,
      'We appreciate your business.',
    ],
  })
}

export function deliveredEmail({ loadNumber, audience }: TemplateArgs): RenderedEmail {
  return renderEmail({
    subject: `Delivery Completed – ${loadNumber}`,
    heading: `Delivery Completed – ${loadNumber}`,
    paragraphs: [
      'Hello,',
      `Your ${noun(audience)}, ${loadNumber}, has been successfully completed.`,
      'Thank you for choosing Logical Links. We appreciate your business.',
    ],
  })
}

export function cancelledEmail({ loadNumber }: TemplateArgs): RenderedEmail {
  return renderEmail({
    subject: `Booking Cancelled – ${loadNumber}`,
    heading: `Booking Cancelled – ${loadNumber}`,
    paragraphs: [
      'Hello,',
      `Your booking, ${loadNumber}, has been cancelled. Please log in to your Logical Links account for more information.`,
    ],
  })
}

// Status → email template, for the four status transitions that send mail.
export const STATUS_EMAIL_TEMPLATES: Record<
  'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled',
  (args: TemplateArgs) => RenderedEmail
> = {
  picked_up:        pickedUpEmail,
  out_for_delivery: outForDeliveryEmail,
  delivered:        deliveredEmail,
  cancelled:        cancelledEmail,
}
