import { languages } from "../src/data/languages.js";

export const resendConfig = {
    get baseUrl() {
        return process.env.RESEND_BASE_URL || "https://api.resend.com";
    },
    get recipients() {
        return (process.env.LEAD_RECIPIENT_EMAIL || "")
            .split(",")
            .map((recipient) => recipient.trim())
            .filter(Boolean);
    },
    get sender() {
        return process.env.LEAD_SENDER_EMAIL || "";
    }
};

const caseLabels = {
    family: "Family",
    "work-business": "Work & Business",
    protection: "Protection",
    defense: "Defense",
    other: "Not sure / Other"
};

const contactMethodLabels = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    sms: "Text (SMS)",
    phone: "Phone call"
};

const languageLabels = new Map(
    languages.map(({ code, statementLanguage }) => [code, statementLanguage])
);

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeHtmlLines(value) {
    return escapeHtml(value).replaceAll(/\r?\n/g, "<br />");
}

function getCaseLabel(caseValue) {
    return caseLabels[caseValue] || caseValue || "Not provided";
}

function getContactMethodLabel(contactMethod) {
    return contactMethodLabels[contactMethod] || contactMethod || "Not provided";
}

function getLanguageLabel(languageCode) {
    return languageLabels.get(languageCode) || languageCode || "Not provided";
}

export function createLeadFields(lead) {
    return [
        { label: "Full name", value: lead.fullName },
        { label: "Email", value: lead.email },
        { label: "Phone", value: lead.phone },
        { label: "Preferred contact", value: getContactMethodLabel(lead.contactMethod) },
        { label: "Language", value: getLanguageLabel(lead.language) },
        { label: "Case type", value: getCaseLabel(lead.case) }
    ];
}

export function createLeadSubject(lead) {
    return `New case review request — ${lead.fullName} (${getCaseLabel(lead.case)})`;
}

export function createLeadText(lead) {
    const details = createLeadFields(lead)
        .map(({ label, value }) => `${label}: ${value || "Not provided"}`)
        .join("\n");

    return `${details}\n\nStatement:\n${lead.statement || "Not provided"}\n`;
}

export function createLeadHtml(lead) {
    const rows = createLeadFields(lead)
        .map(({ label, value }, index) => `
                            <tr>
                                <td style="padding:${index ? "11px" : "0"} 16px 0 0;color:#8b90a8;font-size:12px;line-height:150%;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
                                <td style="padding:${index ? "11px" : "0"} 0 0;color:#17183c;font-size:14px;font-weight:bold;line-height:150%;">${escapeHtml(value || "Not provided")}</td>
                            </tr>`)
        .join("");

    // Email clients drop border-radius when a table uses border-collapse:collapse,
    // and Outlook ignores rgba colours, so the card sticks to separate borders and
    // solid hex values. Outlook still squares the corners, which degrades cleanly.
    return `<!doctype html>
<html>
    <body style="margin:0;padding:24px 16px;background-color:#f2f4ff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;">
            <tr>
                <td style="padding:0;background-color:#ffffff;border:1px solid #e1e6f9;border-radius:18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;">
                        <tr>
                            <td style="padding:30px 30px 0;">
                                <div style="color:#4e6cf2;font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;">Counsela</div>
                                <div style="margin-top:10px;color:#17183c;font-size:22px;font-weight:bold;line-height:130%;">New case review request</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:22px 30px 0;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;">${rows}
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:24px 30px 0;">
                                <div style="height:1px;line-height:1px;font-size:0;background-color:#eceffb;">&nbsp;</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:20px 30px 30px;">
                                <div style="color:#8b90a8;font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;">Statement</div>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:12px;border-collapse:separate;border-spacing:0;">
                                    <tr>
                                        <td style="padding:18px 20px;background-color:#f7f6fb;border:1px solid #eceffb;border-radius:14px;color:#17183c;font-size:14px;line-height:165%;">${escapeHtmlLines(lead.statement || "Not provided")}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}
