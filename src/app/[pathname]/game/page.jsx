import { getAllProjectsCached } from "../../../../utils/projectCache";
import Config from "../../../../utils/Config";
import NotFoundPage from "../NotFoundPage";
import ScratchCard from "../../../components/pages/funzo/ScratchCard";
<<<<<<< HEAD
import VideoArtworkFlow from "@components/pages/VideoArtworkFlow";
=======
import ShalinaNigeriaFlagHosting from "../../../components/pages/funzo/ShalinaNigeriaFlagHosting";
>>>>>>> 841e2afbc29bcb5181ad5698155e4d728aed718d

export async function generateStaticParams() {
  const projects = await getAllProjectsCached();

  return projects.map((project) => ({
    pathname: project.project_hash?.toString(),
  }));
}

export async function generateMetadata({ params }) {
  const { pathname } = await params;
  const projects = await getAllProjectsCached();

  const projectInfo = projects.find(
    (project) => project.project_hash?.toString() === pathname,
  );

  return {
    title: projectInfo?.seo_title || "Default Title",
    description: projectInfo?.seo_description || "Default description",
    openGraph: {
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      images: [
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${projectInfo?.seo_image}` ||
          "/default-image.jpg",
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      image:
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${projectInfo?.seo_image}` ||
        "/default-image.jpg",
    },
  };
}

export default async function Home({ params }) {
  const { pathname } = await params;
  const projects = await getAllProjectsCached();

  const projectInfo = projects.find(
    (project) => project.project_hash?.toString() === pathname,
  );
  const ui = await Config(projectInfo);
  if (projectInfo) {
<<<<<<< HEAD
    if (projectInfo?.config?.game?.scratch_card && projectInfo?.project_hash !== "v42062x3") {
      console.log("Rendering ScratchCard for project:", projectInfo.project_hash);
=======
    if (pathname === "j02y1r2m" || pathname === "mg2n7zq8") {
      return (
        <ShalinaNigeriaFlagHosting
          projectData={projectInfo}
          projectId={pathname}
          ui={ui}
        />
      );
    } else if (projectInfo?.config?.game?.scratch_card) {
>>>>>>> 841e2afbc29bcb5181ad5698155e4d728aed718d
      return (
        <ScratchCard projectData={projectInfo} projectId={pathname} ui={ui} />
      );
    } else return <VideoArtworkFlow projectData={projectInfo} projectId={pathname} ui={ui} />;
  } else {
    <NotFoundPage />;
  }
}
