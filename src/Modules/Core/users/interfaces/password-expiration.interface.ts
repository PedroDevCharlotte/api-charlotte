import { User } from '../Entity/user.entity';

export interface UserNotificationItem {
  user: User;
  daysRemaining: number;
}

export interface ExpiringPasswordUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  dateToPasswordExpiration: Date;
  daysRemaining: number;
  status: string;
}

export interface PasswordExpirationCheckResult {
  message: string;
  notificationsSent: number;
  usersChecked: number;
}
