"use server"

import { saveLeadToNotion } from "@/lib/integrations/notion"
import { triggerBookeeCall } from "@/lib/integrations/dograh"
import { isPhoneValid } from "@/lib/integrations/twilio"
import { summarizeBusiness } from "@/lib/integrations/anthropic"

export async function submitDemoRequest(formData: {
  name: string
  email: string
  phone: string
  businessUrl: string
  consent?: boolean
  consentText?: string
}) {
  try {
    if (!formData.consent) {
      return { success: false, error: "Please agree before submitting." }
    }

    // Optional enrichment — both no-op (return safe defaults) unless configured.
    const phoneValid = await isPhoneValid(formData.phone)
    const businessSummary = phoneValid ? await summarizeBusiness(formData.businessUrl) : ""

    const lead = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      businessUrl: formData.businessUrl,
      status: phoneValid ? "New" : "Invalid Phone",
      consent: formData.consent,
      consentText: formData.consentText,
      businessSummary,
    }

    // Save the lead. With nothing configured this is a no-op, so we log too.
    console.log("[demo submission]", lead)
    const saved = await saveLeadToNotion(lead)
    const notionPageId = saved.ok ? saved.pageId : ""

    if (!phoneValid) {
      return { success: true, note: "Phone could not be verified" }
    }

    // Fire the demo call (best-effort, never blocks the user).
    await triggerBookeeCall("demo", formData.phone, {
      lead_name: formData.name,
      lead_email: formData.email,
      business_summary: businessSummary,
      notion_page_id: notionPageId,
      meeting_type: "demo",
      is_demo: true,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit demo request",
    }
  }
}
