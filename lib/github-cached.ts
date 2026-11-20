import { cacheLife } from "next/cache";
import { site } from "@/content/site";
import { fetchContributions, type Calendar } from "./github";

export async function getContributions(): Promise<Calendar> {
  "use cache";
  const cal = await fetchContributions(site.githubUsername, process.env.GITHUB_TOKEN);
  // Only one cacheLife call may run per invocation. A failed fetch yields sample
  // data, which must not stay cached for days.
  if (cal.isSample) cacheLife("minutes");
  else cacheLife("days");
  return cal;
}
