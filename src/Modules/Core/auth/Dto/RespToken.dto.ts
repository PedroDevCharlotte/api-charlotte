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
  // Lista de permisos (strings) que tiene el usuario vía rol
  permissions?: string[];
  // Lista única de modulePath tomada de los permisos para construir el menú
  menus?: string[];
}
