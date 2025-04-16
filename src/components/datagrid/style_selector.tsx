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

import React, { ReactElement, useState } from 'react';
import { OuiDataGridStyle } from './data_grid_types';
import { OuiI18n } from '../i18n';
import { OuiPopover } from '../popover';
import { OuiButtonEmpty, OuiButtonGroup } from '../button';

export const startingStyles: OuiDataGridStyle = {
  cellPadding: 'm',
  fontSize: 'm',
  border: 'all',
  stripes: false,
  rowHover: 'highlight',
  header: 'shade',
  footer: 'overline',
  stickyFooter: true,
};

const densityStyles: { [key: string]: Partial<OuiDataGridStyle> } = {
  expanded: {
    fontSize: 'l',
    cellPadding: 'l',
  },
  normal: {
    fontSize: 'm',
    cellPadding: 'm',
  },
  compact: {
    fontSize: 's',
    cellPadding: 's',
  },
};

export const useDataGridStyleSelector = (
  initialStyles: OuiDataGridStyle
): [ReactElement, OuiDataGridStyle] => {
  // 跟踪用户在运行时指定的样式
  const [userGridStyles, setUserGridStyles] = useState({});

  const [isOpen, setIsOpen] = useState(false);

  // 这些是可用选项。它们驱动 gridDensity hook 以及渲染中的选项
  const densityOptions: string[] = ['expanded', 'normal', 'compact'];

  // 正常是默认密度
  const [gridDensity, _setGridDensity] = useState(densityOptions[1]);
  const setGridDensity = (density: string) => {
    _setGridDensity(density);
    setUserGridStyles(densityStyles[density]);
  };

  // 合并开发人员指定的样式和用户覆盖的样式
  const gridStyles = {
    ...initialStyles,
    ...userGridStyles,
  };

  const styleSelector = (
    <OuiPopover
      data-test-subj="dataGridStyleSelectorPopover"
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      anchorPosition="downCenter"
      panelPaddingSize="s"
      panelClassName="ouiDataGridColumnSelectorPopover"
      button={
        <OuiButtonEmpty
          size="xs"
          iconType="tableDensityExpanded"
          className="ouiDataGrid__controlBtn"
          color="text"
          data-test-subj="dataGridStyleSelectorButton"
          onClick={() => setIsOpen(!isOpen)}>
          <OuiI18n token="ouiStyleSelector.buttonText" default="密度" />
        </OuiButtonEmpty>
      }>
      <OuiI18n
        tokens={[
          'ouiStyleSelector.buttonLegend',
          'ouiStyleSelector.labelExpanded',
          'ouiStyleSelector.labelNormal',
          'ouiStyleSelector.labelCompact',
        ]}
        defaults={[
          '选择数据网格的显示密度',
          '展开密度',
          '正常密度',
          '紧凑密度',
        ]}>
        {([
          buttonLegend,
          labelExpanded,
          labelNormal,
          labelCompact,
        ]: string[]) => (
          <OuiButtonGroup
            legend={buttonLegend}
            name="density"
            className="oui-displayInlineBlock"
            buttonSize="compressed"
            options={[
              {
                id: densityOptions[0],
                label: labelExpanded,
                iconType: 'tableDensityExpanded',
              },
              {
                id: densityOptions[1],
                label: labelNormal,
                iconType: 'tableDensityNormal',
              },
              {
                id: densityOptions[2],
                label: labelCompact,
                iconType: 'tableDensityCompact',
              },
            ]}
            onChange={setGridDensity}
            idSelected={gridDensity}
            isIconOnly
          />
        )}
      </OuiI18n>
    </OuiPopover>
  );

  return [styleSelector, gridStyles];
};
