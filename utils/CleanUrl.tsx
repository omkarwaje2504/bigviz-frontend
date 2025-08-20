export default function cleanUrls(dataArray: any[]) {
  return dataArray.map((item: any, index: number) => {
    try {
      return {
        ...item,
        image: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${item.image}`,
        download_url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/item.download_url`,
      };
    } catch (err) {
      console.warn(`Clean URL failed for item at index ${index}`, err);
      return item;
    }
  });
}
