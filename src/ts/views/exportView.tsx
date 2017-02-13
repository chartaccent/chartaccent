import * as React from "react";
import { Button } from "../controls/controls";
import * as Actions from "../store/actions";
import { MainStore } from "../store/store";

export interface IExportViewState {
    emailAddress?: string;
    shareData?: boolean;
    exportError?: string;
    exportSuccess?: boolean,
    isExporting?: boolean;
}

function validateEmail(email: string) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

export class ExportView extends React.Component<{
    store: MainStore;
}, IExportViewState> {
    refs: {
        inputEmailAddress: HTMLInputElement;
        checkboxShareDataYes: HTMLInputElement;
        checkboxShareDataNo: HTMLInputElement;
    }
    constructor(props: {}) {
        super(props);
        this.state = {
            emailAddress: null,
            shareData: true,
            exportError: null,
            exportSuccess: false,
            isExporting: false
        }
    }
    public shouldDisableButtons() {
        if(this.state.isExporting) return true;

        return false;
        // if(this.state.shareData == false) return false;
        // if(validateEmail(this.state.emailAddress)) return false;
        // return true;
    }
    public doExportAs(type: string) {
        let emailAddress = this.state.emailAddress;
        let shareData = this.state.shareData;
        this.setState({
            exportError: null,
            exportSuccess: false,
            isExporting: true
        });
        this.props.store.exportAs(type, emailAddress, shareData, (error) => {
            this.setState({
                exportError: error,
                exportSuccess: error == null,
                isExporting: false
            });
        });
    }
    public render() {
        return (
            <section className="section-export">
                <h2>Export</h2>
                <h3 className="note">Are you willing to share your chart with us?</h3>
                <form>
                    <p>
                        <label style={{ cursor: "pointer" }}><input ref="checkboxShareDataYes" type="radio" checked={this.state.shareData} onChange={(e) => {
                            this.setState({
                                shareData: this.refs.checkboxShareDataYes.checked
                            });
                        }} /> Yes, share my chart with the authors. I consent that the authors may use my chart and the associated data for research and future publications.</label>
                    </p>
                    <p>
                        <label style={{ cursor: "pointer" }}><input ref="checkboxShareDataNo" type="radio" checked={!this.state.shareData} onChange={(e) => {
                            this.setState({
                                shareData: !this.refs.checkboxShareDataNo.checked
                            });
                        }} /> No, please keep my chart and data private.</label>
                    </p>
                </form>
                <p data-intro="Export the annotated chart to desired format." className="export-buttons">
                    <Button text="PNG" icon="export" disabled={this.shouldDisableButtons()} onClick={() => this.doExportAs("png")} />
                    {" "}
                    <Button text="SVG" icon="export" disabled={this.shouldDisableButtons()} onClick={() => this.doExportAs("svg")} />
                    {" "}
                    <Button text="Animated GIF" icon="export" disabled={this.shouldDisableButtons()} onClick={() => this.doExportAs("gif")} />
                    {" "}
                    { this.state.isExporting ? <span>Exporting...</span> : (
                        this.state.exportSuccess ? <span>Export success</span> : (
                            this.state.exportError != null ? <span>Export error: {this.state.exportError}</span> : null
                        )
                    ) }
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

/*
Code to record email address:
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
*/