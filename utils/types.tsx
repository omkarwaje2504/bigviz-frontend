export interface UserTeam {
  name: string;
}

export interface UserInfo {
  name: string;
  role: number;
  role_name: string;
  designation: string;
  hash: string;
  code: string;
  contacts_count: number;
  hq: string;
  limit: number;
  region: string;
  state: string;
  team: UserTeam[];
  zone: string;
  avatar: string;
}

export default function data(){
    return null
}