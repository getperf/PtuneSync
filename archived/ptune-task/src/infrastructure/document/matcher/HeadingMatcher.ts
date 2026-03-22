// src/infrastructure/document/matcher/HeadingMatcher.ts

import { hdrAllowPrefix, hdrAllowPrefixWith } from "md-ast-core";

export class HeadingMatcher {

  static heading(title: string): RegExp {
    return hdrAllowPrefix(title);
  }

  static headingWithSuffix(
    title: string,
    suffix: string
  ): RegExp {
    return hdrAllowPrefixWith(title, suffix);
  }

  static review(title: string): RegExp {
    return hdrAllowPrefixWith(title, "\\(.+\\)");
  }

  static reviewByLabel(
    title: string,
    label: string
  ): RegExp {

    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return hdrAllowPrefixWith(title, `\\(${escaped}\\)`);
  }
}