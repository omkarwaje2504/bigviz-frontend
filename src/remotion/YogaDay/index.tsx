import { interpolate, staticFile, Video, AbsoluteFill, Audio, Sequence } from "remotion";
import { getInputProps } from "remotion";

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
}> = ({ frame, formData, download }) => {
  const input = getInputProps();
  const parsedFormData = formData || JSON.parse(input.formData || "{}");

  const {
    language = "English",
    gender = "Male",
    name = "",
    photo,
    speciality = "",
    clinic_address,
    clinic_name,
  } = parsedFormData;

  console.log("YogaDay component rendered with formData:", parsedFormData);


  return (
    <div>
      <Sequence from={0} durationInFrames={192}>
        <Video src={staticFile(`/IPCA/YogaDay/${language}/Intro.mp4`)} />
      </Sequence>
      <Sequence from={192} durationInFrames={1000}>
        <AbsoluteFill>
          <div>
            {name},{speciality},{clinic_address},{clinic_name}
          </div>
        </AbsoluteFill>
      </Sequence>
    </div>
  );
};

export default YogaDay;