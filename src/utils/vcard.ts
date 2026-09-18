import { Contact, UserProfile } from "../types";

/**
 * Escapes special characters in vCard text fields according to RFC 2426 / RFC 6350.
 */
function escapeVCardValue(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Formats a single Contact or UserProfile into a vCard v3.0 text block.
 */
export function generateVCard(contact: Contact | UserProfile | null): string {
  if (!contact) return "";

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0"
  ];

  const fullName = contact.name?.trim() || "";
  lines.push(`FN:${escapeVCardValue(fullName)}`);

  // Structured name N: FamilyName;GivenName;AdditionalNames;HonorificPrefixes;HonorificSuffixes
  if (fullName) {
    const parts = fullName.split(/\s+/);
    if (parts.length === 1) {
      lines.push(`N:;${escapeVCardValue(parts[0])};;;`);
    } else {
      const lastName = parts[parts.length - 1];
      const firstName = parts.slice(0, parts.length - 1).join(" ");
      lines.push(`N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`);
    }
  } else {
    lines.push("N:;;;;");
  }

  if (contact.company) {
    lines.push(`ORG:${escapeVCardValue(contact.company.trim())}`);
  }

  if (contact.jobTitle) {
    lines.push(`TITLE:${escapeVCardValue(contact.jobTitle.trim())}`);
  }

  if (contact.phone) {
    lines.push(`TEL;TYPE=CELL:${contact.phone.trim()}`);
  }

  if (contact.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${contact.email.trim()}`);
  }

  if (contact.website) {
    let url = contact.website.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    lines.push(`URL:${url}`);
  }

  if (contact.address) {
    // ADR format: P.O. Box; Extended Address; Street; Locality (City); Region; Postal Code; Country
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(contact.address.trim())};;;;`);
  }

  // Combine Category, Tags and Notes if available
  const notesParts: string[] = [];
  if ("category" in contact && contact.category) {
    notesParts.push(`Phân loại: ${contact.category}`);
  }
  if ("tags" in contact && contact.tags && contact.tags.length > 0) {
    notesParts.push(`Thẻ: ${contact.tags.join(", ")}`);
  }
  if ("notes" in contact && contact.notes) {
    notesParts.push(contact.notes);
  }

  if (notesParts.length > 0) {
    lines.push(`NOTE:${escapeVCardValue(notesParts.join(" | "))}`);
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

/**
 * Formats multiple contacts into a single vCard string.
 */
export function generateMultipleVCard(contacts: Contact[]): string {
  return contacts.map(c => generateVCard(c)).join("\r\n");
}

/**
 * Triggers a browser download for a .vcf Blob file.
 */
export function downloadVCardFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Share contact via Web Share API if file sharing is supported,
 * otherwise trigger .vcf file download.
 */
export async function shareOrSaveVCard(contact: Contact | UserProfile): Promise<void> {
  if (!contact) return;
  const vcardText = generateVCard(contact);
  const safeName = (contact.name || "contact").trim().replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1EA0-\u1EF9]/g, "_");
  const fileName = `${safeName}.vcf`;
  const blob = new Blob([vcardText], { type: "text/vcard;charset=utf-8;" });

  // Check Web Share API support for files (works on mobile Safari & Chrome)
  if (typeof window !== "undefined" && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: "text/vcard" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: contact.name || "Danh bạ",
          text: `Danh bạ: ${contact.name || ""}`,
        });
        return;
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // User cancelled share sheet
      }
      console.warn("Web Share API failed, falling back to download:", err);
    }
  }

  // Fallback to direct download
  downloadVCardFile(blob, fileName);
}

/**
 * Download a vCard file containing all specified contacts.
 */
export function exportContactsToVCard(contacts: Contact[], customFileName?: string): void {
  if (contacts.length === 0) return;
  const vcardsText = generateMultipleVCard(contacts);
  const fileName = customFileName || `contacts_vcard_${Date.now()}.vcf`;
  const blob = new Blob([vcardsText], { type: "text/vcard;charset=utf-8;" });
  downloadVCardFile(blob, fileName);
}
