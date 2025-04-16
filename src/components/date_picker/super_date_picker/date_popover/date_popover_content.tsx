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

import React, { FunctionComponent } from 'react';

import { OuiTabbedContent, OuiTabbedContentProps } from '../../../tabs';
import { OuiText } from '../../../text';
import { OuiButton } from '../../../button';

import { OuiAbsoluteTab } from './absolute_tab';
import { OuiRelativeTab } from './relative_tab';

import {
  getDateMode,
  DATE_MODES,
  toAbsoluteString,
  toRelativeString,
} from '../date_modes';
import { LocaleSpecifier } from 'moment'; // eslint-disable-line import/named

/**
 * OuiDatePopoverContent 组件的属性接口
 *
 * @interface OuiDatePopoverContentProps
 * @property {string} value - 日期值
 * @property {(date: string | null, event?: React.SyntheticEvent<any>) => void} onChange - 日期值改变时的回调函数
 * @property {boolean} [roundUp=false] - 是否向上取整
 * @property {string} dateFormat - 日期格式
 * @property {string} timeFormat - 时间格式
 * @property {LocaleSpecifier} [locale] - 本地化设置
 * @property {'start' | 'end'} position - 日期位置，开始或结束
 * @property {number} [utcOffset] - UTC 偏移量
 */
export interface OuiDatePopoverContentProps {
  value: string;
  onChange(date: string | null, event?: React.SyntheticEvent<any>): void;
  roundUp?: boolean;
  dateFormat: string;
  timeFormat: string;
  locale?: LocaleSpecifier;
  position: 'start' | 'end';
  utcOffset?: number;
}

/**
 * OuiDatePopoverContent 组件，用于显示日期选择弹出框内容
 *
 * @param {OuiDatePopoverContentProps} props - 组件属性
 * @returns {JSX.Element} 渲染的日期选择弹出框内容
 */
export const OuiDatePopoverContent: FunctionComponent<OuiDatePopoverContentProps> = ({
  value,
  roundUp = false,
  onChange,
  dateFormat,
  timeFormat,
  locale,
  position,
  utcOffset,
}) => {
  /**
   * 标签点击事件处理函数
   *
   * @param {OuiTabbedContentProps['onTabClick']} selectedTab - 选中的标签
   */
  const onTabClick: OuiTabbedContentProps['onTabClick'] = (selectedTab) => {
    switch (selectedTab.id) {
      case DATE_MODES.ABSOLUTE:
        onChange(toAbsoluteString(value, roundUp));
        break;
      case DATE_MODES.RELATIVE:
        onChange(toRelativeString(value));
        break;
    }
  };

  const ariaLabel = `${position === 'start' ? '开始' : '结束'} 日期:`;

  const renderTabs = [
    {
      id: DATE_MODES.ABSOLUTE,
      name: '绝对时间',
      content: (
        <OuiAbsoluteTab
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          locale={locale}
          value={value}
          onChange={onChange}
          roundUp={roundUp}
          position={position}
          utcOffset={utcOffset}
        />
      ),
      'data-test-subj': 'superDatePickerAbsoluteTab',
      'aria-label': `${ariaLabel} 绝对时间`,
    },
    {
      id: DATE_MODES.RELATIVE,
      name: '相对时间',
      content: (
        <OuiRelativeTab
          dateFormat={dateFormat}
          locale={locale}
          value={toAbsoluteString(value, roundUp)}
          onChange={onChange}
          roundUp={roundUp}
          position={position}
        />
      ),
      'data-test-subj': 'superDatePickerRelativeTab',
      'aria-label': `${ariaLabel} 相对时间`,
    },
    {
      id: DATE_MODES.NOW,
      name: '现在',
      content: (
        <OuiText
          size="s"
          color="subdued"
          className="ouiDatePopoverContent__padded--large">
          <p>将时间设置为“现在”意味着每次刷新时，该时间将设置为刷新的时间。</p>
          <OuiButton
            data-test-subj="superDatePickerNowButton"
            onClick={() => {
              onChange('now');
            }}
            fullWidth
            size="s"
            fill>
            将 {position} 日期和时间设置为现在
          </OuiButton>
        </OuiText>
      ),
      'data-test-subj': 'superDatePickerNowTab',
      'aria-label': `${ariaLabel} 现在`,
    },
  ];

  const initialSelectedTab = renderTabs.find(
    (tab) => tab.id === getDateMode(value)
  );

  return (
    <OuiTabbedContent
      className="ouiDatePopoverContent"
      tabs={renderTabs}
      autoFocus="selected"
      initialSelectedTab={initialSelectedTab}
      onTabClick={onTabClick}
      size="s"
      expand
    />
  );
};

OuiDatePopoverContent.displayName = 'OuiDatePopoverContent';
