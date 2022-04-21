const fs = require("fs");
const FILE_NAME = "retail_dataset.csv";

const readData = async (fileName) => {
  const dataSet = fs
    .readFileSync(fileName)
    .toString()
    .split("\r\n")
    .map((line, index) => {
      if (index != 0) {
        line = line.split(",").filter((i) => i);
        //   line.shift();
      }
      return line;
    });
  return dataSet;
};
const itemSetTable = async (dataSet) => {
  const itemSet = new Map();
  for (let i = 1; i < dataSet.length; i++) {
    for (let j = 1; j < dataSet[i].length; j++) {
      let itemValue = itemSet.get(dataSet[i][j]);
      if (itemValue !== undefined) {
        itemSet.set(dataSet[i][j], itemValue + 1);
      } else {
        itemSet.set(dataSet[i][j], 1);
      }
    }
  }
  return itemSet;
};
const filterItemSetTable = async (minSupport, itemSetTable) => {
  for (let [key, value] of itemSetTable.entries()) {
    if (value < minSupport) {
      itemSetTable.delete(key);
    }
  }
  return itemSetTable;
};
const getCombinations = async (items, setLength) => {
  const finalCombinations = [];
  for (let i = 0; i < items.length - 1; i++) {
    for (let j = i + 1; j < items.length; j++) {
      let set = new Set([...items[i], ...items[j]]);
      let temp = [...set];
      if (temp.length === setLength) finalCombinations.push(temp.sort());
    }
  }
  return Array.from(new Set(finalCombinations.map(JSON.stringify)), JSON.parse);

  //return finalCombinations;
};
const calcSupportCountForItems = async (dataSet, combinations) => {
  let table = new Map();
  for (let i = 0; i < combinations.length; i++) {
    let combination = combinations[i];

    for (let j = 1; j < dataSet.length; j++) {
      let counter = 0;
      for (let item = 0; item < combination.length; item++) {
        // console.log(combination[item]);
        if (dataSet[j].includes(combination[item])) {
          counter++;
        }
      }
      // console.log(counter);
      if (counter === combination.length) {
        let temp = combination.toString();
        table.set(temp.toString(), (table.get(temp) || 0) + 1);
      }
    }
  }
  return table;
};

const getSubsets = async (list) =>
  list.reduce(
    (subsets, value) => subsets.concat(subsets.map((set) => [value, ...set])),
    [[]]
  );
const isContains = (list, subList) => {
  if (subList.length > list.length) {
    let temp = subList;
    subList = list;
    list = temp;
  }
  if (subList.length === 0) {
    return true;
  }
  for (let i = 0; i < subList.length; i++) {
    if (list.includes(subList[i])) {
      return true;
    }
  }
  return false;
};
const getAssociationRules = async (dataSet, list, size) => {
  let result = [];
  for (let i = 0; i < list.length; i++) {
    let temp = list[i];
    for (let j = 1; j < list.length; j++) {
      let set = new Set([...temp, ...list[j]]);
      if (set.size === size) {
        if (!isContains(temp, list[j])) {
          result.push([temp, list[j]]);
        }
      }
    }
  }
  return result;
};
const getAssociationRulesForAllSets = async (dataSet, combinations) => {
  const result = [];
  for (let i = 0; i < combinations.length; i++) {
    let subsets = await getSubsets(combinations[i]);
    let rules = await getAssociationRules(
      dataSet,
      subsets,
      combinations[i].length
    );
    result.push(rules);
  }
  return result;
};

const filterBycConfidence = async (rules, dataSet, minConfidence) => {
  for (let i = 0; i < rules.length; i++) {
    const rule = [...rules[i][0][0], ...rules[i][0][1]];

    let aUnionB = await calcSupportCountForItems(dataSet, [rule]);

    aUnionB = [...aUnionB.values()][0];
    console.log("\x1b[32m%s\x1b[0m", rule, ` ${aUnionB}`);

    for (let j = 0; j < rules[i].length; j++) {
      let supportCount = await calcSupportCountForItems(dataSet, [
        rules[i][j][0],
      ]);
      const conf = (aUnionB / [...supportCount.values()][0]).toFixed(2);
      if (conf >= minConfidence)
        console.log(`{ ${rules[i][j][0]} } => { ${rules[i][j][1]} }`, conf);
    }
  }
};

const main = async () => {
  const dataSet = await readData(FILE_NAME);
  let table = await itemSetTable(dataSet);
  table = await filterItemSetTable(6, table);
  let items = [...table.keys()];
  items.forEach((element, index) => {
    items[index] = [element];
  });
  let i = 2;
  let list;
  while (true) {
    let combinations = await getCombinations(items, i);
    table = await calcSupportCountForItems(dataSet, combinations);
    table = await filterItemSetTable(10, table);
    if (table.size === 0) {
      break;
    }
    list = table;
    items = [...table.keys()];
    items.forEach((element, index) => {
      items[index] = element.split(",");
    });
    i++;
  }
  list = [...list.keys()];
  for (let i = 0; i < list.length; i++) {
    list[i] = [...list[i].split(",")];
  }
  let rules = await getAssociationRulesForAllSets(dataSet, list);
  await filterBycConfidence(rules, dataSet, 0.5);
};
main();
