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

import React, { Component, HTMLAttributes, createContext } from 'react';
import classNames from 'classnames';
import { CommonProps } from '../common';
import { OuiI18n } from '../i18n';
import { OuiIcon } from '../icon';
import { OuiScreenReaderOnly } from '../accessibility';
import { OuiText } from '../text';
import { keys, htmlIdGenerator } from '../../services';
import { OuiInnerText } from '../inner_text';

// 创建树视图上下文
const OuiTreeViewContext = createContext<string>('');

/**
 * 检查对象是否包含 `aria-label` 属性
 * @param x - HTMLUListElement 的属性对象
 * @returns 如果包含 `aria-label` 属性则返回 true，否则返回 false
 */
function hasAriaLabel(
  x: HTMLAttributes<HTMLUListElement>
): x is { 'aria-label': string } {
  return x.hasOwnProperty('aria-label');
}

/**
 * 获取树的 ID
 * @param propId - 组件属性中传入的 ID
 * @param contextId - 上下文中的 ID
 * @param idGenerator - ID 生成函数
 * @returns 树的 ID
 */
function getTreeId(
  propId: string | undefined,
  contextId: string,
  idGenerator: Function
) {
  return propId ?? (contextId === '' ? idGenerator() : contextId);
}

/**
 * 树节点接口
 */
export interface Node {
  /** 要渲染为子节点的 OuiTreeViewNodes 数组 */
  children?: Node[];
  /** 该项的可读标签 */
  label: React.ReactNode;
  /** 唯一 ID */
  id: string;
  /** 标签左侧使用的图标 */
  icon?: React.ReactElement;
  /** 该项展开时显示的不同图标，例如打开的文件夹或向下箭头 */
  iconWhenExpanded?: React.ReactElement;
  /** 使用空图标使没有图标的项与其兄弟项对齐 */
  useEmptyIcon?: boolean;
  /** 该项是否展开 */
  isExpanded?: boolean;
  /** 可应用于节点的可选类名 */
  className?: string;
  /** 该项被点击时调用的函数，该项的打开状态将始终切换 */
  callback?(): string;
}

/**
 * 树视图显示选项类型
 */
export type OuiTreeViewDisplayOptions = 'default' | 'compressed';

/**
 * 显示选项到类名的映射对象
 */
const displayToClassNameMap: {
  [option in OuiTreeViewDisplayOptions]: string | null;
} = {
  default: null,
  compressed: 'ouiTreeView--compressed',
};

/**
 * 树视图状态接口
 */
interface OuiTreeViewState {
  // 展开的项的 ID 数组
  openItems: string[];
  // 激活的项的 ID
  activeItem: string;
  // 树的 ID
  treeID: string;
  // 是否展开子节点
  expandChildNodes: boolean;
}

/**
 * 通用树属性类型
 */
export type CommonTreeProps = CommonProps &
  HTMLAttributes<HTMLUListElement> & {
    /** OuiTreeViewNodes 数组 */
    items: Node[];
    /** 可选使用文本和图标尺寸较小的变体 */
    display?: OuiTreeViewDisplayOptions;
    /** 初始加载时将所有项设置为展开状态 */
    expandByDefault?: boolean;
    /** 在包含子项的所有项旁边显示展开箭头 */
    showExpansionArrows?: boolean;
  };

/**
 * 树视图属性类型
 */
export type OuiTreeViewProps = Omit<
  CommonTreeProps,
  'aria-label' | 'aria-labelledby'
> &
  ({ 'aria-label': string } | { 'aria-labelledby': string });

/**
 * OuiTreeView 组件，用于渲染树视图
 */
export class OuiTreeView extends Component<OuiTreeViewProps, OuiTreeViewState> {
  // 树 ID 生成器
  treeIdGenerator = htmlIdGenerator('ouiTreeView');
  // 静态上下文类型
  static contextType = OuiTreeViewContext;
  // 是否为嵌套树
  isNested: boolean = !!this.context;
  // 组件状态
  state: OuiTreeViewState = {
    openItems: this.props.expandByDefault
      ? this.props.items
          .map<string>(({ id, children }) =>
            children ? id : ((null as unknown) as string)
          )
          .filter((x) => x != null)
      : this.props.items
          .map<string>(({ id, children, isExpanded }) =>
            children && isExpanded ? id : ((null as unknown) as string)
          )
          .filter((x) => x != null),
    activeItem: '',
    treeID: getTreeId(this.props.id, this.context, this.treeIdGenerator),
    expandChildNodes: this.props.expandByDefault || false,
  };

