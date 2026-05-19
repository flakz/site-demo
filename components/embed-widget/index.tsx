import Script from "next/script";

function getEnv(key: string) {
  return process.env[`NEXT_PUBLIC_${key}`] || "";
}

const suggestions: { label: string; prompt: string }[] = [];
for (let i = 1; i <= 5; i++) {
  const label = getEnv(`SUGGEST_${i}_LABEL`);
  const prompt = getEnv(`SUGGEST_${i}_PROMPT`);
  if (label && prompt) suggestions.push({ label, prompt });
}

const greetings = [getEnv("GREETING_1"), getEnv("GREETING_2")].filter(Boolean);

const config = {
  webhookUrl: getEnv("WEBHOOK_URL"),
  kbSlug: getEnv("KB_SLUG"),
  brandName: getEnv("BRAND_NAME"),
  brandLogo: getEnv("BRAND_LOGO"),
  primaryColor: getEnv("PRIMARY_COLOR"),
  toggleIcon: getEnv("TOGGLE_ICON"),
  fontFamily: getEnv("FONT_FAMILY"),
  suggestions: suggestions.length ? suggestions : undefined,
  greetings: greetings.length === 2 ? greetings : undefined,
};

const configJson = JSON.stringify(config);

export function EmbedConfig() {
  return (
    <Script
      id="marno-widget-config"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `window.MarnoChatConfig = ${configJson};`,
      }}
    />
  );
}
