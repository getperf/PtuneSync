import { i18n } from "../I18n";
import { ja } from "../ja";
import { en } from "../en";

describe("I18n", () => {
	beforeEach(() => {
		i18n.init("ja");
	});

	test("default language ja", () => {
		expect(i18n.settings).toEqual(ja.settings);
	});

	test("switch to en", () => {
		i18n.init("en");

		expect(i18n.settings).toEqual(en.settings);
	});

	test("switch back to ja", () => {
		i18n.init("ja");

		expect(i18n.settings).toEqual(ja.settings);
	});

	test("common getter works", () => {
		expect(i18n.common).toEqual(ja.common);
	});
});
