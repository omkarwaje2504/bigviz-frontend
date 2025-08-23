
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

  return (
    <div>

    </div>
  );
};

export default YogaDay;
