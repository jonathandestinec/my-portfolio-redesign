import { cacheLife } from "next/cache";
import { site } from "@/content/site";
import { fetchContributions, type Calendar } from "./github";

export async function getContributions(): Promise<Calendar> {
  "use cache";
  cacheLife("days");
  return fetchContributions(site.githubUsername, process.env.GITHUB_TOKEN);
}
