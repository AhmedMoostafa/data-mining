const fs = require("fs");
const FILE_NAME = "Power_Consumption.csv";
let NumberOFClusters = 3;
const manhattanDistance = (p1, p2) => {
  let distance = 0;
  for (let i = 0; i < p1.length; i++) {
    distance += Math.abs(p1[i] - p2[i]);
  }
  return distance;
};
const euclideanDistance = (p1, p2) => {
  let distance = 0;
  for (let i = 0; i < p1.length; i++) {
    distance += Math.pow(p1[i] - p2[i], 2);
  }
  return +Math.sqrt(distance).toFixed(2);
};
const readData = async (fileName) => {
  const dataSet = fs
    .readFileSync(fileName)
    .toString()
    .split("\r\n")
    .map((line, index) => {
      if (index != 0) {
        line = line.split(",").filter((i) => i);
        line.shift();
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
    let number = Math.abs(Math.floor(Math.random() * dataSet.length - 1));
    if (set.size === numberOfClusters) {
      break;
    }
    set.add(number);
  }
  let randomNumbers = [...set];
  for (let i = 0; i < numberOfClusters; i++) {
    centroids.push(dataSet[randomNumbers[i]]);
  }
  return centroids;
};
const getCloserCluster = async (
  point,
  centroids,
  numberOfClusters,
  distanceMeasure
) => {
  let clusterNumber,
    distance = Number.MAX_SAFE_INTEGER;
  for (let i = 0; i < numberOfClusters; i++) {
    let temp;
    if (distanceMeasure === "manhattan") {
      temp = manhattanDistance(point, centroids[i]);
    } else {
      temp = euclideanDistance(point, centroids[i]);
    }
    if (temp < distance) {
      distance = +temp.toFixed(2);
      clusterNumber = i;
    }
  }
  return clusterNumber;
};
const mean = async (cluster) => {
  let clusterSize = cluster.length;
  let result = cluster[0];
  for (let i = 1; i < cluster.length; i++) {
    result = result.map(function (num, index) {
      return num + cluster[i][index];
    });
  }
  result = result.map((num) => {
    return +(num / clusterSize).toFixed(2);
  });
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
const main = async () => {
  let dataSet = await readData(FILE_NAME);
  let centroids = getRandomCentroids(dataSet, NumberOFClusters);
  let clusters = [];
  while (true) {
    for (let i = 0; i < dataSet.length; i++) {
      let clusterNumber = await getCloserCluster(
        dataSet[i],
        centroids,
        NumberOFClusters,
        "manhattan"
      );
      clusters[clusterNumber] === undefined
        ? (clusters[clusterNumber] = [])
        : 0;
      clusters[clusterNumber].push(dataSet[i]);
    }
    let newCentroids = await calcNewCentroids(clusters);

    if (!isNoChange(centroids, newCentroids)) {
      centroids = newCentroids;
    } else {
      break;
    }
  }
  console.log(clusters);
};

main();
