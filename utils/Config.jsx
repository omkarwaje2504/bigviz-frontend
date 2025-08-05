<<<<<<< HEAD
const config =async (projectData) => {
=======

const Config = async(projectData) => {
>>>>>>> 4f3836edd0a4003361484e40128c55946ce00ff1
  
  return {
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
      highlightBg:"bg-gradient-to-br from-green-600 to-green-900"
    },
    basic: {
      primaryText: "#ffffff",
      primaryColor: "#fb2c36",
      secondaryColor: "#f5ba01",
      secondaryText: "#ffffff",
    },
    loginPage: {
      heading: "Welcome Back",
<<<<<<< HEAD
      subHeading: "Sign in to manage your cinema ads",
      loginLabel: "Cinema Access Code",
=======
      subHeading: "Sign in",
      loginLabel: "Enter your Employee Code",
>>>>>>> 4f3836edd0a4003361484e40128c55946ce00ff1
      loginButtomLabel: "Sign In",
      passwordLabel: "Password",
      mobileLabel: "Mobile Number",
    },
    Dashboard: {
      HomePageTitle: "Doctor Management",
      HomePageSubTitle: "Manage all your doctor from here",
      HomePageButtonLabel: "Add New Doctor",
      title: "Dashboard Overview",
<<<<<<< HEAD
      ActiveLabel: projectData?.features.includes("approval_system")
=======
      ActiveLabel: projectData?.features?.includes("approval_system")
>>>>>>> 4f3836edd0a4003361484e40128c55946ce00ff1
        ? "Active Clients"
        : projectData?.product_name === "E-Video"
          ? "Videos Generated"
          : projectData?.product_name === "E-Greeting"
            ? "Greetings Generated"
            : "Active Members",
<<<<<<< HEAD
      PendingLabel: projectData?.features.includes("approval_system")
=======
      PendingLabel: projectData?.features?.includes("approval_system")
>>>>>>> 4f3836edd0a4003361484e40128c55946ce00ff1
        ? "Pending Approvals"
        : projectData?.product_name === "E-Video"
          ? "Videos Not Generated"
          : projectData?.product_name === "E-Greeting"
            ? "Greetings Not Generated"
            : "Active Members",
    },
    ApprovalPageTitle: {
      HomePageTitle: "Cinema Ad Approvals",
    },
  };
};

<<<<<<< HEAD
export default config;
=======
export default Config;
>>>>>>> 4f3836edd0a4003361484e40128c55946ce00ff1
