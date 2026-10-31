# Primary Source Ledger

| Source | URL | Supports |
|---|---|---|
| Official GitHub Security Advisory | github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw | Affected version ranges (11.1.4–12.3.5, 13.0.0–13.5.9, 14.0–14.2.25, 15.0–15.2.3), fix versions, CVSS 9.1, official workaround |
| CVE record (NVD/cvelistv5) | nvd.nist.gov/vuln/detail/cve-2025-29927 | Formal CWE classification (Improper Authorization, CWE-285), publish date (21 Mar 2025) |
| Original researcher disclosure | zhero-web-sec.github.io/research-and-things/nextjs-and-the-corrupt-middleware | Discovery process, technical mechanism detail |
| Vercel postmortem | vercel.com/blog/postmortem-on-next-js-middleware-bypass | Vendor's own root-cause account, response timeline |
| Fastly technical write-up | fastly.com/blog/cve-2025-29927-authorization-bypass-in-next-js | Version-specific payload differences (15.x requires the middleware name 5+ times) |

**Not yet verified (fill in after running your own trace):**
- Exact file path and line numbers of the vulnerable header check (v14.2.24)
- Exact file path and line numbers of the patched check (v14.2.25)
- Exact diff content
