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
      primaryText: projectData?.config?.theme?.primary_text_color || "#000000",
      primaryColor: projectData?.config?.theme?.primary_color || "#fb2c36",
      secondaryColor: projectData?.config?.theme?.secondary_color || "#f5ba01",
      secondaryText: projectData?.config?.theme?.secondary_text_color || "#ffffff",
    },
    loaderPage: {
      loaderTitle:  projectData?.config?.theme?.loading_title || projectData?.name,
      loaderSubTitle:projectData?.config?.theme?.loading_subtitle || "Your jouney is starting from here",
      assetLoader: projectData?.config?.theme?.loading_assets_label || "Loading project assests.."
    },
    loginPage: {
      heading: projectData?.config?.theme?.emp_login_title || "Welcome Back",
      subHeading: projectData?.config?.theme?.emp_login_subtitle || "Sign in",
      loginLabel: projectData?.config?.theme?.emp_code_label || "Enter your Employee Code",
      loginButtonLabel: projectData?.config?.theme?.emp_login_button_text || "Sign In",
      passwordLabel: "Password",
      mobileLabel: "Mobile Number",
    },
    DoctorRegistrationForm:{
      FormHeading:projectData?.config?.theme?.heading?  projectData?.config?.theme?.heading : "Add New Doctor Registration",
      FormSubHeading:projectData?.config?.theme?.subheading?  projectData?.config?.theme?.subheading : "Complete the form below to create a new E-video for medical professionals",
      FormTitle:projectData?.config?.theme?.title?  projectData?.config?.theme?.title : " Doctor Information",
      SubmitButtonLable:projectData?.config?.theme?.doctor_submit_button_label || "Submit",
      MobileInputLable:projectData?.config?.theme?.doctor_mobile_number_label || "Mobile Number",
      MobileValidation: projectData?.config?.theme?.enable_mobile_validation ?? true,
      HomeRedirection:(projectData?.config?.game && projectData?.config?.game?.share_link) ? true : false
    },
    ErroMessageConfig:{
      isErrorMessageEnable: projectData?.config?.theme?.show_error_message ?? true,
    },
    HomePageLables:{
      prevButtonLable:projectData?.config?.theme?.home_prev_btn_label || "prev",
      nextButtonLable: projectData?.config?.theme?.home_next_btn_label || "next",
      gridButtonLable: projectData?.config?.theme?.home_grid_label || "Grid",
      listButtonLable: projectData?.config?.theme?.home_list_label || "List",
      serachHereLable: projectData?.config?.theme?.home_search_here_label ||"Search Here...",
      addedonLabel: projectData?.config?.theme?.added_on_label ||"Added On"
    },
    Dashboard: {
      HomePageTitle: projectData?.config?.theme?.home_title?  projectData?.config?.theme?.home_title : "Doctor List",
      HomePageSubTitle:projectData?.config?.theme?.home_page_subtitle?  projectData?.config?.theme?.home_page_subtitle : "Manage all your doctor from here",
      HomePageButtonLabel:projectData?.config?.theme?.home_page_button_label?  projectData?.config?.theme?.home_page_button_label : "Add New Doctor",
      title:projectData?.config?.theme?.home_title?  projectData?.config?.theme?.home_title : "Dashboard Overview",
      ActiveLabel: projectData?.config?.employee?.approval_required
        ? "Total Doctors"
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
    EVideoConfigs: {
      VideoID: projectData?.artworks?.[0]?.name
    },
    EmployeeConfig:{
      EmployeeCodeLabel:"Employee Code",
      EmployeeNameLabel:"Employee Name",
      EmployeeHQLabel:"Employee HQ",
      EmployeeRegionLabel:"Employee Region",
      EmployeeMobileLabel:"Employee Mobile",
      EmployeeEmailLabel:"Employee Email",
      EmployeeStateLabel:"Employee State",
      EmployeePinCodeLabel:"Employee PinCode",
      EmployeeAddressLabel:"Employee Address"
    }
  };
};

export default Config;
