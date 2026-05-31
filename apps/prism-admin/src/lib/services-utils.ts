// helper to serialize extra metadata inside description
export function serializeDescription(
  text: string,
  billingStructure: string,
  forcesCustomQuote: boolean,
  coverImage?: string | null
): string {
  return JSON.stringify({
    text,
    billingStructure,
    forcesCustomQuote,
    coverImage: coverImage || null,
  });
}

// helper to deserialize
export function deserializeDescription(descriptionStr: string | null): {
  text: string;
  billingStructure: "one-time" | "recurring";
  forcesCustomQuote: boolean;
  coverImage: string | null;
} {
  try {
    if (!descriptionStr) {
      return { text: "", billingStructure: "one-time", forcesCustomQuote: false, coverImage: null };
    }
    const data = JSON.parse(descriptionStr);
    if (data && typeof data === "object" && "text" in data) {
      return {
        text: data.text || "",
        billingStructure: data.billingStructure === "recurring" ? "recurring" : "one-time",
        forcesCustomQuote: !!data.forcesCustomQuote,
        coverImage: data.coverImage || null,
      };
    }
  } catch (e) {
    // fallback if it's plain text description
  }
  return {
    text: descriptionStr || "",
    billingStructure: "one-time",
    forcesCustomQuote: false,
    coverImage: null,
  };
}
