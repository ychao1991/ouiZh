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
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  FunctionComponent,
  ReactNode,
  HTMLAttributes,
} from 'react';
import classNames from 'classnames';

import { CommonProps, ExclusiveUnion } from '../common';

import { OuiBetaBadge } from '../badge/beta_badge';

import { getSecureRelForTarget } from '../../services';

import { IconType } from '../icon';
import { validateHref } from '../../services/security/href_validator';

const renderContent = (
  children: ReactNode,
  label: ReactNode,
  betaBadgeLabel?: ReactNode,
  betaBadgeTooltipContent?: ReactNode,
  betaBadgeIconType?: IconType
) => (
  <div className="ouiKeyPadMenuItem__inner">
    {betaBadgeLabel && (
      <span className="ouiKeyPadMenuItem__betaBadgeWrapper">
        <OuiBetaBadge
          className="ouiKeyPadMenuItem__betaBadge"
          label={betaBadgeLabel}
          iconType={betaBadgeIconType}
          tooltipContent={betaBadgeTooltipContent}
        />
      </span>
    )}

    <div className="ouiKeyPadMenuItem__icon">{children}</div>

    <p className="ouiKeyPadMenuItem__label">{label}</p>
  </div>
);

interface OuiKeyPadMenuItemCommonProps {
  /**
   * ReactNode to render as this component's content
   */
  children: ReactNode;
  isDisabled?: boolean;
  label: ReactNode;

  /**
   * Add a badge to the card to label it as "Beta" or other non-GA state
   */
  betaBadgeLabel?: string;

  /**
   * Supply an icon type if the badge should just be an icon
   */
  betaBadgeIconType?: IconType;

  /**
   * Add a description to the beta badge (will appear in a tooltip)
   */
  betaBadgeTooltipContent?: ReactNode;
  onClick?: () => void;
  href?: string;
  rel?: string;
}

export type OuiKeyPadMenuItemProps = CommonProps &
  ExclusiveUnion<
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'>,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>
  > &
  OuiKeyPadMenuItemCommonProps;

export const OuiKeyPadMenuItem: FunctionComponent<OuiKeyPadMenuItemProps> = ({
  isDisabled: _isDisabled,
  label,
  children,
  className,
  betaBadgeLabel,
  betaBadgeTooltipContent,
  betaBadgeIconType,
  href,
  rel,
  target,
  ...rest
}) => {
  const isHrefValid = !href || validateHref(href);
  const isDisabled = _isDisabled || !isHrefValid;

  const classes = classNames(
    'ouiKeyPadMenuItem',
    {
      'ouiKeyPadMenuItem--hasBetaBadge': betaBadgeLabel,
    },
    className
  );

  const Element = href && !isDisabled ? 'a' : 'button';
  const relObj: {
    role?: string;
    disabled?: boolean;
    type?: string;
    href?: string;
    rel?: string;
    target?: string;
  } = {};

  if (href && !isDisabled) {
    relObj.href = href;
    relObj.target = target;
    relObj.rel = getSecureRelForTarget({ href, rel, target });
  } else {
    relObj.type = 'button';
    relObj.disabled = isDisabled;
  }

  return (
    <Element
      className={classes}
      {...(relObj as HTMLAttributes<HTMLElement>)}
      {...(rest as HTMLAttributes<HTMLElement>)}>
      {renderContent(
        children,
        label,
        betaBadgeLabel,
        betaBadgeTooltipContent,
        betaBadgeIconType
      )}
    </Element>
  );
};
