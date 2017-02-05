import * as React from "react";
import * as d3 from "d3";

export function isTargetInElement(target: any, element: any) {
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