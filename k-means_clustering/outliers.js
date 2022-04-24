const sort = (array) => {
  array.sort((a, b) => {
    return a.distance - b.distance;
  });

  return array;
};
const percentile = (dataset, [low, high]) => {
  let dataSetSize = dataset.length;
  let quartile1 = Math.floor((low * dataSetSize) / 100),
    quartile2 = Math.floor((high * dataSetSize) / 100);

  return [dataset[quartile1].distance, dataset[quartile2].distance];
};
const calcDistance = async (centroid, cluster, distanceMeasure) => {
  let clusterDistances = [];
  for (let i = 0; i < cluster.length; i++) {
    let point = { id: cluster[i][0], distance: 0 };
    point.distance = await distanceMeasure(cluster[i], centroid);
    point.distance = +point.distance.toFixed(3);
    clusterDistances.push(point);
  }
  return clusterDistances;
};
const detectOutliers = async (dataSet, centroid, cluster, distanceMeasure) => {
  let clusterDistances = await calcDistance(centroid, cluster, distanceMeasure);
  clusterDistances = sort(clusterDistances);
  let [quartile1, quartile2] = percentile(clusterDistances, [25, 75]);
  let iqr = quartile2 - quartile1;

  let lower_bound_val = quartile1 - 1.5 * iqr;
  let upper_bound_val = quartile2 + 1.5 * iqr;
  let newClusterValues = [];
  for (let i = 0; i < clusterDistances.length; i++) {
    if (
      clusterDistances[i].distance <= upper_bound_val &&
      clusterDistances[i].distance >= lower_bound_val
    ) {
      newClusterValues.push(cluster[i]);
    }
  }
  return newClusterValues;
};
const detectOutliersForAllClusters = async (
  dataSet,
  centroids,
  clusters,
  distanceMeasure
) => {
  let newClusters = [];
  for (let i = 0; i < clusters.length; i++) {
    const cluster = await detectOutliers(
      dataSet,
      centroids[i],
      clusters[i],
      distanceMeasure
    );
    newClusters.push(cluster);
  }
  return newClusters;
};
module.exports = { detectOutliersForAllClusters };
