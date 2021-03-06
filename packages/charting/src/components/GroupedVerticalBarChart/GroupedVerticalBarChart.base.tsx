import * as React from 'react';
import { max as d3Max } from 'd3-array';
import { axisLeft as d3AxisLeft, axisBottom as d3AxisBottom, Axis as D3Axis } from 'd3-axis';
import { scaleBand as d3ScaleBand, scaleLinear as d3ScaleLinear } from 'd3-scale';
import { select as d3Select, event as d3Event } from 'd3-selection';
import { classNamesFunction } from 'office-ui-fabric-react/lib/Utilities';
import { IProcessedStyleSet, IPalette } from 'office-ui-fabric-react/lib/Styling';
import { Callout, DirectionalHint } from 'office-ui-fabric-react/lib/Callout';
import { ILegend, Legends } from '../Legends/index';
import { FocusZone, FocusZoneDirection } from '@fluentui/react-focus';

import {
  IGroupedVerticalBarChartProps,
  IGroupedVerticalBarChartStyleProps,
  IGroupedVerticalBarChartStyles,
} from './GroupedVerticalBarChart.types';
import {
  IGroupedVerticalBarChartData,
  IGVBarChartSeriesPoint,
  IGVDataPoint,
  IGVSingleDataPoint,
  IGVForBarChart,
} from '@uifabric/charting';

const getClassNames = classNamesFunction<IGroupedVerticalBarChartStyleProps, IGroupedVerticalBarChartStyles>();
type stringAxis = D3Axis<string>;
type numericAxis = D3Axis<number | { valueOf(): number }>;

export interface IRefArrayData {
  legendText?: string;
  refElement?: SVGGElement;
}

export interface IGroupedVerticalBarChartState {
  color: string;
  containerWidth: number;
  containerHeight: number;
  dataForHoverCard: number;
  isCalloutVisible: boolean;
  isLegendSelected: boolean;
  isLegendHovered: boolean;
  titleForHoverCard: string;
  // tslint:disable-next-line:no-any
  refSelected: any;
  xCalloutValue?: string;
  yCalloutValue?: string;
  _width?: number;
  _height?: number;
}

export class GroupedVerticalBarChartBase extends React.Component<
  IGroupedVerticalBarChartProps,
  IGroupedVerticalBarChartState
