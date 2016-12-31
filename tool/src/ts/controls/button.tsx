import * as React from "react";

export interface IButtonProps {
    text: string;
    type?: "normal" | "small" | "text";
    disabled?: boolean;
    onClick?: (button: Button) => void;
    title?: string;
}

export class Button extends React.Component<IButtonProps, {}> {
    public render() {
        return (
            <button
                className={`button-${this.props.type || "normal"}`}
                onClick={() => {
                    if(this.props.onClick != null) {
                        this.props.onClick(this);
                    }
                }}
                title={this.props.title || this.props.text}
            >{this.props.text}</button>
        );
    }
}