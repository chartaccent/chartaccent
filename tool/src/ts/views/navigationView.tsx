import * as React from "react";

export class NavigationView extends React.Component<{}, {}> {
    public render() {
        return (
            <div className="navigation-view">
                <span data-bind="foreach: stages"><button className="stage"><span className="text"></span><span className="arrow">&raquo;</span></button></span>
                <span className="left-side">
                    <a href="index.html" className="title">Home</a>
                </span>
                <span className="right-side">
                    <form className="invisible"><input id="loadFile" type="file" /></form>
                    <a href="#" className="title" data-bind="click: $root.load_chart_button.bind($root)"><span className="icon chartaccent-icons-load"> Open...</span></a>
                </span>
            </div>
        );
    }
}