import { getAllProjectsCached } from "../../../../utils/projectCache";
import RegisterNewCandidate from "@components/pages/RegisterNewCandidate";
import config from "../../../../utils/Config";

export async function generateStaticParams() {
  const projects = await getAllProjectsCached();
  return projects.map((project) => ({
    pathname:
      project.id?.toString() ||
      project.name?.toString() ||
      project.web_link?.split("/").pop(),
  }));
}

export async function generateMetadata({ params }) {
  const { pathname } = await params;
  const projects = await getAllProjectsCached();

  const projectInfo = projects.find(
    (project) =>
      project.id?.toString() === pathname ||
      project.name?.toString() === pathname ||
      project.web_link?.split("/").pop() === pathname,
  );

  return {
    title: projectInfo?.seo_title || "Default Title",
    description: projectInfo?.seo_description || "Default description",
    openGraph: {
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      images: [projectInfo?.logo || "/default-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      image: projectInfo?.logo || "/default-image.jpg",
    },
  };
}
export default async function Home({ params }) {
  const { pathname } = await params;
  const projects = await getAllProjectsCached();

  const projectInfo = projects.find(
    (project) =>
      project.id?.toString() === pathname ||
      project.name?.toString() === pathname ||
      project.web_link?.split("/").pop() === pathname,
  );
  const ui = await config(projectInfo);
  return (
    <RegisterNewCandidate
      projectData={projectInfo}
      projectId={projectInfo?.id}
      ui={ui}
    />
  );
}
