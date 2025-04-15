/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Export all keys under a `keys` named variable
import * as keys from './keys';
export { keys };

export {
  accessibleClickKeys,
  cascadingMenuKeys,
  comboBoxKeys,
  htmlIdGenerator,
} from './accessibility';

export {
  HorizontalAlignment,
  LEFT_ALIGNMENT,
  RIGHT_ALIGNMENT,
  CENTER_ALIGNMENT,
} from './alignment';

export {
  BREAKPOINTS,
  BREAKPOINT_KEYS,
  getBreakpoint,
  isWithinBreakpoints,
  isWithinMaxBreakpoint,
  isWithinMinBreakpoint,
  OuiBreakpointSize,
} from './breakpoint';

export {
  isColorDark,
  isValidHex,
  calculateContrast,
  calculateLuminance,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  hsvToRgb,
  rgbToHex,
  rgbToHsv,
  VISUALIZATION_COLORS,
  DEFAULT_VISUALIZATION_COLOR,
  colorPalette,
  ouiPaletteForLightBackground,
  ouiPaletteForDarkBackground,
  ouiPaletteColorBlind,
  ouiPaletteColorBlindBehindText,
  ouiPaletteForStatus,
  ouiPaletteForTemperature,
  ouiPaletteComplimentary,
  ouiPaletteNegative,
  ouiPalettePositive,
  ouiPaletteCool,
  ouiPaletteWarm,
  ouiPaletteGray,
  HSV,
  getSteppedGradient,
} from './color';

export { useColorPickerState, useColorStopsState } from './color_picker';

export { copyToClipboard } from './copy_to_clipboard';

export {
  formatAuto,
  formatBoolean,
  formatDate,
  formatNumber,
  formatText,
  dateFormatAliases,
} from './format';

export { isEvenlyDivisibleBy, isWithinRange } from './number';

export { Pager } from './paging';

export { Random } from './random';

export { getSecureRelForTarget } from './security';

export { toSentenceCase, toInitials, slugify } from './string';

export {
  PropertySortType,
  PropertySort,
  SortDirectionType,
  SortDirection,
  Direction,
  SortableProperties,
  Comparators,
} from './sort';

export { calculatePopoverPosition, findPopoverPosition } from './popover';

export {
  getDurationAndPerformOnFrame,
  getTransitionTimings,
  getWaitDuration,
  performOnFrame,
} from './transition';

export { OuiWindowEvent } from './window_event';

export {
  useCombinedRefs,
  useDependentState,
  useIsWithinBreakpoints,
  useMouseMove,
  isMouseEvent,
} from './hooks';

export { throttle } from './throttle';

/* OUI -> EUI Aliases */
export type { OuiBreakpointSize as EuiBreakpointSize } from './breakpoint';
export {
  ouiPaletteForLightBackground as euiPaletteForLightBackground,
  ouiPaletteForDarkBackground as euiPaletteForDarkBackground,
  ouiPaletteColorBlind as euiPaletteColorBlind,
  ouiPaletteColorBlindBehindText as euiPaletteColorBlindBehindText,
  ouiPaletteForStatus as euiPaletteForStatus,
  ouiPaletteForTemperature as euiPaletteForTemperature,
  ouiPaletteComplimentary as euiPaletteComplimentary,
  ouiPaletteNegative as euiPaletteNegative,
  ouiPalettePositive as euiPalettePositive,
  ouiPaletteCool as euiPaletteCool,
  ouiPaletteWarm as euiPaletteWarm,
  ouiPaletteGray as euiPaletteGray,
} from './color';
export { OuiWindowEvent as EuiWindowEvent } from './window_event';
/* End of Aliases */
