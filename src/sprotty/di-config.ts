/**
 * Copyright (c) 2022 ipyelk contributors.
 * Distributed under the terms of the Modified BSD License.
 */

/*******************************************************************************
 * Copyright (c) 2017 TypeFox GmbH (http://www.typefox.io) and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *******************************************************************************/

import { DOMWidgetView } from '@jupyter-widgets/base';

import { Container, ContainerModule } from 'inversify';
import {
  TYPES,
  defaultModule,
  boundsModule,
  fadeModule,
  moveModule,
  // hoverModule,
  // Tool,
  // MouseTool,
  exportModule,
  // SGraphView,
  // DiamondNodeView,
  // RectangularNodeView,
  // CircularNodeView,
  // SCompartmentView,
  // ForeignObjectView,
  // HtmlRootView,
  ConsoleLogger,
  LogLevel,
  configureViewerOptions,
  SvgExporter,
  configureModelElement,
  SGraph,
  edgeEditModule,
  undoRedoModule,
  // updateModule,
  routingModule,
  modelSourceModule,
  labelEditModule,

  // ICommandStack,
  // ToolManager, DefaultToolsEnablingKeyListener, ToolManagerActionHandler,
  // EnableToolsAction,
  // EnableDefaultToolsAction,
  // configureActionHandler,
  HoverFeedbackCommand,
  configureCommand,
  // HoverFeedbackAction
  // LocalModelSource,
  //
  // ModelRenderer,
  RenderingTargetKind,
  IVNodePostprocessor,
  ViewRegistry
} from 'sprotty';
import updateModule from './update';

import { JLModelSource } from './diagram-server';
import * as v from './views';
import {
  ElkNode,
  ElkPort,
  ElkEdge,
  ElkJunction,
  SymbolNode,
  ElkLabel
} from './sprotty-model';
import { ElkModelRenderer, SSymbolModelFactory } from './renderer';
import { toolFeedbackModule } from '../tools/feedback';
import viewportModule from './viewportModule';

class FilteringSvgExporter extends SvgExporter {
  protected isExported(styleSheet: CSSStyleSheet): boolean {
    return (
      styleSheet.href != null &&
      (styleSheet.href.endsWith('diagram.css') ||
        styleSheet.href.endsWith('sprotty.css'))
    );
  }
}

export default (containerId: string, view: DOMWidgetView) => {
  const elkGraphModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(TYPES.ModelSource)
      .to(JLModelSource)
      .inSingletonScope();

    rebind(TYPES.ILogger)
      .to(ConsoleLogger)
      .inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    rebind(TYPES.SvgExporter)
      .to(FilteringSvgExporter)
      .inSingletonScope();

    const context = { bind, unbind, isBound, rebind };

    // Initialize model element views
    configureModelElement(context, 'graph', SGraph, v.SGraphView);
    configureModelElement(context, 'node', ElkNode, v.ElkNodeView);
    configureModelElement(context, 'node:use', ElkNode, v.ElkUseNodeView);
    configureModelElement(context, 'node:diamond', ElkNode, v.ElkDiamondNodeView);
    configureModelElement(context, 'node:round', ElkNode, v.ElkRoundNodeView);
    configureModelElement(context, 'node:image', ElkNode, v.ElkImageNodeView);
    configureModelElement(context, 'node:comment', ElkNode, v.ElkCommentNodeView);
    configureModelElement(context, 'node:path', ElkNode, v.ElkPathNodeView);
    configureModelElement(context, 'node:svg', ElkNode, v.ElkSVGNodeView);
    configureModelElement(context, 'node:html', ElkNode, v.ElkJLNodeView);
    configureModelElement(context, 'node:widget', ElkNode, v.ElkJLNodeView);
    configureModelElement(
      context,
      'node:compartment',
      ElkNode,
      v.ElkCompartmentNodeView
    );
    configureModelElement(
      context,
      'node:foreignobject',
      ElkNode,
      v.ElkForeignObjectNodeView
    );

    configureModelElement(context, 'port', ElkPort, v.ElkPortView);
    configureModelElement(context, 'edge', ElkEdge, v.ElkEdgeView);
    configureModelElement(context, 'label', ElkLabel, v.ElkLabelView);
    configureModelElement(context, 'label:icon', ElkLabel, v.ElkLabelView);
    configureModelElement(context, 'junction', ElkJunction, v.JunctionView);
    configureViewerOptions(context, {
      needsClientLayout: false,
      baseDiv: containerId
    });

    // Hover
    configureCommand(context, HoverFeedbackCommand);

    // Model elements for symbols
    configureModelElement(context, 'symbol', SymbolNode, v.SymbolNodeView);

    // Expose extracted path and connector offset to the rendering context
    rebind(TYPES.ModelRendererFactory).toFactory<ElkModelRenderer>(ctx => {
      return (targetKind: RenderingTargetKind, processors: IVNodePostprocessor[]) => {
        const viewRegistry = ctx.container.get<ViewRegistry>(TYPES.ViewRegistry);
        const modelSource = ctx.container.get<JLModelSource>(TYPES.ModelSource);
        const renderer = new ElkModelRenderer(
          viewRegistry,
          targetKind,
          processors,
          modelSource
        );
        return renderer;
      };
    });

    rebind(TYPES.IModelFactory)
      .to(SSymbolModelFactory)
      .inSingletonScope();
  });
  const container = new Container();

  container.load(
    defaultModule,
    boundsModule,
    moveModule,
    fadeModule,
    //    hoverModule,
    updateModule,
    undoRedoModule,
    viewportModule,
    routingModule,
    exportModule,
    modelSourceModule,
    edgeEditModule,
    labelEditModule,
    toolFeedbackModule,
    elkGraphModule
  );
  return container;
};
