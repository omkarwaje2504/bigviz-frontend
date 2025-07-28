const config =async (projectData) => {
  
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
      subHeading: "Sign in to manage your cinema ads",
      loginLabel: "Cinema Access Code",
      loginButtomLabel: "Sign In",
      passwordLabel: "Password",
      mobileLabel: "Mobile Number",
    },
    Dashboard: {
      HomePageTitle: "Doctor Management",
      HomePageSubTitle: "Manage all your doctor from here",
      HomePageButtonLabel: "Add New Doctor",
      title: "Dashboard Overview",
      ActiveLabel: projectData?.features.includes("approval_system")
        ? "Active Clients"
        : projectData?.product_name === "E-Video"
          ? "Videos Generated"
          : projectData?.product_name === "E-Greeting"
            ? "Greetings Generated"
            : "Active Members",
      PendingLabel: projectData?.features.includes("approval_system")
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

export default config;
