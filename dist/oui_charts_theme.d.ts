declare module '@opensearch-project/oui/dist/oui_charts_theme' {
	import { PartialTheme, LineAnnotationStyle, PartitionConfig } from '@elastic/charts';
	import { RecursivePartial } from '@opensearch-project/oui/src/components/common';
	export interface OuiChartThemeType {
	    lineAnnotation: LineAnnotationStyle;
	    theme: PartialTheme;
	    partition: RecursivePartial<PartitionConfig>;
	}
	export const OUI_CHARTS_THEME_LIGHT: OuiChartThemeType;
	export const OUI_CHARTS_THEME_DARK: OuiChartThemeType;
	export const OUI_CHARTS_NEXT_THEME_LIGHT: OuiChartThemeType;
	export const OUI_CHARTS_NEXT_THEME_DARK: OuiChartThemeType;
	export const OUI_SPARKLINE_THEME_PARTIAL: PartialTheme;
	export interface EuiChartThemeType extends OuiChartThemeType {
	}
	export const EUI_CHARTS_THEME_LIGHT: OuiChartThemeType;
	export const EUI_CHARTS_THEME_DARK: OuiChartThemeType;
	export const EUI_CHARTS_NEXT_THEME_LIGHT: OuiChartThemeType;
	export const EUI_CHARTS_NEXT_THEME_DARK: OuiChartThemeType;
	export const EUI_SPARKLINE_THEME_PARTIAL: PartialTheme;

}
