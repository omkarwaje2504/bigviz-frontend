import {
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
  Video,
  AbsoluteFill,
  Audio,
} from "remotion";

interface YogaDayProps {
  name: string;
  photo: string;
  gender: string;
  speciality: string;
  clinic_name: string;
  clinic_address: string;
  doctorAudio: {
    downloadUrl: string;
    duration: number;
    text: string;
  };
  language: string;
}

export const YogaDay: React.FC<YogaDayProps> = ({
  name,
  photo,
  gender,
  speciality,
  clinic_name,
  clinic_address,
  doctorAudio,
  language,
}) => {
  const audioduration = doctorAudio.duration * 24;

  const durations: Record<string, Record<string, number>> = {
    English: { Male: 3870, Female: 3870 },
    Hindi: { Male: 3300, Female: 3370 },
    Marathi: { Male: 3680, Female: 3680 },
    Gujarati: { Male: 3610, Female: 3610 },
    Tamil: { Male: 4447, Female: 4447 },
    Telugu: { Male: 4680, Female: 4360 },
    Kannada: { Male: 3480, Female: 3480 },
    Malayalam: { Male: 3510, Female: 3510 },
    Punjabi: { Male: 4300, Female: 4300 },
    Bengali: { Male: 4000, Female: 4000 },
    Odia: { Male: 4479, Female: 4479 },
    Assamese: { Male: 4479, Female: 4479 },
  };

  const video = durations[language]?.[gender] ?? 3096;

  const introdurations: Record<string, Record<string, number>> = {
    English: { Male: 150, Female: 150 },
    Hindi: { Male: 144, Female: 144 },
    Marathi: { Male: 144, Female: 144 },
    Gujarati: { Male: 168, Female: 168 },
    Tamil: { Male: 144, Female: 144 },
    Telugu: { Male: 168, Female: 168 },
    Kannada: { Male: 150, Female: 150 },
    Malayalam: { Male: 144, Female: 144 },
    Bengali: { Male: 144, Female: 144 },
    Odia: { Male: 168, Female: 168 },
    Punjabi: { Male: 144, Female: 144 },
    Assamese: { Male: 168, Female: 168 },
  };

  const introduration = introdurations[language]?.[gender] ?? 3096;
  const frame = useCurrentFrame();

  const nameslide = interpolate(
    frame,
    [introduration + 10, introduration + 15],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.66, 0.04, 0.15, 1),
    },
  );
  const specslide = interpolate(
    frame,
    [introduration + 15, introduration + 20],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.66, 0.04, 0.15, 1),
    },
  );

  const clinicSlide = interpolate(
    frame,
    [introduration + 20, introduration + 25],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.66, 0.04, 0.15, 1),
    },
  );

  const clinicaddSlide = interpolate(
    frame,
    [introduration + 25, introduration + 30],
    [-100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.66, 0.04, 0.15, 1),
    },
  );

  const photoSlide = interpolate(
    frame,
    [introduration, introduration + 10],
    [100, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.66, 0.04, 0.15, 1),
    },
  );

  return (
    <div>
      <Sequence from={0}>
        <AbsoluteFill style={{
          backgroundImage: `url(${staticFile(`IPCA/bg.png`)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }} />
      </Sequence>
      <Sequence from={0} durationInFrames={introduration + audioduration}>
        <Video src={staticFile(`IPCA/YogaDay/${language}/Intro.mp4`)} />
      </Sequence>
      <Sequence from={introduration} durationInFrames={audioduration}>
        <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile(`IPCA/bg.png`)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
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
          <div>
            <Audio src={doctorAudio.downloadUrl} />
          </div>
        </AbsoluteFill>
        <Audio src={staticFile(`IPCA/audio.mp3`)} volume={0.3} />
      </Sequence>
      <Sequence
        from={introduration + audioduration}
        durationInFrames={introduration + audioduration + video}
      >
        <Video src={staticFile(`IPCA/YogaDay/${language}/${gender}.mp4`)} />
      </Sequence>

      <Sequence
        from={introduration + audioduration}
        durationInFrames={introduration + audioduration + video}
      >
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
      </Sequence>
    </div>
  );
};
