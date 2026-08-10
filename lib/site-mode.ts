// Two deployments, one codebase.
// - portfolio: the public face (later damilareoo.xyz) — no System/Changelog chrome
// - workshop: the build log — System + Changelog live here
export const isPortfolio = process.env.NEXT_PUBLIC_SITE_MODE === "portfolio";

export const workshopUrl = "https://portfolio-v2-omega-azure.vercel.app";
