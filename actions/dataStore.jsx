let dataCache = null;

export async function getDataSingleton() {
  // if (dataCache) return dataCache;

  const response = await fetch(
    `https://pixpro.app/api/projects/80223bb1e415d563d5ff065ce97871c7`,
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
