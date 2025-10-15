import { getAllProjectsCached } from "../../../../utils/projectCache";
import Config from "../../../../utils/Config";
import NotFoundPage from "../NotFoundPage";
import ScratchCard from "../../../components/pages/funzo/ScratchCard";
import ShalinaNigeriaFlagHosting from "../../../components/pages/funzo/ShalinaNigeriaFlagHosting";
import VideoArtworkFlow from "@components/pages/VideoArtworkFlow";
import Puzzle from '@components/pages/funzo/Puzzle'

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
    console.log(pathname)
    if (pathname === "j02y1r2m" || pathname === "polygel-independence") {
      return (
        <ShalinaNigeriaFlagHosting
          projectData={projectInfo}
          projectId={pathname}
          ui={ui}
        />
      );
    } else if (projectInfo?.config?.game?.scratch_card) {
      return (
        <ScratchCard projectData={projectInfo} projectId={pathname} ui={ui} />
      );
    } else if(pathname==="xzpg9o2d"){
      return <Puzzle/>
    } else return <VideoArtworkFlow projectData={projectInfo} projectId={pathname} ui={ui} />;
  } else {
    <NotFoundPage />;
  }
}
