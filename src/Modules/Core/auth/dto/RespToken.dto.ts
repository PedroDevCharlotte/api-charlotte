export class RespTokenDto {
  access_token: string;
  requires2FA?: boolean;
  user?: userDetails; // Define a more specific type if possible
  register2FA?: boolean;
  isFirstLogin?: boolean; // Indica si es el primer inicio de sesión del usuario
}

export class userDetails {
  id: number;
  role: string;
  name: string; // Nombre completo del usuario
  department: string;
  roleId: number;
  email: string;
  departmentId: number;
}
