// lib/imageSearchJobs.ts
import type { LiveProduct } from "./liveProduct";

export type ImageSearchJob = {
  id: string;
  status: "searching" | "loading" | "done" | "error";
  products: LiveProduct[];
  offerIds?: string[];
  totalExpected?: number;
  error?: string;
  createdAt: number;
};

const jobs = new Map<string, ImageSearchJob>();

export function createJob(): ImageSearchJob {
  const id = Math.random().toString(36).substring(2, 10);
  const job: ImageSearchJob = {
    id,
    status: "searching",
    products: [],
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ImageSearchJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<ImageSearchJob>): void {
  const job = jobs.get(id);
  if (job) {
    jobs.set(id, { ...job, ...updates });
  }
}

export function pushProduct(id: string, product: LiveProduct): void {
  const job = jobs.get(id);
  if (job) {
    job.products.push(product);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      jobs.delete(id);
    }
  }
}, 10 * 60 * 1000);