let dataCache = null;

export async function getDataSingleton() {
  // if (dataCache) return dataCache;

  const response = await fetch(
    `https://sai-dev.laravel.cloud/api/all-projects`,
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
