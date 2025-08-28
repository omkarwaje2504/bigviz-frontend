import { FaFilm } from "react-icons/fa";
import { GiWoodFrame } from "react-icons/gi";

const Config = async (projectData) => {
  return {
    icons: {
      loadingScreen:
        projectData?.product_type === "PhotoFrame" ? (
          <GiWoodFrame
            className="text-8xl animate-pulse"
            style={{
              fill: projectData?.Theme?.secondaryColor || "#f5ba01",
            }}
          />
        ) : (
          <FaFilm
            className="text-8xl animate-pulse"
            style={{
              fill: projectData?.Theme?.secondaryColor || "#f5ba01",
            }}
          />
        ),
    },
    theme: {
      selectedBg: "bg-gradient-to-br from-red-600 to-red-900",
      unselectedBg: "bg-transparent",
      selectedText: "text-white",
      unselectedText: "text-red-100",
      selectedGradient: "bg-gradient-to-br from-red-600 to-red-900",
      selectedDot: "bg-red-600",
      unselectedBorder: "border-red-100",
      dotBorder: "border-white",
      selectedBorder: "border-white",
      highlightBg: "bg-gradient-to-br from-green-600 to-green-900",
    },
    basic: {
      primaryText: projectData?.Theme?.primaryTextColor || "#ffffff",
      primaryColor: projectData?.Theme?.primaryColor || "#fb2c36",
      secondaryColor: projectData?.Theme?.secondaryColor || "#f5ba01",
      secondaryText: projectData?.Theme?.secondaryTextColor || "#ffffff",
    },
    loginPage: {
      heading: "Welcome Back",
      subHeading: "Sign in",
      loginLabel: "Enter your Employee Code",
      loginButtomLabel: "Sign In",
      passwordLabel: "Password",
      mobileLabel: "Mobile Number",
    },
    DoctorRegistrationForm:{
      FormHeading:projectData?.config?.theme?.heading?  projectData?.config?.theme?.heading : "Add New Doctor Registration",
      FormSubHeading:projectData?.config?.theme?.subheading?  projectData?.config?.theme?.subheading : "Complete the form below to create a new E-video for medical professionals",
      FormTitle:projectData?.config?.theme?.title?  projectData?.config?.theme?.title : " Doctor Information",
    },
    Dashboard: {
      HomePageTitle: projectData?.config?.theme?.home_title?  projectData?.config?.theme?.home_title : "Doctor Management",
      HomePageSubTitle:projectData?.config?.theme?.home_page_subtitle?  projectData?.config?.theme?.home_page_subtitle : "Manage all your doctor from here",
      HomePageButtonLabel:projectData?.config?.theme?.home_page_button_label?  projectData?.config?.theme?.home_page_button_label : "Add New Doctor",
      title:projectData?.config?.theme?.home_title?  projectData?.config?.theme?.home_title : "Dashboard Overview",
      ActiveLabel: projectData?.config?.employee?.approval_required
        ? "Active Clients"
        : projectData?.product_name === "E-Video"
          ? "Videos Generated"
          : projectData?.product_name === "E-Greeting"
            ? "Greetings Generated"
            : "Active Members",
      PendingLabel: projectData?.config?.employee?.approval_required
        ? "Pending Approvals"
        : projectData?.product_name === "E-Video"
          ? "Videos Not Generated"
          : projectData?.product_name === "E-Greeting"
            ? "Greetings Not Generated"
            : "Pending Members",
    },
    ApprovalPageTitle: {
      HomePageTitle: `${projectData?.name} Approvals`,
    },
  };
};

export default Config;
