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

import React, { FunctionComponent, ButtonHTMLAttributes } from 'react';

import classNames from 'classnames';
import { CommonProps, keysOf } from '../../common';
import { OuiIcon } from '../../icon';
import { OuiI18n } from '../../i18n';

const sizeToClassNameMap = {
  s: 'ouiFormControlLayoutClearButton--small',
  m: null,
};

export const SIZES = keysOf(sizeToClassNameMap);

export type OuiFormControlLayoutClearButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: typeof SIZES[number];
  };

export const OuiFormControlLayoutClearButton: FunctionComponent<OuiFormControlLayoutClearButtonProps> = ({
  className,
  onClick,
  size = 'm',
  ...rest
}) => {
  const classes = classNames(
    'ouiFormControlLayoutClearButton',
    sizeToClassNameMap[size],
    className
  );

  return (
    <OuiI18n token="ouiFormControlLayoutClearButton.label" default="清除输入">
      {(label: string) => (
        <button
          type="button"
          className={classes}
          onClick={onClick}
          aria-label={label}
          {...rest}>
          <OuiIcon
            className="ouiFormControlLayoutClearButton__icon"
            type="cross"
          />
        </button>
      )}
    </OuiI18n>
  );
};
