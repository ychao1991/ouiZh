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

import React, { Component, AriaAttributes } from 'react';
import classNames from 'classnames';
import AceEditor, { IAceEditorProps } from 'react-ace';

import { keysOf } from '../common';
import { htmlIdGenerator, keys } from '../../services';
import { OuiI18n } from '../i18n';

const DEFAULT_MODE = 'text';
const DEFAULT_THEME = 'textmate';

function setOrRemoveAttribute(
  element: HTMLTextAreaElement,
  attributeName: SupportedAriaAttribute,
  value: SupportedAriaAttributes[SupportedAriaAttribute]
) {
  if (value === null || value === undefined) {
    element.removeAttribute(attributeName);
  } else {
    element.setAttribute(attributeName, value);
  }
}

type SupportedAriaAttribute =
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby';
type SupportedAriaAttributes = Pick<AriaAttributes, SupportedAriaAttribute>;

export interface OuiCodeEditorProps
  extends SupportedAriaAttributes,
    Omit<IAceEditorProps, 'mode'> {
  width?: string;
  height?: string;
  onBlur?: IAceEditorProps['onBlur'];
  onFocus?: IAceEditorProps['onFocus'];
  isReadOnly?: boolean;
  setOptions: IAceEditorProps['setOptions'];
  cursorStart?: number;
  'data-test-subj'?: string;
  /**
   * Select the `brace` theme
   * The matching theme file must also be imported from `brace` (e.g., `import 'brace/theme/github';`)
   */
  theme?: IAceEditorProps['theme'];

  /**
   * Use string for a built-in mode or object for a custom mode
   */
  mode?: IAceEditorProps['mode'] | object;
  id?: string;
}

export interface OuiCodeEditorState {
  isHintActive: boolean;
  isEditing: boolean;
  name: string;
}

export class OuiCodeEditor extends Component<
  OuiCodeEditorProps,
  OuiCodeEditorState
