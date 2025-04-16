/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * OpenSearch 贡献者要求对本文件的贡献遵循 Apache-2.0 许可或兼容的开源许可。
 *
 * 修改版权归 OpenSearch 贡献者所有。详情请查看 GitHub 历史记录。
 */

/*
 * 本文件已获得 Elasticsearch B.V. 依据一个或多个贡献者许可协议授权。
 * 有关版权归属的更多信息，请查看随本工作分发的 NOTICE 文件。
 * Elasticsearch B.V. 依据 Apache 许可证 2.0 版（“许可证”）将本文件授权给您；
 * 除非遵守许可证规定，否则您不得使用本文件。
 * 您可以在以下网址获取许可证副本：
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * 除非适用法律要求或书面同意，否则依据许可证分发的软件按“原样”分发，
 * 不附带任何形式的明示或暗示的保证和条件。请查看许可证了解具体的权限和限制规定。
 */

import React, {
  FunctionComponent,
  ReactChild,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';

import { CommonProps } from '../../common';
import {
  getPositionFromStop,
  getStopFromMouseLocation,
  isColorInvalid,
  isStopInvalid,
} from './utils';
import { getChromaColor } from '../utils';
import { keys, useMouseMove } from '../../../services';

import { OuiButtonIcon } from '../../button';
import { OuiColorPicker, OuiColorPickerProps } from '../color_picker';
import { OuiFlexGroup, OuiFlexItem } from '../../flex';
import { OuiFieldNumber, OuiFieldNumberProps, OuiFormRow } from '../../form';
import { OuiI18n } from '../../i18n';
import { OuiPopover } from '../../popover';
import { OuiScreenReaderOnly } from '../../accessibility';
import { OuiSpacer } from '../../spacer';
import { OuiRangeThumb } from '../../form/range/range_thumb';

/**
 * 色标接口，包含停止位置和颜色信息
 */
export interface ColorStop {
  /** 停止位置 */
  stop: number;
  /** 颜色值 */
  color: string;
}

/**
 * OuiColorStopThumb 组件的属性接口
 */
interface OuiColorStopThumbProps extends CommonProps, ColorStop {
  /** 自定义类名 */
  className?: string;
  /** 色标变更时的回调函数 */
  onChange: (colorStop: ColorStop) => void;
  /** 获取焦点时的回调函数 */
  onFocus?: () => void;
  /** 移除色标时的回调函数 */
  onRemove?: () => void;
  /** 全局最小值 */
  globalMin: number;
  /** 全局最大值 */
  globalMax: number;
  /** 局部最小值 */
  localMin: number;
  /** 局部最大值 */
  localMax: number;
  /** 自定义最小值 */
  min?: number;
  /** 自定义最大值 */
  max?: number;
  /** 是否为范围最小值 */
  isRangeMin?: boolean;
  /** 是否为范围最大值 */
  isRangeMax?: boolean;
  /** 父元素引用 */
  parentRef?: HTMLDivElement | null;
  /** 颜色选择器模式 */
  colorPickerMode: OuiColorPickerProps['mode'];
  /** 颜色选择器是否显示透明度通道 */
  colorPickerShowAlpha?: OuiColorPickerProps['showAlpha'];
  /** 颜色选择器的色板 */
  colorPickerSwatches?: OuiColorPickerProps['swatches'];
  /** 是否禁用组件 */
  disabled?: boolean;
  /** 是否为只读模式 */
  readOnly?: boolean;
  /** 弹出框是否打开 */
  isPopoverOpen: boolean;
  /** 打开弹出框的函数 */
  openPopover: () => void;
  /** 关闭弹出框的函数 */
  closePopover: () => void;
  /** 数据索引 */
  'data-index'?: string;
  /** 无障碍文本 */
  'aria-valuetext'?: string;
  /** 数字输入框的属性 */
  valueInputProps?: Partial<OuiFieldNumberProps>;
}

/**
 * OuiColorStopThumb 组件，用于显示和编辑色标
 * @param props - 组件属性
 */
export const OuiColorStopThumb: FunctionComponent<OuiColorStopThumbProps> = ({
  className,
  stop,
  color,
  onChange,
  onFocus,
  onRemove,
  globalMin,
  globalMax,
  localMin,
  localMax,
  min,
  max,
  isRangeMin = false,
  isRangeMax = false,
  parentRef,
  colorPickerMode,
  colorPickerShowAlpha,
  colorPickerSwatches,
  disabled,
  readOnly,
  isPopoverOpen,
  openPopover,
  closePopover,
  'data-index': dataIndex,
  'aria-valuetext': ariaValueText,
  valueInputProps = {},
}) => {
  // 根据颜色和是否显示透明度计算背景颜色
  const background = useMemo(() => {
    const chromaColor = getChromaColor(color, colorPickerShowAlpha);
    return chromaColor ? chromaColor.css() : undefined;
  }, [color, colorPickerShowAlpha]);
  // 记录是否获得焦点
  const [hasFocus, setHasFocus] = useState(isPopoverOpen);
  // 记录颜色是否无效
  const [colorIsInvalid, setColorIsInvalid] = useState(
    isColorInvalid(color, colorPickerShowAlpha)
  );
  // 记录停止位置是否无效
  const [stopIsInvalid, setStopIsInvalid] = useState(isStopInvalid(stop));
  // 记录数字输入框的引用
  const [numberInputRef, setNumberInputRef] = useState<HTMLInputElement | null>(
    null
  );
  // 记录弹出框的引用
  const popoverRef = useRef<OuiPopover>(null);

  // 当弹出框打开或停止位置变化时，重新定位弹出框
  useEffect(() => {
    if (isPopoverOpen && popoverRef && popoverRef.current) {
      popoverRef.current.positionPopoverFixed();
    }
  }, [isPopoverOpen, stop]);

  // 根据鼠标位置获取停止位置
  const getStopFromMouseLocationFn = (location: { x: number; y: number }) => {
    // 防止使用时引用为 `null`
    return getStopFromMouseLocation(location, parentRef!, globalMin, globalMax);
  };

  // 根据停止位置获取位置百分比
  const getPositionFromStopFn = (stop: ColorStop['stop']) => {
    // 防止使用时引用为 `null`
    return getPositionFromStop(stop, parentRef!, globalMin, globalMax);
  };

  // 处理移除色标事件
  const handleOnRemove = () => {
    if (onRemove) {
      closePopover();
      onRemove();
    }
  };

  // 处理获取焦点事件
  const handleFocus = () => {
    setHasFocus(true);
    if (onFocus) {
      onFocus();
    }
  };

  // 设置焦点状态为 true
  const setHasFocusTrue = () => setHasFocus(true);
  // 设置焦点状态为 false
  const setHasFocusFalse = () => setHasFocus(false);

  // 处理颜色变更事件
  const handleColorChange = (value: ColorStop['color']) => {
    setColorIsInvalid(isColorInvalid(value, colorPickerShowAlpha));
    onChange({ stop, color: value });
  };

  // 处理停止位置变更事件
  const handleStopChange = (value: ColorStop['stop']) => {
    const willBeInvalid = value > localMax || value < localMin;

    if (willBeInvalid) {
      if (value > localMax) {
        value = localMax;
      }
      if (value < localMin) {
        value = localMin;
      }
    }
    setStopIsInvalid(isStopInvalid(value));
    onChange({ stop: value, color });
  };

  // 处理数字输入框的变更事件
  const handleStopInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);

    const willBeInvalid = value > globalMax || value < globalMin;

    if (willBeInvalid) {
      if (value > globalMax && max != null) {
        value = globalMax;
      }
      if (value < globalMin && min != null) {
        value = globalMin;
      }
    }

    setStopIsInvalid(isStopInvalid(value));
    onChange({ stop: value, color });
  };

  // 处理指针位置变更事件
  const handlePointerChange = (
    location: { x: number; y: number },
    isFirstInteraction?: boolean
  ) => {
    if (isFirstInteraction) return; // 防止在初始鼠标按下事件时触发变更
    if (parentRef == null) {
      return;
    }
    const newStop = getStopFromMouseLocationFn(location);
    handleStopChange(newStop);
  };

  // 处理键盘按下事件
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case keys.ENTER:
        event.preventDefault();
        openPopover();
        break;

      case keys.ARROW_LEFT:
        event.preventDefault();
        if (readOnly) return;
        handleStopChange(stop - 1);
        break;

      case keys.ARROW_RIGHT:
        event.preventDefault();
        if (readOnly) return;
        handleStopChange(stop + 1);
        break;
    }
  };

  // 使用鼠标移动钩子处理指针位置变更
  const [handleMouseDown, handleInteraction] = useMouseMove<HTMLButtonElement>(
    handlePointerChange
  );

  // 处理鼠标按下事件
  const handleOnMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!readOnly) {
      handleMouseDown(e);
    }
    openPopover();
  };

  // 处理触摸交互事件
  const handleTouchInteraction = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (!readOnly) {
      handleInteraction(e);
    }
  };

  // 处理触摸开始事件
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    handleTouchInteraction(e);
    if (!isPopoverOpen) {
      openPopover();
    }
  };

  // 计算组件类名
  const classes = classNames(
    'ouiColorStopPopover',
    {
      'ouiColorStopPopover-hasFocus': hasFocus || isPopoverOpen,
    },
    className
  );

  return (
    <OuiPopover
      ref={popoverRef}
      className={classes}
      anchorClassName="ouiColorStopPopover__anchor"
      panelPaddingSize="s"
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      initialFocus={numberInputRef || undefined}
      focusTrapProps={{ clickOutsideDisables: false }}
      panelClassName={
        numberInputRef ? undefined : 'ouiColorStopPopover-isLoadingPanel'
      }
      style={{
        left: `${getPositionFromStopFn(stop)}%`,
      }}
      button={
        <OuiI18n
          tokens={[
            'ouiColorStopThumb.buttonAriaLabel',
            'ouiColorStopThumb.buttonTitle',
          ]}
          defaults={[
            '按 Enter 键修改此色标。按 Esc 键聚焦到组',
            '点击编辑，拖动重新定位',
          ]}>
          {([buttonAriaLabel, buttonTitle]: ReactChild[]) => {
            const ariaLabel = buttonAriaLabel as string;
            const title = buttonTitle as string;
            return (
              <OuiRangeThumb
                data-test-subj="ouiColorStopThumb"
                data-index={dataIndex}
                min={localMin}
                max={localMax}
                value={stop}
                onFocus={handleFocus}
                onBlur={setHasFocusFalse}
                onMouseOver={setHasFocusTrue}
                onMouseOut={setHasFocusFalse}
                onKeyDown={handleKeyDown}
                onMouseDown={handleOnMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchInteraction}
                aria-valuetext={ariaValueText}
                aria-label={ariaLabel}
                title={title}
                className="ouiColorStopThumb"
                tabIndex={-1}
                style={{
                  background,
                }}
                disabled={disabled}
              />
            );
          }}
        </OuiI18n>
      }>
      <div className="ouiColorStop" data-test-subj="ouiColorStopPopover">
        <OuiScreenReaderOnly>
          <p aria-live="polite">
            <OuiI18n
              token="ouiColorStopThumb.screenReaderAnnouncement"
              default="一个包含色标编辑表单的弹出框已打开。向前按 Tab 键循环选择表单控件，或按 Esc 键关闭此弹出框。"
            />
          </p>
        </OuiScreenReaderOnly>
        <OuiFlexGroup gutterSize="s" responsive={false}>
          <OuiFlexItem>
            <OuiI18n
              tokens={[
                'ouiColorStopThumb.stopLabel',
                'ouiColorStopThumb.stopErrorMessage',
              ]}
              defaults={['停止位置值', '值超出范围']}>
              {([stopLabel, stopErrorMessage]: React.ReactChild[]) => (
                <OuiFormRow
                  label={stopLabel}
                  display="rowCompressed"
                  isInvalid={stopIsInvalid}
                  error={stopIsInvalid ? stopErrorMessage : null}>
                  <OuiFieldNumber
                    {...valueInputProps}
                    inputRef={setNumberInputRef}
                    compressed={true}
                    readOnly={readOnly}
                    min={isRangeMin || min == null ? undefined : localMin}
                    max={isRangeMax || max == null ? undefined : localMax}
                    value={isStopInvalid(stop) ? '' : stop}
                    isInvalid={stopIsInvalid}
                    onChange={handleStopInputChange}
                  />
                </OuiFormRow>
              )}
            </OuiI18n>
          </OuiFlexItem>
          {!readOnly && (
            <OuiFlexItem grow={false}>
              <OuiFormRow display="rowCompressed" hasEmptyLabelSpace={true}>
                <OuiI18n
                  token="ouiColorStopThumb.removeLabel"
                  default="移除这个色标">
                  {(removeLabel: string) => (
                    <OuiButtonIcon
                      iconType="trash"
                      color="danger"
                      aria-label={removeLabel}
                      title={removeLabel}
                      disabled={!onRemove}
                      onClick={handleOnRemove}
                    />
                  )}
                </OuiI18n>
              </OuiFormRow>
            </OuiFlexItem>
          )}
        </OuiFlexGroup>
        {!readOnly && <OuiSpacer size="s" />}
        <OuiColorPicker
          readOnly={readOnly}
          onChange={handleColorChange}
          color={color}
          mode={readOnly ? 'secondaryInput' : colorPickerMode}
          swatches={colorPickerSwatches}
          display="inline"
          showAlpha={colorPickerShowAlpha}
          isInvalid={colorIsInvalid}
          secondaryInputDisplay={
            colorPickerMode === 'swatch' ? 'none' : 'bottom'
          }
        />
      </div>
    </OuiPopover>
  );
};
