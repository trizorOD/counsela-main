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
        .map(({ label, value }) => `
                            <tr>
                                <td style="padding:6px 16px 6px 0;color:rgba(0,0,0,0.45);font-size:12px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
                                <td style="padding:6px 0;color:#17183c;font-size:14px;font-weight:500;">${escapeHtml(value || "Not provided")}</td>
                            </tr>`)
        .join("");

    return `<!doctype html>
<html>
    <body style="margin:0;padding:24px;background-color:#f2f4ff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse;background-color:#ffffff;border:1px solid rgba(78,108,242,0.22);border-radius:18px;">
            <tr>
                <td style="padding:28px 28px 0;">
                    <div style="color:#4e6cf2;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Counsela</div>
                    <h1 style="margin:12px 0 0;color:#17183c;font-size:22px;font-weight:600;line-height:130%;">New case review request</h1>
                </td>
            </tr>
            <tr>
                <td style="padding:20px 28px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rows}
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:22px 28px 28px;">
                    <div style="color:rgba(0,0,0,0.45);font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Statement</div>
                    <div style="margin-top:10px;padding:18px 20px;border-radius:14px;background-color:#f7f6fb;color:#17183c;font-size:14px;line-height:165%;white-space:pre-wrap;">${escapeHtml(lead.statement || "Not provided")}</div>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}
