import * as React from "react";
import { Button } from "../controls/controls";
import * as Actions from "../store/actions";

export interface IExportViewState {
    emailAddress?: string;
    shareData?: boolean;
}

function validateEmail(email: string) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

export class ExportView extends React.Component<{}, IExportViewState> {
    refs: {
        inputEmailAddress: HTMLInputElement;
        checkboxShareData: HTMLInputElement;
    }
    constructor(props: {}) {
        super(props);
        this.state = {
            emailAddress: window.localStorage.getItem("chartaccent-emailaddress") || "",
            shareData: true
        }
    }
    public shouldDisableButtons() {
        if(this.state.shareData == false) return false;
        if(validateEmail(this.state.emailAddress)) return false;
        return true;
    }
    public doExportAs(type: string) {
        let emailAddress = this.state.emailAddress;
        let shareData = this.state.shareData;
        new Actions.ExportAs(type, emailAddress, shareData).dispatch();
    }
    public render() {
        return (
            <section className="section-export">
                <h2>Export</h2>
                <h3 className="note">Email Address</h3>
                <p>
                    <input ref="inputEmailAddress" style={{ maxWidth: "400px" }} type="text" value={this.state.emailAddress} placeholder="yourname@example.com" onChange={(e) => {
                        this.setState({
                            emailAddress: this.refs.inputEmailAddress.value
                        });
                        window.localStorage.setItem("chartaccent-emailaddress", this.refs.inputEmailAddress.value);
                    }} />
                </p>
                <p className="note">
                    By providing an email address you agree that the authors may contact you to request feedback and for user research. You may withdraw this consent at any time.
                </p>
                <p data-intro="Export the annotated chart to desired format.">
                    <Button text="PNG" icon="export" disabled={this.shouldDisableButtons()} onClick={() => this.doExportAs("png")} />
                    {" "}
                    <Button text="SVG" icon="export" disabled={this.shouldDisableButtons()} onClick={() => this.doExportAs("svg")} />
                    {" "}
                    <Button text="Animated GIF" icon="export" disabled={this.shouldDisableButtons()} onClick={() => this.doExportAs("gif")} />
                </p>
                <p>
                    <label style={{ cursor: "pointer" }}><input ref="checkboxShareData" type="checkbox" checked={!this.state.shareData} onChange={(e) => {
                        this.setState({
                            shareData: !this.refs.checkboxShareData.checked
                        });
                    }} /> Don't share data with the authors</label>
                </p>
                <h3 className="note">Publication</h3>
                <div className="bibitem note">
                    <div className="bibitem-title"><strong>ChartAccent: Annotation for Data-Driven Storytelling</strong></div>
                    <div className="bibitem-authors">Donghao Ren, Matthew Brehmer, Bongshin Lee, Tobias Höllerer, and Eun Kyoung Choe</div>
                    <div className="bibitem-place">(Accepted) Proceedings of IEEE Pacific Visualization (PacificVis 2017), 2017</div>
                    <div className="bibitem-links"><a href="publications/chartaccent-pacificvis2017.pdf">Download PDF</a></div>
                </div>
            </section>
        );
    }
}