> {
  static defaultProps = {
    setOptions: {},
  };

  state: OuiCodeEditorState = {
    isHintActive: true,
    isEditing: false,
    name: htmlIdGenerator()(),
  };

  idGenerator = htmlIdGenerator();
  aceEditor: AceEditor | null = null;
  editorHint: HTMLButtonElement | null = null;

  aceEditorRef = (aceEditor: AceEditor | null) => {
    if (aceEditor) {
      this.aceEditor = aceEditor;
      const textbox = aceEditor.editor.textInput.getElement() as HTMLTextAreaElement;
      textbox.tabIndex = -1;
      textbox.addEventListener('keydown', this.onKeydownAce);
      setOrRemoveAttribute(textbox, 'aria-label', this.props['aria-label']);
      setOrRemoveAttribute(
        textbox,
        'aria-labelledby',
        this.props['aria-labelledby']
      );
      setOrRemoveAttribute(
        textbox,
        'aria-describedby',
        this.props['aria-describedby']
      );
    }
  };

  onEscToExit = () => {
    this.stopEditing();
    if (this.editorHint) {
      this.editorHint.focus();
    }
  };

  onKeydownAce = (event: KeyboardEvent) => {
    if (event.key === keys.ESCAPE) {
      event.preventDefault();
      event.stopPropagation();
      // Handles exiting edit mode when `isReadOnly` is set.
      // Other 'esc' cases handled by `stopEditingOnEsc` command.
      // Would run after `stopEditingOnEsc`.
      if (
        this.aceEditor !== null &&
        !this.aceEditor.editor.completer &&
        this.state.isEditing
      ) {
        this.onEscToExit();
      }
    }
  };

  onFocusAce: IAceEditorProps['onFocus'] = (event, editor) => {
    this.setState({
      isEditing: true,
    });
    if (this.props.onFocus) {
      this.props.onFocus(event, editor);
    }
  };

  onBlurAce: IAceEditorProps['onBlur'] = (event, editor) => {
    this.stopEditing();
    if (this.props.onBlur) {
      this.props.onBlur(event, editor);
    }
  };

  startEditing = () => {
    this.setState({
      isHintActive: false,
    });
    if (this.aceEditor !== null) {
      this.aceEditor.editor.textInput.focus();
    }
  };

  stopEditing() {
    this.setState({
      isHintActive: true,
      isEditing: false,
    });
  }

  isCustomMode() {
    return typeof this.props.mode === 'object';
  }

  setCustomMode() {
    if (this.aceEditor !== null) {
      this.aceEditor.editor.getSession().setMode(this.props.mode);
    }
  }

  componentDidMount() {
    if (this.isCustomMode()) {
      this.setCustomMode();
    }
    const { isReadOnly, id } = this.props;

    const textareaProps: {
      id?: string;
      readOnly?: boolean;
    } = { id, readOnly: isReadOnly };

    const el = document.getElementById(this.state.name);
    if (el) {
      const textarea = el.querySelector('textarea');
      if (textarea)
        keysOf(textareaProps).forEach((key) => {
          if (textareaProps[key])
            textarea.setAttribute(`${key}`, textareaProps[key]!.toString());
        });
    }
  }

  componentDidUpdate(prevProps: OuiCodeEditorProps) {
    if (this.props.mode !== prevProps.mode && this.isCustomMode()) {
      this.setCustomMode();
    }
  }

  render() {
    const {
      width,
      height,
      onBlur,
      isReadOnly,
      setOptions,
      cursorStart,
      mode = DEFAULT_MODE,
      'data-test-subj': dataTestSubj = 'codeEditorContainer',
      theme = DEFAULT_THEME,
      commands = [],
      ...rest
    } = this.props;

    const classes = classNames('ouiCodeEditorWrapper', {
      'ouiCodeEditorWrapper-isEditing': this.state.isEditing,
    });

    const promptClasses = classNames('ouiCodeEditorKeyboardHint', {
      'ouiCodeEditorKeyboardHint-isInactive': !this.state.isHintActive,
    });

    let filteredCursorStart;

    const options: IAceEditorProps['setOptions'] = { ...setOptions };

    if (isReadOnly) {
      // Put the cursor at the beginning of the editor, so that it doesn't look like
      // a prompt to begin typing.
      filteredCursorStart = -1;

      Object.assign(options, {
        readOnly: true,
        highlightActiveLine: false,
        highlightGutterLine: false,
      });
    } else {
      filteredCursorStart = cursorStart;
    }

    const prompt = (
      <button
        className={promptClasses}
        id={this.idGenerator('codeEditor')}
        ref={(hint) => {
          this.editorHint = hint;
        }}
        onClick={this.startEditing}
        data-test-subj="codeEditorHint">
        <p className="ouiText">
          {isReadOnly ? (
            <OuiI18n
              token="ouiCodeEditor.startInteracting"
              default="按 Enter 键开始与代码交互。"
            />
          ) : (
            <OuiI18n
              token="ouiCodeEditor.startEditing"
              default="按 Enter 键开始编辑。"
            />
          )}
        </p>

        <p className="ouiText">
          {isReadOnly ? (
            <OuiI18n
              token="ouiCodeEditor.stopInteracting"
              default="完成后，按 Escape 键停止与代码交互。"
            />
          ) : (
            <OuiI18n
              token="ouiCodeEditor.stopEditing"
              default="完成后，按 Escape 键停止编辑。"
            />
          )}
        </p>
      </button>
    );

    return (
      <div
        className={classes}
        style={{ width, height }}
        data-test-subj={dataTestSubj}>
        {prompt}

        <AceEditor
          // Setting a default, existing `mode` is necessary to properly initialize the editor
          // prior to dynamically setting a custom mode (https://github.com/elastic/eui/pull/2616)
          mode={this.isCustomMode() ? DEFAULT_MODE : (mode as string)} // https://github.com/securingsincity/react-ace/pull/771
          name={this.state.name}
          theme={theme}
          ref={this.aceEditorRef}
          width={width}
          height={height}
          onFocus={this.onFocusAce}
          onBlur={this.onBlurAce}
          setOptions={options}
          editorProps={{
            $blockScrolling: Infinity,
          }}
          cursorStart={filteredCursorStart}
          commands={[
            // Handles exiting edit mode in all cases except `isReadOnly`
            // Runs before `onKeydownAce`.
            {
              name: 'stopEditingOnEsc',
              bindKey: { win: 'Esc', mac: 'Esc' },
              exec: this.onEscToExit,
            },
            ...commands,
          ]}
          {...rest}
        />
      </div>
    );
  }
}
