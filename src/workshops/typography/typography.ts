import * as ko from "knockout";
import * as Objects from "@paperbits/common/objects";
import * as Arrays from "@paperbits/common/arrays";
import template from "./typography.html";
import { StyleService } from "../../styleService";
import { Component, Param, Event, OnMounted } from "@paperbits/common/ko/decorators";
import { FontContract, ColorContract, ShadowContract } from "../../contracts";
import { TypographyStylePluginConfig } from "../../plugins";
import { ChangeRateLimit } from "@paperbits/common/ko/consts";


const inheritLabel = "(Inherit)";

@Component({
    selector: "typography",
    template: template
})
export class Typography {
    public fontKey: ko.Observable<any>;
    public fontSize: ko.Observable<any>;
    public fontWeight: ko.Observable<string | number>;
    public fontStyle: ko.Observable<any>;
    public lineHeight: ko.Observable<string | number>;
    public letterSpacing: ko.Observable<string | number>;
    public colorKey: ko.Observable<any>;
    public shadowKey: ko.Observable<any>;
    public textAlign: ko.Observable<any>;
    public textTransform: ko.Observable<any>;
    public textDecoration: ko.Observable<any>;
    public fontName: ko.Observable<string>;
    public colorName: ko.Observable<string>;
    public shadowName: ko.Observable<string>;
    public fontWeights: any[] = [];
    public fontStyles: any[] = [];
    public currentWeight: ko.Computed<string>;
    public currentStyle: ko.Computed<string>;

    public textTransformOptions: any = [
        { value: null, text: "(Inherit)" },
        { value: "none", text: "None" },
        { value: "capitalize", text: "Capitalize" },
        { value: "lowercase", text: "Lower-case" },
        { value: "uppercase", text: "Upper-case" }
    ];

    public textDecorationOptions: any = [
        { value: null, text: "(Inherit)" },
        { value: "none", text: "None" },
        { value: "underline", text: "Underline" },
        { value: "overline", text: "Overline" },
        { value: "line-through", text: "Line through" }
    ];

    @Param()
    public typography: ko.Observable<TypographyStylePluginConfig>;

    @Event()
    public onUpdate: (contract: TypographyStylePluginConfig) => void;

    constructor(private readonly styleService: StyleService) {
        this.typography = ko.observable();
        this.fontKey = ko.observable();
        this.fontSize = ko.observable();
        this.fontWeight = ko.observable();
        this.fontStyle = ko.observable();
        this.lineHeight = ko.observable();
        this.letterSpacing = ko.observable();
        this.colorKey = ko.observable();
        this.shadowKey = ko.observable();
        this.textAlign = ko.observable();
        this.textTransform = ko.observable();
        this.textDecoration = ko.observable();
        this.fontName = ko.observable();
        this.colorName = ko.observable();
        this.shadowName = ko.observable();
        this.currentWeight = ko.pureComputed(() => `${this.fontWeight() || "(Inherit)"}`);
        this.currentStyle = ko.pureComputed(() => `${this.fontStyle() || "(Inherit)"}`);
    }

