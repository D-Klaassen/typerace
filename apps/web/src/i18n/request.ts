import { getRequestConfig } from "next-intl/server";

// v1 ships English only. Adding a language means adding messages/<locale>.json
// and choosing the locale here (or via i18n routing).
export default getRequestConfig(async () => {
  const locale = "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
