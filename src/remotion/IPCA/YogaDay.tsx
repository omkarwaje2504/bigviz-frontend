import { interpolate, staticFile, Video, AbsoluteFill, Audio } from "remotion";

type FormData = {
  name: string;
  photo: string;
  gender: string;
  speciality: string;
  clinic_name: string;
  clinic_address: string;
  language: string;
};

const YogaDay: React.FC<{
  frame: number;
  formData?: FormData;
  download: boolean;
}> = ({ frame, formData = undefined, download }) => {
  console.log("component", download, frame, formData);
  const frameData = frame;

  const {
    language = "English",
    gender = "Male",
    name = "",
    photo,
    speciality = "",
    clinic_address,
    clinic_name,
  } = formData || {};


  const introdurations: Record<string, Record<string, number>> = {
    English: { Male: 150, Female: 150 },
    Hindi: { Male: 144, Female: 144 },
  };

  const introduration = introdurations[language]?.[gender] ?? 3096;

  const nameslide = interpolate(
    frameData,
    [introduration + 10, introduration + 15],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const specslide = interpolate(
    frameData,
    [introduration + 15, introduration + 20],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const clinicSlide = interpolate(
    frameData,
    [introduration + 20, introduration + 25],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const clinicaddSlide = interpolate(
    frameData,
    [introduration + 25, introduration + 30],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const photoSlide = interpolate(
    frameData,
    [introduration, introduration + 10],
    [100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div>
      
      <Video src={staticFile(`IPCA/YogaDay/${language}/Intro.mp4`)} />

      <AbsoluteFill
      >
        <div
          className="w-[25rem] h-[25rem] left-[9.5rem] overflow-hidden border-[#a5e4c6] rounded-full border-[5px] absolute bottom-[4.2rem]"
          style={{
            transform: `translateY(${photoSlide}%)`,
          }}
        >
          <img src={photo} alt="doctor-photo" className="w-full rounded-lg" />
        </div>
        <div className="mt-[1.5rem] ml-9 font-serif">
          <div
            className={` font-bold text-[#5180b6] max-w-[30rem]  ${
              name.length > 21 ? "text-3xl" : "text-5xl"
            }
            `}
            style={{
              transform: `translateX(${nameslide}%)`,
            }}
          >
            {name}
          </div>

          <div
            className={`font-[500]  text-[#292929] max-w-[30rem] ${
              name.length > 21 || speciality.length > 21
                ? "text-3xl mt-3"
                : "text-5xl mt-2"
            }`}
            style={{
              transform: `translateX(${specslide}%)`,
            }}
          >
            {speciality}
          </div>
          {clinic_name && (
            <div
              className={`font-medium   text-[#292929] max-w-[30rem] ${
                name.length > 21 || clinic_name?.length > 25
                  ? "text-2xl mt-2"
                  : "text-4xl mt-6"
              }`}
              style={{
                transform: `translateX(${clinicSlide}%)`,
              }}
            >
              {clinic_name}
            </div>
          )}
          {clinic_address && (
            <div
              className={`font-medium mt-1 max-w-[30rem]  ${
                name.length > 21 || clinic_address?.length > 25
                  ? "text-2xl"
                  : "text-4xl"
              }`}
              style={{
                transform: `translateX(${clinicaddSlide}%)`,
              }}
            >
              {clinic_address}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Audio src={staticFile(`IPCA/audio.mp3`)} volume={0.3} />

      <Video src={staticFile(`IPCA/YogaDay/${language}/${gender}.mp4`)} />

      <div
        className="w-[25rem] h-[25rem] left-[9.5rem] overflow-hidden border-[#a5e4c6] rounded-full border-[5px] absolute bottom-[4.2rem]"
        style={{
          transform: `translateX(${nameslide}%)`,
        }}
      >
        <img src={photo} alt="doctor-photo" className="w-full rounded-lg" />
      </div>
      <div className="mt-[1.5rem] ml-9 font-serif">
        <div
          className={` font-bold text-[#5180b6] max-w-[30rem]  ${
            name.length > 21 ? "text-3xl" : "text-5xl"
          }
            `}
          style={{
            transform: `translateX(${nameslide}%)`,
          }}
        >
          {name}
        </div>

        <div
          className={`font-[500]  text-[#292929] max-w-[30rem] ${
            name.length > 21 || speciality.length > 21
              ? "text-3xl mt-3"
              : "text-5xl mt-2"
          }`}
          style={{
            transform: `translateX(${nameslide}%)`,
          }}
        >
          {speciality}
        </div>
        {clinic_name && (
          <div
            className={`font-medium   text-[#292929] max-w-[30rem] ${
              name.length > 21 || clinic_name?.length > 25
                ? "text-2xl mt-2"
                : "text-4xl mt-6"
            }`}
            style={{
              transform: `translateX(${nameslide}%)`,
            }}
          >
            {clinic_name}
          </div>
        )}
        {clinic_address && (
          <div
            className={`font-medium mt-1 max-w-[30rem]  ${
              name.length > 21 || clinic_address?.length > 25
                ? "text-2xl"
                : "text-4xl"
            }`}
            style={{
              transform: `translateX(${nameslide}%)`,
            }}
          >
            {clinic_address}
          </div>
        )}
      </div>
    </div>
  );
};

export default YogaDay;
