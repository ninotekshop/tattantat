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

  export const House: LucideIcon;
  export const LayoutGrid: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const Plus: LucideIcon;
  export const UserRound: LucideIcon;
  export const Bell: LucideIcon;
  export const Bot: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const FileText: LucideIcon;
  export const Heart: LucideIcon;
  export const LogOut: LucideIcon;
  export const PackageOpen: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Trash2: LucideIcon;
  export const Search: LucideIcon;
  export const Camera: LucideIcon;
  export const ImagePlus: LucideIcon;
  export const LocateFixed: LucideIcon;
  export const Sparkles: LucideIcon;
  export const X: LucideIcon;
  export const MapPin: LucideIcon;
  export const Send: LucideIcon;
  export const TriangleAlert: LucideIcon;
  export const Mail: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Lock: LucideIcon;
  export const Phone: LucideIcon;
  export const Pencil: LucideIcon;
  export const Flag: LucideIcon;
  export const Share2: LucideIcon;
  export const Clock: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const Check: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const BadgeCheck: LucideIcon;
  export const PlayCircle: LucideIcon;

  const icons: Record<string, LucideIcon>;
  export default icons;
}
