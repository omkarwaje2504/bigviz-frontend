import { staticFile, Video, AbsoluteFill, Sequence } from "remotion";

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
  return (
    <div>
      {/* <Sequence from={0} durationInFrames={192}>
        <Video src={staticFile(`IPCA/YogaDay/${language}/Intro.mp4`)} />
      </Sequence> */}
      <Sequence from={0} durationInFrames={200}>
        <AbsoluteFill style={{ backgroundColor: "black" }}>
          <div className="text-white">
            <p>Hello {name}</p>
            {name},{speciality},{clinic_address},{clinic_name}
          </div>
        </AbsoluteFill>
      </Sequence>
    </div>
  );
};

export default YogaDay;
