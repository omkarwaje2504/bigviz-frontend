import LoginPage from "@components/pages/LoginPage";
import { getAllProjectsCached } from "../../../utils/projectCache";

export async function generateStaticParams() {
  const projects = await getAllProjectsCached();
  console.log("generateStaticParams", projects.length);
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
  try {
    const { pathname } = await params;
    const projects = await getAllProjectsCached();

    const projectInfo = projects.find(
      (project) =>
        project.id?.toString() === pathname ||
        project.name?.toString() === pathname ||
        project.web_link?.split("/").pop() === pathname,
    );

    return <LoginPage projectData={projectInfo} projectId={pathname} />;
  } catch (error) {
    console.error("Error in Home component:", error);
    return <div>Error loading project data. Please try again later.</div>;
  }
}
