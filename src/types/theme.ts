export type ThemeColor = 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'teal';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeContextType {
  isDark: boolean;
  toggleDark: () => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}
