export interface UserTeam {
  name: string;
}

export interface UserInfo {
  name: string;
  role: 1 | 2 | 3 | 4 | 5;
  role_name: string;
  designation: string | null;
  hash: string | null;
  code: string | null;
  contacts_count: number;
  hq: string;
  limit: number;
  region: string;
  state: string;
  team: UserTeam[];
  zone: string;
  avatar: string | null;
}

export interface History {
  approved_at: string;
  employee_email: string;
  employee_name: string;
  role: number;
  status: "Approved" | "Pending" | "Declined" | "Delivered";
}
export type RoleNames = {
  [key: number]: string;
};

export interface ApprovalLogic {
  roleNames: RoleNames;
  approvalStackNumbers: number[];
  approvalHistory: History[];
  approvedRoles: number[];
  disapprovedRoles: number[];
  nextApproverRole: number | null;
  currentUserCanApprove: boolean;
  userHasActed: boolean;
  allApproved: boolean;
  anyDisapproved: boolean;
  userInApprovalFlow: boolean;
  currentUser: UserInfo;
}

export interface Doctor {
  approval_history: History[];
  comments: string | null;
  approved_at: string | null;
  photo_approval_status: 0 | 1 | 2 | 3 | 4;
  code: string | null;
  created_at: string;
  download_url: string;
  email: string | null;
  doctor_hash: string;
  mobile: string;
  name: string;
  image: string;
  values: Record<string, string>;
  updated_at: string;
   extras:{
        video_url: string
      }
}

export default function data() {
  return null;
}

export type FormData = Record<string, any>;

interface Field {
  additional_config: string[];
  default_value: string;
  display_name: string;
  helper: string;
  hint: string;
  id: string;
  name: string;
  placeholder: string;
  type: string;
}

export interface ProjectInfo {
  project_hash: string;
  product_type: string;
  features: any;
  config: {
    field: Field[];
    doctor: {
      approval_type: string;
      disable_doctor_prefix: boolean;
      disable_mobile_number: boolean;
      disable_photo_cropper: boolean;
      disable_photo_upload: boolean;
      enable_add_new_doctor: boolean;
      enable_contact_email: boolean;
      enable_edit_button: boolean;
      identifier_type: string;
      label: string;
      optional_first_photo: boolean;
      optional_mobile_number: boolean;
      country_codes: string[];
      prefix: string;
      regex: string;
      preview_enabled: boolean;
      download_enabled: boolean;
      edit_enabled: boolean;
     
    };
    employee: {
      approval_roles: string[];
      approval_required: boolean;
      Decline_Comments: boolean;
      Enable_hierarchy: boolean;
      employee_login_type: any;
      employee_login_using_number: boolean;
      final_artwork_allow_download: boolean;
      reprint_button: boolean;
    };
    game: {
      scratch_card: boolean;
    };
  };
  product_name: string;
}
export type MemberTableProps = {
  ui: any;
  projectData: ProjectInfo;
  userInfo: UserInfo;
  members: Doctor[];
  onEdit: (id: string) => void;
  approvalState?: boolean;
  approvingStatus?: any;
  onApprove?: (member: Doctor) => void;
  onDisapprove?: (member: Doctor, comment: string) => void;
};
