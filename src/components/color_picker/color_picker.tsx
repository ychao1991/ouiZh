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

import React, {
  FunctionComponent,
  HTMLAttributes,
  ReactElement,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import chroma, { ColorSpaces } from 'chroma-js';

import { CommonProps } from '../common';

import { OuiScreenReaderOnly } from '../accessibility';
import { OuiColorPickerSwatch } from './color_picker_swatch';
import { OuiFocusTrap } from '../focus_trap';
import { OuiFlexGroup, OuiFlexItem } from '../flex';
import {
  OuiFieldText,
  OuiFormControlLayout,
  OuiFormControlLayoutProps,
  OuiFormRow,
  OuiRange,
} from '../form';
import { OuiI18n } from '../i18n';
import { OuiPopover } from '../popover';
import { OuiSpacer } from '../spacer';
import { VISUALIZATION_COLORS, keys } from '../../services';

import { OuiHue } from './hue';
import { OuiSaturation } from './saturation';
import {
  getChromaColor,
  parseColor,
  HEX_FALLBACK,
  HSV_FALLBACK,
  RGB_FALLBACK,
  RGB_JOIN,
} from './utils';

type OuiColorPickerDisplay = 'default' | 'inline';
type OuiColorPickerMode = 'default' | 'swatch' | 'picker' | 'secondaryInput';

export interface OuiColorPickerOutput {
  rgba: ColorSpaces['rgba'];
  hex: string;
  isValid: boolean;
}

interface HTMLDivElementOverrides {
  /**
   * hex (字符串)
   * RGB (以逗号分隔的字符串)
   * RGBa (以逗号分隔的字符串)
   * 空字符串将被视为 '透明'
   */
  color?: string | null;
  onBlur?: () => void;
  /**
   * text (输入或选择的字符串)
   * hex (如果透明度 < 1，则为 8 位十六进制，否则为 6 位十六进制)
   * RGBa (数组形式；如果颜色无效，则值为 NaN)
   * isValid (布尔值，表示输入文本是否为有效颜色)
   */
  onChange: (text: string, output: OuiColorPickerOutput) => void;
  onFocus?: () => void;
}
export interface OuiColorPickerProps
  extends CommonProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof HTMLDivElementOverrides>,
    HTMLDivElementOverrides {
  /**
   *  用于替代文本输入的自定义元素
   */
  button?: ReactElement;
  /**
   *  对 OuiFieldText 使用压缩样式
   */
  compressed?: boolean;
  display?: OuiColorPickerDisplay;
  disabled?: boolean;
  fullWidth?: boolean;
  id?: string;
  /**
   *  自定义验证标志
   */
  isInvalid?: boolean;
  /**
   * 选择使用带渐变选择器的色板（默认）、仅色板、仅渐变选择器或仅辅助输入。
   */
  mode?: OuiColorPickerMode;
  /**
   *  自定义弹出框的 z-index
   */
  popoverZIndex?: number;
  readOnly?: boolean;
  /**
   *  用于作为色板选项的十六进制字符串数组（3 或 6 个字符）。默认为 OUI 可视化颜色
   */
  swatches?: string[];

  /**
   * 创建一个输入组，元素位于输入之前。仅当 `display` 设置为 `default` 时显示。
   * `string` | `ReactElement` 或这些的数组
   */
  prepend?: OuiFormControlLayoutProps['prepend'];

  /**
   * 创建一个输入组，元素位于输入之后。仅当 `display` 设置为 `default` 时显示。
   * `string` | `ReactElement` 或这些的数组
   */
  append?: OuiFormControlLayoutProps['append'];
  /**
   * 是否渲染 Alpha 通道（不透明度）值范围滑块。
   */
  showAlpha?: boolean;
  /**
   * 尽可能以提供的格式格式化文本输入（色相和饱和度选择）
   * 例外：手动文本输入和色板将按输入显示
   * 默认显示用户最后输入的格式
   */
  format?: 'hex' | 'rgba';
  /**
   * 辅助颜色值输入的放置选项。
   */
  secondaryInputDisplay?: 'top' | 'bottom' | 'none';
  /**
   * 向主输入添加一个清除其值的按钮。
   */
  isClearable?: boolean;
  /**
   * 替换未设置颜色值时默认的 '透明' 占位符的文本。
   */
  placeholder?: string;
}

function isKeyboardEvent(
  event: React.MouseEvent | React.KeyboardEvent
): event is React.KeyboardEvent {
  return typeof event === 'object' && 'key' in event;
}

const getOutput = (
  text: string | null,
  showAlpha: boolean = false
): OuiColorPickerOutput => {
  const color = getChromaColor(text, true);
  let isValid = true;
  if (!showAlpha && color !== null) {
    isValid = color.alpha() === 1;
  }
  // 请注意，如果使用者不允许不透明度，
  // 我们仍然返回带有 Alpha 通道的颜色，但将其标记为无效
  return color
    ? {
        rgba: color.rgba(),
        hex: color.hex(),
        isValid,
      }
    : {
        rgba: RGB_FALLBACK,
        hex: HEX_FALLBACK,
        isValid: false,
      };
};

const getHsv = (hsv?: number[], fallback: number = 0) => {
  // Chroma 的直通（RGB）解析确定黑色/白色/灰色没有色相，并返回 `NaN`
  // 出于我们的目的，如果需要，我们可以将 `NaN` 处理为 `0`
  if (!hsv) return HSV_FALLBACK;
  const hue = isNaN(hsv[0]) ? fallback : hsv[0];
  return [hue, hsv[1], hsv[2]] as ColorSpaces['hsv'];
};

export const OuiColorPicker: FunctionComponent<OuiColorPickerProps> = ({
  button,
  className,
  color,
  compressed = false,
  disabled,
  display = 'default',
  fullWidth = false,
  id,
  isInvalid,
  mode = 'default',
  onBlur,
  onChange,
  onFocus,
  readOnly = false,
  swatches = VISUALIZATION_COLORS,
  popoverZIndex,
  prepend,
  append,
  showAlpha = false,
  format,
  secondaryInputDisplay = 'none',
  isClearable = false,
  placeholder,
  'data-test-subj': dataTestSubj,
}) => {
  const preferredFormat = useMemo(() => {
    if (format) return format;
    const parsed = parseColor(color);
    return parsed != null && typeof parsed === 'object' ? 'rgba' : 'hex';
  }, [color, format]);
  const chromaColor = useMemo(() => getChromaColor(color, showAlpha), [
    color,
    showAlpha,
  ]);
  const [alphaRangeValue, setAlphaRangeValue] = useState('100');
  const alphaChannel = useMemo(() => {
    return chromaColor ? chromaColor.alpha() : 1;
  }, [chromaColor]);

  useEffect(() => {
    const percent = (alphaChannel * 100).toFixed();
    setAlphaRangeValue(percent);
  }, [alphaChannel]);

  const [isColorSelectorShown, setIsColorSelectorShown] = useState(false);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null); // 理想情况下使用 `useRef`，但 `OuiFieldText` 还不支持
  const [popoverShouldOwnFocus, setPopoverShouldOwnFocus] = useState(false);

  const prevColor = useRef(chromaColor ? chromaColor.rgba().join() : null);
  const [colorAsHsv, setColorAsHsv] = useState<ColorSpaces['hsv']>(
    chromaColor ? getHsv(chromaColor.hsv()) : HSV_FALLBACK
  );
  const usableHsv: ColorSpaces['hsv'] = useMemo(() => {
    if (chromaColor && chromaColor.rgba().join() !== prevColor.current) {
      const [h, s, v] = chromaColor.hsv();
      const hue = isNaN(h) ? colorAsHsv[0] : h;
      return [hue, s, v];
    }
    return colorAsHsv;
  }, [chromaColor, colorAsHsv]);

  const satruationRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  const testSubjAnchor = classNames('ouiColorPickerAnchor', dataTestSubj);

  const updateColorAsHsv = ([h, s, v]: ColorSpaces['hsv']) => {
    setColorAsHsv(getHsv([h, s, v], usableHsv[0]));
  };

  const classes = classNames('ouiColorPicker', className);
  const popoverClass = 'ouiColorPicker__popoverAnchor';
  const panelClasses = classNames('ouiColorPicker__popoverPanel', {
    'ouiColorPicker__popoverPanel--pickerOnly':
      mode === 'picker' && secondaryInputDisplay !== 'bottom',
    'ouiColorPicker__popoverPanel--customButton': button,
  });
  const swatchClass = 'ouiColorPicker__swatchSelect';
  const inputClasses = classNames('ouiColorPicker__input', {
    'ouiColorPicker__input--inGroup': prepend || append,
  });

  const handleOnChange = (text: string) => {
    const output = getOutput(text, showAlpha);
    if (output.isValid) {
      prevColor.current = output.rgba.join();
    }
    onChange(text, output);
  };

  const handleOnBlur = () => {
    // `onBlur` 在弹出框关闭时也会被调用
    // 因此，如果弹出框打开，则阻止第二次 `onBlur`
    if (!isColorSelectorShown && onBlur) {
      onBlur();
    }
  };

  const closeColorSelector = (shouldDelay = false) => {
    if (onBlur) {
      onBlur();
    }

    if (shouldDelay) {
      setTimeout(() => setIsColorSelectorShown(false));
    } else {
      setIsColorSelectorShown(false);
    }
  };

  const showColorSelector = (shouldFocusInside = false) => {
    if (isColorSelectorShown || readOnly) return;
    if (onFocus) {
      onFocus();
    }

    setPopoverShouldOwnFocus(shouldFocusInside);
    setIsColorSelectorShown(true);
  };

  const handleToggle = () => {
    if (isColorSelectorShown) {
      closeColorSelector();
    } else {
      showColorSelector(true);
    }
  };

  const handleFinalSelection = () => {
    // 当触发器是输入框时，聚焦输入框以便进行调整
    if (inputRef) {
      inputRef.focus();
    }

    closeColorSelector(true);
  };

  const handleOnKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === keys.ENTER) {
      if (isColorSelectorShown) {
        handleFinalSelection();
      } else {
        showColorSelector();
      }
    }
  };

  const handleInputActivity = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLInputElement>
  ) => {
    if (isKeyboardEvent(event)) {
      if (event.key === keys.ENTER) {
        event.preventDefault();
        handleToggle();
      }
    } else {
      showColorSelector();
    }
  };

  const handleToggleOnKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === keys.ARROW_DOWN) {
      event.preventDefault();
      if (isColorSelectorShown) {
        const nextFocusEl = mode !== 'swatch' ? satruationRef : swatchRef;
        if (nextFocusEl.current) {
          nextFocusEl.current.focus();
        }
      } else {
        showColorSelector(true);
      }
    }
  };

  const handleColorInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleOnChange(event.target.value);
    const newColor = getChromaColor(event.target.value, showAlpha);
    if (newColor) {
      updateColorAsHsv(newColor.hsv());
    }
  };

  const handleClearInput = () => {
    handleOnChange('');
    if (secondaryInputDisplay === 'none' && isColorSelectorShown) {
      closeColorSelector();
    }
  };

  const updateWithHsv = (hsv: ColorSpaces['hsv']) => {
    const color = chroma.hsv(...hsv).alpha(alphaChannel);
    let formatted;
    if (preferredFormat === 'rgba') {
      formatted =
        alphaChannel < 1
          ? color.rgba().join(RGB_JOIN)
          : color.rgb().join(RGB_JOIN);
    } else {
      formatted = color.hex();
    }
    handleOnChange(formatted);
    updateColorAsHsv(hsv);
  };

  const handleColorSelection = (color: ColorSpaces['hsv']) => {
    const [h] = usableHsv;
    const [, s, v] = color;
    const newHsv: ColorSpaces['hsv'] = [h, s, v];
    updateWithHsv(newHsv);
  };

  const handleHueSelection = (hue: number) => {
    const [, s, v] = usableHsv;
    const newHsv: ColorSpaces['hsv'] = [hue, s, v];
    updateWithHsv(newHsv);
  };

  const handleSwatchSelection = (color: string) => {
    const newColor = getChromaColor(color, showAlpha);
    handleOnChange(color);
    if (newColor) {
      updateColorAsHsv(newColor.hsv());
    }

    handleFinalSelection();
  };

  const handleAlphaSelection = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>,
    isValid: boolean
  ) => {
    const target = e.target as HTMLInputElement;
    setAlphaRangeValue(target.value || '');
    if (isValid) {
      const alpha = parseInt(target.value, 10) / 100;
      const newColor = chromaColor ? chromaColor.alpha(alpha) : null;
      const hex = newColor ? newColor.hex() : HEX_FALLBACK;
      const rgba = newColor ? newColor.rgba() : RGB_FALLBACK;
      let text;
      if (preferredFormat === 'rgba') {
        text =
          alpha < 1 ? rgba.join(RGB_JOIN) : rgba.slice(0, 3).join(RGB_JOIN);
      } else {
        text = hex;
      }
      onChange(text, { hex, rgba, isValid: !!newColor });
    }
  };

  const inlineInput = secondaryInputDisplay !== 'none' && (
    <OuiI18n
      tokens={[
        'ouiColorPicker.colorLabel',
        'ouiColorPicker.colorErrorMessage',
        'ouiColorPicker.transparent',
      ]}
      defaults={['颜色值', '无效的颜色值', '透明']}>
      {([colorLabel, colorErrorMessage, transparent]: string[]) => (
        <OuiFormRow
          display="rowCompressed"
          isInvalid={isInvalid}
          error={isInvalid ? colorErrorMessage : null}>
          <OuiFormControlLayout
            clear={
              isClearable && color && !readOnly && !disabled
                ? { onClick: handleClearInput }
                : undefined
            }
            readOnly={readOnly}
            compressed={compressed}>
            <OuiFieldText
              compressed={true}
              value={color ? color.toUpperCase() : HEX_FALLBACK}
              placeholder={!color ? placeholder || transparent : undefined}
              onChange={handleColorInput}
              isInvalid={isInvalid}
              disabled={disabled}
              readOnly={readOnly}
              aria-label={colorLabel}
              autoComplete="off"
              data-test-subj={`ouiColorPickerInput_${secondaryInputDisplay}`}
            />
          </OuiFormControlLayout>
        </OuiFormRow>
      )}
    </OuiI18n>
  );

  const showSecondaryInputOnly = mode === 'secondaryInput';
  const showPicker = mode !== 'swatch' && !showSecondaryInputOnly;
  const showSwatches = mode !== 'picker' && !showSecondaryInputOnly;

  const composite = (
    <>
      {secondaryInputDisplay === 'top' && (
        <>
          {inlineInput}
          <OuiSpacer size="s" />
        </>
      )}
      {showPicker && (
        <div onKeyDown={handleOnKeyDown}>
          <OuiSaturation
            id={id}
            color={usableHsv}
            hex={chromaColor ? chromaColor.hex() : undefined}
            onChange={handleColorSelection}
            ref={satruationRef}
          />
          <OuiHue
            id={id}
            hue={usableHsv[0]}
            hex={chromaColor ? chromaColor.hex() : undefined}
            onChange={handleHueSelection}
          />
        </div>
      )}
      {showSwatches && (
        <OuiFlexGroup wrap responsive={false} gutterSize="s" role="listbox">
          {swatches.map((swatch, index) => (
            <OuiFlexItem grow={false} key={swatch}>
              <OuiI18n
                token="ouiColorPicker.swatchAriaLabel"
                values={{ swatch }}
                default="选择 {swatch} 作为颜色">
                {(swatchAriaLabel: string) => (
                  <OuiColorPickerSwatch
                    className={swatchClass}
                    color={swatch}
                    onClick={() => handleSwatchSelection(swatch)}
                    aria-label={swatchAriaLabel}
                    role="option"
                    ref={index === 0 ? swatchRef : undefined}
                  />
                )}
              </OuiI18n>
            </OuiFlexItem>
          ))}
        </OuiFlexGroup>
      )}
      {secondaryInputDisplay === 'bottom' && (
        <>
          {mode !== 'picker' && <OuiSpacer size="s" />}
          {inlineInput}
        </>
      )}
      {showAlpha && (
        <>
          <OuiSpacer size="s" />
          <OuiI18n
            token="ouiColorPicker.alphaLabel"
            default="Alpha 通道（不透明度）值">
            {(alphaLabel: string) => (
              <OuiRange
                className="ouiColorPicker__alphaRange"
                data-test-subj="ouiColorPickerAlpha"
                compressed={true}
                showInput={true}
                max={100}
                min={0}
                value={alphaRangeValue}
                append="%"
                onChange={handleAlphaSelection}
                aria-label={alphaLabel}
              />
            )}
          </OuiI18n>
        </>
      )}
    </>
  );

  let buttonOrInput;
  if (button) {
    buttonOrInput = cloneElement(button, {
      onClick: handleToggle,
      id: id,
      disabled: disabled,
      'data-test-subj': testSubjAnchor,
    });
  } else {
    const colorStyle = chromaColor ? chromaColor.css() : undefined;
    buttonOrInput = (
      <OuiFormControlLayout
        icon={
          !readOnly
            ? {
                type: 'arrowDown',
                side: 'right',
              }
            : undefined
        }
        clear={
          isClearable && color && !readOnly && !disabled
            ? { onClick: handleClearInput }
            : undefined
        }
        readOnly={readOnly}
        fullWidth={fullWidth}
        compressed={compressed}
        onKeyDown={handleToggleOnKeyDown}
        prepend={prepend}
        append={append}>
        <div
          // 用于通过 currentColor 将所选颜色传递给表单布局 SVG
          style={{
            color: colorStyle,
          }}>
          <OuiI18n
            tokens={[
              'ouiColorPicker.openLabel',
              'ouiColorPicker.closeLabel',
              'ouiColorPicker.transparent',
            ]}
            defaults={[
              '按转义键关闭弹出框',
              '按向下键打开包含颜色选项的弹出框',
              '透明',
            ]}>
            {([openLabel, closeLabel, transparent]: string[]) => (
              <OuiFieldText
                className={inputClasses}
                onClick={handleInputActivity}
                onKeyDown={handleInputActivity}
                onBlur={handleOnBlur}
                value={color ? color.toUpperCase() : HEX_FALLBACK}
                placeholder={!color ? placeholder || transparent : undefined}
                id={id}
                onChange={handleColorInput}
                icon={chromaColor ? 'swatchInput' : 'stopSlash'}
                inputRef={setInputRef}
                isInvalid={isInvalid}
                compressed={compressed}
                disabled={disabled}
                readOnly={readOnly}
                fullWidth={fullWidth}
                autoComplete="off"
                data-test-subj={testSubjAnchor}
                aria-label={isColorSelectorShown ? openLabel : closeLabel}
              />
            )}
          </OuiI18n>
        </div>
      </OuiFormControlLayout>
    );
  }

  return display === 'inline' ? (
    <div className={classes}>{composite}</div>
  ) : (
    <OuiPopover
      ownFocus={popoverShouldOwnFocus}
      initialFocus={
        (mode !== 'swatch' ? satruationRef.current : swatchRef.current) ??
        undefined
      }
      button={buttonOrInput}
      isOpen={isColorSelectorShown}
      closePopover={handleFinalSelection}
      zIndex={popoverZIndex}
      className={popoverClass}
      panelClassName={panelClasses}
      display={button ? 'inlineBlock' : 'block'}
      attachToAnchor={button ? false : true}
      anchorPosition="downLeft"
      panelPaddingSize="s">
      <div className={classes} data-test-subj="ouiColorPickerPopover">
        <OuiFocusTrap clickOutsideDisables={true}>
          <OuiScreenReaderOnly>
            <p aria-live="polite">
              <OuiI18n
                token="ouiColorPicker.screenReaderAnnouncement"
                default="一个包含一系列可选颜色的弹出框已打开。向前按 Tab 键循环选择颜色选项，或按 Esc 键关闭此弹出框。"
              />
            </p>
          </OuiScreenReaderOnly>
          {composite}
        </OuiFocusTrap>
      </div>
    </OuiPopover>
  );
};

// @internal
export type OuiCompressedColorPickerProps = Omit<
  OuiColorPickerProps,
  'compressed'
>;

// @internal
export const OuiCompressedColorPicker: FunctionComponent<OuiCompressedColorPickerProps> = (
  props
) => <OuiColorPicker {...props} compressed />;
