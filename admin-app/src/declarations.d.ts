declare module 'lucide-react-native' {
  import type { ComponentType } from 'react';
  import type { ColorValue } from 'react-native';
  import type { SvgProps } from 'react-native-svg';

  export interface LucideProps extends Omit<SvgProps, 'color'> {
    color?: ColorValue;
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  export const LayoutDashboard: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Bell: LucideIcon;
  export const Settings: LucideIcon;
  export const LogOut: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Lock: LucideIcon;
  export const UserRound: LucideIcon;
  export const Check: LucideIcon;
  export const X: LucideIcon;
  export const Smartphone: LucideIcon;
  export const FileText: LucideIcon;
  export const IdCard: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Flag: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const Users: LucideIcon;
}
