import React from 'react';
import DashboardStore from '../stores/DashboardStore';
import BenchStore from '../stores/BenchStore';
import GlobalStore from '../stores/GlobalStore';
import MZBenchRouter from '../utils/MZBenchRouter';
import MZBenchActions from '../actions/MZBenchActions';
import Autosuggest from 'react-autosuggest';
import Misc from '../utils/Misc';
import PropTypes from 'prop-types';

class SimpleSuggestion {
    getTagSuggestions(value) {
      if (value.indexOf("#") === -1) return [];
      let allTags = GlobalStore.getAllTags();

      let result = [];
      let parts = value.split("#");
      let lookup = parts.splice(-1, 1)[0];
      let prefix = parts.join("#");

      for (var i in allTags) {
        if (allTags[i].indexOf(lookup) !== -1) {
            result.push(prefix + "#" + allTags[i]);
        }
      }
      return result;
    }

    getSuggestions(value, allValues) {
      let result = [];

      for (var i in allValues) {
        if (allValues[i].indexOf(value) !== -1) {
            result.push(allValues[i]);
        }
      }
      return result;
    }

    getSuggestionValue(suggestion) {
      return suggestion;
    }

    renderSuggestion(suggestion) {
      return (
        <span>{suggestion}</span>
      );
    }
}

class DashboardEdit extends React.Component {
    constructor(props) {
            super(props);
            this._onUp = this._onUp.bind(this);
            this._onDown = this._onDown.bind(this);
            this._onDelete = this._onDelete.bind(this);
            this._onChangeName = this._onChangeName.bind(this);
            this._onChangeCriteria = this._onChangeCriteria.bind(this);
            this._onChangeMetricFun = this._onChangeMetricFun.bind(this);
            this._onChangeXEnvFun = this._onChangeXEnvFun.bind(this);
            this._onChangeGroupEnvFun = this._onChangeGroupEnvFun.bind(this);
            this._onChangeKind = this._onChangeKind.bind(this);
            this._onChangeXAxis = this._onChangeXAxis.bind(this);
            this._onChangeDescription = this._onChangeDescription.bind(this);
            this._onTagSuggestionsUpdateRequested = this._onTagSuggestionsUpdateRequested.bind(this);
            this._onMetricSuggestionsUpdateRequested = this._onMetricSuggestionsUpdateRequested.bind(this);
            this._onGroupSuggestionsUpdateRequested = this._onGroupSuggestionsUpdateRequested.bind(this);
            this._onXSuggestionsUpdateRequested = this._onXSuggestionsUpdateRequested.bind(this);
            this._onCancel =     this._onCancel.bind(this);
            this._onAddChart =   this._onAddChart.bind(this);
            this._onSave = this._onSave.bind(this);
            this._onChange = this._onChange.bind(this);
            this._suggestion = new SimpleSuggestion();
            this.autoUpdateHandler = null;
            this.state = {suggestions : this._suggestion.getTagSuggestions(props.item.criteria)};
            this.state = this._resolveState();
    }

    componentDidMount() {
        BenchStore.onChange(this._onChange);
        if (BenchStore.getTimelineId() != this.props.item.criteria)
            MZBenchActions.getTimeline({q:this.props.item.criteria,
                bench_id: undefined, limit: this.props.benchLimit}, this.props.item.criteria);
    }

