"use server"

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

    // TODO: handle the submission however you like —
    // send an email, write to a database, call a CRM, or POST to a webhook.
    console.log("[demo submission]", formData)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit demo request",
    }
  }
}
