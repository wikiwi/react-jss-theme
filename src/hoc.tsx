/*
 * Copyright (C) 2016 wikiwi.io
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */

import * as React from "react";
import objectAssign = require("object-assign");

import { Theme, StyleSheetReference } from "./theme";

export interface ThemeProviderContext {
  theme: Theme;
}

export interface ThemeProps {
  /** styleName are Style names from the Theme */
  styleName?: string;
}

export interface ThemeInjectedProps<T> {
  /** classes are the CSS classes of the Styles */
  classes?: T;
}

interface Props extends ThemeProps, ThemeInjectedProps<any> { }

export function removeThemeProps(props: Object) {
  let hocProps: Props = {
    styleName: undefined,
    classes: undefined,
  };
  for (let key in hocProps) {
    delete props[key];
  }
}

/**
 * decorateWithTheme wraps component with a HOC providing theming capabilities.
 *
 * @param TargetComponent  The target component to make themable.
 * @param defaultStyleName The default style to fetch from the theme.
 */
export function decorateWithTheme(TargetComponent: React.ComponentClass<any>, defaultStyleNames = ""): React.ComponentClass<any> {
  return class WithTheme extends React.Component<Props, void> {
    static contextTypes: any = {
      theme: React.PropTypes.object,
    };

    context: ThemeProviderContext;

    private classes: any;
    private sheetRefs: Array<StyleSheetReference>;

    constructor(props) {
      super(props);
      this.sheetRefs = new Array<StyleSheetReference>();
      this.classes = {};
    }

    private toStyleNameArray(...styleName: Array<string>): Array<string> {
      let computed = new Array<string>();
      for (let name of styleName) {
        if (!name || !name.trim()) {
          continue;
        }
        let items = name.split(/\s+/);
        for (let i of items) {
          let trimed = i.trim();
          if (trimed && computed.indexOf(trimed) === -1) {
            computed.push(trimed);
          }
        }
      }
      return computed;
    }

    componentWillMount() {
      if (!this.context.theme) {
        return;
      }
      let styleNames = this.toStyleNameArray(defaultStyleNames, this.props["styleName"]);
      for (let styleName of styleNames) {

        let ref = this.context.theme.require(styleName);
        if (!ref) {
          console.error(`Style name '${styleName}' was not found in template.`);
          return;
        }
        for (let className of Object.keys(ref.classes)) {
          if (this.classes[className] === undefined) {
            this.classes[className] = ref.classes[className];
            continue;
          }
          this.classes[className] += " " + ref.classes[className];
        }
        this.sheetRefs.push(ref);
      }
    }

    componentWillUnmount() {
      for (let ref of this.sheetRefs) {
        ref.release();
      }
    }

    public render() {
      let styleName = this.toStyleNameArray(defaultStyleNames, this.props["styleName"]).join(" ");
      let props = objectAssign({}, this.props, { styleName: styleName });
      if (this.classes) {
        props["classes"] = this.classes;
      }
      return <TargetComponent {...props} />;
    }
  } as React.ComponentClass<any>;
}

/**
 * WithTheme uses a Decorator signature.
 */
export function WithTheme(defaultStyleNames = ""): (target: React.ComponentClass<any>) => any {
  return (target: React.ComponentClass<any>) => {
    return decorateWithTheme(target, defaultStyleNames);
  };
}