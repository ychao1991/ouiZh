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
  Component,
  ChangeEventHandler,
  KeyboardEventHandler,
} from 'react';
import { timeUnits, timeUnitsPlural } from '../time_units';
import { OuiI18n } from '../../../i18n';
import { OuiFlexGroup, OuiFlexItem } from '../../../flex';
import { OuiTitle } from '../../../title';
import { OuiSpacer } from '../../../spacer';
import { OuiSelect, OuiFieldNumber } from '../../../form';
import { OuiButton } from '../../../button';
import { htmlIdGenerator } from '../../../../services';
import { OuiScreenReaderOnly } from '../../../accessibility';
import {
  Milliseconds,
  TimeUnitId,
  RelativeOption,
  ApplyRefreshInterval,
} from '../../types';
import { keysOf } from '../../../common';

const refreshUnitsOptions: RelativeOption[] = keysOf(timeUnits)
  .filter(
    (timeUnit) => timeUnit === 'h' || timeUnit === 'm' || timeUnit === 's'
  )
  .map((timeUnit) => ({ value: timeUnit, text: timeUnitsPlural[timeUnit] }));

const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;

function fromMilliseconds(milliseconds: Milliseconds): OuiRefreshIntervalState {
  const round = (value: number) => parseFloat(value.toFixed(2));
  if (milliseconds > MILLISECONDS_IN_HOUR) {
    return {
      units: 'h',
      value: round(milliseconds / MILLISECONDS_IN_HOUR),
    };
  }

  if (milliseconds > MILLISECONDS_IN_MINUTE) {
    return {
      units: 'm',
      value: round(milliseconds / MILLISECONDS_IN_MINUTE),
    };
  }

  return {
    units: 's',
    value: round(milliseconds / MILLISECONDS_IN_SECOND),
  };
}

function toMilliseconds(units: TimeUnitId, value: Milliseconds) {
  switch (units) {
    case 'h':
      return Math.round(value * MILLISECONDS_IN_HOUR);
    case 'm':
      return Math.round(value * MILLISECONDS_IN_MINUTE);
    case 's':
    default:
      return Math.round(value * MILLISECONDS_IN_SECOND);
  }
}

export interface OuiRefreshIntervalProps {
  applyRefreshInterval?: ApplyRefreshInterval;
  isPaused: boolean;
  refreshInterval: Milliseconds;
}

interface OuiRefreshIntervalState {
  value: number | '';
  units: TimeUnitId;
}

export class OuiRefreshInterval extends Component<
  OuiRefreshIntervalProps,
  OuiRefreshIntervalState
> {
  state: OuiRefreshIntervalState = fromMilliseconds(this.props.refreshInterval);

  generateId = htmlIdGenerator();

  onValueChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const sanitizedValue = parseFloat(event.target.value);
    this.setState(
      {
        value: isNaN(sanitizedValue) ? '' : sanitizedValue,
      },
      this.applyRefreshInterval
    );
  };

  onUnitsChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    this.setState(
      {
        units: event.target.value as TimeUnitId,
      },
      this.applyRefreshInterval
    );
  };

  startRefresh = () => {
    const { applyRefreshInterval } = this.props;
    const { value, units } = this.state;

    if (value !== '' && value > 0 && applyRefreshInterval !== undefined) {
      applyRefreshInterval({
        refreshInterval: toMilliseconds(units, value),
        isPaused: false,
      });
    }
  };

  handleKeyDown: KeyboardEventHandler<HTMLElement> = ({ key }) => {
    if (key === 'Enter') {
      this.startRefresh();
    }
  };

  applyRefreshInterval = () => {
    const { applyRefreshInterval, isPaused } = this.props;
    const { units, value } = this.state;
    if (value === '') {
      return;
    }
    if (!applyRefreshInterval) {
      return;
    }

    const refreshInterval = toMilliseconds(units, value);

    applyRefreshInterval({
      refreshInterval,
      isPaused: refreshInterval <= 0 ? true : isPaused,
    });
  };

  toggleRefresh = () => {
    const { applyRefreshInterval, isPaused } = this.props;
    const { units, value } = this.state;

    if (!applyRefreshInterval || value === '') {
      return;
    }
    applyRefreshInterval({
      refreshInterval: toMilliseconds(units, value),
      isPaused: !isPaused,
    });
  };

  render() {
    const { applyRefreshInterval, isPaused } = this.props;
    const { value, units } = this.state;
    const legendId = this.generateId();
    const refreshSelectionId = this.generateId();

    if (!applyRefreshInterval) {
      return null;
    }

    const options = refreshUnitsOptions.find(({ value }) => value === units);
    const optionText = options ? options.text : '';

    return (
      <fieldset>
        <OuiTitle size="xxxs">
          <legend id={legendId}>
            <OuiI18n
              token="ouiRefreshInterval.legend"
              default="每...刷新一次"
            />
          </legend>
        </OuiTitle>
        <OuiSpacer size="s" />
        <OuiFlexGroup gutterSize="s" responsive={false}>
          <OuiFlexItem>
            <OuiFieldNumber
              compressed
              value={value}
              onChange={this.onValueChange}
              onKeyDown={this.handleKeyDown}
              aria-label="Refresh interval value"
              aria-describedby={`${refreshSelectionId} ${legendId}`}
              data-test-subj="superDatePickerRefreshIntervalInput"
            />
          </OuiFlexItem>
          <OuiFlexItem>
            <OuiSelect
              compressed
              aria-label="Refresh interval units"
              aria-describedby={`${refreshSelectionId} ${legendId}`}
              value={units}
              options={refreshUnitsOptions}
              onChange={this.onUnitsChange}
              onKeyDown={this.handleKeyDown}
              data-test-subj="superDatePickerRefreshIntervalUnitsSelect"
            />
          </OuiFlexItem>
          <OuiFlexItem grow={false}>
            <OuiButton
              className="ouiRefreshInterval__startButton"
              iconType={isPaused ? 'play' : 'stop'}
              size="s"
              onClick={this.toggleRefresh}
              disabled={value === '' || value <= 0}
              data-test-subj="superDatePickerToggleRefreshButton"
              aria-describedby={refreshSelectionId}>
              {isPaused ? (
                <OuiI18n token="ouiRefreshInterval.start" default="开始" />
              ) : (
                <OuiI18n token="ouiRefreshInterval.stop" default="停止" />
              )}
            </OuiButton>
          </OuiFlexItem>
        </OuiFlexGroup>
        <OuiScreenReaderOnly>
          <p id={refreshSelectionId}>
            <OuiI18n
              token="ouiRefreshInterval.fullDescription"
              default="刷新间隔当前设置为 {optionValue} {optionText}。"
              values={{
                optionValue: value,
                optionText,
              }}
            />
          </p>
        </OuiScreenReaderOnly>
      </fieldset>
    );
  }
}
