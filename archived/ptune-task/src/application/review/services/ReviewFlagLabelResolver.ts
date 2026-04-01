import { i18n } from "../../../shared/i18n/I18n";

export class ReviewFlagLabelResolver {
  resolve(flag: string): string {
    const flags = i18n.common.review.flag;
    const value = (flags as Record<string, string>)[flag];
    return value ?? flags.unknown;
  }
}
