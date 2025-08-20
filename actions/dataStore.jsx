let dataCache = null;

export async function getDataSingleton() {
  // if (dataCache) return dataCache;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PROJECT_URL}/all-projects`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // cache: "no-cache",
    },
  );
  const dataCache = await response.json();
  return dataCache;
}
