import ProviderComparisonMatrix from "../ProviderComparisonMatrix";

export default function Scorecard(props) {
  return (
    <ProviderComparisonMatrix
      provider={props.mainProviderInMatrix}
      competitors={props.competitorsInMatrix}
      measures={props.matrixMeasures}
      data={props.matrixData}
      marketAverages={props.matrixMarketAverages}
      nationalAverages={props.matrixNationalAverages}
      publishDate={props.publishDate}
      providerTypeFilter={props.providerTypeFilter}
      setProviderTypeFilter={props.setProviderTypeFilter}
      availableProviderTypes={props.availableProviderTypes}
    />
  );
} 