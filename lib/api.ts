export function getBaseApiUrl(): string {
  const baseUrl = process.env.BASE_API || process.env.NEXT_PUBLIC_BASE_API;

  if (!baseUrl) {
    throw new Error(
      "BASE_API environment variable is not set. " +
        "Please set BASE_API or NEXT_PUBLIC_BASE_API in your .env.local file or environment variables."
    );
  }

  return baseUrl.replace(/\/$/, "");
}
