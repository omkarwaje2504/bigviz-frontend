import { getDataSingleton } from "@actions/dataStore";

let cachedProjectData: any[] | null = null;

export async function getAllProjectsCached() {
  if (cachedProjectData) return cachedProjectData;

  try {
    const response = await getDataSingleton();

    const allProjects = response?.data || [];
    cachedProjectData = allProjects;
    return cachedProjectData;
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return [];
  }
}