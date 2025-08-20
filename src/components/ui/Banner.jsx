const Banner = ({ bannerImage }) => {
  
  const src = bannerImage || "/banner.jpg"; // prefer public folder path

  return (
    <div className="bg-white border-b border-red-300 dark:bg-black dark:border-red-800 py-4 flex items-center justify-between lg:w-[70%]">
      <div className="relative flex items-center w-full h-full max-h-screen overflow-hidden">
        {/* Main visible banner image */}
        <img
          src={src}
          alt="banner-image"
          className="w-full relative z-10 object-cover"
        />

        {/* Blurred background image for larger screens only */}
        <img
          src={src}
          alt="blurred-background"
          className="absolute top-0 left-0 w-full h-full object-cover blur-3xl z-0 hidden lg:block"
        />
      </div>
    </div>
  );
};

export default Banner;
