import { AbsoluteFill, Sequence } from "remotion";

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
    <Sequence from={0} durationInFrames={200}>
      <AbsoluteFill style={{ backgroundColor: "black", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "white", textAlign: "center", fontSize: "40px", lineHeight: 1.5 }}>
          <p>Hello {name}</p>
          <p className="text-red-500">{speciality}</p>
          <p>{clinic_name}</p>
          <p>{clinic_address}</p>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

export default YogaDay;
