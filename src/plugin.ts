/**
 * Copyright (c) 2022 ipyelk contributors.
 * Distributed under the terms of the Modified BSD License.
 */
import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import { NAME, VERSION, ELK_DEBUG } from './tokens';
import '../style/index.css';

const EXTENSION_ID = `${NAME}:plugin`;

const plugin: IPlugin<Application<Widget>, void> = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  autoStart: true,
  activate: (app: Application<Widget>, registry: IJupyterWidgetRegistry) => {
    ELK_DEBUG && console.warn('elk activated');
    registry.registerWidget({
      name: NAME,
      version: VERSION,
      exports: async () => {
        const widgetExports = {
          ...(await import(/* webpackChunkName: "elklayout" */ './layout_widget')),
          ...(await import(/* webpackChunkName: "elkdisplay" */ './display_widget')),
          ...(await import(/* webpackChunkName: "elkexporter" */ './exporter'))
        };
        ELK_DEBUG && console.warn('widgets loaded');
        return widgetExports;
      }
    });
  }
};
export default plugin;