    private async updateObservables(typographyContract: TypographyStylePluginConfig): Promise<void> {
        if (!typographyContract) {
            return;
        }

        const styles = await this.styleService.getStyles();

        if (typographyContract.fontKey) {
            const fontContract = Objects.getObjectAt<FontContract>(typographyContract.fontKey, styles);

            if (fontContract) {
                this.fontName(fontContract.displayName);
                this.fontKey(typographyContract.fontKey);

                const supportedWeights = fontContract.variants
                    .map(variant => variant.weight.toString());

                const deduplicated = Arrays.distinct(supportedWeights).sort();

                this.fontWeights = [].concat(deduplicated, undefined);
            }
            else {
                console.warn(`Font with key "${typographyContract.fontKey}" not found. Elements using it will fallback to parent's definition.`);
            }
        }
        else {
            this.fontWeights = ["bold", "normal", undefined];
        }

        this.fontStyles = ["italic", "normal", undefined];

        if (typographyContract.colorKey) {
            const colorContract = Objects.getObjectAt<FontContract>(typographyContract.colorKey, styles);

            if (colorContract) {
                this.colorName(colorContract.displayName);
                this.colorKey(typographyContract.colorKey);
            }
            else {
                console.warn(`Color with key "${typographyContract.colorKey}" not found. Elements using it will fallback to parent's definition.`);
            }
        }

        this.fontSize(typographyContract.fontSize);
        this.fontWeight(typographyContract.fontWeight);
        this.fontStyle(typographyContract.fontStyle);
        this.textTransform(typographyContract.textTransform);
        this.textDecoration(typographyContract.textDecoration);
        this.lineHeight(typographyContract.lineHeight);
        this.letterSpacing(typographyContract.letterSpacing);

        if (typographyContract.shadowKey) {
            const shadowContract = Objects.getObjectAt<FontContract>(typographyContract.shadowKey, styles);

            if (shadowContract) {
                this.shadowName(shadowContract.displayName);
                this.shadowKey(typographyContract.shadowKey);
            }
            else {
                console.warn(`Shadow with key "${typographyContract.shadowKey}" not found. Elements using it will fallback to parent's definition.`);
            }
        }

        this.textAlign(typographyContract.textAlign);
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        const typography = this.typography();

        this.fontName(inheritLabel);
        this.colorName(inheritLabel);
        this.shadowName(inheritLabel);

        await this.updateObservables(typography);

        this.fontKey.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.fontWeight.subscribe(this.applyChanges);
        this.fontStyle.subscribe(this.applyChanges);
        this.fontSize.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.lineHeight.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.letterSpacing.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.colorKey.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.shadowKey.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.textAlign.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.textTransform.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.textDecoration.extend(ChangeRateLimit).subscribe(this.applyChanges);
        this.typography.subscribe(this.updateObservables);
    }

    public async onFontSelected(fontContract: FontContract): Promise<void> {
        this.fontName(fontContract ? fontContract.displayName : inheritLabel);
        this.fontKey(fontContract ? fontContract.key : null);

        await this.updateObservables({
            fontKey: this.fontKey(),
            fontSize: this.fontSize(),
            textAlign: this.textAlign()
        });
    }

    public onColorSelected(colorContract: ColorContract): void {
        this.colorName(colorContract ? colorContract.displayName : inheritLabel);
        this.colorKey(colorContract ? colorContract.key : null);
    }

    public onShadowSelected(shadowContract: ShadowContract): void {
        this.shadowName(shadowContract ? shadowContract.displayName : inheritLabel);
        this.shadowKey(shadowContract ? shadowContract.key : null);
    }

    public toggleBold(): void {
        const weight = this.fontWeight();
        let index = this.fontWeights.indexOf(weight);

        index++;

        if (index > this.fontWeights.length - 1) {
            index = 0;
        }

        const newWeight = this.fontWeights[index];

        this.fontWeight(newWeight);
        //  this.currentWeight(`${newWeight || "(Inherit)"}`);
    }

    public toggleItalic(): void {
        const style = this.fontStyle();
        let index = this.fontStyles.indexOf(style);

        index++;

        if (index > this.fontStyles.length - 1) {
            index = 0;
        }

        const newStyle = this.fontStyles[index];

        this.fontStyle(newStyle);
    }

    public alignLeft(): void {
        const alignment = this.textAlign();
        this.textAlign(alignment === "left" ? null : "left");
    }

    public alignCenter(): void {
        const alignment = this.textAlign();
        this.textAlign(alignment === "center" ? null : "center");
    }

    public alignRight(): void {
        const alignment = this.textAlign();
        this.textAlign(alignment === "right" ? null : "right");
    }

    public justify(): void {
        const alignment = this.textAlign();
        this.textAlign(alignment === "justify" ? null : "justify");
    }

    private applyChanges(): void {
        if (!this.onUpdate) {
            return;
        }

        this.onUpdate({
            fontKey: this.fontKey(),
            fontSize: this.fontSize(),
            fontWeight: this.fontWeight(),
            fontStyle: this.fontStyle(),
            lineHeight: this.lineHeight(),
            letterSpacing: this.letterSpacing(),
            colorKey: this.colorKey(),
            shadowKey: this.shadowKey(),
            textAlign: this.textAlign(),
            textTransform: this.textTransform(),
            textDecoration: this.textDecoration()
        });
    }
}