import * as React from "react";
import * as d3 from "d3";

import { Button } from "../controls/controls";
import { Label, Defaults } from "../model/model";

export interface IRowWidgetProps {
    text: string;
    title?: string;
    contentOnly?: boolean;
    columnCount?: number;
}

export class RowWidget<PropsType extends IRowWidgetProps, StatesType> extends React.Component<PropsType, StatesType> {

    public renderWidget(): JSX.Element {
        return null;
    }

    public render() {
        if(this.props.contentOnly) {
            return this.renderWidget();
        } else {
            return (
                <div className={`col-${this.props.columnCount || 12}`}>
                    <label title={this.props.title}>{this.props.text}</label>
                    <div className="widget-content">{ this.renderWidget() }</div>
                </div>
            );
        }
    }
}

function isTargetInElement(target: any, element: any) {
    var result = false;
    var item = target;
    while(item && item != document.body && item != document) {
        if(item == element) {
            result = true;
            break;
        }
        item = item.parentNode;
    }
    return result;
}

export interface ILabelWidgetProps extends IRowWidgetProps {
    label: Label;
    onChange: (newLabel: Label) => void;
}

export class LabelWidget extends RowWidget<ILabelWidgetProps, {
    currentLabel: Label;
}> {
    refs: {
        input: HTMLInputElement;
        inputColor: HTMLInputElement;
        dropdownContainer: HTMLDivElement;
        dropdownButton: HTMLButtonElement;
    }

    constructor(props: ILabelWidgetProps) {
        super(props);

        this.state = {
            currentLabel: this.props.label != null ? { ... this.props.label } : Defaults.label("")
        };

        this.onMouseDown = this.onMouseDown.bind(this);
    }

    public componentWillReceiveProps(nextProps: ILabelWidgetProps) {
        this.setState({
            currentLabel: nextProps.label != null ? { ... nextProps.label } : Defaults.label("")
        });
    }

    private sendEvent() {
        this.props.onChange(this.state.currentLabel);
    }

    public onMouseDown(e: MouseEvent) {
        if(!isTargetInElement(e.target, this.refs.dropdownContainer)) {
            this.completeDropdown();
        }
    }
    public startDropdown() {
        this.refs.dropdownContainer.style.display = "block";
        d3.select(this.refs.dropdownButton).classed("active", true);
        window.addEventListener("mousedown", this.onMouseDown);
    }
    public completeDropdown() {
        this.refs.dropdownContainer.style.display = "none";
        d3.select(this.refs.dropdownButton).classed("active", false);
        window.removeEventListener("mousedown", this.onMouseDown);
    }

    public renderWidget() {
        let label = this.state.currentLabel;
        return (
            <span className="label-widget">
                <input type="text" ref="input" placeholder={this.props.title} value={label.text}
                    onChange={(e) => {
                        this.state.currentLabel.text = this.refs.input.value;
                        this.setState({ currentLabel: this.state.currentLabel });
                    }}
                    onBlur={() => this.sendEvent()}
                    onKeyDown={(e) => {
                        if(e.keyCode == 13) {
                            this.sendEvent();
                        }
                    }}
                />
                <span className="controls">
                    <button ref="dropdownButton" className="button-small" onClick={(e) => this.startDropdown()}>...</button>
                </span>
                <div className="dropdown" ref="dropdownContainer">

                    <div className="widget-row widget-row-p">
                        <div className="col-12">
                            <label>Color</label>
                            <div className="widget-content">
                                <input ref="inputColor" type="color" value={label.color} onChange={(e) => {
                                    this.state.currentLabel.color = this.refs.inputColor.value;
                                    this.setState({ currentLabel: this.state.currentLabel });
                                    this.sendEvent();
                                }} />
                            </div>
                        </div>
                    </div>
                    <div className="widget-row widget-row-p">
                        <div className="col-12">
                            <label>Font</label>
                            <div className="widget-content">
                                <select
                                    value={label.fontFamily}
                                    onChange={(e) => {
                                        this.state.currentLabel.fontFamily = (e.target as HTMLSelectElement).value;
                                        this.setState({ currentLabel: this.state.currentLabel });
                                        this.sendEvent();
                                    }}
                                >
                                { Defaults.fonts.map(f => <option value={f}>{f}</option>) }
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="widget-row widget-row-p">
                        <div className="col-12">
                            <label>Size</label>
                            <div className="widget-content">
                                <input type="number" value={label.fontSize}
                                    onChange={(e) => {
                                        this.state.currentLabel.fontSize = +(e.target as HTMLInputElement).value;
                                        this.setState({ currentLabel: this.state.currentLabel });
                                        this.sendEvent();
                                    }} />
                            </div>
                        </div>
                    </div>
                </div>
            </span>
        );
    }
}

