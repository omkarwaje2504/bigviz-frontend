export default function cleanUrls(dataArray: any[]) {
  return dataArray.map((item: any, index: number) => {
    try {
      return {
        ...item,
        image: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${item.image}`,
        download_url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${item.download_url}`,
      };
    } catch (err) {
      console.warn(`Clean URL failed for item at index ${index}`, err);
      return item;
    }
  });
}

export const cleanName = (name: string) => {
  const prefixes = ["Dr", "Prof", "Mr", "Mrs", "dr", "prof", "mr", "mrs"];
  let newName = name;
  for (const p of prefixes) {
    if (newName.startsWith(`${p}. `) || newName.startsWith(`${p} `)) {
      newName = newName.substring(p.length + 1).trim();
      break;
    } else if (newName.startsWith(`${p}.`)) {
      newName = newName.substring(p.length).trim();
      break;
    }
  }
  return newName;
};