  /**
   * 组件更新后生命周期方法
   * @param prevProps - 上一次的组件属性
   */
  componentDidUpdate(prevProps: OuiTreeViewProps) {
    if (this.props.id !== prevProps.id) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        treeID: getTreeId(this.props.id, this.context, this.treeIdGenerator),
      });
    }
  }

  // 按钮引用数组
  buttonRef: Array<HTMLButtonElement | undefined> = [];

  /**
   * 设置按钮引用
   * @param ref - 按钮的引用
   * @param index - 按钮在数组中的索引
   */
  setButtonRef = (
    ref: HTMLButtonElement | HTMLAnchorElement | null,
    index: number
  ) => {
    this.buttonRef[index] = ref as HTMLButtonElement;
  };

  /**
   * 处理节点点击事件
   * @param node - 被点击的节点
   * @param ignoreCallback - 是否忽略回调函数，默认为 false
   */
  handleNodeClick = (node: Node, ignoreCallback: boolean = false) => {
    const index = this.state.openItems.indexOf(node.id);

    this.setState({
      expandChildNodes: false,
    });

    node.isExpanded = !node.isExpanded;

    if (!ignoreCallback && node.callback !== undefined) {
      node.callback();
    }

    if (this.isNodeOpen(node)) {
      // 如果节点在 openItems 数组中，则移除它
      this.setState({
        openItems: this.state.openItems.filter((_, i) => i !== index),
      });
    } else {
      // 如果节点不在 openItems 数组中，则添加它
      this.setState((prevState) => ({
        openItems: [...prevState.openItems, node.id],
        activeItem: node.id,
      }));
    }
  };

  /**
   * 检查节点是否展开
   * @param node - 要检查的节点
   * @returns 如果节点展开则返回 true，否则返回 false
   */
  isNodeOpen = (node: Node) => {
    return this.state.openItems.includes(node.id);
  };

  /**
   * 处理键盘按键事件，实现键盘导航
   * @param event - 键盘事件对象
   * @param node - 当前节点
   */
  onKeyDown = (event: React.KeyboardEvent, node: Node) => {
    switch (event.key) {
      case keys.ARROW_DOWN: {
        const nodeButtons = Array.from(
          document.querySelectorAll(
            `[data-test-subj="ouiTreeViewButton-${this.state.treeID}"]`
          )
        );
        const currentIndex = nodeButtons.indexOf(event.currentTarget);
        if (currentIndex > -1) {
          const nextButton = nodeButtons[currentIndex + 1] as HTMLElement;
          if (nextButton) {
            event.preventDefault();
            event.stopPropagation();
            nextButton.focus();
          }
        }
        break;
      }
      case keys.ARROW_UP: {
        const nodeButtons = Array.from(
          document.querySelectorAll(
            `[data-test-subj="ouiTreeViewButton-${this.state.treeID}"]`
          )
        );
        const currentIndex = nodeButtons.indexOf(event.currentTarget);
        if (currentIndex > -1) {
          const prevButton = nodeButtons[currentIndex - 1] as HTMLElement;
          if (prevButton) {
            event.preventDefault();
            event.stopPropagation();
            prevButton.focus();
          }
        }
        break;
      }
      case keys.ARROW_RIGHT: {
        if (!this.isNodeOpen(node)) {
          event.preventDefault();
          event.stopPropagation();
          this.handleNodeClick(node, true);
        }
        break;
      }
      case keys.ARROW_LEFT: {
        if (this.isNodeOpen(node)) {
          event.preventDefault();
          event.stopPropagation();
          this.handleNodeClick(node, true);
        }
      }
      default:
        break;
    }
  };

  /**
   * 处理子节点的键盘按键事件
   * @param event - 键盘事件对象
   * @param index - 按钮在数组中的索引
   */
  onChildrenKeydown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === keys.ARROW_LEFT) {
      event.preventDefault();
      event.stopPropagation();
      this.buttonRef[index]!.focus();
    }
  };

  /**
   * 渲染组件
   * @returns 渲染的 React 元素
   */
  render() {
    const {
      children,
      className,
      items,
      display = 'default',
      expandByDefault,
      showExpansionArrows,
      ...rest
    } = this.props;

    // 计算类名
    const classes = classNames(
      'ouiTreeView',
      display ? displayToClassNameMap[display] : null,
      { 'ouiTreeView--withArrows': showExpansionArrows },
      className
    );

    const instructionsId = `${this.state.treeID}--instruction`;

    return (
      <OuiTreeViewContext.Provider value={this.state.treeID}>
        <OuiText
          size={display === 'compressed' ? 's' : 'm'}
          className="ouiTreeView__wrapper">
          {!this.isNested && (
            <OuiI18n
              token="ouiTreeView.listNavigationInstructions"
              default="您可以使用方向键快速导航此列表。">
              {(listNavigationInstructions: string) => (
                <OuiScreenReaderOnly>
                  <p id={instructionsId}>{listNavigationInstructions}</p>
                </OuiScreenReaderOnly>
              )}
            </OuiI18n>
          )}
          <ul
            className={classes}
            id={!this.isNested ? this.state.treeID : undefined}
            aria-describedby={!this.isNested ? instructionsId : undefined}
            {...rest}>
            {items.map((node, index) => {
              const buttonId = node.id;
              const wrappingId = this.treeIdGenerator(buttonId);

              return (
                <OuiInnerText
                  key={node.id + index}
                  fallback={typeof node.label === 'string' ? node.label : ''}>
                  {(ref, innerText) => (
                    <OuiI18n
                      key={node.id + index}
                      token="ouiTreeView.ariaLabel"
                      default="{nodeLabel} 是 {ariaLabel} 的子项"
                      values={{
                        nodeLabel: innerText,
                        ariaLabel: hasAriaLabel(rest) ? rest['aria-label'] : '',
                      }}>
                      {(ariaLabel: string) => {
                        const label:
                          | { 'aria-label': string }
                          | { 'aria-labelledby': string } = hasAriaLabel(rest)
                          ? {
                              'aria-label': ariaLabel,
                            }
                          : {
                              'aria-labelledby': `${buttonId} ${rest['aria-labelledby']}`,
                            };

                        const nodeClasses = classNames(
                          'ouiTreeView__node',
                          display ? displayToClassNameMap[display] : null,
                          {
                            'ouiTreeView__node--expanded': this.isNodeOpen(
                              node
                            ),
                          }
                        );

                        const nodeButtonClasses = classNames(
                          'ouiTreeView__nodeInner',
                          showExpansionArrows && node.children
                            ? 'ouiTreeView__nodeInner--withArrows'
                            : null,
                          this.state.activeItem === node.id
                            ? 'ouiTreeView__node--active'
                            : null,
                          node.className ? node.className : null
                        );

                        return (
                          <React.Fragment>
                            <li className={nodeClasses}>
                              <button
                                id={buttonId}
                                aria-controls={wrappingId}
                                aria-expanded={this.isNodeOpen(node)}
                                ref={(ref) => this.setButtonRef(ref, index)}
                                data-test-subj={`ouiTreeViewButton-${this.state.treeID}`}
                                onKeyDown={(event: React.KeyboardEvent) =>
                                  this.onKeyDown(event, node)
                                }
                                onClick={() => this.handleNodeClick(node)}
                                className={nodeButtonClasses}>
                                {showExpansionArrows && node.children ? (
                                  <OuiIcon
                                    className="ouiTreeView__expansionArrow"
                                    size={display === 'compressed' ? 's' : 'm'}
                                    type={
                                      this.isNodeOpen(node)
                                        ? 'arrowDown'
                                        : 'arrowRight'
                                    }
                                  />
                                ) : null}
                                {node.icon && !node.useEmptyIcon ? (
                                  <span className="ouiTreeView__iconWrapper">
                                    {this.isNodeOpen(node) &&
                                    node.iconWhenExpanded
                                      ? node.iconWhenExpanded
                                      : node.icon}
                                  </span>
                                ) : null}
                                {node.useEmptyIcon && !node.icon ? (
                                  <span className="ouiTreeView__iconPlaceholder" />
                                ) : null}
                                <span
                                  ref={ref}
                                  className="ouiTreeView__nodeLabel">
                                  {node.label}
                                </span>
                              </button>
                              <div
                                id={wrappingId}
                                onKeyDown={(event: React.KeyboardEvent) =>
                                  this.onChildrenKeydown(event, index)
                                }>
                                {node.children && this.isNodeOpen(node) ? (
                                  <OuiTreeView
                                    items={node.children}
                                    display={display}
                                    showExpansionArrows={showExpansionArrows}
                                    expandByDefault={
                                      this.state.expandChildNodes
                                    }
                                    {...label}
                                  />
                                ) : null}
                              </div>
                            </li>
                          </React.Fragment>
                        );
                      }}
                    </OuiI18n>
                  )}
                </OuiInnerText>
              );
            })}
          </ul>
        </OuiText>
      </OuiTreeViewContext.Provider>
    );
  }
}