    render() {
        let item = this.props.item;
        const inputProps = {
          placeholder: 'Type a criteria',
          value: item.criteria,
          onChange : this._onChangeCriteria,
          className: "form-control",
          type: "text"
        };

        let total = this.state.total;
        let found = total === -1 ? "⏳" : (total == this.props.benchLimit ? `> ${total}` : total);

        return (
            <div className="fluid-container">
                <div className="row">
                  <div className="form-group col-md-6">
                    <label>Dashboard name</label>
                    <input type="text" defaultValue={item.name} onChange={this._onChangeName} className="form-control" placeholder="Type something" />
                  </div>
                  <div className="form-group col-md-3">
                    <label>Search query ({found} matching)</label>
                    <Autosuggest suggestions={this.state.suggestions}
                       getSuggestionValue={this._suggestion.getSuggestionValue}
                       onSuggestionsUpdateRequested={this._onTagSuggestionsUpdateRequested}
                       renderSuggestion={this._suggestion.renderSuggestion}
                       inputProps={inputProps} />
                  </div>
                </div>
                {item.charts.map(this.renderChart, this)}
                <div className="row">
                    <div className="form-group col-md-9">
                        <button className="btn btn-info" onClick={this._onAddChart}><span className="glyphicon glyphicon-plus"></span>Add chart</button>
                        &nbsp;
                        <button type="button" className="btn btn-success" onClick={this._onSave}>Save dashboard</button>
                        &nbsp;
                        <button type="button" className="btn btn-danger" onClick={this._onCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    suggestionProps(placeholder, value, lambda) {
        return {
            placeholder: placeholder,
            value: value,
            onChange : lambda,
            className: "form-control",
            type: "text"
        };
    }

    renderChart(chart, idx) {
        const inputProps = this.suggestionProps('Type metric name', chart.metric, this._onChangeMetricFun(chart.id));
        const inputXProps = this.suggestionProps('Type env name', chart.x_env, this._onChangeXEnvFun(chart.id));
        const inputGroupProps = this.suggestionProps('Type env name', chart.group_env, this._onChangeGroupEnvFun(chart.id));

        const kind = Misc.ucfirst(chart.kind) + " " + chart.size;

        return  (<div className="dashboard-config-row" key={chart.id}>
                    <div className="row">
                      <div className="form-group col-md-6">
                        <label>Metric name for Y</label>
                        <Autosuggest suggestions={this.state.metric_suggestions[idx]}
                           getSuggestionValue={this._suggestion.getSuggestionValue}
                           onSuggestionsUpdateRequested={this._onMetricSuggestionsUpdateRequested(chart.id)}
                           renderSuggestion={this._suggestion.renderSuggestion}
                           inputProps={inputProps} />
                      </div>
                      <div className="form-group col-md-3">
                        <label>Kind</label>
                        <select onChange={this._onChangeKind} rel={chart.id} defaultValue={kind} className="form-control">
                            <option value="Compare 5">Compare 5</option>
                            <option value="Compare 10">Compare 10</option>
                            <option value="Regression 0">Regression</option>
                            <option value="Group 5">Group 5 (XY chart)</option>
                            <option value="Group 10">Group 10 (XY chart)</option>
                        </select>
                      </div>
                      <div className="form-group col-md-3">
                            <button type="button" className="btn btn-danger" rel={chart.id} onClick={this._onDelete}><span className="glyphicon glyphicon-remove"></span></button>
                      </div>
                    </div>
                    <div className="row">
                      <div className="form-group col-md-6">
                        <label>{(chart.kind == "compare") ? "Env var for caption (optional)" : "Env var for groups (optional)"}</label>
                        <Autosuggest suggestions={this.state.group_suggestions[idx]}
                           getSuggestionValue={this._suggestion.getSuggestionValue}
                           onSuggestionsUpdateRequested={this._onGroupSuggestionsUpdateRequested(chart.id)}
                           renderSuggestion={this._suggestion.renderSuggestion}
                           inputProps={inputGroupProps} />
                      </div>
                      {(chart.kind == "group") ?
                              (<div className="form-group col-md-3">
                                <label>Env var for X-axis</label>
                                <Autosuggest suggestions={this.state.x_suggestions[idx]}
                                   getSuggestionValue={this._suggestion.getSuggestionValue}
                                   onSuggestionsUpdateRequested={this._onXSuggestionsUpdateRequested(chart.id)}
                                   renderSuggestion={this._suggestion.renderSuggestion}
                                   inputProps={inputXProps} />
                              </div>) : (chart.kind == "regression" ?
                              (<div className="col-md-3"><label>X-axis</label>
                              <select onChange={this._onChangeXAxis} rel={chart.id} defaultValue={chart.regression_x} className="form-control">
                                  <option value="Number">Number</option>
                                  <option value="Time">Time</option>
                              </select></div>)
                              : (<div className="col-md-3"></div>)) }
                      <div className="form-group col-md-3">
                            {idx > 0 ? (<button type="button" className="btn btn-info" rel={chart.id} onClick={this._onUp}><span className="glyphicon glyphicon-arrow-up"></span></button>) : null}
                            {idx > 0 ? (<span>&nbsp;</span>) : null}
                            {idx < (this.props.item.charts.length - 1) ? (<button type="button" className="btn btn-info" rel={chart.id} onClick={this._onDown}><span className="glyphicon glyphicon-arrow-down"></span></button>) : null}
                      </div>
                    </div>
                    <div className="row">
                        <div className="form-group col-md-9">
                            <label>Description (optional)</label>
                            <textarea rel={chart.id} onChange={this._onChangeDescription} className="form-control" rows="2" defaultValue={chart.description}></textarea>
                        </div>
                    </div>
                </div>);
    }
    _onTagSuggestionsUpdateRequested({ value }) {
        this.setState({
          suggestions: this._suggestion.getTagSuggestions(value)
        });
    }
    _onMetricSuggestionsUpdateRequested(id) {
        let idx = this._getIdx(id);
        return ({ value }) => {
            this.state.metric_suggestions[idx] =
                this._suggestion.getSuggestions(value,
        this.props.item.charts[idx].kind == "compare" ? this.state.metrics : this.state.results);
            this.setState(this.state);
        }
    }
    _onXSuggestionsUpdateRequested(id) {
        let idx = this._getIdx(id);
        return ({ value }) => {
            this.state.x_suggestions[idx] =
                this._suggestion.getSuggestions(value, this.state.envs);
            this.setState(this.state);
        }
    }
    _onGroupSuggestionsUpdateRequested(id) {
        let idx = this._getIdx(id);
        return ({ value }) => {
            this.state.group_suggestions[idx] =
                this._suggestion.getSuggestions(value, this.state.envs);
            this.setState(this.state);
        }
    }
    _onChangeName(event) {
        MZBenchActions.withSelectedDashboard((d) => {d.name = event.target.value});
    }
    _onCancel(event) {
        event.preventDefault();
        if (DashboardStore.isNewSelected()) {
            MZBenchActions.resetNewDashboard();
            MZBenchActions.selectDashboardById(undefined);
        }
        MZBenchRouter.navigate("/dashboard", {});
    }
    _onAddChart(event) {
        event.preventDefault();
        MZBenchActions.addChartToSelectedDashboard();
    }
    _onUp(event) {
        let idx = this._getIdx(parseInt($(event.target).closest('button').attr("rel")));
        MZBenchActions.withSelectedDashboard((d) => {d.charts.splice(idx,0,d.charts.splice(idx-1,1)[0]);});
    }
    _onDown(event) {
        let idx = this._getIdx(parseInt($(event.target).closest('button').attr("rel"))) + 1;
        MZBenchActions.withSelectedDashboard((d) => {d.charts.splice(idx,0,d.charts.splice(idx-1,1)[0]);});
    }
    _onDelete(event) {
        let idx = this._getIdx(parseInt($(event.target).closest('button').attr("rel")));
        MZBenchActions.withSelectedDashboard((d) => {d.charts.splice(idx, 1)});
    }
    _onChangeDescription(event) {
        let idx = this._getIdx(parseInt($(event.target).attr("rel")));
        MZBenchActions.withSelectedDashboard((d) => {d.charts[idx].description = event.target.value});
    }
    _onChangeMetricFun(id) {
        let idx = this._getIdx(id);
        return (event, {newValue}) => {
            MZBenchActions.withSelectedDashboard((d) => {d.charts[idx].metric = newValue;});
        }
    }
    _onChangeXEnvFun(id) {
        let idx = this._getIdx(id);
        return (event, {newValue}) => {
            MZBenchActions.withSelectedDashboard((d) => {d.charts[idx].x_env = newValue;});
        }
    }
    _onChangeGroupEnvFun(id) {
        let idx = this._getIdx(id);
        return (event, {newValue}) => {
            MZBenchActions.withSelectedDashboard((d) => {d.charts[idx].group_env = newValue;});
        }
    }
    _onChangeKind(event) {
        let idx = this._getIdx(parseInt($(event.target).attr("rel")));
        let parts = event.target.value.split(" ");
        let kind = parts[0].toLowerCase();
        let size = parts[1] ? parts[1] : "0";
        MZBenchActions.withSelectedDashboard((d) => {d.charts[idx].kind = kind; d.charts[idx].size = size;});
    }
    _onChangeXAxis(event) {
        let idx = this._getIdx(parseInt($(event.target).attr("rel")));
        let newValue = event.target.value;
        MZBenchActions.withSelectedDashboard((d) => {d.charts[idx].regression_x = newValue;});
    }
    _onChangeCriteria(event, {newValue}) {
        MZBenchActions.withSelectedDashboard((d) => {d.criteria = newValue});

        if (this.autoUpdateHandler) {
            clearTimeout(this.autoUpdateHandler);
        }
        this.autoUpdateHandler = setTimeout(() => MZBenchActions.getTimeline({q:newValue, bench_id: undefined, limit: this.props.benchLimit}, newValue), this.props.updateInterval);
    }
    _onSave(event) {
        event.preventDefault();
        let notify = $.notify({message: `Saving the dashboard... `}, {type: 'info'});
        MZBenchActions.saveSelectedDashboard();
        MZBenchRouter.navigate("/dashboard", {});
    }
    _getIdx(id) {
        return this.props.item.charts.reduce((a, x, idx) => x.id === id ? idx : a, -1);
    }
    _resolveState() {
        this.state.total = (this.props.item.criteria == BenchStore.getTimelineId()) ? BenchStore.getTotal() : -1;
        let benches = BenchStore.getItems().filter((b) => b.status === "complete" ? 1 : 0);
        this.state.metrics = Misc.uniq_fast(benches.reduce((acc_b, b) => {
            let groups = b.metrics.groups || [];
            return acc_b.concat(groups.reduce((acc_g, g) => {
                return acc_g.concat(g.graphs.reduce((acc, graph) => acc.concat(graph.metrics.map((m) => m.name.trim())), []))
            }, []));
        }, []));
        this.state.envs = Misc.uniq_fast(benches.reduce((acc_b, b) => {
            let env = b.env || [];
            return acc_b.concat(env.map((x) => x.name));
        }, []));
        this.state.results = Misc.uniq_fast(benches.reduce((acc_b, b) => {
            let results = b.results || {};
            return acc_b.concat(Object.keys(results));
        }, []));

        if (!this.state.metric_suggestions) this.state.metric_suggestions = [];
        if (!this.state.x_suggestions) this.state.x_suggestions = [];
        if (!this.state.group_suggestions) this.state.group_suggestions = [];

        for (var i in this.props.item.charts) {
            if (!this.state.metric_suggestions[i])
                this.state.metric_suggestions[i] =
                    this._suggestion.getSuggestions(this.props.item.charts[i].metric,
                        this.props.item.charts[i].kind == "compare" ? this.state.metrics : this.state.results);

            if (!this.state.x_suggestions[i])
                this.state.x_suggestions[i] =
                    this._suggestion.getSuggestions(this.props.item.charts[i].x_env, this.state.envs);

            if (!this.state.group_suggestions[i])
                this.state.group_suggestions[i] =
                    this._suggestion.getSuggestions(this.props.item.charts[i].group_env, this.state.envs);
        }

        return this.state;
    }
    _onChange() {
        this.setState(this._resolveState());
    }
};

DashboardEdit.propTypes = {
    item: PropTypes.object,
    updateInterval: PropTypes.number,
    benchLimit: PropTypes.number
};

DashboardEdit.defaultProps = {
    updateInterval: 500,
    benchLimit: 20
};

export default DashboardEdit;
