import GenerateVideo from "@components/pages/GenerateVideo";
import { getAllProjectsCached } from "@utils/projectCache";
import Config from "@utils/Config";
import NotFoundPage from "../NotFoundPage";

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
      images: [`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${projectInfo?.seo_image}` || "/default-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      image: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${projectInfo?.seo_image}` || "/default-image.jpg",
    },
  };
}

export default async function Home({ params }) {
  try {
    const { pathname } = await params;
    const projects = await getAllProjectsCached();
    const projectInfo = projects.find(
      (project) => project.project_hash?.toString() === pathname,
    );

    const ui = await Config(projectInfo);
    if (projectInfo) {
      return (
        <GenerateVideo projectData={projectInfo} projectId={pathname} ui={ui} />
      );
    } else {
      return <NotFoundPage />;
    }
  } catch (error) {
    console.error("Error in Home component:", error);
    return <NotFoundPage />;
  }
}