> {
  private _points: IGroupedVerticalBarChartData[];
  private _yAxisTickCount: number;
  private _xAxisLabels: string[];
  private _barWidth: number;
  private _groupPadding: number = 16;
  private _showXAxisGridLines: boolean;
  private _showYAxisGridLines: boolean;
  private _showXAxisPath: boolean;
  private _showYAxisPath: boolean;
  private _classNames: IProcessedStyleSet<IGroupedVerticalBarChartStyles>;
  private _refArray: IRefArrayData[];
  private _reqID: number;
  private _yMax: number;
  // tslint:disable-next-line:no-any
  private _datasetForBars: any;
  // tslint:disable-next-line:no-any
  private _xScale0: any;
  // tslint:disable-next-line:no-any
  private _xScale1: any;
  private _dataset: IGVDataPoint[];
  private _keys: string[];
  private _isGraphDraw: boolean = true;
  private legendContainer: HTMLDivElement;
  private chartContainer: HTMLDivElement;
  private minLegendContainerHeight: number = 32;
  private margins = { top: 20, right: 20, bottom: 35, left: 40 };

  public constructor(props: IGroupedVerticalBarChartProps) {
    super(props);
    this.state = {
      containerWidth: 0,
      containerHeight: 0,
      color: '',
      dataForHoverCard: 0,
      isCalloutVisible: false,
      isLegendSelected: false,
      isLegendHovered: false,
      refSelected: null,
      titleForHoverCard: '',
      xCalloutValue: '',
      yCalloutValue: '',
      _width: this.props.width || 600,
      _height: this.props.height || 350,
    };
    this._refArray = [];
    this._adjustProps();
  }

  public componentDidMount(): void {
    this._fitParentContainer();
    window.addEventListener('resize', this._fitParentContainer);
  }

  public componentWillUnmount(): void {
    cancelAnimationFrame(this._reqID);
    d3Select('#firstGElementForBars').remove();
  }

  public componentDidUpdate(): void {
    if (this._isGraphDraw) {
      // drawing graph after first update only to avoid multile g tags
      this._drawGraph();
      this._isGraphDraw = false;
    }
  }

  public render(): React.ReactNode {
    const { theme, className, styles } = this.props;

    if (this.props.parentRef) {
      this._fitParentContainer();
    }

    this._xAxisLabels = this._createXAxisProperties();
    this._datasetForBars = this._createDataset();
    this._xScale0 = this._createX0Scale(this._xAxisLabels);
    this._xScale1 = this._createX1Scale(this._xScale0);
    const x0Axis = this._createx0Axis(this._xScale0);
    const yAxis: numericAxis = this._createYAxis(this._dataset);
    const legends: JSX.Element = this._getLegendData(this.props.theme!.palette);

    this._classNames = getClassNames(styles!, {
      theme: theme!,
      className,
      legendColor: this.state.color,
      showXAxisPath: this._showXAxisPath,
      showYAxisPath: this._showYAxisPath,
      href: this.props.href,
      width: this.state._width,
      height: this.state._height,
    });

    const svgDimensions = {
      width: this.state.containerWidth || 600,
      height: this.state.containerHeight || 350,
    };

    return (
      <div
        id="d3GroupedChart"
        ref={(rootElem: HTMLDivElement) => (this.chartContainer = rootElem)}
        className={this._classNames.root}
      >
        <FocusZone direction={FocusZoneDirection.horizontal}>
          <svg width={svgDimensions.width} height={svgDimensions.height}>
            <g
              id="xAxisGElement"
              ref={(node: SVGGElement | null) => this._setXAxis(node, x0Axis)}
              className={this._classNames.xAxis}
              transform={`translate(0, ${svgDimensions.height - 35})`}
            />
            <g
              id="yAxisGElement"
              ref={(node: SVGGElement | null) => this._setYAxis(node, yAxis)}
              className={this._classNames.yAxis}
              transform={`translate(40, 0)`}
            />
            <g id="barGElement" />
          </svg>
        </FocusZone>
        <div ref={(e: HTMLDivElement) => (this.legendContainer = e)} className={this._classNames.legendContainer}>
          {legends}
        </div>
        {!this.props.hideTooltip && this.state.isCalloutVisible ? (
          <Callout
            target={this.state.refSelected}
            gapSpace={10}
            isBeakVisible={false}
            setInitialFocus={true}
            directionalHint={DirectionalHint.topRightEdge}
          >
            <div className={this._classNames.hoverCardRoot}>
              <div className={this._classNames.hoverCardTextStyles}>
                {this.state.xCalloutValue ? this.state.xCalloutValue : this.state.titleForHoverCard}
              </div>
              <div className={this._classNames.hoverCardDataStyles}>
                {this.state.yCalloutValue ? this.state.yCalloutValue : this.state.dataForHoverCard}
              </div>
            </div>
          </Callout>
        ) : null}
      </div>
    );
  }

  private _adjustProps(): void {
    this._points = this.props.data || [];
    this._yAxisTickCount = this.props.yAxisTickCount || 5;
    this._showXAxisGridLines = this.props.showXAxisGridLines || false;
    this._showYAxisGridLines = this.props.showYAxisGridLines || false;
    this._showXAxisPath = this.props.showXAxisPath || false;
    this._showYAxisPath = this.props.showYAxisPath || false;
    this._barWidth = this.props.barwidth!;
  }

  private _fitParentContainer(): void {
    const { containerWidth, containerHeight } = this.state;
    this._reqID = requestAnimationFrame(() => {
      const legendContainerComputedStyles = getComputedStyle(this.legendContainer);
      const legendContainerHeight =
        (this.legendContainer.getBoundingClientRect().height || this.minLegendContainerHeight) +
        parseFloat(legendContainerComputedStyles.marginTop || '0') +
        parseFloat(legendContainerComputedStyles.marginBottom || '0');
      const container = this.props.parentRef ? this.props.parentRef : this.chartContainer;
      const currentContainerWidth = container.getBoundingClientRect().width;
      const currentContainerHeight =
        container.getBoundingClientRect().height > legendContainerHeight
          ? container.getBoundingClientRect().height
          : 350;
      const shouldResize =
        containerWidth !== currentContainerWidth || containerHeight !== currentContainerHeight - legendContainerHeight;
      if (shouldResize) {
        this.setState({
          containerWidth: currentContainerWidth,
          containerHeight: currentContainerHeight - legendContainerHeight,
        });
      }
    });
  }

  private _getOpacity = (legendTitle: string) => {
    let shouldHighlight = true;
    if (this.state.isLegendHovered || this.state.isLegendSelected) {
      shouldHighlight = this.state.titleForHoverCard === legendTitle;
    }
    return shouldHighlight ? '' : '0.1';
  };

  private _onBarHover = (
    target: SVGRectElement,
    color: string,
    data: number,
    legendTitle: string,
    xAxisCalloutData: string,
    yAxisCalloutData: string,
  ): void => {
    if (
      this.state.isLegendSelected === false ||
      (this.state.isLegendSelected && this.state.titleForHoverCard === legendTitle)
    ) {
      this.setState({
        refSelected: target,
        isCalloutVisible: true,
        titleForHoverCard: legendTitle,
        dataForHoverCard: data,
        color: color,
        xCalloutValue: xAxisCalloutData,
        yCalloutValue: yAxisCalloutData,
      });
    }
  };

  private mouseAction = (
    type: string,
    color: string,
    data: number,
    legendTitle: string,
    xAxisCalloutData: string,
    yAxisCalloutData: string,
  ): void => {
    this._onBarHover(d3Event.target, color, data, legendTitle, xAxisCalloutData, yAxisCalloutData);
  };

  private _onBarLeave = (): void => {
    this.setState({
      isCalloutVisible: false,
    });
  };

  private _onBarFocus = (
    legendText: string,
    pointData: number,
    color: string,
    refArrayIndexNumber: number,
    xAxisCalloutData: string,
    yAxisCalloutData: string,
  ): void => {
    if (
      this.state.isLegendSelected === false ||
      (this.state.isLegendSelected && this.state.titleForHoverCard === legendText)
    ) {
      this._refArray.map((obj: IRefArrayData, index: number) => {
        if (obj.legendText === legendText && refArrayIndexNumber === index) {
          this.setState({
            refSelected: obj.refElement,
            isCalloutVisible: true,
            titleForHoverCard: legendText,
            dataForHoverCard: pointData,
            color: color,
            xCalloutValue: xAxisCalloutData,
            yCalloutValue: yAxisCalloutData,
          });
        }
      });
    }
  };

  private focusAction = (
    type: string,
    color: string,
    data: number,
    legendTitle: string,
    refArrayIndexNumber: number,
    xAxisCalloutData: string,
    yAxisCalloutData: string,
  ): void => {
    this._refArray[refArrayIndexNumber] = { legendText: legendTitle, refElement: d3Event.target };
    this._onBarFocus(legendTitle, data, color, refArrayIndexNumber, xAxisCalloutData, yAxisCalloutData);
  };

  private _redirectToUrl = (href: string | undefined): void => {
    href ? (window.location.href = href) : '';
  };

  private _drawGraph = (): void => {
    const that = this;

    const yBarScale = d3ScaleLinear()
      .domain([0, this._yMax])
      .range([0, this.state.containerHeight - this.margins.bottom - this.margins.top]);

    // previous <g> - graph need to remove otherwise multile g elements will create
    d3Select('#firstGElementForBars').remove();
    const barContainer = d3Select('#barGElement')
      .append('g')
      .attr('id', 'firstGElementForBars');
    const seriesName = barContainer
      .selectAll('.name')
      .data(this._datasetForBars)
      .enter()
      .append('g')
      .attr('transform', (d: IGVForBarChart) => `translate(${this._xScale0(d.xAxisPoint)}, 0)`);

    let widthOfBar: number;
    if (this._barWidth && this._barWidth < this._xScale1.bandwidth()) {
      widthOfBar = this._barWidth;
    } else {
      widthOfBar = this._xScale1.bandwidth();
    }

    const tempDataSet = Object.keys(this._datasetForBars[0]).splice(0, this._keys.length);
    tempDataSet.map((datasetKey: string, index: number) => {
      seriesName
        .selectAll(`.${datasetKey}`)
        .data(d => [d])
        .enter()
        .append('rect')
        .style('fill', (d: IGVSingleDataPoint) => d[datasetKey].color)
        .attr('focusable', true)
        .attr('data-is-focusable', true)
        .attr('class', this._classNames.opacityChangeOnHover)
        .attr('fill-opacity', (d: IGVForBarChart) => that._getOpacity(d[datasetKey].legend))
        .attr('x', (d: IGVSingleDataPoint) => this._xScale1(datasetKey)!)
        .attr('y', (d: IGVForBarChart) => {
          return this.state.containerHeight - this.margins.bottom - yBarScale(d[datasetKey].data);
        })
        .attr('width', widthOfBar)
        .attr('height', (d: IGVForBarChart) => {
          return yBarScale(d[datasetKey].data);
        })
        .on('mouseover', (d: IGVForBarChart) => {
          return that.mouseAction(
            'mouseover',
            d[datasetKey].color,
            d[datasetKey].data,
            d[datasetKey].legend,
            d[datasetKey].xAxisCalloutData!,
            d[datasetKey].yAxisCalloutData!,
          );
        })
        .on('mousemove', (d: IGVForBarChart) =>
          that.mouseAction(
            'mousemove',
            d[datasetKey].color,
            d[datasetKey].data,
            d[datasetKey].legend,
            d[datasetKey].xAxisCalloutData!,
            d[datasetKey].yAxisCalloutData!,
          ),
        )
        .on('mouseout', this._onBarLeave)
        // tslint:disable-next-line:no-any
        .on('focus', (d: any) =>
          that.focusAction(
            'focus',
            d[datasetKey].color,
            d[datasetKey].data,
            d[datasetKey].legend,
            d.indexNum * that._keys.length + index,
            d[datasetKey].xAxisCalloutData!,
            d[datasetKey].yAxisCalloutData!,
          ),
        )
        .on('blur', that._onBarLeave)
        .on('click', (d: IGVForBarChart) => that._redirectToUrl(this.props.href!));
    });
  };

  private _createXAxisProperties = (): string[] => {
    const xAxisLabels: string[] = [];
    const keys: string[] = [];
    const colors: string[] = [];

    this._points.map((singlePoint: IGroupedVerticalBarChartData) => {
      xAxisLabels.push(singlePoint.name);
    });

    this._points[0].series.map((singleKey: IGVBarChartSeriesPoint) => {
      keys.push(singleKey.key);
      colors.push(singleKey.color);
    });

    this._keys = keys;

    return xAxisLabels;
  };

  private _createDataset = () => {
    // tslint:disable-next-line:no-any
    const datasetForBars: any = [];
    const dataset: IGVDataPoint[] = [];

    this._points.map((point: IGroupedVerticalBarChartData, index: number) => {
      const singleDatasetPoint: IGVDataPoint = {};
      // tslint:disable-next-line:no-any
      const singleDatasetPointforBars: any = {};

      point.series.map((seriesPoint: IGVBarChartSeriesPoint) => {
        singleDatasetPoint[seriesPoint.key] = seriesPoint.data;
        singleDatasetPointforBars[seriesPoint.key] = {
          ...seriesPoint,
        };
      });

      singleDatasetPointforBars.xAxisPoint = point.name;
      singleDatasetPointforBars.indexNum = index;

      datasetForBars.push(singleDatasetPointforBars);
      dataset.push(singleDatasetPoint);
    });
    this._dataset = dataset;
    return datasetForBars;
  };

  private _createX0Scale = (xAxisLabels: string[]) => {
    const x0Axis = d3ScaleBand()
      .domain(xAxisLabels.map((label: string) => label))
      .range([this.margins.left, this.state.containerWidth - this.margins.right])
      .padding(this._groupPadding / 100);
    return x0Axis;
  };

  // tslint:disable-next-line:no-any
  private _createX1Scale = (xScale0: any): any => {
    return d3ScaleBand()
      .domain(this._keys)
      .range([0, xScale0.bandwidth()])
      .padding(0.05);
  };

  // tslint:disable-next-line:no-any
  private _createx0Axis = (xScale0: any): any => {
    const x0Axis = d3AxisBottom(xScale0).tickPadding(10);

    this._showXAxisGridLines &&
      x0Axis.tickSizeInner(-(this.state.containerHeight - this.margins.bottom - this.margins.top));
    return x0Axis;
  };

  private _createYAxis(dataset: IGVDataPoint[]): numericAxis {
    // tslint:disable-next-line:no-any
    const yMax: number = d3Max(dataset, (point: any) => d3Max(this._keys, (key: string) => point[key]));
    this._yMax = yMax;
    const interval = Math.ceil(yMax / this._yAxisTickCount);
    const domains: Array<number> = [0];
    while (domains[domains.length - 1] < yMax) {
      domains.push(domains[domains.length - 1] + interval);
    }
    const yAxisScale = d3ScaleLinear()
      .domain([0, domains[domains.length - 1]])
      .range([this.state.containerHeight - this.margins.bottom, this.margins.top]);
    const yAxis = d3AxisLeft(yAxisScale)
      .tickPadding(10)
      .tickValues(domains);

    this._showYAxisGridLines &&
      yAxis.tickSizeInner(-(this.state.containerWidth - this.margins.left - this.margins.right));

    return yAxis;
  }

  private _onLegendClick(customMessage: string): void {
    if (this.state.isLegendSelected) {
      if (this.state.titleForHoverCard === customMessage) {
        this.setState({
          isLegendSelected: false,
          titleForHoverCard: customMessage,
        });
      } else {
        this.setState({
          titleForHoverCard: customMessage,
        });
      }
    } else {
      this.setState({
        isLegendSelected: true,
        titleForHoverCard: customMessage,
      });
    }
  }

  private _onLegendHover(customMessage: string): void {
    if (this.state.isLegendSelected === false) {
      this.setState({
        isLegendHovered: true,
        titleForHoverCard: customMessage,
      });
      this._isGraphDraw = true;
    }
  }

  private _onLegendLeave(isLegendFocused?: boolean): void {
    if (!!isLegendFocused || this.state.isLegendSelected === false) {
      this.setState({
        isLegendHovered: false,
        titleForHoverCard: '',
        isLegendSelected: !!isLegendFocused ? false : this.state.isLegendSelected,
      });
      this._isGraphDraw = true;
    }
  }

  private _getLegendData = (palette: IPalette): JSX.Element => {
    const data = this._points;
    const defaultPalette: string[] = [palette.blueLight, palette.blue, palette.blueMid, palette.red, palette.black];
    const actions: ILegend[] = [];

    data.map((singleChartData: IGroupedVerticalBarChartData) => {
      singleChartData.series.map((point: IGVBarChartSeriesPoint) => {
        const color: string = point.color ? point.color : defaultPalette[Math.floor(Math.random() * 4 + 1)];
        const checkSimilarLegends = actions.filter((leg: ILegend) => leg.title === point.legend && leg.color === color);
        if (checkSimilarLegends!.length > 0) {
          return;
        }

        const legend: ILegend = {
          title: point.legend,
          color: color,
          action: () => {
            this._onLegendClick(point.legend);
          },
          hoverAction: () => {
            this._onLegendHover(point.legend);
          },
          onMouseOutAction: (isLegendSelected?: boolean) => {
            this._onLegendLeave(isLegendSelected);
          },
        };

        actions.push(legend);
      });
    });
    return (
      <Legends
        legends={actions}
        overflowProps={this.props.legendsOverflowProps}
        enabledWrapLines={this.props.enabledLegendsWrapLines}
        focusZonePropsInHoverCard={this.props.focusZonePropsForLegendsInHoverCard}
      />
    );
  };

  private _setXAxis(node: SVGGElement | null, xAxis: numericAxis | stringAxis): void {
    if (node === null) {
      return;
    }
    d3Select(node).call(xAxis);
  }

  private _setYAxis(node: SVGElement | null, yAxis: numericAxis): void {
    if (node === null) {
      return;
    }
    d3Select(node).call(yAxis);
  }
}
