import { Chart, Label, Scale, AppState } from "../model/model";
import { ChartAccent } from "../chartaccent";
import { Dispatcher } from "flux";

export let globalDispatcher = new Dispatcher<Action>();

export class Action {
    public dispatch() {
        globalDispatcher.dispatch(this);
    }
};

export class Reset extends Action {
}

export class StartIntroduction extends Action {
}

export class LoadData extends Action {
    constructor(
        public fileName: string,
        public raw: string,
        public fileType: "csv" | "tsv"
    ) {
        super();
    }
}

export class UpdateChart extends Action {
    constructor(
        public chart: Chart
    ) {
        super();
    }
}

export class UpdateChartType extends UpdateChart {
    constructor(
        public chart: Chart,
        public newType: string
    ) {
        super(chart);
    }
}

export class UpdateChartTitle extends UpdateChart {
    constructor(
        public chart: Chart,
        public newTitle: Label
    ) {
        super(chart);
    }
}

export class UpdateChartWidthHeight extends UpdateChart {
    constructor(
        public chart: Chart,
        public newWidth: number,
        public newHeight: number
    ) {
        super(chart);
    }
}

export class UpdateChartXColumn extends UpdateChart {
    constructor(
        public chart: Chart,
        public newXColumn: string
    ) {
        super(chart);
    }
}

export class UpdateChartYColumn extends UpdateChart {
    constructor(
        public chart: Chart,
        public newYColumn: string
    ) {
        super(chart);
    }
}

export class UpdateChartGroupColumn extends UpdateChart {
    constructor(
        public chart: Chart,
        public newGroupColumn: string
    ) {
        super(chart);
    }
}

export class UpdateChartSizeColumn extends UpdateChart {
    constructor(
        public chart: Chart,
        public newSizeColumn: string
    ) {
        super(chart);
    }
}

export class UpdateChartNameColumn extends UpdateChart {
    constructor(
        public chart: Chart,
        public newNameColumn: string
    ) {
        super(chart);
    }
}

export class UpdateChartYColumns extends UpdateChart {
    constructor(
        public chart: Chart,
        public newYColumns: string[]
    ) {
        super(chart);
    }
}

export class UpdateChartXLabel extends UpdateChart {
    constructor(
        public chart: Chart,
        public newXLabel: Label
    ) {
        super(chart);
    }
}

export class UpdateChartYLabel extends UpdateChart {
    constructor(
        public chart: Chart,
        public newYLabel: Label
    ) {
        super(chart);
    }
}

export class UpdateChartXScale extends UpdateChart {
    constructor(
        public chart: Chart,
        public newXScale: Scale
    ) {
        super(chart);
    }
}

export class UpdateChartYScale extends UpdateChart {
    constructor(
        public chart: Chart,
        public newYScale: Scale
    ) {
        super(chart);
    }
}


export class UpdateChartColors extends UpdateChart {
    constructor(
        public chart: Chart,
        public newColors: string[]
    ) {
        super(chart);
    }
}

export class SaveState extends Action {
};

export class LoadState extends Action {
    constructor(
        public state: AppState
    ) {
        super();
    }
};