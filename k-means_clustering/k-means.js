const fs = require("fs");
const { detectOutliersForAllClusters } = require("./outliers");
const FILE_NAME = "Power_Consumption.csv";
let NumberOFClusters = 3;
const manhattanDistance = (p1, p2) => {
  let distance = 0;
  for (let i = 1; i < p1.length; i++) {
    distance += Math.abs(p1[i] - p2[i - 1]);
  }
  return distance;
};
const euclideanDistance = (p1, p2) => {
  let distance = 0;
  for (let i = 1; i < p1.length; i++) {
    distance += Math.pow(p1[i] - p2[i - 1], 2);
  }
  return +Math.sqrt(distance);
};
const readData = async (fileName) => {
  const dataSet = fs
    .readFileSync(fileName)
    .toString()
    .split("\r\n")
    .map((line, index) => {
      if (index != 0) {
        line = line.split(",").filter((i) => i);
        line = line.map((num) => {
          return +num;
        });
      }

      return line;
    });
  dataSet.shift();
  return dataSet;
};
const getRandomCentroids = (dataSet, numberOfClusters) => {
  let set = new Set();
  let centroids = [];
  while (true) {
    let number = Math.abs(Math.floor(Math.random() * dataSet.length));
    if (set.size === numberOfClusters) {
      break;
    }
    set.add(number);
  }
  let randomNumbers = [...set];
  for (let i = 0; i < numberOfClusters; i++) {
    let temp = [...dataSet[randomNumbers[i]]];
    temp.shift();
    centroids.push(temp);
  }
  // console.log(randomNumbers);
  return [centroids, randomNumbers];
};
const getCloserCluster = async (
  point,
  centroids,
  numberOfClusters,
  distanceMeasure
) => {
  let clusterNumber = 0,
    distance = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < numberOfClusters; i++) {
    let temp;
    if (centroids[i] !== undefined) {
      if (distanceMeasure === "manhattan") {
        temp = manhattanDistance(point, centroids[i]);
      } else {
        temp = euclideanDistance(point, centroids[i]);
      }
      if (temp < distance) {
        distance = +temp;
        clusterNumber = i;
      }
    }
  }
  return clusterNumber;
};
const mean = async (cluster) => {
  let clusterSize = cluster.length;
  let result = cluster[0];
  if (result != undefined) {
    for (let i = 1; i < cluster.length; i++) {
      result = result.map(function (num, index) {
        return num + cluster[i][index];
      });
    }
    result = result.map((num) => {
      return +(num / clusterSize);
    });
    result.shift();
  }
  return result;
};

const calcNewCentroids = async (clusters) => {
  let centroids = [];
  for (let i = 0; i < clusters.length; i++) {
    let centroid = await mean(clusters[i]);
    // console.log(centroid);
    centroids.push(centroid);
  }
  return centroids;
};

let isNoChange = (oldCentroids, newCentroids) => {
  for (let i = 0; i < oldCentroids.length; i++) {
    let c1 = oldCentroids[i],
      c2 = newCentroids[i];
    for (let j = 0; j < c1.length; j++) {
      if (c1[j] !== c2[j]) {
        return false;
      }
    }
  }

  return true;
};
let finalCentroids;
const getCusterIds = (clusters) => {
  let clusterPointsIds = [];
  for (let i = 0; i < clusters.length; i++) {
    let temp = [];
    for (let j = 0; j < clusters[i].length; j++) {
      temp.push(clusters[i][j][0]);
    }
    clusterPointsIds.push(temp);
  }
  return clusterPointsIds;
};
const main = async () => {
  let dataSet = await readData(FILE_NAME);

  let [centroids, randomNumbers] = getRandomCentroids(
    dataSet,
    NumberOFClusters
  );
  let clusters = [];
  for (let index = 0; index < centroids.length; index++) {
    clusters.push([dataSet[randomNumbers[index]]]);
  }
  console.log();
  while (true) {
    clusters = [];
    for (let i = 0; i < dataSet.length; i++) {
      let clusterNumber = await getCloserCluster(
        dataSet[i],
        centroids,
        NumberOFClusters,
        "manhattan"
      );
      //  console.log(dataSet[randomNumbers[clusterNumber]]);
      clusters[clusterNumber] === undefined
        ? (clusters[clusterNumber] = [])
        : 0;
      clusters[clusterNumber].push(dataSet[i]);
    }
    let newCentroids = await calcNewCentroids(clusters);
    finalCentroids = newCentroids;
    if (!isNoChange(centroids, newCentroids)) {
      centroids = newCentroids;
    } else {
      break;
    }
  }
  let clusterPointsIds = getCusterIds(clusters);
  let newClusters = await detectOutliersForAllClusters(
    dataSet,
    finalCentroids,
    clusters,
    manhattanDistance
  );
  newClusters = getCusterIds(newClusters);
  console.log(clusterPointsIds);
  console.log(newClusters);
};

main();