export interface IWidthHeightWidgetProps extends IRowWidgetProps {
    width: number;
    height: number;
    onChange: (newWidth: number, newHeight: number) => void;
}

export class WidthHeightWidget extends RowWidget<IWidthHeightWidgetProps, {
    width: string;
    height: string;
}> {
    refs: {
        inputWidth: HTMLInputElement;
        inputHeight: HTMLInputElement;
    }

    constructor(props: IWidthHeightWidgetProps) {
        super(props);

        this.state = {
            width: (this.props.width || 800).toString(),
            height: (this.props.height || 400).toString()
        };
    }

    public componentWillReceiveProps(nextProps: IWidthHeightWidgetProps) {
        this.setState({
            width: (nextProps.width || 800).toString(),
            height: (nextProps.height || 400).toString()
        });
    }

    private parseSize(str: string): number {
        let num = +str.trim();
        if(isNaN(num)) return 500;
        if(num < 10) num = 10;
        if(num > 5000) num = 5000;
        return num;
    }

    private sendEvent() {
        this.props.onChange(this.parseSize(this.state.width), this.parseSize(this.state.height));
    }

    public render() {
        let width = this.state.width;
        let height = this.state.height;

        return (
            <div className={`col-${this.props.columnCount || 12}`}>
                <div className="widget-row">
                    <div className="col-6">
                        <label title="width">Width</label>
                        <div className="widget-content">
                            <input type="text" ref="inputWidth" placeholder="800" value={width}
                                onChange={() => {
                                    this.setState({ width: this.refs.inputWidth.value } as any);
                                }}
                                onBlur={(e) => {
                                    this.sendEvent();
                                }}
                                onKeyDown={(e) => {
                                    if(e.keyCode == 13) {
                                        this.sendEvent()
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <label title="height">Height</label>
                        <div className="widget-content">
                            <input type="text" ref="inputHeight" placeholder="400" value={height}
                                onChange={() => {
                                    this.setState({ height: this.refs.inputHeight.value } as any);
                                }}
                                onBlur={(e) => {
                                    this.sendEvent();
                                }}
                                onKeyDown={(e) => {
                                    if(e.keyCode == 13) {
                                        this.sendEvent()
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export class DropdownListWidget<PropsType extends IRowWidgetProps, StatesType> extends RowWidget<PropsType, StatesType> {
    refs: {
        dropdownButton: HTMLButtonElement,
        dropdownList: HTMLDivElement
    }
    constructor(props: PropsType) {
        super(props);
        this.onMouseDown = this.onMouseDown.bind(this);
    }
    public renderListItems(): JSX.Element[] {
        return [];
    }
    public renderButton(): JSX.Element {
        return <span>button</span>;
    }
    public renderWidget() {
        return (
            <div className="dropdown-widget">
                <button className="button-dropdown" onClick={() => this.startDropdown()} ref="dropdownButton">
                { this.renderButton() }
                </button>
                <div className="dropdown-list" ref="dropdownList">
                { this.renderListItems() }
                </div>
            </div>
        );
    }

    public onMouseDown(e: MouseEvent) {
        if(!isTargetInElement(e.target, this.refs.dropdownList)) {
            this.completeDropdown();
        }
    }
    public startDropdown() {
        this.refs.dropdownList.style.display = "block";
        d3.select(this.refs.dropdownButton).classed("active", true);
        window.addEventListener("mousedown", this.onMouseDown);
    }
    public completeDropdown() {
        this.refs.dropdownList.style.display = "none";
        d3.select(this.refs.dropdownButton).classed("active", false);
        window.removeEventListener("mousedown", this.onMouseDown);
    }
}

export interface IColumnWidgetProps extends IRowWidgetProps {
    candidates: string[];
    column: string;
    allowNull?: boolean;
    nullText?: string;
    onChange: (newColumn: string) => void;
}

export class ColumnWidget extends DropdownListWidget<IColumnWidgetProps, {}> {
    public renderButton() {
        return <span>{this.props.column || (this.props.nullText || "(none)")}</span>;
    }
    public renderListItems() {
        let candidates = this.props.candidates.map((d, i) => (
            <button key={`c${i}`}
                className={`button-dropdown-list-item ${d == this.props.column ? "active" : ""}`}
                onClick={() => {
                    this.props.onChange(d);
                    this.completeDropdown();
                }}
            >{d}</button>
        ));
        if(this.props.allowNull == true) {
            return [ (
                <button key={`c-null`}
                    className={`button-dropdown-list-item ${this.props.column == null ? "active" : ""}`}
                    onClick={() => {
                        this.props.onChange(null);
                        this.completeDropdown();
                    }}
                >(none)</button>)
             ].concat(candidates);
        } else {
            return candidates;
        }
    }
}

export interface IColumnsWidgetProps extends IRowWidgetProps {
    candidates: string[];
    columns: string[];
    onChange: (newColumns: string[]) => void;
}

export class ColumnsWidget extends DropdownListWidget<IColumnsWidgetProps, {}> {
    public renderButton() {
        return <span>{this.props.columns != null ? this.props.columns.join(", ") : "(none)"}</span>;
    }
    public renderListItems() {
        return [
            <div style={{ color: "#888", margin: "5px 10px" }} key="prefix">(ctrl/shift + click to select multiple series)</div>
        ].concat(this.props.candidates.map((d, i) => (
            <button key={`c${i}`}
                className={`button-dropdown-list-item ${this.props.columns.indexOf(d) >= 0 ? "active" : ""}`}
                onClick={(e) => {
                    if(e.ctrlKey || e.shiftKey) {
                        let newColumns = this.props.candidates.filter((c) => {
                            if(this.props.columns.indexOf(c) >= 0) {
                                return c != d;
                            } else {
                                return c == d;
                            }
                        });
                        this.props.onChange(newColumns);
                    } else {
                        this.props.onChange([ d ]);
                    }
                }}
            >{d}</button>
        )));
    }
}

export interface IColorsWidgetProps extends IRowWidgetProps {
    colors: string[];
    onChange: (newColors: string[]) => void;
}

export class ColorsWidget extends DropdownListWidget<IColorsWidgetProps, {}> {
    public isSameColors(colors1: string[], colors2: string[]): boolean {
        if(colors1.length != colors2.length) return false;
        for(let i = 0; i < colors1.length; i++) {
            if(colors1[i] != colors2[i]) return false;
        }
        return true;
    }
    public renderColors(colors: string[]) {
        return colors.slice(0, 6).map((c) => (
            <span style={{ backgroundColor: c, display: "inline-block", width: "10px", height: "1em", margin: "0 2px", verticalAlign: "middle", outline: "1px solid white" }}></span>
        ));
    }
    public renderButton() {
        let name = "(custom)";
        Defaults.colors.forEach((d, i) => {
            if(this.isSameColors(d.colors, this.props.colors)) {
                name = d.name;
            }
        });
        return (<span>{this.renderColors(this.props.colors.slice(0, 6))} {name}</span>);
    }
    public renderListItems() {
        return Defaults.colors.map((d, i) => (
            <button key={`c${i}`}
                className={`button-dropdown-list-item ${this.isSameColors(d.colors, this.props.colors) ? "active" : ""}`}
                onClick={(e) => {
                    this.props.onChange(d.colors);
                    this.completeDropdown();
                }}
            >{ this.renderColors(d.colors) } {d.name}</button>
        ));
    }
}